// Indian number formatting (₹4,50,000 — lakh grouping), shared by farmer screens.
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const grouped = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function formatINR(amount: number): string {
  return Number.isFinite(amount) ? inr.format(amount) : "—";
}

export function formatIndianNumber(n: number): string {
  return Number.isFinite(n) ? grouped.format(n) : "—";
}
