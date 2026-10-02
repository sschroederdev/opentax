/** Whole dollars with thousands separators; negative amounts in parentheses. Zero is left blank. */
export function amount(dollars: number): string {
  if (dollars === 0) return "";
  const text = Math.abs(dollars).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return dollars < 0 ? `(${text})` : text;
}

/** Like `amount`, but writes 0 for lines the instructions say to enter -0- on. */
export function amountOrZero(dollars: number): string {
  return dollars === 0 ? "0" : amount(dollars);
}

/** For lines printed with their own parentheses: the absolute value. */
export function loss(dollars: number): string {
  return amount(Math.abs(dollars));
}

/** "123-45-6789" from digits with or without dashes; anything else is returned as typed. */
export function ssn(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 9 ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}` : value.trim();
}

/** Drops undefined and false values, so only fields with something to write remain. */
export function compact<K extends string>(values: Partial<Record<K, string | boolean | undefined>>) {
  const out: Partial<Record<K, string | boolean>> = {};
  for (const [key, value] of Object.entries(values) as [K, string | boolean | undefined][]) {
    if (value !== undefined && value !== false && value !== "") out[key] = value;
  }
  return out;
}
