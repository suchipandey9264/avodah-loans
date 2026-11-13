/** Standard reducing-balance EMI: P·r·(1+r)^n / ((1+r)^n − 1), r = monthly rate. */
export function emi(principal, annualRatePct, months) {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export const formatINR = (n) => "₹" + inr.format(Math.round(n));

/** ₹ amounts in lakh / crore shorthand. */
export function formatShort(n) {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)} L`;
  return formatINR(n);
}
