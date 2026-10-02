import type { TaxReturnResult } from "@opentax/engine";
import { usd } from "../lib/money.ts";

export function Summary({ result, error, onReview }: { result: TaxReturnResult | null; error: string | null; onReview: () => void }) {
  if (!result) {
    return (
      <aside className="summary">
        <p className="error">{error ?? "Couldn't compute this return."}</p>
      </aside>
    );
  }
  const f = result.form1040;
  const problems = result.diagnostics.filter((d) => d.severity === "error" || d.severity === "unsupported").length;
  const warnings = result.diagnostics.filter((d) => d.severity === "warning").length;
  const il = result.illinois;
  return (
    <aside className="summary" aria-live="polite">
      <div className={f.refund > 0 ? "headline refund" : "headline owe"}>
        <span>{f.refund > 0 ? "Federal refund" : "Federal amount owed"}</span>
        <strong>{usd(f.refund > 0 ? f.refund : f.amountOwed)}</strong>
      </div>
      {il && (
        <div className={il.refund > 0 ? "headline small refund" : "headline small owe"}>
          <span>{il.refund > 0 ? "Illinois refund" : "Illinois amount owed"}</span>
          <strong>{usd(il.refund > 0 ? il.refund : il.amountOwed)}</strong>
        </div>
      )}
      <dl>
        <dt>Adjusted gross income</dt>
        <dd>{usd(f.adjustedGrossIncome)}</dd>
        <dt>Taxable income</dt>
        <dd>{usd(f.taxableIncome)}</dd>
        <dt>Total tax</dt>
        <dd>{usd(f.totalTax)}</dd>
        <dt>Payments and credits</dt>
        <dd>{usd(f.totalPayments)}</dd>
      </dl>
      <button type="button" className={problems ? "status incomplete" : "status complete"} onClick={onReview}>
        {problems
          ? `${problems} ${problems === 1 ? "item needs" : "items need"} attention`
          : warnings
            ? `Complete, ${warnings} ${warnings === 1 ? "note" : "notes"} to check`
            : "Complete"}
      </button>
    </aside>
  );
}
