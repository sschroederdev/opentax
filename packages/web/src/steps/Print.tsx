import { federalPacket } from "@opentax/forms";
import { useMemo, useState } from "react";
import { federalPdf } from "../lib/pdf.ts";
import { exportFileName, exportReturn } from "../lib/savedReturn.ts";
import { download } from "../lib/download.ts";
import type { StepProps } from "./types.ts";

export function Print({ saved, result }: StepProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { input, details } = saved;
  const packet = useMemo(() => {
    if (!result || result.taxYear !== 2026) return null;
    try {
      return federalPacket(input, result, details);
    } catch {
      return null;
    }
  }, [input, details, result]);

  if (!result) return <p>Your return couldn't be computed. Check the earlier steps.</p>;
  if (!packet) {
    return (
      <>
        <h2>Print and file</h2>
        <p>Printable forms are available for 2026 returns only.</p>
      </>
    );
  }

  const makePdf = async () => {
    setBusy(true);
    setError(null);
    try {
      const { blob } = await federalPdf(input, result, details);
      download(blob, exportFileName(saved).replace(/\.json$/, "-federal.pdf"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>Print and file</h2>
      {!result.complete && (
        <p className="callout danger">
          This return is incomplete. Resolve everything marked "Fix this" or "Not supported" on the Review step before filing.
        </p>
      )}
      <p className="callout">
        The IRS hasn't released the final 2026 forms yet, so these are its drafts, printed "DRAFT — DO NOT FILE". Come back and print
        again after the final forms are out (usually in December). Your return is saved on this device.
      </p>

      <h3>Your federal forms</h3>
      <ul className="forms">
        {packet.forms.map((f, i) => (
          <li key={i}>
            {f.form.title}
            {f.label && <span className="hint"> ({f.label})</span>}
          </li>
        ))}
      </ul>
      <button type="button" className="primary" disabled={busy} onClick={makePdf}>
        {busy ? "Filling forms…" : "Download PDF"}
      </button>
      {error && <p className="error">{error}</p>}

      <h3>Before you mail it</h3>
      <ul className="checklist">
        {packet.notes.map((n, i) => (
          <li key={i}>
            <strong>{n.form}:</strong> {n.message}
          </li>
        ))}
        <li>
          Mail it to the address for your state on the IRS{" "}
          <a href="https://www.irs.gov/filing/where-to-file-paper-tax-returns-with-or-without-a-payment" target="_blank" rel="noreferrer">
            Where to File
          </a>{" "}
          page. Returns are due April 15, 2027.
        </li>
      </ul>

      {input.illinois && (
        <>
          <h3>Illinois</h3>
          <p>
            Illinois hasn't published its 2026 forms yet. Your IL-1040 amounts are on the Review step; printable Illinois forms will be
            added once they're out.
          </p>
        </>
      )}

      <h3>Keep a copy</h3>
      <p className="hint">The file includes your SSNs and bank details. Store it somewhere private.</p>
      <button type="button" className="secondary" onClick={() => download(new Blob([exportReturn(saved)], { type: "application/json" }), exportFileName(saved))}>
        Export return (JSON)
      </button>
    </>
  );
}
