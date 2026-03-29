import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../apiConfig';
import Navbar from '../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TaxWizard = () => {
  const [formData, setFormData] = useState({
    basic: '',
    hra: '',
    special: '',
    section80c: '0',
    section80d: '',
  });

  const [liveTaxData, setLiveTaxData] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Live calculator debounce hook
  useEffect(() => {
    const fetchLiveMath = async () => {
      if (!formData.basic) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/tax/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData }),
        });
        if (response.ok) {
          const data = await response.json();
          setLiveTaxData(data);
        }
      } catch (err) {
        console.error('Live math failed:', err);
      }
    };

    const timer = setTimeout(() => {
      fetchLiveMath();
    }, 500);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSliderChange = (e) => {
    setFormData({ ...formData, section80c: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setAiResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/analyze-tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI analysis failed');
      setAiResult(data);
      setLiveTaxData(data); // keep in sync
    } catch (err) {
      setError(err.message || 'Failed to generate tax advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = liveTaxData ? [
    {
      name: 'Tax Liability',
      'Old Regime': liveTaxData.old_regime.tax_payable,
      'New Regime': liveTaxData.new_regime.tax_payable,
    }
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 flex flex-col lg:flex-row gap-8">
        {/* Left Column - Input Form */}
        <section className="w-full lg:w-1/2 rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Tax Wizard</h2>
          <p className="text-slate-500 mb-8 font-medium">Input your finances to auto-plan your taxes and maximize returns.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Basic Salary (₹)</label>
                <input
                  name="basic"
                  type="number"
                  value={formData.basic}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="e.g. 1200000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">HRA Received (₹)</label>
                  <input
                    name="hra"
                    type="number"
                    value={formData.hra}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="e.g. 200000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Special Allowance (₹)</label>
                  <input
                    name="special"
                    type="number"
                    value={formData.special}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="e.g. 150000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">80D Health Insurance (₹)</label>
                <input
                  name="section80d"
                  type="number"
                  value={formData.section80d}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="e.g. 25000"
                />
              </div>

              <div className="pt-4 pb-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-slate-700">80C Investments</label>
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full text-sm">
                    ₹{Number(formData.section80c).toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150000"
                  step="5000"
                  value={formData.section80c}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>₹0</span>
                  <span>Slide to simulate savings</span>
                  <span>₹1.5L (Max)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.basic}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Analyzing Profile...
                </span>
              ) : 'Get Personal Tax Advice'}
            </button>
            {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">{error}</p>}
          </form>
        </section>

        {/* Right Column - Results & Charts */}
        <section className="w-full lg:w-1/2 space-y-6 flex flex-col">
          {liveTaxData ? (
            <>
              {/* Savings Highlight */}
              <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 shadow-xl text-white relative overflow-hidden">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
                <div className="relative z-10 w-full">
                  <h3 className="text-emerald-100 font-medium text-lg mb-1">Recommended Regime</h3>
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-5xl font-extrabold capitalize tracking-tight">{liveTaxData.recommended}</span>
                    <span className="text-emerald-200 text-xl font-medium pb-1">Regime</span>
                  </div>
                  {liveTaxData.savings > 0 ? (
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/20 backdrop-blur-md px-5 py-2.5 border border-white/20">
                      <svg className="w-5 h-5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                      <span className="text-lg font-semibold">You save ₹{liveTaxData.savings.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="text-emerald-100 font-medium bg-white/10 px-4 py-2 rounded-xl inline-block border border-white/10">Tax is equal in both regimes</div>
                  )}
                </div>
              </div>

              {/* Regime Comparison Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={`rounded-3xl p-6 border-2 transition-all duration-300 ${liveTaxData.recommended === 'old' ? 'bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className={`font-bold text-lg ${liveTaxData.recommended === 'old' ? 'text-emerald-800' : 'text-slate-600'}`}>Old Regime</h4>
                    {liveTaxData.recommended === 'old' && <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Best</span>}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taxable Income</span>
                      <span className="font-semibold text-slate-800">₹{liveTaxData.old_regime.taxable_income.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deductions Used</span>
                      <span className="font-semibold text-slate-800">₹{liveTaxData.old_regime.deductions_used.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-slate-700 font-medium">Tax Payable</span>
                      <span className={`text-2xl font-black ${liveTaxData.recommended === 'old' ? 'text-emerald-600' : 'text-slate-800'}`}>₹{liveTaxData.old_regime.tax_payable.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-3xl p-6 border-2 transition-all duration-300 ${liveTaxData.recommended === 'new' ? 'bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className={`font-bold text-lg ${liveTaxData.recommended === 'new' ? 'text-emerald-800' : 'text-slate-600'}`}>New Regime</h4>
                    {liveTaxData.recommended === 'new' && <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Best</span>}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Taxable Income</span>
                      <span className="font-semibold text-slate-800">₹{liveTaxData.new_regime.taxable_income.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Standard Deduction</span>
                      <span className="font-semibold text-slate-800">₹{liveTaxData.new_regime.deductions_used.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-slate-700 font-medium">Tax Payable</span>
                      <span className={`text-2xl font-black ${liveTaxData.recommended === 'new' ? 'text-emerald-600' : 'text-slate-800'}`}>₹{liveTaxData.new_regime.tax_payable.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="rounded-3xl bg-white p-6 shadow-soft border border-slate-100 min-h-[300px]">
                <h4 className="font-bold text-slate-700 mb-4 ml-2">Tax Liability Comparison</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" tickFormatter={(value) => `₹${value/1000}k`} stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" hide />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} cursor={{fill: 'transparent'}} />
                    <Legend iconType="circle" />
                    <Bar dataKey="Old Regime" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={24} />
                    <Bar dataKey="New Regime" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* AI Advice Output */}
              {aiResult && (
                <div className="rounded-3xl bg-white p-8 shadow-soft border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">AI Tax Assessment</h3>
                  </div>

                  <p className="text-slate-600 leading-relaxed mb-6 font-medium">{aiResult.ai_advice}</p>

                  {aiResult.ai_suggestions?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Action Plan</h4>
                      <ul className="space-y-3">
                        {aiResult.ai_suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                            <span className="text-slate-700 text-sm">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Awaiting Financial Data</h3>
              <p className="text-slate-500 max-w-sm">Enter your salary details on the left to see your live tax simulation and tailored savings plan.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TaxWizard;