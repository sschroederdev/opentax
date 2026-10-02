import { emptyIllinois, type IllinoisInput } from "@opentax/engine";
import { Checkbox, MoneyInput, Select } from "../components/fields.tsx";
import type { StepProps } from "./types.ts";

export function Illinois({ saved, update }: StepProps) {
  const il = saved.input.illinois;
  const set = (change: Partial<IllinoisInput>) => update((d) => void Object.assign(d.input.illinois!, change));
  return (
    <>
      <h2>Illinois</h2>
      <Checkbox
        label="Prepare an Illinois return (IL-1040)"
        checked={il !== null}
        onChange={(on) => update((d) => void (d.input.illinois = on ? emptyIllinois() : null))}
      />
      {il && (
        <>
          <Select
            label="Residency in 2026"
            value={il.residency}
            onChange={(residency) => set({ residency })}
            options={[
              ["fullYear", "Lived in Illinois all year"],
              ["partYear", "Moved into or out of Illinois (not supported yet)"],
              ["nonresident", "Lived in another state (not supported yet)"],
            ]}
          />
          <div className="grid">
            <MoneyInput
              label="Property tax paid on your Illinois home"
              hint="For the 5% property tax credit (Schedule ICR)."
              value={il.propertyTaxPaid}
              onChange={(propertyTaxPaid) => set({ propertyTaxPaid })}
            />
            <MoneyInput
              label="K-12 tuition, book, and lab fees"
              hint="For full-time K-12 students under 21 at an Illinois school."
              value={il.k12EducationExpenses}
              onChange={(k12EducationExpenses) => set({ k12EducationExpenses })}
            />
            <MoneyInput
              label="Use tax"
              hint="Tax owed on out-of-state and online purchases that didn't charge Illinois sales tax."
              value={il.useTax}
              onChange={(useTax) => set({ useTax })}
            />
            <MoneyInput label="Illinois estimated payments" value={il.estimatedPayments} onChange={(estimatedPayments) => set({ estimatedPayments })} />
            <MoneyInput
              label="Bright Start, Bright Directions, or ABLE contributions"
              hint="The subtraction for these isn't supported yet."
              value={il.collegeSavingsContributions}
              onChange={(collegeSavingsContributions) => set({ collegeSavingsContributions })}
            />
          </div>
        </>
      )}
    </>
  );
}
