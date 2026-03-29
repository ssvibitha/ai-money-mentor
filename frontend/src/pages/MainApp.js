import React, { useMemo, useState } from 'react';
import API_BASE_URL from '../apiConfig';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend
} from 'recharts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


const riskProfiles = {
  Low: {
    returnRate: 6,
    allocation: [
      { name: 'Equity', value: 30 },
      { name: 'Debt', value: 45 },
      { name: 'Cash', value: 20 },
      { name: 'Alternatives', value: 5 },
    ],
    advice: 'Conservative strategy. Keep emergency buffer and invest in safer debt instruments.',
  },
  Medium: {
    returnRate: 8,
    allocation: [
      { name: 'Equity', value: 50 },
      { name: 'Debt', value: 30 },
      { name: 'Cash', value: 15 },
      { name: 'Alternatives', value: 5 },
    ],
    advice: 'Balanced plan. Focus on SIP consistency and gradual increases as income grows.',
  },
  High: {
    returnRate: 10,
    allocation: [
      { name: 'Equity', value: 65 },
      { name: 'Debt', value: 20 },
      { name: 'Cash', value: 10 },
      { name: 'Alternatives', value: 5 },
    ],
    advice: 'Aggressive growth. Rebalance quarterly and avoid market-timing decisions.',
  },
};

const colors = ['#1D9E75', '#378ADD', '#EF9F27', '#E24B4A'];

const calculateMilestones = (params) => {
  const { currentSavings, monthlyInvestment, annualRate, years } = params;
  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = Math.max(Math.round(years * 12), 1);

  let balance = currentSavings;
  const data = [];

  for (let month = 0; month <= totalMonths; month++) {
    if (month > 0) {
      balance = balance * (1 + monthlyRate) + monthlyInvestment;
    }
    if (month % Math.max(1, Math.floor(totalMonths / 8)) === 0 || month === totalMonths) {
      const year = (month / 12).toFixed(1);
      data.push({ year, value: Number(balance.toFixed(2)) });
    }
  }
  return data;
};

