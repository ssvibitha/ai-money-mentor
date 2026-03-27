import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { callLLM } from '../utils/hf';
import { buildFIREPrompt } from '../utils/prompts';
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
    advice:
      'Conservative strategy. Keep emergency buffer and invest in safer debt instruments.',
  },
  Medium: {
    returnRate: 8,
    allocation: [
      { name: 'Equity', value: 50 },
      { name: 'Debt', value: 30 },
      { name: 'Cash', value: 15 },
      { name: 'Alternatives', value: 5 },
    ],
    advice:
      'Balanced plan. Focus on SIP consistency and gradual increases as income grows.',
  },
  High: {
    returnRate: 10,
    allocation: [
      { name: 'Equity', value: 65 },
      { name: 'Debt', value: 20 },
      { name: 'Cash', value: 10 },
      { name: 'Alternatives', value: 5 },
    ],
    advice:
      'Aggressive growth. Rebalance quarterly and avoid market-timing decisions.',
  },
};

const colors = ['#0ea5e9', '#16a34a', '#fbbf24', '#a855f7'];

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
  const [age, setAge] = useState('35');
  const [monthlyIncome, setMonthlyIncome] = useState('90000');
  const [monthlyExpenses, setMonthlyExpenses] = useState('40000');
  const [currentSavings, setCurrentSavings] = useState('200000');
  const [financialGoal, setFinancialGoal] = useState('15000000');
  const [riskAppetite, setRiskAppetite] = useState('Medium');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    const ageVal = Number(age);
    const income = Number(monthlyIncome);
    const expenses = Number(monthlyExpenses);
    const savings = Number(currentSavings);
    const goal = Number(financialGoal);

    // Enhanced validation
    if (!ageVal || ageVal <= 0 || ageVal > 100) {
      setError('Please enter a valid age (1 - 100).');
      return;
    }
    if (income <= 0 || expenses < 0 || goal <= 0) {
      setError('Income, expenses, and goal must be positive numbers.');
      return;
    }
    if (expenses >= income) {
      setError('Expenses should be less than income to build savings.');
      return;
    }
    if (savings < 0) {
      setError('Current savings cannot be negative.');
      return;
    }
    if (goal > 100000000) { // 10 crores
      setError('Goal seems unrealistically high. Consider breaking it down.');
      return;
    }
    if (savings === 0 && goal > 50000000) {
      setError('With zero savings, achieving such a high goal may take decades. Consider starting small.');
      return;
    }

    setError('');
    setIsLoading(true);
    setProgressMessage('Analyzing your profile with AI...');

    try {
      // Use AI for personalized advice
      const formData = { age, income: monthlyIncome, expenses: monthlyExpenses, savings: currentSavings, goal: financialGoal, risk };
      const prompt = buildFIREPrompt(formData);
      const aiResult = await callLLM(prompt);

      // Local calculations for projections
      const profile = riskProfiles[riskAppetite] || riskProfiles.Medium;
      const contributionRate = 0.7;
      const monthlySIP = Number((monthlySaving * contributionRate).toFixed(0));
      const annualRate = profile.returnRate;
      const gap = Math.max(0, goal - savings);

      let years = 0;
      if (monthlySIP <= 0) {
        years = Infinity;
      } else {
        const r = annualRate / 12 / 100;
        let current = savings;
        let month = 0;
        while (current < goal && month < 600) {
          month += 1;
          current = current * (1 + r) + monthlySIP;
        }
        years = month / 12;
      }

      const yearsClamped = Number.isFinite(years) ? Math.min(years, 30) : 30;
      const milestones = calculateMilestones({
        currentSavings: savings,
        monthlyInvestment: monthlySIP,
        annualRate,
        years: yearsClamped,
      });

      const projectedSavings = milestones.length > 0 ? milestones[milestones.length - 1].value : savings;

      setResult({
        monthlySIP: aiResult.monthly_sip || monthlySIP,
        returnRate: annualRate,
        years: Number.isFinite(years) ? Number(years.toFixed(1)) : 'N/A',
        assetAllocation: profile.allocation,
        milestones,
        advice: aiResult.summary || profile.advice,
        goalGap: gap,
        projectedSavings,
        taxSavings: estimatedTaxSavings,
        aiInsights: aiResult,
      });

      setProgressMessage('Plan generated successfully!');
    } catch (err) {
      setError('AI analysis failed. Using standard calculations. ' + err.message);
      // Fallback to local calculation
      const profile = riskProfiles[riskAppetite] || riskProfiles.Medium;
      const contributionRate = 0.7;
      const monthlySIP = Number((monthlySaving * contributionRate).toFixed(0));
      const annualRate = profile.returnRate;
      const gap = Math.max(0, goal - savings);

      let years = 0;
      if (monthlySIP <= 0) {
        years = Infinity;
      } else {
        const r = annualRate / 12 / 100;
        let current = savings;
        let month = 0;
        while (current < goal && month < 600) {
          month += 1;
          current = current * (1 + r) + monthlySIP;
        }
        years = month / 12;
      }

      const yearsClamped = Number.isFinite(years) ? Math.min(years, 30) : 30;
      const milestones = calculateMilestones({
        currentSavings: savings,
        monthlyInvestment: monthlySIP,
        annualRate,
        years: yearsClamped,
      });

      const projectedSavings = milestones.length > 0 ? milestones[milestones.length - 1].value : savings;

      setResult({
        monthlySIP,
        returnRate: annualRate,
        years: Number.isFinite(years) ? Number(years.toFixed(1)) : 'N/A',
        assetAllocation: profile.allocation,
        milestones,
        advice: profile.advice,
        goalGap: gap,
        projectedSavings,
        taxSavings: estimatedTaxSavings,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgressMessage(''), 2000);
    }
  };

  const downloadPlan = async () => {
    if (!result) return;
    const element = document.getElementById('results-section');
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('FIRE_Plan.pdf');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-softgreen to-white pb-8">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold" aria-label="FIRE Planner logo">F</div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">FIRE Planner</h1>
              <p className="text-xs text-slate-500">Dashboard</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a className="text-slate-800" href="#planner">FIRE Planner</a>
            <Link to="/tax" className="hover:text-slate-900">Tax Wizard</Link>
          </nav>

          <button
            onClick={() => setIsLoggedIn(false)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            aria-label="Logout from your account"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-soft sm:p-10">
          <h2 className="text-3xl font-bold text-slate-800">Plan Your Financial Freedom</h2>
          <p className="mt-4 max-w-2xl text-slate-600">Get personalized investment & tax insights instantly. Enter your details and see your FIRE plan instantly with clear milestones.</p>
          <button
            onClick={onGeneratePlan}
            disabled={isLoading}
            className="mt-6 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Get Started
          </button>
        </section>

        <section id="planner" className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-800">Step 1: Enter your profile</h3>
            <p className="mt-1 text-sm text-slate-500">Provide your age, income, expenses and goals.</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-600">Age</label>
              <input
                type="number"
                value={age}
                placeholder="e.g. 35"
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
                aria-describedby="age-error"
                required
              />
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-600">Monthly Income (₹)</label>
              <input
                type="number"
                value={monthlyIncome}
                placeholder="e.g. 90000"
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-600">Monthly Expenses (₹)</label>
              <input
                type="number"
                value={monthlyExpenses}
                placeholder="e.g. 40000"
                onChange={(e) => setMonthlyExpenses(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-800">Step 2: Set goals</h3>
            <p className="mt-1 text-sm text-slate-500">Financial goal and current saving matter the most.</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-600">Current Savings (₹)</label>
              <input
                type="number"
                value={currentSavings}
                placeholder="e.g. 200000"
                onChange={(e) => setCurrentSavings(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-600">Financial Goal (₹)</label>
              <input
                type="number"
                value={financialGoal}
                placeholder="e.g. 15000000"
                onChange={(e) => setFinancialGoal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-800">Step 3: Risk & run</h3>
            <p className="mt-1 text-sm text-slate-500">Choose risk profile and generate analysis.</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-slate-600">Risk Appetite</label>
              <select
                value={riskAppetite}
                onChange={(e) => setRiskAppetite(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <p className="text-xs text-slate-500">Projected surplus (monthly): <strong>₹{monthlySaving.toLocaleString()}</strong></p>

            <button
              onClick={onGeneratePlan}
              disabled={isLoading}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Calculating...' : 'Generate Plan'}
            </button>

            {error && <p id="age-error" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
            {isLoading && (
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-600" aria-live="polite">
                <svg className="h-4 w-4 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>{progressMessage}</span>
              </div>
            )}
          </article>
        </section>

        {result && (
          <section id="results-section" className="mt-8 rounded-2xl bg-white p-5 shadow-soft">
            <h3 className="text-xl font-semibold text-slate-800">Results & Dashboard</h3>
            <p className="mt-1 text-sm text-slate-500">Your financial roadmap at a glance with key metrics and insights.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-slate-500">Monthly SIP</p>
                  <span title="Recommended monthly SIP based on your surplus" className="text-xs text-slate-400">ℹ</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-primary">₹{result.monthlySIP.toLocaleString()}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-slate-500">Tax Benefit</p>
                  <span title="Estimated annual tax savings from disciplined SIPs" className="text-xs text-slate-400">ℹ</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-green-700">₹{result.taxSavings.toLocaleString()}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-slate-500">Projected Savings</p>
                  <span title="Projected savings at your target year based on current assumptions" className="text-xs text-slate-400">ℹ</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-800">₹{Number(result.projectedSavings).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-soft">
                <h4 className="text-base font-semibold text-slate-700">Asset Allocation</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={result.assetAllocation}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        label={(entry) => `${entry.name}: ${entry.value}%`}
                      >
                        {result.assetAllocation.map((entry, index) => (
                          <Cell key={entry.name} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-soft">
                <h4 className="text-base font-semibold text-slate-700">Savings Milestones</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer>
                    <LineChart data={result.milestones}>
                      <CartesianGrid strokeDasharray="4 4" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="Projected Value" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white p-4 shadow-soft">
              <h4 className="text-base font-semibold text-slate-700">Risk-Based Comparison</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <BarChart
                    data={result.milestones.map((item) => ({ year: item.year, value: item.value }))}
                  >
                    <CartesianGrid strokeDasharray="4 4" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Bar dataKey="value" name="Milestone" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-green-50 p-4">
              <h4 className="text-base font-semibold text-green-700">Insights</h4>
              <p className="mt-2 text-slate-700">{result.advice}</p>
              <p className="mt-2 text-sm text-slate-600">
                Recommendation: Maintain a diversified portfolio, adjust SIP by 10% annually, and keep an emergency fund worth 6 months.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onRecalculate}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
              >
                Recalculate
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Adjust Inputs
              </button>
              <button
                onClick={downloadPlan}
                className="rounded-xl border border-secondary bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary hover:bg-secondary/20"
                aria-label="Download your FIRE plan as PDF"
              >
                Download Plan
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white/80 py-6">
        <div className="mx-auto text-center text-sm text-slate-500 sm:max-w-6xl">
          <p>FIRE Planner • Optimize your path to financial independence.</p>
          <p className="mt-2">Need help? <a href="mailto:support@fireplanner.io" className="text-primary hover:underline">Contact support@fireplanner.io</a> • Disclaimer: this tool is for educational purposes and not financial advice.</p>
        </div>
      </footer>
    </div>
  );
}

export default MainApp;