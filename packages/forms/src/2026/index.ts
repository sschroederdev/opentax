import type { FilledForm, FormContext, FormDefinition, PacketNote } from "../types.ts";
import { F1040, fill1040 } from "./f1040.ts";
import { FORM_8949, fillForm8949 } from "./form8949.ts";
import { FORM_8959, fillForm8959 } from "./form8959.ts";
import { FORM_8960, fillForm8960 } from "./form8960.ts";
import { FORM_8995, fillForm8995 } from "./form8995.ts";
import { SCHEDULE_1, fillSchedule1 } from "./schedule1.ts";
import { SCHEDULE_1A, fillSchedule1A } from "./schedule1A.ts";
import { SCHEDULE_2, fillSchedule2 } from "./schedule2.ts";
import { SCHEDULE_3, fillSchedule3 } from "./schedule3.ts";
import { SCHEDULE_3A, fillSchedule3A } from "./schedule3A.ts";
import { SCHEDULE_8812, fillSchedule8812 } from "./schedule8812.ts";
import { SCHEDULE_B, fillScheduleB } from "./scheduleB.ts";
import { SCHEDULE_C, fillScheduleC } from "./scheduleC.ts";
import { SCHEDULE_D, fillScheduleD } from "./scheduleD.ts";
import { SCHEDULE_EIC, fillScheduleEIC } from "./scheduleEIC.ts";
import { SCHEDULE_SE, fillScheduleSE } from "./scheduleSE.ts";

/** Every 2026 federal form OpenTax fills. */
export const FORMS_2026: FormDefinition[] = [
  F1040,
  SCHEDULE_1,
  SCHEDULE_1A,
  SCHEDULE_2,
  SCHEDULE_3,
  SCHEDULE_3A,
  SCHEDULE_B,
  SCHEDULE_C,
  SCHEDULE_D,
  FORM_8949,
  SCHEDULE_SE,
  SCHEDULE_EIC,
  SCHEDULE_8812,
  FORM_8995,
  FORM_8959,
  FORM_8960,
];

/** Fills Form 1040 and each schedule the return needs. The list is in attachment sequence order. */
export function fill2026(ctx: FormContext, notes: PacketNote[]): FilledForm[] {
  const forms: (FilledForm | null)[] = [
    fill1040(ctx, notes),
    fillSchedule1(ctx),
    fillSchedule1A(ctx, notes),
    fillSchedule2(ctx),
    fillSchedule3(ctx),
    fillSchedule3A(ctx, notes),
    fillScheduleB(ctx, notes),
    ...fillScheduleC(ctx, notes),
    fillScheduleD(ctx, notes),
    ...fillForm8949(ctx),
    ...fillScheduleSE(ctx),
    fillScheduleEIC(ctx, notes),
    fillSchedule8812(ctx),
    fillForm8995(ctx, notes),
    fillForm8959(ctx),
    fillForm8960(ctx),
  ];
  return forms.filter((f): f is FilledForm => f !== null);
}
