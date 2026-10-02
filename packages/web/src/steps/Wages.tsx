import { emptyW2, type FormW2 } from "@opentax/engine";
import { MoneyInput, RepeatingList, TextInput } from "../components/fields.tsx";
import { removeAt } from "../lib/update.ts";
import { OwnerSelect } from "./owner.tsx";
import type { StepProps } from "./types.ts";

export function Wages({ saved, update }: StepProps) {
  return (
    <>
      <h2>Wages (Form W-2)</h2>
      <p className="lead">Enter each W-2 exactly as printed, including cents.</p>
      <RepeatingList
        items={saved.input.w2s}
        noun="W-2"
        title={(w, i) => w.employerName || `W-2 ${i + 1}`}
        empty={<p className="empty">No W-2s.</p>}
        onAdd={() => update((d) => void d.input.w2s.push(emptyW2()))}
        onRemove={(i) => update((d) => void (d.input.w2s = removeAt(d.input.w2s, i)))}
        render={(w, i) => {
          const set = (change: Partial<FormW2>) => update((d) => Object.assign(d.input.w2s[i]!, change));
          return (
            <>
              <div className="grid">
                <OwnerSelect saved={saved} value={w.owner} onChange={(owner) => set({ owner })} />
                <TextInput label="Employer name" value={w.employerName} onChange={(employerName) => set({ employerName })} />
                <TextInput label="Employer ID number (box b)" value={w.employerEin} placeholder="12-3456789" onChange={(employerEin) => set({ employerEin })} />
              </div>
              <div className="grid">
                <MoneyInput label="Box 1: Wages, tips, other compensation" value={w.wages} onChange={(wages) => set({ wages })} />
                <MoneyInput label="Box 2: Federal income tax withheld" value={w.federalWithholding} onChange={(federalWithholding) => set({ federalWithholding })} />
                <MoneyInput label="Box 3: Social security wages" value={w.socialSecurityWages} onChange={(socialSecurityWages) => set({ socialSecurityWages })} />
                <MoneyInput label="Box 4: Social security tax withheld" value={w.socialSecurityTaxWithheld} onChange={(socialSecurityTaxWithheld) => set({ socialSecurityTaxWithheld })} />
                <MoneyInput label="Box 5: Medicare wages and tips" value={w.medicareWages} onChange={(medicareWages) => set({ medicareWages })} />
                <MoneyInput label="Box 6: Medicare tax withheld" value={w.medicareTaxWithheld} onChange={(medicareTaxWithheld) => set({ medicareTaxWithheld })} />
                <MoneyInput label="Box 7: Social security tips" value={w.socialSecurityTips} onChange={(socialSecurityTips) => set({ socialSecurityTips })} />
              </div>
              <h4>No tax on tips and overtime</h4>
              <div className="grid">
                <MoneyInput
                  label="Box 12, code TP: Qualified tips"
                  hint="Tips in an occupation that customarily received tips."
                  value={w.qualifiedTips}
                  onChange={(qualifiedTips) => set({ qualifiedTips })}
                />
                <MoneyInput
                  label="Box 12, code TT: Qualified overtime"
                  hint="The extra half of time-and-a-half pay required by the Fair Labor Standards Act."
                  value={w.qualifiedOvertimeCompensation}
                  onChange={(qualifiedOvertimeCompensation) => set({ qualifiedOvertimeCompensation })}
                />
              </div>
              <h4>State</h4>
              <div className="grid">
                <TextInput label="Box 15: State" value={w.stateCode} maxLength={2} placeholder="IL" onChange={(stateCode) => set({ stateCode: stateCode.toUpperCase() })} />
                <MoneyInput label="Box 16: State wages" value={w.stateWages} onChange={(stateWages) => set({ stateWages })} />
                <MoneyInput label="Box 17: State income tax" value={w.stateIncomeTaxWithheld} onChange={(stateIncomeTaxWithheld) => set({ stateIncomeTaxWithheld })} />
              </div>
            </>
          );
        }}
      />
    </>
  );
}
