/**
 * Parses what someone types into an amount box: "1,234.56", "$1234", " 12 ".
 * Returns null for anything that isn't a plain non-negative amount.
 */
export function parseMoney(text: string): number | null {
  const cleaned = text.replace(/[$,\s]/g, "");
  if (cleaned === "") return 0;
  if (!/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === ".") return null;
  return Number(cleaned);
}

/** Shows an amount for editing: 1234.5 -> "1,234.50", 0 -> "". */
export function formatMoneyInput(amount: number): string {
  if (amount === 0) return "";
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Whole dollars for display: 1234 -> "$1,234", -50 -> "−$50". */
export function usd(amount: number): string {
  const text = Math.abs(amount).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return amount < 0 ? `−${text}` : text;
}
