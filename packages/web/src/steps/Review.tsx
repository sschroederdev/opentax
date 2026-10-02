import type { Diagnostic, TaxReturnResult } from "@opentax/engine";
import type { ReactNode } from "react";
import { usd } from "../lib/money.ts";
import type { StepProps } from "./types.ts";

/** A form line. A string amount (a count) is shown as is; numbers are dollars. */
type Row = [line: string, label: string, amount: number | string];

function Lines({ rows, hideZero = true }: { rows: Row[]; hideZero?: boolean }) {
  return (
    <table className="lines">
      <tbody>
        {rows
          .filter(([, , amount], i) => !hideZero || (amount !== 0 && amount !== "0") || i === rows.length - 1)
          .map(([line, label, amount]) => (
            <tr key={line + label}>
              <th scope="row" className="line">{line}</th>
              <td>{label}</td>
              <td className="amount">{typeof amount === "string" ? amount : usd(amount)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

function Section({ title, children, open }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="section" open={open}>
      <summary>{title}</summary>
      {children}
    </details>
  );
}

const SEVERITY_LABEL: Record<Diagnostic["severity"], string> = {
  error: "Fix this",
  unsupported: "Not supported",
  warning: "Check this",
  info: "Note",
};

export function Diagnostics({ diagnostics }: { diagnostics: Diagnostic[] }) {
  if (diagnostics.length === 0) return <p className="ok">No problems found.</p>;
  const order: Diagnostic["severity"][] = ["error", "unsupported", "warning", "info"];
  return (
    <ul className="diagnostics">
      {[...diagnostics]
        .sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))
        .map((d, i) => (
          <li key={i} className={d.severity}>
            <span className="badge">{SEVERITY_LABEL[d.severity]}</span> {d.message}
          </li>
        ))}
    </ul>
  );
}

function form1040Rows(r: TaxReturnResult): Row[] {
  const f = r.form1040;
  return [
    ["1z", "Wages", f.wages],
    ["2a", "Tax-exempt interest", f.taxExemptInterest],
    ["2b", "Taxable interest", f.taxableInterest],
    ["3a", "Qualified dividends", f.qualifiedDividends],
    ["3b", "Ordinary dividends", f.ordinaryDividends],
    ["7a", "Capital gain or (loss)", f.capitalGainOrLoss],
    ["8", "Additional income (Schedule 1)", f.additionalIncome],
    ["9", "Total income", f.totalIncome],
    ["10", "Adjustments to income (Schedule 1)", f.adjustmentsToIncome],
    ["11a", "Adjusted gross income", f.adjustedGrossIncome],
    ["12e", "Standard deduction", f.standardDeduction],
    ["12f", "Charitable deduction", f.charitableDeduction],
    ["13a", "Tips, overtime, and senior deductions (Schedule 1-A)", f.scheduleOneADeductions],
    ["13b", "Qualified business income deduction", f.qualifiedBusinessIncomeDeduction],
    ["15", "Taxable income", f.taxableIncome],
    ["16", "Tax", f.tax],
    ["19", "Child tax credit and credit for other dependents", f.childTaxCreditAndCreditForOtherDependents],
    ["23", "Other taxes (Schedule 2)", f.otherTaxes],
    ["24a", "Total tax", f.totalTax],
    ["25d", "Federal income tax withheld", f.federalWithholding],
    ["26", "Estimated tax payments", f.estimatedTaxPayments],
    ["27a", "Earned income credit", f.earnedIncomeCredit],
    ["28", "Additional child tax credit", f.additionalChildTaxCredit],
    ["31", "Excess social security withheld (Schedule 3)", f.excessSocialSecurityWithheld],
    ["32b", "Refundable credits not paid (Schedule 3-A)", -f.federalPublicBenefitReduction],
    ["33", "Total payments", f.totalPayments],
    f.refund > 0 ? ["34", "Refund", f.refund] : ["37", "Amount you owe", f.amountOwed],
  ];
}

export function Review({ result }: StepProps) {
  if (!result) return <p>Your return couldn't be computed. Check the earlier steps.</p>;
  const r = result;
  return (
    <>
      <h2>Review</h2>
      <h3>Things to look at</h3>
      <Diagnostics diagnostics={r.diagnostics} />

      <h3>Form 1040</h3>
      <Lines rows={form1040Rows(r)} />

      <h3>Schedules and worksheets</h3>
      {r.scheduleOneA.total > 0 && (
        <Section title="Schedule 1-A: Additional deductions">
          <Lines rows={[["15", "No tax on tips", r.scheduleOneA.tips], ["27", "No tax on overtime", r.scheduleOneA.overtime], ["43", "Enhanced deduction for seniors", r.scheduleOneA.senior], ["44", "Total", r.scheduleOneA.total]]} />
        </Section>
      )}
      {r.scheduleB.required && (
        <Section title="Schedule B: Interest and dividends">
          <Lines hideZero={false} rows={[...r.scheduleB.interest.map((x, i): Row => [`1`, x.payerName || `Payer ${i + 1}`, x.amount]), ["4", "Taxable interest", r.form1040.taxableInterest]]} />
          <Lines hideZero={false} rows={[...r.scheduleB.dividends.map((x, i): Row => [`5`, x.payerName || `Payer ${i + 1}`, x.amount]), ["6", "Ordinary dividends", r.form1040.ordinaryDividends]]} />
        </Section>
      )}
      {r.scheduleC.map((c, i) => (
        <Section key={i} title={`Schedule C: ${c.name || `Business ${i + 1}`}`}>
          <Lines rows={[["1", "Gross receipts", c.grossReceipts], ["7", "Gross income", c.grossIncome], ["28", "Total expenses", c.totalExpenses], ["30", "Home office (simplified method)", c.homeOfficeDeduction], ["31", "Net profit or (loss)", c.netProfit]]} />
        </Section>
      ))}
      {r.scheduleSE.map((se, i) => (
        <Section key={i} title={`Schedule SE: ${se.owner === "spouse" ? "spouse" : "you"}`}>
          <Lines rows={[["2", "Net profit", se.netProfit], ["6", "Net earnings from self-employment", se.netEarnings], ["10", "Social security tax", se.socialSecurityTax], ["11", "Medicare tax", se.medicareTax], ["12", "Self-employment tax", se.selfEmploymentTax], ["13", "Deductible half", se.deduction]]} />
        </Section>
      ))}
      {r.form8995 && (
        <Section title="Form 8995: Qualified business income deduction">
          <Lines rows={[...r.form8995.businesses.map((b): Row => ["1", b.name || "Business", b.qualifiedBusinessIncome]), ["2", "Total qualified business income", r.form8995.qualifiedBusinessIncome], ["6", "REIT dividends", r.form8995.qualifiedReitDividends], ["11", "Taxable income before the deduction", r.form8995.taxableIncomeBeforeDeduction], ["12", "Net capital gain", r.form8995.netCapitalGain], ["17", "Deduction", r.form8995.deduction]]} />
        </Section>
      )}
      {r.scheduleD && (
        <Section title="Schedule D and Form 8949: Capital gains and losses">
          <table className="lines">
            <thead>
              <tr><th>Box</th><th>Sales</th><th className="amount">Proceeds</th><th className="amount">Basis</th><th className="amount">Adjustment</th><th className="amount">Gain or (loss)</th></tr>
            </thead>
            <tbody>
              {r.scheduleD.form8949.map((g) => (
                <tr key={g.box}>
                  <th scope="row">{g.box}</th>
                  <td>{g.rows.length}</td>
                  <td className="amount">{usd(g.proceeds)}</td>
                  <td className="amount">{usd(g.costBasis)}</td>
                  <td className="amount">{usd(g.adjustment)}</td>
                  <td className="amount">{usd(g.gainOrLoss)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Lines rows={[["6", "Short-term loss carryover", -r.scheduleD.shortTermCarryover], ["7", "Net short-term gain or (loss)", r.scheduleD.netShortTerm], ["13", "Capital gain distributions", r.scheduleD.capitalGainDistributions], ["14", "Long-term loss carryover", -r.scheduleD.longTermCarryover], ["15", "Net long-term gain or (loss)", r.scheduleD.netLongTerm], ["16", "Total", r.scheduleD.total], ["21", "Loss allowed this year", r.scheduleD.allowedLoss], ["", "Short-term loss to carry to 2027", r.scheduleD.carryoverToNextYear.shortTerm], ["", "Long-term loss to carry to 2027", r.scheduleD.carryoverToNextYear.longTerm]]} />
        </Section>
      )}
      {r.qualifiedDividendsWorksheet && (
        <Section title="Qualified Dividends and Capital Gain Tax Worksheet">
          <Lines rows={Object.entries(r.qualifiedDividendsWorksheet.lines).map(([line, amount]): Row => [line, `Line ${line}`, amount])} hideZero={false} />
        </Section>
      )}
      {r.schedule8812.creditBeforePhaseout > 0 && (
        <Section title="Schedule 8812: Child tax credit">
          <Lines rows={[["4", "Qualifying children under 17", String(r.schedule8812.qualifyingChildren)], ["6", "Other dependents", String(r.schedule8812.otherDependents)], ["8", "Credit before phaseout", r.schedule8812.creditBeforePhaseout], ["11", "Phaseout", r.schedule8812.phaseoutReduction], ["13", "Limit (your tax)", r.schedule8812.creditLimit], ["14", "Nonrefundable credit", r.schedule8812.nonrefundableCredit], ["27", "Additional child tax credit", r.schedule8812.additionalChildTaxCredit]]} />
        </Section>
      )}
      <Section title="Earned income credit">
        {r.earnedIncomeCredit.eligible ? (
          <Lines rows={[["", "Qualifying children", String(r.earnedIncomeCredit.qualifyingChildren)], ["", "Earned income", r.earnedIncomeCredit.earnedIncome], ["", "Investment income", r.earnedIncomeCredit.investmentIncome], ["27a", "Credit", r.earnedIncomeCredit.credit]]} />
        ) : (
          <ul>{r.earnedIncomeCredit.ineligibleReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        )}
      </Section>
      {r.scheduleThreeA && (
        <Section title="Schedule 3-A: Federal public benefit">
          <Lines hideZero={false} rows={[["6", "Refundable credits beyond your tax", r.scheduleThreeA.federalPublicBenefit], ["8", "Not paid", r.scheduleThreeA.reduction]]} />
        </Section>
      )}
      {(r.form8959.additionalMedicareTax > 0 || r.form8959.additionalMedicareTaxWithheld > 0) && (
        <Section title="Form 8959: Additional Medicare Tax">
          <Lines rows={[["7", "On wages", r.form8959.onWages], ["18", "On self-employment income", r.form8959.onSelfEmployment], ["24", "Withheld by employers", r.form8959.additionalMedicareTaxWithheld]]} />
        </Section>
      )}
      {r.form8960.netInvestmentIncomeTax > 0 && (
        <Section title="Form 8960: Net investment income tax">
          <Lines rows={[["8", "Investment income", r.form8960.netInvestmentIncome], ["13", "Modified AGI", r.form8960.modifiedAgi], ["14", "Threshold", r.form8960.threshold], ["17", "Tax", r.form8960.netInvestmentIncomeTax]]} />
        </Section>
      )}

      {r.illinois && (
        <>
          <h3>Illinois IL-1040</h3>
          <p className="hint">Line numbers are from the 2025 IL-1040; Illinois hasn't published the 2026 form yet.</p>
          <Lines
            rows={[
              ["1", "Federal adjusted gross income", r.illinois.federalAgi],
              ["2", "Federally tax-exempt interest and dividends", r.illinois.taxExemptInterestAddition],
              ["3", "Other additions", r.illinois.otherAdditions],
              ["4", "Total income", r.illinois.totalIncome],
              ["8", "Subtractions (Schedule M)", r.illinois.subtractions],
              ["9", "Illinois base income", r.illinois.baseIncome],
              ["10", "Exemption allowance", r.illinois.exemptionAllowance],
              ["11", "Net income", r.illinois.netIncome],
              ["12", "Tax (4.95%)", r.illinois.tax],
              ["16", "Property tax credit", r.illinois.propertyTaxCredit],
              ["16", "K-12 education expense credit", r.illinois.k12EducationCredit],
              ["19", "Tax after credits", r.illinois.taxAfterCredits],
              ["21", "Use tax", r.illinois.useTax],
              ["23", "Total tax", r.illinois.totalTax],
              ["25", "Illinois income tax withheld", r.illinois.withholding],
              ["26", "Estimated payments", r.illinois.estimatedPayments],
              ["29", "Illinois earned income credit", r.illinois.earnedIncomeCredit],
              ["30", "Illinois child tax credit", r.illinois.childTaxCredit],
              ["31", "Total payments and credits", r.illinois.totalPayments],
              r.illinois.refund > 0 ? ["32", "Overpayment", r.illinois.refund] : ["33", "Amount you owe", r.illinois.amountOwed],
            ]}
          />
        </>
      )}
    </>
  );
}
