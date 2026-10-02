import type { TaxReturnInput, TaxReturnResult, TaxYearParams } from "@opentax/engine";
import type { FilerDetails } from "./details.ts";

/** Text for a text field, or true to check a checkbox. */
export type FieldValue = string | boolean;

/** One field on an official PDF: its full field name and a phrase from its tooltip. */
export interface FieldSpec {
  name: string;
  /** Part of the field's tooltip (/TU). Tests check it so a renumbered form fails loudly. */
  tooltip: string;
}

export interface FormDefinition<K extends string = string> {
  id: string;
  title: string;
  year: number;
  /** PDF file name under pdfs/<year>/. */
  file: string;
  url: string;
  /** "Draft created 6/16/26", or "Final". Drafts print "DRAFT — DO NOT FILE". */
  revision: string;
  /** Leading pages to drop: the IRS puts a notice page in front of each draft. */
  coverPages: number;
  fields: Record<K, FieldSpec>;
}

export interface FilledForm<K extends string = string> {
  form: FormDefinition<K>;
  /** Tells copies apart, such as one Schedule C per business. */
  label?: string;
  values: Partial<Record<K, FieldValue>>;
}

export interface FormContext {
  input: TaxReturnInput;
  result: TaxReturnResult;
  details: FilerDetails;
  params: TaxYearParams;
}

/** Something the filer has to do by hand, such as attach a statement. */
export interface PacketNote {
  form: string;
  message: string;
}