function MainApp() {
  const [age] = useState('25');
  const [monthlyIncome, setMonthlyIncome] = useState('80000');
  const [monthlyExpenses, setMonthlyExpenses] = useState('45000');
  const [currentSavings, setCurrentSavings] = useState('200000');
  const [financialGoal, setFinancialGoal] = useState('15000000');
  const [riskAppetite, setRiskAppetite] = useState('Medium');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const monthlySaving = useMemo(() => {
    const income = Number(monthlyIncome) || 0;
    const expenses = Number(monthlyExpenses) || 0;
    return Math.max(0, income - expenses);
  }, [monthlyIncome, monthlyExpenses]);

  const estimatedTaxSavings = useMemo(() => {
    const taxable = Math.max(0, Number(monthlyIncome) - Number(monthlyExpenses));
    return Number((taxable * 0.1).toFixed(0));
  }, [monthlyIncome, monthlyExpenses]);

  const onGeneratePlan = async () => {
    setError('');
    setIsLoading(true);
    setProgressMessage('Analyzing your profile with AI...');

    try {
      const formData = { age, income: monthlyIncome, expenses: monthlyExpenses, savings: currentSavings, goal: financialGoal, risk: riskAppetite };
      const aiResponse = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      });
      const aiResult = await aiResponse.json();

      if (!aiResponse.ok) throw new Error(aiResult.error || 'AI analysis failed');

      const profile = riskProfiles[riskAppetite] || riskProfiles.Medium;
      const monthlySIP = aiResult.monthly_sip || Number((monthlySaving * 0.7).toFixed(0));
      const annualRate = profile.returnRate;
      const years = aiResult.retirement_age ? (aiResult.retirement_age - age) : 20;

      const milestones = calculateMilestones({
        currentSavings: Number(currentSavings),
        monthlyInvestment: monthlySIP,
        annualRate,
        years,
      });

      setResult({
        monthlySIP,
        taxSavings: estimatedTaxSavings,
        projectedSavings: milestones[milestones.length - 1].value,
        assetAllocation: aiResult.asset_allocation ? Object.entries(aiResult.asset_allocation).map(([name, value]) => ({ name, value })) : profile.allocation,
        milestones,
        advice: aiResult.summary || profile.advice,
      });

      // Save plan to database
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        await fetch(`${API_BASE_URL}/api/plans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            age: Number(age),
            income: Number(monthlyIncome),
            expenses: Number(monthlyExpenses),
            savings: Number(currentSavings),
            goal: Number(financialGoal),
            risk_appetite: riskAppetite,
            ai_analysis: aiResult
          }),
        });
      }
    } catch (err) {
      setError('AI analysis failed. ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPlan = async () => {
    const element = document.getElementById('results-section');
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
    pdf.save('Vittora_Plan.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 sm:p-10">
          <h2 className="text-3xl font-extrabold text-slate-900">Dashboard</h2>
          <p className="mt-2 text-slate-500">Welcome back! Manage your financial roadmap here.</p>
          <button
            onClick={onGeneratePlan}
            disabled={isLoading}
            className="mt-6 rounded-xl bg-gradient-to-r from-[#1D9E75] to-[#378ADD] px-8 py-3 text-base font-bold text-white shadow-lg transition hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Generate New Plan'}
          </button>
          {
            error && (
              <p className="text-red-500 mt-2">{error}</p>
            )
          }

          {
            progressMessage && isLoading && (
              <p className="text-sm text-gray-500 mt-2">{progressMessage}</p>
            )
          }
        </section>

        <section id="planner" className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-600">Monthly Income (₹)</label>
                <input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} className="w-full mt-1 p-2 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Monthly Expenses (₹)</label>
                <input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(e.target.value)} className="w-full mt-1 p-2 rounded-lg border border-slate-200" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Goals</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-600">Financial Goal (₹)</label>
                <input type="number" value={financialGoal} onChange={e => setFinancialGoal(e.target.value)} className="w-full mt-1 p-2 rounded-lg border border-slate-200" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Savings (₹)</label>
                <input type="number" value={currentSavings} onChange={e => setCurrentSavings(e.target.value)} className="w-full mt-1 p-2 rounded-lg border border-slate-200" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Risk</h3>
            <div className="space-y-4">
              <select value={riskAppetite} onChange={e => setRiskAppetite(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 bg-white">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <button
                onClick={onGeneratePlan}
                className="w-full py-2 bg-[#1D9E75] text-white font-bold rounded-lg shadow-md mt-4"
              >
                Update Plan
              </button>
            </div>
          </div>
        </section>

        {result && (
          <section id="results-section" className="mt-10 p-8 rounded-3xl bg-white shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-5">
            <header className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900">Your AI-Generated Plan</h3>
              <button onClick={downloadPlan} className="text-sm font-bold text-[#1D9E75] underline">Download PDF</button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="p-6 bg-[#1D9E75]/10 rounded-2xl border border-[#1D9E75]/20">
                <p className="text-xs font-black text-[#1D9E75] uppercase tracking-widest">Monthly SIP</p>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{result.monthlySIP.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-[#378ADD]/10 rounded-2xl border border-[#378ADD]/20">
                <p className="text-xs font-black text-[#378ADD] uppercase tracking-widest">Tax Savings</p>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{result.taxSavings.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Projected Corpus</p>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{Math.round(result.projectedSavings).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <h4 className="font-bold text-slate-800 mb-6">Asset Allocation</h4>
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={result.assetAllocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                        {result.assetAllocation.map((entry, index) => (
                          <Cell key={entry.name} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-6">Growth Projection</h4>
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={result.milestones}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={v => `₹${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                      <Line type="monotone" dataKey="value" stroke="#1D9E75" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2">AI Insights</h4>
              <p className="text-slate-600 leading-relaxed">{result.advice}</p>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default MainApp;