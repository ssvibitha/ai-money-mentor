import React, { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import Navbar from "../components/Navbar";
import "./FirePlanner.css";

Chart.register(...registerables);

// ─── Helpers ────────────────────────────────────────────────────────
function formatINR(val) {
  if (!val && val !== 0) return "—";
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  return `₹${Number(val).toLocaleString("en-IN")}`;
}

// ─── Sub-components ─────────────────────────────────────────────────

function DonutChart({ allocation }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!allocation || !ref.current) return;
    if (chartRef.current) chartRef.current.destroy();

    // Ensure numeric values
    const equity = Number(allocation.equity) || 0;
    const debt = Number(allocation.debt) || 0;
    const gold = Number(allocation.gold) || 0;

    chartRef.current = new Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: ["Equity", "Debt", "Gold"],
        datasets: [{
          data: [equity, debt, gold],
          backgroundColor: ["#1D9E75", "#378ADD", "#EF9F27"],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        cutout: "70%",
        plugins: { legend: { display: false } },
        animation: { animateRotate: true, duration: 800 },
      },
    });
    return () => chartRef.current?.destroy();
  }, [allocation]);

  return (
    <div className="fp-donut-wrap">
      <div className="fp-donut-canvas-wrap">
        <canvas ref={ref} />
      </div>
      <div className="fp-donut-legend">
        {[
          { label: "Equity", val: allocation.equity, color: "#1D9E75" },
          { label: "Debt", val: allocation.debt, color: "#378ADD" },
          { label: "Gold", val: allocation.gold, color: "#EF9F27" },
        ].map(item => (
          <div className="fp-legend-item" key={item.label}>
            <span className="fp-legend-dot" style={{ background: item.color }} />
            <span className="fp-legend-label">{item.label}</span>
            <span className="fp-legend-val">{item.val}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data?.length || !ref.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels: data.map(d => d.year),
        datasets: [{
          label: "Corpus (₹)",
          data: data.map(d => Number(d.amount)),
          borderColor: "#1D9E75",
          backgroundColor: "rgba(29,158,117,0.08)",
          fill: true,
          tension: 0.45,
          pointRadius: 4,
          pointBackgroundColor: "#1D9E75",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: v => v >= 10000000
                ? `₹${(v / 10000000).toFixed(1)}Cr`
                : `₹${(v / 100000).toFixed(0)}L`,
              font: { size: 11 },
              color: "#888",
            },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          x: {
            ticks: { font: { size: 11 }, color: "#888" },
            grid: { display: false },
          },
        },
        animation: { duration: 1000 },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <div className="fp-line-wrap">
      <canvas ref={ref} />
    </div>
  );
}

function BarChart({ breakdown }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!breakdown || !ref.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const expenses = Number(breakdown.expenses) || 0;
    const sip = Number(breakdown.sip) || 0;
    const remaining = Number(breakdown.remaining) || 0;

    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: ["Monthly Income Breakdown"],
        datasets: [
          {
            label: "Expenses",
            data: [expenses],
            backgroundColor: "#E24B4A",
            borderRadius: 4,
          },
          {
            label: "SIP Investment",
            data: [sip],
            backgroundColor: "#1D9E75",
            borderRadius: 4,
          },
          {
            label: "Remaining",
            data: [remaining],
            backgroundColor: "#378ADD",
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            stacked: true,
            ticks: {
              callback: v => `₹${(v / 1000).toFixed(0)}k`,
              font: { size: 11 },
              color: "#888",
            },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          y: { stacked: true, display: false },
        },
        animation: { duration: 800 },
      },
    });
    return () => chartRef.current?.destroy();
  }, [breakdown]);

  return (
    <div className="fp-bar-wrap">
      <canvas ref={ref} />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function FIREPlanner() {
  const user = JSON.parse(localStorage.getItem("user"));
  const isLoggedIn = !!localStorage.getItem("token");

  const [form, setForm] = useState({
    age: "",
    income: "",
    expenses: "",
    savings: "",
    goal: "Retire Early",
    targetAge: "",
    risk: "Moderate",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const setRisk = r => setForm(prev => ({ ...prev, risk: r }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const response = await fetch('http://localhost:5000/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: form }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI Analysis failed');

      // Map AI response to ensure consistency
      // Note: Backend returns { monthly_sip, retirement_age, corpus_needed, asset_allocation, milestones, summary }
      // We also need years_to_goal, corpus_growth, monthly_breakdown for the UI

      const years_to_goal = data.retirement_age - form.age;

      // If AI didn't provide growth/breakdown, we can synthesize them or update the backend to provide them.
      // For now, let's assume the backend provides them or we synthesize a simple version.

      setResult({
        ...data,
        years_to_goal: data.retirement_age ? (data.retirement_age - form.age) : 0,
        corpus_growth: data.corpus_growth || [],
        monthly_breakdown: data.monthly_breakdown || {
          expenses: Number(form.expenses),
          sip: data.monthly_sip,
          remaining: Number(form.income) - Number(form.expenses) - Number(data.monthly_sip)
        }
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isLoggedIn) return;
    setSaveLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          age: Number(form.age),
          income: Number(form.income),
          expenses: Number(form.expenses),
          savings: Number(form.savings),
          goal: Number(result.corpus_needed), // or form.goal
          risk_appetite: form.risk,
          ai_analysis: result
        }),
      });
      if (response.ok) {
        setSaved(true);
      } else {
        throw new Error('Failed to save plan');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="fp-page">
      <Navbar />

      <div className="fp-container">
        {/* ── Header ── */}
        <div className="fp-header">
          <h1 className="fp-title">🔥 FIRE Planner</h1>
          <p className="fp-subtitle">
            Enter your details and get a personalized month-by-month retirement roadmap instantly.
          </p>
        </div>

        <div className="fp-layout">
          {/* ── LEFT — Form ── */}
          <form className="fp-form" onSubmit={handleSubmit}>

            <div className="fp-form-section">
              <h3 className="fp-form-section-title">Personal Details</h3>

              <div className="fp-field">
                <label className="fp-label">Your Age</label>
                <input className="fp-input" type="number" name="age"
                  placeholder="e.g. 25" value={form.age}
                  onChange={handleChange} required min={18} max={60} />
              </div>

              <div className="fp-field">
                <label className="fp-label">Monthly Income (₹)</label>
                <input className="fp-input" type="number" name="income"
                  placeholder="e.g. 80000" value={form.income}
                  onChange={handleChange} required min={1} />
              </div>

              <div className="fp-field">
                <label className="fp-label">Monthly Expenses (₹)</label>
                <input className="fp-input" type="number" name="expenses"
                  placeholder="e.g. 45000" value={form.expenses}
                  onChange={handleChange} required min={1} />
              </div>

              <div className="fp-field">
                <label className="fp-label">Current Savings (₹)</label>
                <input className="fp-input" type="number" name="savings"
                  placeholder="e.g. 200000" value={form.savings}
                  onChange={handleChange} required min={0} />
              </div>
            </div>

            <div className="fp-form-section">
              <h3 className="fp-form-section-title">Goal Details</h3>

              <div className="fp-field">
                <label className="fp-label">Financial Goal</label>
                <select className="fp-input fp-select" name="goal"
                  value={form.goal} onChange={handleChange}>
                  <option>Retire Early</option>
                  <option>Buy a House</option>
                  <option>Child's Education</option>
                  <option>Wealth Building</option>
                </select>
              </div>

              <div className="fp-field">
                <label className="fp-label">Target Age to Achieve Goal</label>
                <input className="fp-input" type="number" name="targetAge"
                  placeholder="e.g. 48" value={form.targetAge}
                  onChange={handleChange} required min={25} max={80} />
              </div>

              <div className="fp-field">
                <label className="fp-label">Risk Appetite</label>
                <div className="fp-risk-toggle">
                  {["Low", "Moderate", "High"].map(r => (
                    <button type="button" key={r}
                      className={`fp-risk-btn ${form.risk === r ? "fp-risk-btn--active" : ""}`}
                      onClick={() => setRisk(r)}>{r}</button>
                  ))}
                </div>
              </div>
            </div>

            <button className="fp-submit-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="fp-btn-loading">
                  <span className="fp-spinner" /> Analyzing profile...
                </span>
              ) : "Generate My Plan →"}
            </button>

            {error && (
              <div className="fp-error">
                <span>⚠️</span> {error}
              </div>
            )}
          </form>

          {/* ── RIGHT — Output ── */}
          <div className="fp-output">
            {!result && !loading && (
              <div className="fp-empty">
                <div className="fp-empty-icon">📈</div>
                <p className="fp-empty-title">Your Plan Roadmap</p>
                <p className="fp-empty-sub">Fill in the profile details to visualize your financial independence journey.</p>
              </div>
            )}

            {loading && (
              <div className="fp-loading-state">
                <div className="fp-loading-spinner" />
                <p className="fp-loading-text">Our AI is crunching the numbers...</p>
                <p className="fp-loading-sub">Building your personalized path to FIRE.</p>
              </div>
            )}

            {result && (
              <div className="fp-result fade-in">
                <div className="fp-summary-banner">
                  <p className="fp-summary-text">{result.summary}</p>
                </div>

                <div className="fp-metrics">
                  <div className="fp-metric-card">
                    <span className="fp-metric-label">Monthly SIP</span>
                    <span className="fp-metric-value">{formatINR(result.monthly_sip)}</span>
                  </div>
                  <div className="fp-metric-card">
                    <span className="fp-metric-label">Target Corpus</span>
                    <span className="fp-metric-value">{formatINR(result.corpus_needed)}</span>
                  </div>
                  <div className="fp-metric-card">
                    <span className="fp-metric-label">Retire Age</span>
                    <span className="fp-metric-value">{result.retirement_age} yrs</span>
                  </div>
                </div>

                {result.corpus_growth?.length > 0 && (
                  <div className="fp-chart-card">
                    <h4 className="fp-chart-title">Corpus Growth Projection</h4>
                    <LineChart data={result.corpus_growth} />
                  </div>
                )}

                {result.asset_allocation && (
                  <div className="fp-chart-card">
                    <h4 className="fp-chart-title">Asset Allocation</h4>
                    <DonutChart allocation={result.asset_allocation} />
                  </div>
                )}

                {result.monthly_breakdown && (
                  <div className="fp-chart-card">
                    <h4 className="fp-chart-title">Monthly Budget Impact</h4>
                    <BarChart breakdown={result.monthly_breakdown} />
                    <div className="fp-bar-legend">
                      {[
                        { label: "Expenses", color: "#E24B4A" },
                        { label: "SIP", color: "#1D9E75" },
                        { label: "Remaining", color: "#378ADD" },
                      ].map(item => (
                        <span className="fp-bar-legend-item" key={item.label}>
                          <span className="fp-bar-legend-dot" style={{ background: item.color }} />
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.milestones?.length > 0 && (
                  <div className="fp-chart-card">
                    <h4 className="fp-chart-title">Key Milestones</h4>
                    <div className="fp-milestones">
                      {result.milestones.map((m, i) => (
                        <div className="fp-milestone" key={i}>
                          <div className="fp-milestone-dot"
                            style={{ background: i === result.milestones.length - 1 ? "#1D9E75" : "#378ADD" }} />
                          <div className="fp-milestone-body">
                            <span className="fp-milestone-year">{m.year}</span>
                            <span className="fp-milestone-label">{m.label || m.milestone}</span>
                            <span className="fp-milestone-amount">{formatINR(m.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="fp-save-wrap">
                  {!isLoggedIn ? (
                    <div className="fp-guest-banner">
                      <p>Sign up to save this plan and track your progress!</p>
                      <a href="/signup" className="fp-signup-link">Get Started for Free →</a>
                    </div>
                  ) : saved ? (
                    <div className="fp-saved-msg">✨ Plan saved successfully! View it in your dashboard.</div>
                  ) : (
                    <button className="fp-save-btn" onClick={handleSave} disabled={saveLoading}>
                      {saveLoading ? "Saving..." : "Save Plan to Dashboard"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}