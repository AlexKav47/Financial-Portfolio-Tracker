export function formatMoney(amount, currency) {
  if (amount == null || !Number.isFinite(Number(amount))) return "—";
  const c = (currency || "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: 6,
    }).format(Number(amount));
  } catch {
    return String(amount);
  }
}
