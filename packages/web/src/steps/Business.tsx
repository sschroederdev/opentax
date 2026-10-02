import { emptyBusiness, emptyBusinessIncomeForm, type BusinessIncomeForm, type ScheduleCBusiness, type ScheduleCExpenses } from "@opentax/engine";
import { Checkbox, MoneyInput, NumberInput, RepeatingList, Select, TextInput } from "../components/fields.tsx";
import { removeAt } from "../lib/update.ts";
import { OwnerSelect } from "./owner.tsx";
import type { StepProps } from "./types.ts";

const EXPENSES: [keyof ScheduleCExpenses, string, string?][] = [
  ["advertising", "Advertising"],
  ["carAndTruck", "Car and truck expenses", "Standard mileage or actual costs for business driving."],
  ["commissionsAndFees", "Commissions and fees"],
  ["contractLabor", "Contract labor"],
  ["depreciation", "Depreciation and section 179", "Not supported yet."],
  ["insurance", "Insurance (other than health)"],
  ["mortgageInterest", "Mortgage interest (business property)"],
  ["otherInterest", "Other interest"],
  ["legalAndProfessional", "Legal and professional services"],
  ["officeExpense", "Office expense"],
  ["rentVehiclesAndEquipment", "Rent: vehicles, machinery, equipment"],
  ["rentOtherProperty", "Rent: other business property"],
  ["repairsAndMaintenance", "Repairs and maintenance"],
  ["supplies", "Supplies"],
  ["taxesAndLicenses", "Taxes and licenses"],
  ["travel", "Travel"],
  ["meals", "Business meals", "Enter the full amount; half is deductible."],
  ["utilities", "Utilities"],
  ["other", "Other expenses"],
  ["wages", "Wages paid to employees", "Not supported yet."],
  ["employeeBenefitPrograms", "Employee benefit programs", "Not supported yet."],
  ["pensionAndProfitSharing", "Pension and profit-sharing plans", "Not supported yet."],
];

export function Business({ saved, update }: StepProps) {
  return (
    <>
      <h2>Self-employment</h2>
      <p className="lead">
        Freelance, gig, and sole proprietor income (Schedule C), including income on Forms 1099-NEC, 1099-K, and 1099-MISC, and
        cash or direct payments.
      </p>
      <RepeatingList
        items={saved.input.businesses}
        noun="business"
        title={(b, i) => b.name || `Business ${i + 1}`}
        empty={<p className="empty">No self-employment income.</p>}
        onAdd={() => update((d) => void d.input.businesses.push(emptyBusiness()))}
        onRemove={(i) => update((d) => void (d.input.businesses = removeAt(d.input.businesses, i)))}
        render={(b, i) => {
          const set = (change: Partial<ScheduleCBusiness>) => update((d) => Object.assign(d.input.businesses[i]!, change));
          const setForm = (j: number, change: Partial<BusinessIncomeForm>) =>
            update((d) => Object.assign(d.input.businesses[i]!.incomeForms[j]!, change));
          return (
            <>
              <div className="grid">
                <OwnerSelect saved={saved} value={b.owner} onChange={(owner) => set({ owner })} />
                <TextInput label="Business or profession" placeholder="Photography" value={b.name} onChange={(name) => set({ name })} />
                <TextInput
                  label="Principal business code"
                  hint="Six digits, from the list in the Schedule C instructions."
                  maxLength={6}
                  value={b.principalBusinessCode}
                  onChange={(principalBusinessCode) => set({ principalBusinessCode })}
                />
              </div>
              <Checkbox
                label="I materially participated in this business in 2026"
                hint="Generally, you worked in it regularly and substantially (for example, more than 500 hours)."
                checked={b.materiallyParticipated}
                onChange={(materiallyParticipated) => set({ materiallyParticipated })}
              />
              <h4>Income</h4>
              <RepeatingList
                items={b.incomeForms}
                noun="1099"
                title={(f, j) => `${f.form}${f.payerName ? ` from ${f.payerName}` : ""}` || `Form ${j + 1}`}
                onAdd={() => update((d) => void d.input.businesses[i]!.incomeForms.push(emptyBusinessIncomeForm()))}
                onRemove={(j) => update((d) => void (d.input.businesses[i]!.incomeForms = removeAt(d.input.businesses[i]!.incomeForms, j)))}
                render={(f, j) => (
                  <div className="grid">
                    <Select
                      label="Form"
                      value={f.form}
                      onChange={(form) => setForm(j, { form })}
                      options={[
                        ["1099-NEC", "1099-NEC"],
                        ["1099-K", "1099-K"],
                        ["1099-MISC", "1099-MISC"],
                      ]}
                    />
                    <TextInput label="Payer" value={f.payerName} onChange={(payerName) => setForm(j, { payerName })} />
                    <MoneyInput label="Amount" value={f.amount} onChange={(amount) => setForm(j, { amount })} />
                    <MoneyInput label="Federal income tax withheld" value={f.federalWithholding} onChange={(federalWithholding) => setForm(j, { federalWithholding })} />
                    <MoneyInput label="State tax withheld" value={f.stateTaxWithheld} onChange={(stateTaxWithheld) => setForm(j, { stateTaxWithheld })} />
                  </div>
                )}
              />
              <div className="grid">
                <MoneyInput label="Other receipts not on a 1099" value={b.otherGrossReceipts} onChange={(otherGrossReceipts) => set({ otherGrossReceipts })} />
                <MoneyInput label="Returns and allowances" value={b.returnsAndAllowances} onChange={(returnsAndAllowances) => set({ returnsAndAllowances })} />
                <MoneyInput label="Cost of goods sold" value={b.costOfGoodsSold} onChange={(costOfGoodsSold) => set({ costOfGoodsSold })} />
                <MoneyInput label="Other business income" value={b.otherIncome} onChange={(otherIncome) => set({ otherIncome })} />
              </div>
              <h4>Expenses</h4>
              <div className="grid">
                {EXPENSES.map(([key, label, hint]) => (
                  <MoneyInput
                    key={key}
                    label={label}
                    hint={hint}
                    value={b.expenses[key]}
                    onChange={(value) => update((d) => void (d.input.businesses[i]!.expenses[key] = value))}
                  />
                ))}
              </div>
              <h4>Home office</h4>
              <NumberInput
                label="Square feet used regularly and only for this business"
                hint="Simplified method: $5 per square foot, up to 300 square feet."
                min={0}
                value={b.homeOfficeSquareFeet}
                onChange={(homeOfficeSquareFeet) => set({ homeOfficeSquareFeet })}
              />
            </>
          );
        }}
      />
    </>
  );
}
