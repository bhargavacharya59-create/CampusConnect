const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** ₹18,500 */
export const rupees = (n: number) => inr.format(n);

/** 87.4% (drops the decimal when it is .0) */
export const pct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`;

export function initials(name: string): string {
  const parts = name.replace(/^(Dr|Prof|Mr|Mrs|Ms)\.\s+/i, "").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function plural(n: number, one: string, many = one + "s"): string {
  return `${n} ${n === 1 ? one : many}`;
}
