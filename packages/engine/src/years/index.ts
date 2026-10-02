import type { TaxYearParams } from "./params.ts";
import { TY2025 } from "./ty2025.ts";
import { TY2026 } from "./ty2026.ts";

export type { Bracket, ByStatus, EitcParams, TaxYearParams } from "./params.ts";
export { TY2025, TY2026 };

export const SUPPORTED_YEARS: Record<number, TaxYearParams> = {
  2025: TY2025,
  2026: TY2026,
};
