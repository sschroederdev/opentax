import { computeReturn, normalizeReturn } from "@opentax/engine";
import { useEffect, useMemo, useRef, useState } from "react";
import example from "../../../../examples/2026-illinois-server-freelancer.json";
import { download } from "../lib/download.ts";
import { usd } from "../lib/money.ts";
import { exportFileName, exportReturn, importReturn, newReturn, type SavedReturn } from "../lib/savedReturn.ts";
import { deleteReturn, listReturns, requestPersistence, saveReturn } from "../lib/storage.ts";

function outcome(saved: SavedReturn): string {
  try {
    const f = computeReturn(saved.input).form1040;
    return f.refund > 0 ? `Refund ${usd(f.refund)}` : `Owe ${usd(f.amountOwed)}`;
  } catch {
    return "";
  }
}

export function ReturnsList({ go }: { go: (path: string) => void }) {
  const [returns, setReturns] = useState<SavedReturn[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = () => listReturns().then(setReturns, (e) => setError(`Couldn't open this browser's storage: ${e}`));
  useEffect(() => void refresh(), []);
  // Compute each saved return once per list load, not on every render.
  const outcomes = useMemo(() => new Map(returns?.map((r) => [r.id, outcome(r)])), [returns]);

  const open = async (saved: SavedReturn) => {
    await saveReturn(saved);
    void requestPersistence();
    go(`/return/${saved.id}/you`);
  };

  return (
    <main className="home">
      <section className="intro">
        <h2>Your 2026 tax return, prepared on your own device</h2>
        <p>
          OpenTax runs entirely in this browser. Nothing you enter is uploaded: there's no account and no server. Returns are saved in
          this browser until you delete them.
        </p>
        <div className="actions">
          <button type="button" className="primary" onClick={() => open(newReturn())}>
            Start a 2026 return
          </button>
          <button type="button" className="secondary" onClick={() => fileInput.current?.click()}>
            Import a saved return
          </button>
          <button
            type="button"
            className="link"
            onClick={() => open(newReturn({ name: "Example: server and freelancer", input: normalizeReturn(example as Parameters<typeof normalizeReturn>[0]) }))}
          >
            Try an example
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                await open(importReturn(await file.text()));
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              }
            }}
          />
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      {returns && returns.length > 0 && (
        <section>
          <h2>Saved returns</h2>
          <ul className="returns">
            {returns.map((r) => (
              <li key={r.id} className="card">
                <a href={`#/return/${r.id}/you`}>
                  <strong>{r.name}</strong>
                  <span className="hint">
                    {outcomes.get(r.id)} · edited {new Date(r.updatedAt).toLocaleDateString()}
                  </span>
                </a>
                <div className="row-actions">
                  <button type="button" className="link" onClick={() => download(new Blob([exportReturn(r)], { type: "application/json" }), exportFileName(r))}>
                    Export
                  </button>
                  <button
                    type="button"
                    className="link danger"
                    onClick={async () => {
                      if (!confirm(`Delete "${r.name}" from this browser? This can't be undone.`)) return;
                      await deleteReturn(r.id);
                      await refresh();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
