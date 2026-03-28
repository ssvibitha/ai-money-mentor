import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const TaxWizard = () => {
  const [formData, setFormData] = useState({
    basic: '',
    hra: '',
    special: '',
    section80c: '',
    section80d: '',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use backend API instead of direct HF call
      const response = await fetch('http://localhost:5000/api/ai/analyze-tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI analysis failed');
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to generate tax advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-softgreen to-white pb-8">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        <section className="rounded-2xl bg-white p-6 shadow-soft sm:p-10">
          <h2 className="text-3xl font-bold text-slate-800">Optimize Your Taxes</h2>
          <p className="mt-4 text-slate-600">Enter your salary details to get personalized tax-saving advice powered by AI.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="basic" className="block text-sm font-medium text-slate-600">Basic Salary (₹)</label>
                <input
                  id="basic"
                  name="basic"
                  type="number"
                  value={formData.basic}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 500000"
                  required
                />
              </div>
              <div>
                <label htmlFor="hra" className="block text-sm font-medium text-slate-600">HRA Received (₹)</label>
                <input
                  id="hra"
                  name="hra"
                  type="number"
                  value={formData.hra}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 100000"
                  required
                />
              </div>
              <div>
                <label htmlFor="special" className="block text-sm font-medium text-slate-600">Special Allowance (₹)</label>
                <input
                  id="special"
                  name="special"
                  type="number"
                  value={formData.special}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 50000"
                  required
                />
              </div>
              <div>
                <label htmlFor="section80c" className="block text-sm font-medium text-slate-600">80C Investments (₹)</label>
                <input
                  id="section80c"
                  name="section80c"
                  type="number"
                  value={formData.section80c}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 150000"
                  required
                />
              </div>
              <div>
                <label htmlFor="section80d" className="block text-sm font-medium text-slate-600">80D Health Insurance (₹)</label>
                <input
                  id="section80d"
                  name="section80d"
                  type="number"
                  value={formData.section80d}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 25000"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-base font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Analyzing...' : 'Get Tax Advice'}
            </button>
          </form>

          {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          {result && (
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-semibold text-slate-800">Tax Comparison</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-red-50 p-4">
                  <h4 className="font-semibold text-red-700">Old Regime</h4>
                  <p>Taxable Income: ₹{result.old_regime?.taxable_income?.toLocaleString()}</p>
                  <p>Tax Payable: ₹{result.old_regime?.tax_payable?.toLocaleString()}</p>
                  <p>Deductions Used: ₹{result.old_regime?.deductions_used?.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-green-50 p-4">
                  <h4 className="font-semibold text-green-700">New Regime</h4>
                  <p>Taxable Income: ₹{result.new_regime?.taxable_income?.toLocaleString()}</p>
                  <p>Tax Payable: ₹{result.new_regime?.tax_payable?.toLocaleString()}</p>
                  <p>Deductions Used: ₹{result.new_regime?.deductions_used?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TaxWizard;