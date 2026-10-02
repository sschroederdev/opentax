import type { Screening } from "@opentax/engine";
import { Checkbox } from "../components/fields.tsx";
import type { StepProps } from "./types.ts";

const QUESTIONS: [Exclude<keyof Screening, "livedApartFromSpouseLastSixMonths">, string][] = [
  ["retirementDistributions", "Retirement distributions: pensions, IRAs, or 401(k) (Form 1099-R)"],
  ["socialSecurityBenefits", "Social Security benefits (Form SSA-1099)"],
  ["unemploymentCompensation", "Unemployment compensation (Form 1099-G)"],
  ["rentalRoyaltyOrK1Income", "Rental property, royalties, or a Schedule K-1 from a partnership, S corporation, or trust"],
  ["soldHomeOrBusinessProperty", "Sold a home, land, or business property"],
  ["otherIncome", "Gambling winnings (Form W-2G), prizes, alimony received, jury duty pay, or other income"],
  ["farmIncome", "Farm income (Schedule F)"],
  ["householdEmployees", "Paid a household employee, such as a nanny or housekeeper"],
  ["marketplaceHealthInsurance", "Health insurance from the Marketplace (Form 1095-A)"],
  ["wantsToItemize", "I want to itemize deductions (mortgage interest, state taxes, large donations)"],
  ["carLoanInterest", "Interest on a loan for a new car assembled in the U.S."],
  ["educationExpensesOrStudentLoanInterest", "College tuition, or student loan interest"],
  ["hsaOrIraContributions", "Contributions to an HSA or IRA"],
  ["childOrDependentCareExpenses", "Child or dependent care expenses (daycare, after-school care)"],
  ["foreignAccountsOrIncome", "Foreign bank accounts, foreign trusts, or income from another country"],
];

export function Situations({ saved, update }: StepProps) {
  return (
    <>
      <h2>Other situations</h2>
      <p className="lead">
        Check anything that applied to you (or your spouse) in 2026. OpenTax doesn't handle these yet, so it will tell you the return
        is incomplete rather than give you a wrong answer.
      </p>
      {QUESTIONS.map(([key, label]) => (
        <Checkbox
          key={key}
          label={label}
          checked={saved.input.screening[key]}
          onChange={(v) => update((d) => void (d.input.screening[key] = v))}
        />
      ))}
    </>
  );
}
