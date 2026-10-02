import { useEffect, useId, useState, type ReactNode } from "react";
import { formatMoneyInput, parseMoney } from "../lib/money.ts";

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  /** Narrow fields sit side by side in a `.grid`. */
  wide?: boolean;
}

function Field({ label, hint, wide, id, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={wide ? "field wide" : "field"}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function TextInput(
  props: FieldProps & { value: string; onChange: (value: string) => void; placeholder?: string; autoComplete?: string; maxLength?: number },
) {
  const id = useId();
  return (
    <Field {...props} id={id}>
      <input
        id={id}
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete ?? "off"}
        maxLength={props.maxLength}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </Field>
  );
}

/** An amount in dollars and cents. Keeps what's typed until it's a valid amount. */
export function MoneyInput(props: FieldProps & { value: number; onChange: (value: number) => void }) {
  const id = useId();
  const [text, setText] = useState(formatMoneyInput(props.value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(formatMoneyInput(props.value));
  }, [props.value, focused]);
  const invalid = parseMoney(text) === null;
  return (
    <Field {...props} id={id}>
      <div className={invalid ? "money invalid" : "money"}>
        <span aria-hidden="true">$</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          aria-invalid={invalid}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            const parsed = parseMoney(text);
            if (parsed !== null) setText(formatMoneyInput(parsed));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const parsed = parseMoney(e.target.value);
            if (parsed !== null) props.onChange(parsed);
          }}
        />
      </div>
      {invalid && <p className="error">Enter an amount like 1,234.56</p>}
    </Field>
  );
}

export function NumberInput(props: FieldProps & { value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  const id = useId();
  return (
    <Field {...props} id={id}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={props.min}
        max={props.max}
        value={Number.isFinite(props.value) ? props.value : ""}
        onChange={(e) => props.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
    </Field>
  );
}

export function DateInput(props: FieldProps & { value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <Field {...props} id={id}>
      <input id={id} type="date" value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </Field>
  );
}

export function Select<T extends string>(
  props: FieldProps & { value: T; onChange: (value: T) => void; options: readonly (readonly [T, string])[] },
) {
  const id = useId();
  return (
    <Field {...props} id={id}>
      <select id={id} value={props.value} onChange={(e) => props.onChange(e.target.value as T)}>
        {props.options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Checkbox(props: { label: ReactNode; hint?: ReactNode; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="check">
      <input id={id} type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <label htmlFor={id}>
        {props.label}
        {props.hint && <span className="hint">{props.hint}</span>}
      </label>
    </div>
  );
}

/** A yes/no question that can stay unanswered (null). */
export function YesNo(props: { label: ReactNode; hint?: ReactNode; value: boolean | null; onChange: (value: boolean) => void }) {
  const name = useId();
  return (
    <fieldset className="yesno">
      <legend>{props.label}</legend>
      {props.hint && <p className="hint">{props.hint}</p>}
      <div className="options">
        {([true, false] as const).map((answer) => (
          <label key={String(answer)} className={props.value === answer ? "selected" : undefined}>
            <input type="radio" name={name} checked={props.value === answer} onChange={() => props.onChange(answer)} />
            {answer ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A list of cards (W-2s, 1099s, ...) with add and remove buttons. */
export function RepeatingList<T>(props: {
  items: T[];
  noun: string;
  title: (item: T, index: number) => string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className="repeating">
      {props.items.length === 0 && props.empty}
      {props.items.map((item, i) => (
        <section className="card" key={i}>
          <header>
            <h3>{props.title(item, i)}</h3>
            <button type="button" className="link danger" onClick={() => props.onRemove(i)}>
              Remove
            </button>
          </header>
          {props.render(item, i)}
        </section>
      ))}
      <button type="button" className="secondary" onClick={props.onAdd}>
        + Add {props.noun}
      </button>
    </div>
  );
}
