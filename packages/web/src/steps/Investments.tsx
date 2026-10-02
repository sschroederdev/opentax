import { empty1099Div, empty1099Int, type Form1099Div, type Form1099Int } from "@opentax/engine";
import { MoneyInput, RepeatingList, TextInput } from "../components/fields.tsx";
import { removeAt } from "../lib/update.ts";
import { OwnerSelect } from "./owner.tsx";
import type { StepProps } from "./types.ts";

export function Investments({ saved, update }: StepProps) {
  return (
    <>
      <h2>Interest and dividends</h2>
      <h3>Form 1099-INT</h3>
      <RepeatingList
        items={saved.input.form1099Ints}
        noun="1099-INT"
        title={(f, i) => f.payerName || `1099-INT ${i + 1}`}
        empty={<p className="empty">No 1099-INT forms.</p>}
        onAdd={() => update((d) => void d.input.form1099Ints.push(empty1099Int()))}
        onRemove={(i) => update((d) => void (d.input.form1099Ints = removeAt(d.input.form1099Ints, i)))}
        render={(f, i) => {
          const set = (change: Partial<Form1099Int>) => update((d) => Object.assign(d.input.form1099Ints[i]!, change));
          return (
            <div className="grid">
              <OwnerSelect saved={saved} value={f.owner} onChange={(owner) => set({ owner })} />
              <TextInput label="Payer" value={f.payerName} onChange={(payerName) => set({ payerName })} />
              <MoneyInput label="Box 1: Interest income" value={f.interest} onChange={(interest) => set({ interest })} />
              <MoneyInput label="Box 2: Early withdrawal penalty" value={f.earlyWithdrawalPenalty} onChange={(earlyWithdrawalPenalty) => set({ earlyWithdrawalPenalty })} />
              <MoneyInput
                label="Box 3: U.S. savings bond and Treasury interest"
                value={f.usSavingsBondAndTreasuryInterest}
                onChange={(usSavingsBondAndTreasuryInterest) => set({ usSavingsBondAndTreasuryInterest })}
              />
              <MoneyInput label="Box 4: Federal income tax withheld" value={f.federalWithholding} onChange={(federalWithholding) => set({ federalWithholding })} />
              <MoneyInput label="Box 6: Foreign tax paid" value={f.foreignTaxPaid} onChange={(foreignTaxPaid) => set({ foreignTaxPaid })} />
              <MoneyInput label="Box 8: Tax-exempt interest" value={f.taxExemptInterest} onChange={(taxExemptInterest) => set({ taxExemptInterest })} />
              <MoneyInput label="Box 17: State tax withheld" value={f.stateTaxWithheld} onChange={(stateTaxWithheld) => set({ stateTaxWithheld })} />
            </div>
          );
        }}
      />
      <h3>Form 1099-DIV</h3>
      <RepeatingList
        items={saved.input.form1099Divs}
        noun="1099-DIV"
        title={(f, i) => f.payerName || `1099-DIV ${i + 1}`}
        empty={<p className="empty">No 1099-DIV forms.</p>}
        onAdd={() => update((d) => void d.input.form1099Divs.push(empty1099Div()))}
        onRemove={(i) => update((d) => void (d.input.form1099Divs = removeAt(d.input.form1099Divs, i)))}
        render={(f, i) => {
          const set = (change: Partial<Form1099Div>) => update((d) => Object.assign(d.input.form1099Divs[i]!, change));
          return (
            <div className="grid">
              <OwnerSelect saved={saved} value={f.owner} onChange={(owner) => set({ owner })} />
              <TextInput label="Payer" value={f.payerName} onChange={(payerName) => set({ payerName })} />
              <MoneyInput label="Box 1a: Total ordinary dividends" value={f.ordinaryDividends} onChange={(ordinaryDividends) => set({ ordinaryDividends })} />
              <MoneyInput label="Box 1b: Qualified dividends" value={f.qualifiedDividends} onChange={(qualifiedDividends) => set({ qualifiedDividends })} />
              <MoneyInput label="Box 2a: Total capital gain distributions" value={f.capitalGainDistributions} onChange={(capitalGainDistributions) => set({ capitalGainDistributions })} />
              <MoneyInput label="Box 2b: Unrecaptured section 1250 gain" value={f.unrecapturedSection1250Gain} onChange={(unrecapturedSection1250Gain) => set({ unrecapturedSection1250Gain })} />
              <MoneyInput label="Box 2c: Section 1202 gain" value={f.section1202Gain} onChange={(section1202Gain) => set({ section1202Gain })} />
              <MoneyInput label="Box 2d: Collectibles (28%) gain" value={f.collectiblesGain} onChange={(collectiblesGain) => set({ collectiblesGain })} />
              <MoneyInput label="Box 4: Federal income tax withheld" value={f.federalWithholding} onChange={(federalWithholding) => set({ federalWithholding })} />
              <MoneyInput label="Box 5: Section 199A dividends" value={f.section199ADividends} onChange={(section199ADividends) => set({ section199ADividends })} />
              <MoneyInput label="Box 7: Foreign tax paid" value={f.foreignTaxPaid} onChange={(foreignTaxPaid) => set({ foreignTaxPaid })} />
              <MoneyInput label="Box 12: Exempt-interest dividends" value={f.exemptInterestDividends} onChange={(exemptInterestDividends) => set({ exemptInterestDividends })} />
              <MoneyInput label="Box 16: State tax withheld" value={f.stateTaxWithheld} onChange={(stateTaxWithheld) => set({ stateTaxWithheld })} />
            </div>
          );
        }}
      />
    </>
  );
}
