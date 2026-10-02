import { MoneyInput } from "../components/fields.tsx";
import type { StepProps } from "./types.ts";

export function Deductions({ saved, update }: StepProps) {
  const { input } = saved;
  const joint = input.filingStatus === "marriedFilingJointly";
  return (
    <>
      <h2>Deductions and payments</h2>
      <p className="lead">
        OpenTax takes the standard deduction, plus the deductions for tips, overtime, and seniors when they apply. Itemizing isn't
        supported yet.
      </p>
      <MoneyInput
        label="Cash donations to charity in 2026"
        hint={`New for 2026: up to ${joint ? "$2,000" : "$1,000"} is deductible without itemizing. Gifts to donor-advised funds and private foundations don't count.`}
        value={input.charitableCashContributions}
        onChange={(v) => update((d) => void (d.input.charitableCashContributions = v))}
      />
      <MoneyInput
        label="2026 estimated tax payments"
        hint="Include any 2025 overpayment you applied to 2026."
        value={input.estimatedTaxPayments}
        onChange={(v) => update((d) => void (d.input.estimatedTaxPayments = v))}
      />
    </>
  );
}
