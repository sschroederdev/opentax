import type { IsoDate } from "./types.ts";

interface YearMonthDay {
  year: number;
  month: number;
  day: number;
}

export function parseIsoDate(date: IsoDate): YearMonthDay {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Invalid date "${date}", expected YYYY-MM-DD`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function isValidIsoDate(date: IsoDate): boolean {
  try {
    const { year, month, day } = parseIsoDate(date);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
  } catch {
    return false;
  }
}

/**
 * Age on December 31 of the tax year, counting a birthday as reached on its
 * anniversary. Used for child age tests (Rev. Rul. 2003-72).
 */
export function ageAtEndOfYear(dateOfBirth: IsoDate, taxYear: number): number {
  const { year } = parseIsoDate(dateOfBirth);
  return taxYear - year;
}

/**
 * Age on December 31 of the tax year, treating a person as reaching an age
 * the day before their birthday. The IRS uses this convention for the age 65
 * tests (standard deduction, senior deduction) and the EITC age 25-64 test:
 * someone born on January 1 is treated as a year older at the end of the
 * prior year.
 */
export function ageAtEndOfYearDayBeforeRule(dateOfBirth: IsoDate, taxYear: number): number {
  const { year, month, day } = parseIsoDate(dateOfBirth);
  const age = taxYear - year;
  return month === 1 && day === 1 ? age + 1 : age;
}
