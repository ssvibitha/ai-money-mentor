const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const HF_TOKEN = (process.env.HF_TOKEN || '').trim();
const JWT_SECRET = (process.env.JWT_SECRET || 'vittora_secret_123').trim();

console.log("Server starting...");

// --- AUTH ROUTES ---
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [rows] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: 'User created successfully', id: rows.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'User registration failed. Email might already exist.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- AI ANALYZE ROUTES ---
app.post('/api/ai/analyze', async (req, res) => {
  const { formData } = req.body;
  const prompt = `You are a SEBI-registered financial advisor in India.
User details:
- Age: ${formData.age}
- Income: Rs ${formData.income}
- Expenses: Rs ${formData.expenses}
- Savings: Rs ${formData.savings}
- Goal: ${formData.goal}
- Risk: ${formData.risk}

Respond ONLY with JSON:
{
  "monthly_sip": 15000,
  "retirement_age": 52,
  "corpus_needed": 30000000,
  "asset_allocation": { "equity": 70, "debt": 20, "gold": 10 },
  "milestones": [
    { "year": 2027, "milestone": "Emergency fund complete", "amount": 300000 }
  ],
  "corpus_growth": [
    { "year": 2025, "amount": 200000 }
  ],
  "summary": "Example summary."
}`;

  try {
    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
      }
    );

    const text = response.data.choices?.[0]?.message?.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('AI analysis failed:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: 'AI analysis failed',
      details: error.response?.data?.error || error.message
    });
  }
});

function calculateTaxes(formData) {
  const basic = Number(formData.basic) || 0;
  const hra = Number(formData.hra) || 0;
  const special = Number(formData.special) || 0;
  const sec80cRaw = Number(formData.section80c) || 0;
  const sec80dRaw = Number(formData.section80d) || 0;

  const totalIncome = basic + hra + special;
  const actual80c = Math.min(sec80cRaw, 150000);
  const actual80d = Math.min(sec80dRaw, 25000);
  const stdDeduction = 50000;

  // Old Regime Taxable
  let oldTaxable = totalIncome - actual80c - actual80d - stdDeduction;
  if (oldTaxable < 0) oldTaxable = 0;

  // Old Regime Calculation
  let oldTax = 0;
  if (oldTaxable > 1000000) {
    oldTax += (oldTaxable - 1000000) * 0.3 + 112500;
  } else if (oldTaxable > 500000) {
    oldTax += (oldTaxable - 500000) * 0.2 + 12500;
  } else if (oldTaxable > 250000) {
    oldTax += (oldTaxable - 250000) * 0.05;
  }
  if (oldTaxable <= 500000) oldTax = 0; // 87A rebate

  // New Regime Taxable (only std deduction applies)
  let newTaxable = totalIncome - stdDeduction;
  if (newTaxable < 0) newTaxable = 0;

  // New Regime Calculation (FY 2024-25)
  let newTax = 0;
  if (newTaxable > 1500000) {
    newTax += (newTaxable - 1500000) * 0.3 + 150000;
  } else if (newTaxable > 1200000) {
    newTax += (newTaxable - 1200000) * 0.2 + 90000;
  } else if (newTaxable > 900000) {
    newTax += (newTaxable - 900000) * 0.15 + 45000;
  } else if (newTaxable > 600000) {
    newTax += (newTaxable - 600000) * 0.1 + 15000;
  } else if (newTaxable > 300000) {
    newTax += (newTaxable - 300000) * 0.05;
  }
  if (newTaxable <= 700000) newTax = 0; // 87A rebate

  const oldTotalDeductions = actual80c + actual80d + stdDeduction;
  const newTotalDeductions = stdDeduction;

  const bestRegime = oldTax <= newTax ? "old" : "new";
  const savings = Math.abs(oldTax - newTax);

  return {
    income: totalIncome,
    old_regime: { taxable_income: oldTaxable, tax_payable: oldTax, deductions_used: oldTotalDeductions },
    new_regime: { taxable_income: newTaxable, tax_payable: newTax, deductions_used: newTotalDeductions },
    recommended: bestRegime,
    savings: savings
  };
}

