const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();
const pool = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const HF_TOKEN = (process.env.HF_TOKEN || '').trim();
const JWT_SECRET = (process.env.JWT_SECRET || 'vittora_secret_123').trim();

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
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
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

app.post('/api/ai/analyze-tax', async (req, res) => {
  const { formData } = req.body;
  const prompt = `You are a certified tax advisor in India.
User salary details:
- Basic salary: ₹${formData.basic} per year
- HRA received: ₹${formData.hra} per year
- Special allowance: ₹${formData.special} per year
- 80C investments: ₹${formData.section80c}
- 80D health insurance: ₹${formData.section80d}

Respond ONLY with JSON:
{
  "old_regime": { "taxable_income": 800000, "tax_payable": 75000, "deductions_used": 150000 },
  "new_regime": { "taxable_income": 950000, "tax_payable": 55000, "deductions_used": 0 },
  "recommended": "new",
  "savings": 20000,
  "summary": "The new regime saves you ₹20,000 in tax this year."
}`;

  try {
    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
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
    console.error('Tax AI analysis failed:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Tax AI analysis failed' });
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
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
