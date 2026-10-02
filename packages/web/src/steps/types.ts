import type { TaxReturnResult } from "@opentax/engine";
import type { SavedReturn } from "../lib/savedReturn.ts";

export interface StepProps {
  saved: SavedReturn;
  result: TaxReturnResult | null;
  update: (recipe: (draft: SavedReturn) => void) => void;
}