app.post('/api/tax/calculate', (req, res) => {
  const { formData } = req.body;
  const taxData = calculateTaxes(formData || {});
  res.json(taxData);
});

app.post('/api/ai/analyze-tax', async (req, res) => {
  const { formData } = req.body;
  const taxData = calculateTaxes(formData || {});

  const prompt = `User income: ₹${taxData.income}, old regime tax: ₹${taxData.old_regime.tax_payable}, new regime tax: ₹${taxData.new_regime.tax_payable}.
Explain which tax regime is better and suggest how to reduce tax legally in India. 
Keep reasoning simple and actionable (max 5-6 lines). 

Respond ONLY as valid JSON:
{
  "explanation": "...",
  "suggestions": ["..."]
}`;

  try {
    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
      }
    );

    const text = response.data.choices?.[0]?.message?.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    // Mix AI suggestions with deterministic math calculations
    const aiData = JSON.parse(jsonMatch[0]);
    res.json({
      ...taxData,
      ai_advice: aiData.explanation,
      ai_suggestions: aiData.suggestions || []
    });
  } catch (error) {
    console.error('Tax AI analysis failed:', error.response ? error.response.data : error.message);
    // If AI fails gracefully fallback to Math defaults
    res.json({
      ...taxData,
      ai_advice: "AI couldn't generate advice right now. Please rely on the basic calculations.",
      ai_suggestions: ["Take advantage of 80C by investing in ELSS or PPF.", "Claim 80D for family health insurance."]
    });
  }
});

app.post('/api/ai/analyze-score', async (req, res) => {
  const { score, dimensions } = req.body;
  const prompt = `You are a certified financial wellness advisor in India.

A user completed a financial health assessment with these results:
- Emergency Fund: ${dimensions.emergency_fund.answer} -> ${dimensions.emergency_fund.points} points out of 20
- Insurance: ${dimensions.insurance.answer} -> ${dimensions.insurance.points} points out of 15
- Investments: ${dimensions.investments.answer} -> ${dimensions.investments.points} points out of 20
- Debt: ${dimensions.debt.answer} -> ${dimensions.debt.points} points out of 15
- Tax Efficiency: ${dimensions.tax_efficiency.answer} -> ${dimensions.tax_efficiency.points} points out of 15
- Retirement Planning: ${dimensions.retirement.answer} -> ${dimensions.retirement.points} points out of 15

Overall score: ${score} out of 100

For each dimension where they scored less than 70% of max points, 
give one specific, actionable recommendation in simple language 
an Indian saver would understand.

Respond ONLY as valid JSON:

{
  "overall_rating": "...",
  "recommendations": {
    "emergency_fund": "... or null",
    "insurance": "... or null",
    "investments": "... or null",
    "debt": "... or null",
    "tax_efficiency": "... or null",
    "retirement": "... or null"
  },
  "top_priority": "...",
  "encouragement": "..."
}`;

  try {
    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      },
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
      }
    );

    const text = response.data.choices?.[0]?.message?.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('Score AI analysis failed:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Score AI analysis failed' });
  }
});

// --- PLAN STORAGE ROUTES ---
app.post('/api/plans', async (req, res) => {
  const { user_id, age, income, expenses, savings, goal, risk_appetite, ai_analysis } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO plans (user_id, age, income, expenses, savings, goal, risk_appetite, ai_analysis) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, age, income, expenses, savings, goal, risk_appetite, JSON.stringify(ai_analysis)]
    );
    res.status(201).json({ message: 'Plan saved successfully', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Saving plan failed' });
  }
});

app.get('/api/plans/:user_id', async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC', [req.params.user_id]);
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Fetching plans failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});