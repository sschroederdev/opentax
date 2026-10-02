import { computeReturn, type TaxReturnResult } from "@opentax/engine";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { SavedReturn } from "../lib/savedReturn.ts";
import { saveReturn } from "../lib/storage.ts";
import { produce } from "../lib/update.ts";
import { STEPS } from "../steps/index.ts";
import { Summary } from "./Summary.tsx";

function compute(saved: SavedReturn): { result: TaxReturnResult | null; error: string | null } {
  try {
    return { result: computeReturn(saved.input), error: null };
  } catch (e) {
    return { result: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export function ReturnEditor(props: { initial: SavedReturn; stepId: string; go: (path: string) => void }) {
  const [saved, setSaved] = useState(props.initial);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { result, error } = useMemo(() => compute(saved), [saved]);
  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.id === props.stepId));
  const step = STEPS[stepIndex]!;
  const Step = step.component;

  // Autosave shortly after each change, and when leaving.
  const pending = useRef<SavedReturn | null>(null);
  useEffect(() => {
    if (saved === props.initial) return;
    pending.current = saved;
    const timer = setTimeout(() => {
      pending.current = null;
      saveReturn(saved).then(() => setSaveError(null), (e) => setSaveError(String(e)));
    }, 400);
    return () => clearTimeout(timer);
  }, [saved, props.initial]);
  useEffect(() => () => void (pending.current && saveReturn(pending.current)), []);

  const update = (recipe: (draft: SavedReturn) => void) =>
    setSaved((prev) => produce(prev, (d) => {
      recipe(d);
      d.updatedAt = new Date().toISOString();
    }));

  const goStep = (id: string) => {
    props.go(`/return/${saved.id}/${id}`);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="editor">
      <nav className="steps" aria-label="Steps">
        <input
          className="return-name"
          aria-label="Return name"
          value={saved.name}
          onChange={(e) => update((d) => void (d.name = e.target.value))}
        />
        <ol>
          {STEPS.map((s) => {
            const note = s.summary?.(saved);
            return (
              <li key={s.id}>
                <a
                  href={`#/return/${saved.id}/${s.id}`}
                  aria-current={s.id === step.id ? "step" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    goStep(s.id);
                  }}
                >
                  {s.title}
                  {note && <span className="count">{note}</span>}
                </a>
              </li>
            );
          })}
        </ol>
        {saveError && <p className="error">Couldn't save: {saveError}</p>}
      </nav>
      <main className="step">
        <Suspense fallback={<p className="loading">Loading…</p>}>
          <Step saved={saved} result={result} update={update} />
        </Suspense>
        <div className="step-buttons">
          {stepIndex > 0 && (
            <button type="button" className="secondary" onClick={() => goStep(STEPS[stepIndex - 1]!.id)}>
              ← {STEPS[stepIndex - 1]!.title}
            </button>
          )}
          {stepIndex < STEPS.length - 1 && (
            <button type="button" className="primary" onClick={() => goStep(STEPS[stepIndex + 1]!.id)}>
              {STEPS[stepIndex + 1]!.title} →
            </button>
          )}
        </div>
      </main>
      <Summary result={result} error={error} onReview={() => goStep("review")} />
    </div>
  );
}
