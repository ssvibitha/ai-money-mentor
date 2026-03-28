export function buildFIREPrompt(formData) {
  return `You are a SEBI-registered financial advisor in India.

A user has provided the following details:
- Age: ${formData.age} years
- Monthly income: ₹${formData.income}
- Monthly expenses: ₹${formData.expenses}
- Current savings: ₹${formData.savings}
- Financial goal: ${formData.goal}
- Risk appetite: ${formData.risk}

Respond ONLY with a valid JSON object, no explanation, no markdown, no backticks:

{
  "monthly_sip": 15000,
  "retirement_age": 52,
  "corpus_needed": 30000000,
  "asset_allocation": { "equity": 70, "debt": 20, "gold": 10 },
  "milestones": [
    { "year": 2027, "milestone": "Emergency fund complete", "amount": 300000 },
    { "year": 2030, "milestone": "First 10L corpus", "amount": 1000000 }
  ],
  "monthly_savings": 20000,
  "summary": "Based on your profile, you can retire at 52 with a ₹3Cr corpus."
}`;
}

export function buildTaxPrompt(formData) {
  return `You are a certified tax advisor in India.

User salary details:
- Basic salary: ₹${formData.basic} per year
- HRA received: ₹${formData.hra} per year
- Special allowance: ₹${formData.special} per year
- 80C investments: ₹${formData.section80c}
- 80D health insurance: ₹${formData.section80d}
- Home loan interest: ₹${formData.homeloan}

Respond ONLY with a valid JSON object, no explanation, no markdown, no backticks:

{
  "old_regime": {
    "taxable_income": 800000,
    "tax_payable": 75000,
    "deductions_used": 150000
  },
  "new_regime": {
    "taxable_income": 950000,
    "tax_payable": 55000,
    "deductions_used": 0
  },
  "recommended": "new",
  "savings": 20000,
  "summary": "The new regime saves you ₹20,000 in tax this year."
}`;
}
