import { lazy, type ComponentType } from "react";
import type { SavedReturn } from "../lib/savedReturn.ts";
import { Business } from "./Business.tsx";
import { Contact } from "./Contact.tsx";
import { Deductions } from "./Deductions.tsx";
import { Dependents } from "./Dependents.tsx";
import { Illinois } from "./Illinois.tsx";
import { Investments } from "./Investments.tsx";
import { Review } from "./Review.tsx";
import { Sales } from "./Sales.tsx";
import { Situations } from "./Situations.tsx";
import type { StepProps } from "./types.ts";
import { Wages } from "./Wages.tsx";

// Filling PDFs needs pdf-lib, so the last step loads it on demand.
const Print = lazy(() => import("./Print.tsx").then((m) => ({ default: m.Print })));
import { You } from "./You.tsx";

export interface Step {
  id: string;
  title: string;
  component: ComponentType<StepProps>;
  /** A short count shown in the step list, such as "2 W-2s". */
  summary?: (saved: SavedReturn) => string | undefined;
}

const count = (n: number, noun: string, plural = `${noun}s`) => (n === 0 ? undefined : `${n} ${n === 1 ? noun : plural}`);

export const STEPS: Step[] = [
  { id: "you", title: "About you", component: You },
  { id: "dependents", title: "Dependents", component: Dependents, summary: (s) => count(s.input.dependents.length, "dependent") },
  { id: "wages", title: "Wages", component: Wages, summary: (s) => count(s.input.w2s.length, "W-2") },
  {
    id: "investments",
    title: "Interest and dividends",
    component: Investments,
    summary: (s) => count(s.input.form1099Ints.length + s.input.form1099Divs.length, "form"),
  },
  { id: "sales", title: "Stock and crypto sales", component: Sales, summary: (s) => count(s.input.capitalAssetSales.length, "sale") },
  { id: "business", title: "Self-employment", component: Business, summary: (s) => count(s.input.businesses.length, "business", "businesses") },
  { id: "deductions", title: "Deductions and payments", component: Deductions },
  {
    id: "situations",
    title: "Other situations",
    component: Situations,
    summary: (s) => count(Object.entries(s.input.screening).filter(([k, v]) => v && k !== "livedApartFromSpouseLastSixMonths").length, "item"),
  },
  { id: "illinois", title: "Illinois", component: Illinois, summary: (s) => (s.input.illinois ? "IL-1040" : undefined) },
  { id: "contact", title: "Address and refund", component: Contact },
  { id: "review", title: "Review", component: Review },
  { id: "print", title: "Print and file", component: Print },
];
