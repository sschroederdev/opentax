import { roundDollars, type Form8949Box, type Form8949Group, type Form8949Row } from "@opentax/engine";
import { namesOnReturn, primarySsn } from "../common.ts";
import { amount, amountOrZero, compact } from "../format.ts";
import type { FieldValue, FilledForm, FormContext, FormDefinition } from "../types.ts";

const fields = {
  "p1.name": { name: "topmostSubform[0].Page1[0].f1_01[0]", tooltip: "Page 1. Name(s) shown on return." },
  "p1.ssn": { name: "topmostSubform[0].Page1[0].f1_02[0]", tooltip: "curity number or taxpayer identification number." },
  "p1.boxA": { name: "topmostSubform[0].Page1[0].c1_1[0]", tooltip: "asis was reported to the I R S (see Note above)." },
  "p1.boxB": { name: "topmostSubform[0].Page1[0].c1_1[1]", tooltip: "9-B showing basis was not reported to the I R S." },
  "p1.boxC": { name: "topmostSubform[0].Page1[0].c1_1[2]", tooltip: "reported to you on Form 1099-B or Form 1099-D A." },
  "p1.boxG": { name: "topmostSubform[0].Page1[0].c1_1[3]", tooltip: "asis was reported to the I R S (see Note above)." },
  "p1.boxH": { name: "topmostSubform[0].Page1[0].c1_1[4]", tooltip: "D A showing basis was not reported to the I R S." },
  "p1.boxI": { name: "topmostSubform[0].Page1[0].c1_1[5]", tooltip: "reported to you on Form 1099-D A or Form 1099-B." },
  "p1.r1.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row1[0].f1_03[0]", tooltip: "Row: 1. Column: (a) Description of property (Exa" },
  "p1.r1.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row1[0].f1_04[0]", tooltip: "Row: 1. Column: (b) Date acquired (Mo., day, yr." },
  "p1.r1.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row1[0].f1_05[0]", tooltip: "Row: 1. Column: (c) Date sold or disposed of (Mo" },
  "p1.r1.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row1[0].f1_06[0]", tooltip: "Row: 1. Column: (d) Proceeds (sales price) (see" },
  "p1.r1.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row1[0].f1_07[0]", tooltip: "Row: 1. Column: (e) Cost or other basis. See the" },
  "p1.r1.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row1[0].f1_08[0]", tooltip: "Row: 1. Column: Adjustment, if any, to gain or l" },
  "p1.r1.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row1[0].f1_09[0]", tooltip: "Row: 1. Column: Adjustment, if any, to gain or l" },
  "p1.r1.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row1[0].f1_10[0]", tooltip: "Row: 1. Column: (h) Gain or (loss). Subtract col" },
  "p1.r2.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row2[0].f1_11[0]", tooltip: "Row: 2. Column: (a) Description of property (Exa" },
  "p1.r2.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row2[0].f1_12[0]", tooltip: "Row: 2. Column: (b) Date acquired (Mo., day, yr." },
  "p1.r2.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row2[0].f1_13[0]", tooltip: "Row: 2. Column: (c) Date sold or disposed of (Mo" },
  "p1.r2.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row2[0].f1_14[0]", tooltip: "Row: 2. Column: (d) Proceeds (sales price) (see" },
  "p1.r2.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row2[0].f1_15[0]", tooltip: "Row: 2. Column: (e) Cost or other basis. See the" },
  "p1.r2.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row2[0].f1_16[0]", tooltip: "Row: 2. Column: Adjustment, if any, to gain or l" },
  "p1.r2.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row2[0].f1_17[0]", tooltip: "Row: 2. Column: Adjustment, if any, to gain or l" },
  "p1.r2.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row2[0].f1_18[0]", tooltip: "Row: 2. Column: (h) Gain or (loss). Subtract col" },
  "p1.r3.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row3[0].f1_19[0]", tooltip: "Row: 3. Column: (a) Description of property (Exa" },
  "p1.r3.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row3[0].f1_20[0]", tooltip: "Row: 3. Column: (b) Date acquired (Mo., day, yr." },
  "p1.r3.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row3[0].f1_21[0]", tooltip: "Row: 3. Column: (c) Date sold or disposed of (Mo" },
  "p1.r3.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row3[0].f1_22[0]", tooltip: "Row: 3. Column: (d) Proceeds (sales price) (see" },
  "p1.r3.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row3[0].f1_23[0]", tooltip: "Row: 3. Column: (e) Cost or other basis. See the" },
  "p1.r3.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row3[0].f1_24[0]", tooltip: "Row: 3. Column: Adjustment, if any, to gain or l" },
  "p1.r3.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row3[0].f1_25[0]", tooltip: "Row: 3. Column: Adjustment, if any, to gain or l" },
  "p1.r3.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row3[0].f1_26[0]", tooltip: "Row: 3. Column: (h) Gain or (loss). Subtract col" },
  "p1.r4.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row4[0].f1_27[0]", tooltip: "Row: 4. Column: (a) Description of property (Exa" },
  "p1.r4.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row4[0].f1_28[0]", tooltip: "Row: 4. Column: (b) Date acquired (Mo., day, yr." },
  "p1.r4.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row4[0].f1_29[0]", tooltip: "Row: 4. Column: (c) Date sold or disposed of (Mo" },
  "p1.r4.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row4[0].f1_30[0]", tooltip: "Row: 4. Column: (d) Proceeds (sales price) (see" },
  "p1.r4.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row4[0].f1_31[0]", tooltip: "Row: 4. Column: (e) Cost or other basis. See the" },
  "p1.r4.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row4[0].f1_32[0]", tooltip: "Row: 4. Column: Adjustment, if any, to gain or l" },
  "p1.r4.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row4[0].f1_33[0]", tooltip: "Row: 4. Column: Adjustment, if any, to gain or l" },
  "p1.r4.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row4[0].f1_34[0]", tooltip: "Row: 4. Column: (h) Gain or (loss). Subtract col" },
  "p1.r5.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row5[0].f1_35[0]", tooltip: "Row: 5. Column: (a) Description of property (Exa" },
  "p1.r5.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row5[0].f1_36[0]", tooltip: "Row: 5. Column: (b) Date acquired (Mo., day, yr." },
  "p1.r5.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row5[0].f1_37[0]", tooltip: "Row: 5. Column: (c) Date sold or disposed of (Mo" },
  "p1.r5.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row5[0].f1_38[0]", tooltip: "Row: 5. Column: (d) Proceeds (sales price) (see" },
  "p1.r5.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row5[0].f1_39[0]", tooltip: "Row: 5. Column: (e) Cost or other basis. See the" },
  "p1.r5.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row5[0].f1_40[0]", tooltip: "Row: 5. Column: Adjustment, if any, to gain or l" },
  "p1.r5.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row5[0].f1_41[0]", tooltip: "Row: 5. Column: Adjustment, if any, to gain or l" },
  "p1.r5.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row5[0].f1_42[0]", tooltip: "Row: 5. Column: (h) Gain or (loss). Subtract col" },
  "p1.r6.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row6[0].f1_43[0]", tooltip: "Row: 6. Column: (a) Description of property (Exa" },
  "p1.r6.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row6[0].f1_44[0]", tooltip: "Row: 6. Column: (b) Date acquired (Mo., day, yr." },
  "p1.r6.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row6[0].f1_45[0]", tooltip: "Row: 6. Column: (c) Date sold or disposed of (Mo" },
  "p1.r6.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row6[0].f1_46[0]", tooltip: "Row: 6. Column: (d) Proceeds (sales price) (see" },
  "p1.r6.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row6[0].f1_47[0]", tooltip: "Row: 6. Column: (e) Cost or other basis. See the" },
  "p1.r6.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row6[0].f1_48[0]", tooltip: "Row: 6. Column: Adjustment, if any, to gain or l" },
  "p1.r6.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row6[0].f1_49[0]", tooltip: "Row: 6. Column: Adjustment, if any, to gain or l" },
  "p1.r6.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row6[0].f1_50[0]", tooltip: "Row: 6. Column: (h) Gain or (loss). Subtract col" },
  "p1.r7.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row7[0].f1_51[0]", tooltip: "Row: 7. Column: (a) Description of property (Exa" },
  "p1.r7.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row7[0].f1_52[0]", tooltip: "Row: 7. Column: (b) Date acquired (Mo., day, yr." },
  "p1.r7.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row7[0].f1_53[0]", tooltip: "Row: 7. Column: (c) Date sold or disposed of (Mo" },
  "p1.r7.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row7[0].f1_54[0]", tooltip: "Row: 7. Column: (d) Proceeds (sales price) (see" },
  "p1.r7.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row7[0].f1_55[0]", tooltip: "Row: 7. Column: (e) Cost or other basis. See the" },
  "p1.r7.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row7[0].f1_56[0]", tooltip: "Row: 7. Column: Adjustment, if any, to gain or l" },
  "p1.r7.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row7[0].f1_57[0]", tooltip: "Row: 7. Column: Adjustment, if any, to gain or l" },
  "p1.r7.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row7[0].f1_58[0]", tooltip: "Row: 7. Column: (h) Gain or (loss). Subtract col" },
  "p1.r8.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row8[0].f1_59[0]", tooltip: "Row: 8. Column: (a) Description of property (Exa" },
  "p1.r8.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row8[0].f1_60[0]", tooltip: "Row: 8. Column: (b) Date acquired (Mo., day, yr." },
  "p1.r8.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row8[0].f1_61[0]", tooltip: "Row: 8. Column: (c) Date sold or disposed of (Mo" },
  "p1.r8.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row8[0].f1_62[0]", tooltip: "Row: 8. Column: (d) Proceeds (sales price) (see" },
  "p1.r8.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row8[0].f1_63[0]", tooltip: "Row: 8. Column: (e) Cost or other basis. See the" },
  "p1.r8.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row8[0].f1_64[0]", tooltip: "Row: 8. Column: Adjustment, if any, to gain or l" },
  "p1.r8.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row8[0].f1_65[0]", tooltip: "Row: 8. Column: Adjustment, if any, to gain or l" },
  "p1.r8.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row8[0].f1_66[0]", tooltip: "Row: 8. Column: (h) Gain or (loss). Subtract col" },
  "p1.r9.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row9[0].f1_67[0]", tooltip: "Row: 9. Column: (a) Description of property (Exa" },
  "p1.r9.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row9[0].f1_68[0]", tooltip: "Row: 9. Column: (b) Date acquired (Mo., day, yr." },
  "p1.r9.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row9[0].f1_69[0]", tooltip: "Row: 9. Column: (c) Date sold or disposed of (Mo" },
  "p1.r9.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row9[0].f1_70[0]", tooltip: "Row: 9. Column: (d) Proceeds (sales price) (see" },
  "p1.r9.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row9[0].f1_71[0]", tooltip: "Row: 9. Column: (e) Cost or other basis. See the" },
  "p1.r9.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row9[0].f1_72[0]", tooltip: "Row: 9. Column: Adjustment, if any, to gain or l" },
  "p1.r9.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row9[0].f1_73[0]", tooltip: "Row: 9. Column: Adjustment, if any, to gain or l" },
  "p1.r9.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row9[0].f1_74[0]", tooltip: "Row: 9. Column: (h) Gain or (loss). Subtract col" },
  "p1.r10.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row10[0].f1_75[0]", tooltip: "Row: 10. Column: (a) Description of property (Ex" },
  "p1.r10.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row10[0].f1_76[0]", tooltip: "Row: 10. Column: (b) Date acquired (Mo., day, yr" },
  "p1.r10.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row10[0].f1_77[0]", tooltip: "Row: 10. Column: (c) Date sold or disposed of (M" },
  "p1.r10.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row10[0].f1_78[0]", tooltip: "Row: 10. Column: (d) Proceeds (sales price) (see" },
  "p1.r10.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row10[0].f1_79[0]", tooltip: "Row: 10. Column: (e) Cost or other basis. See th" },
  "p1.r10.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row10[0].f1_80[0]", tooltip: "Row: 10. Column: Adjustment, if any, to gain or" },
  "p1.r10.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row10[0].f1_81[0]", tooltip: "Row: 10. Column: Adjustment, if any, to gain or" },
  "p1.r10.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row10[0].f1_82[0]", tooltip: "Row: 10. Column: (h) Gain or (loss). Subtract co" },
  "p1.r11.a": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row11[0].f1_83[0]", tooltip: "Row: 11. Column: (a) Description of property (Ex" },
  "p1.r11.b": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row11[0].f1_84[0]", tooltip: "Row: 11. Column: (b) Date acquired (Mo., day, yr" },
  "p1.r11.c": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row11[0].f1_85[0]", tooltip: "Row: 11. Column: (c) Date sold or disposed of (M" },
  "p1.r11.d": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row11[0].f1_86[0]", tooltip: "Row: 11. Column: (d) Proceeds (sales price) (see" },
  "p1.r11.e": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row11[0].f1_87[0]", tooltip: "Row: 11. Column: (e) Cost or other basis. See th" },
  "p1.r11.f": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row11[0].f1_88[0]", tooltip: "Row: 11. Column: Adjustment, if any, to gain or" },
  "p1.r11.g": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row11[0].f1_89[0]", tooltip: "Row: 11. Column: Adjustment, if any, to gain or" },
  "p1.r11.h": { name: "topmostSubform[0].Page1[0].Table_Line1_Part1[0].Row11[0].f1_90[0]", tooltip: "Row: 11. Column: (h) Gain or (loss). Subtract co" },
  "p1.total.d": { name: "topmostSubform[0].Page1[0].f1_91[0]", tooltip: ". (d) Proceeds (sales price) (see instructions)." },
  "p1.total.e": { name: "topmostSubform[0].Page1[0].f1_92[0]", tooltip: "and see Column (e) in the separate instructions." },
  "p1.total.f": { name: "topmostSubform[0].Page1[0].f1_93[0]", tooltip: "ate instructions. (f) Code(s) from instructions." },
  "p1.total.g": { name: "topmostSubform[0].Page1[0].f1_94[0]", tooltip: "separate instructions. (g) Amount of adjustment." },
  "p1.total.h": { name: "topmostSubform[0].Page1[0].f1_95[0]", tooltip: "lumn (d) and combine the result with column (g)." },
  "p2.name": { name: "topmostSubform[0].Page2[0].f2_01[0]", tooltip: "ication no. not required if shown on other side." },
  "p2.ssn": { name: "topmostSubform[0].Page2[0].f2_02[0]", tooltip: "curity number or taxpayer identification number." },
  "p2.boxD": { name: "topmostSubform[0].Page2[0].c2_1[0]", tooltip: "asis was reported to the I R S (see Note above)." },
  "p2.boxE": { name: "topmostSubform[0].Page2[0].c2_1[1]", tooltip: "9-B showing basis was not reported to the I R S." },
  "p2.boxF": { name: "topmostSubform[0].Page2[0].c2_1[2]", tooltip: "reported to you on Form 1099-B or Form 1099-D A." },
  "p2.boxJ": { name: "topmostSubform[0].Page2[0].c2_1[3]", tooltip: "asis was reported to the I R S (see Note above)." },
  "p2.boxK": { name: "topmostSubform[0].Page2[0].c2_1[4]", tooltip: "D A showing basis was not reported to the I R S." },
  "p2.boxL": { name: "topmostSubform[0].Page2[0].c2_1[5]", tooltip: "reported to you on Form 1099-D A or Form 1099-B." },
  "p2.r1.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row1[0].f2_03[0]", tooltip: "Row: 1. Column: (a) Description of property (Exa" },
  "p2.r1.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row1[0].f2_04[0]", tooltip: "Row: 1. Column: (b) Date acquired (Mo., day, yr." },
  "p2.r1.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row1[0].f2_05[0]", tooltip: "Row: 1. Column: (c) Date sold or disposed of (Mo" },
  "p2.r1.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row1[0].f2_06[0]", tooltip: "Row: 1. Column: (d) Proceeds (sales price) (see" },
  "p2.r1.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row1[0].f2_07[0]", tooltip: "Row: 1. Column: (e) Cost or other basis. See the" },
  "p2.r1.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row1[0].f2_08[0]", tooltip: "Row: 1. Column: Adjustment, if any, to gain or l" },
  "p2.r1.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row1[0].f2_09[0]", tooltip: "Row: 1. Column: Adjustment, if any, to gain or l" },
  "p2.r1.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row1[0].f2_10[0]", tooltip: "Row: 1. Column: (h) Gain or (loss). Subtract col" },
  "p2.r2.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row2[0].f2_11[0]", tooltip: "Row: 2. Column: (a) Description of property (Exa" },
  "p2.r2.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row2[0].f2_12[0]", tooltip: "Row: 2. Column: (b) Date acquired (Mo., day, yr." },
  "p2.r2.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row2[0].f2_13[0]", tooltip: "Row: 2. Column: (c) Date sold or disposed of (Mo" },
  "p2.r2.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row2[0].f2_14[0]", tooltip: "Row: 2. Column: (d) Proceeds (sales price) (see" },
  "p2.r2.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row2[0].f2_15[0]", tooltip: "Row: 2. Column: (e) Cost or other basis. See the" },
  "p2.r2.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row2[0].f2_16[0]", tooltip: "Row: 2. Column: Adjustment, if any, to gain or l" },
  "p2.r2.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row2[0].f2_17[0]", tooltip: "Row: 2. Column: Adjustment, if any, to gain or l" },
  "p2.r2.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row2[0].f2_18[0]", tooltip: "Row: 2. Column: (h) Gain or (loss). Subtract col" },
  "p2.r3.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row3[0].f2_19[0]", tooltip: "Row: 3. Column: (a) Description of property (Exa" },
  "p2.r3.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row3[0].f2_20[0]", tooltip: "Row: 3. Column: (b) Date acquired (Mo., day, yr." },
  "p2.r3.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row3[0].f2_21[0]", tooltip: "Row: 3. Column: (c) Date sold or disposed of (Mo" },
  "p2.r3.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row3[0].f2_22[0]", tooltip: "Row: 3. Column: (d) Proceeds (sales price) (see" },
  "p2.r3.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row3[0].f2_23[0]", tooltip: "Row: 3. Column: (e) Cost or other basis. See the" },
  "p2.r3.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row3[0].f2_24[0]", tooltip: "Row: 3. Column: Adjustment, if any, to gain or l" },
  "p2.r3.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row3[0].f2_25[0]", tooltip: "Row: 3. Column: Adjustment, if any, to gain or l" },
  "p2.r3.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row3[0].f2_26[0]", tooltip: "Row: 3. Column: (h) Gain or (loss). Subtract col" },
  "p2.r4.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row4[0].f2_27[0]", tooltip: "Row: 4. Column: (a) Description of property (Exa" },
  "p2.r4.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row4[0].f2_28[0]", tooltip: "Row: 4. Column: (b) Date acquired (Mo., day, yr." },
  "p2.r4.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row4[0].f2_29[0]", tooltip: "Row: 4. Column: (c) Date sold or disposed of (Mo" },
  "p2.r4.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row4[0].f2_30[0]", tooltip: "Row: 4. Column: (d) Proceeds (sales price) (see" },
  "p2.r4.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row4[0].f2_31[0]", tooltip: "Row: 4. Column: (e) Cost or other basis. See the" },
  "p2.r4.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row4[0].f2_32[0]", tooltip: "Row: 4. Column: Adjustment, if any, to gain or l" },
  "p2.r4.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row4[0].f2_33[0]", tooltip: "Row: 4. Column: Adjustment, if any, to gain or l" },
  "p2.r4.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row4[0].f2_34[0]", tooltip: "Row: 4. Column: (h) Gain or (loss). Subtract col" },
  "p2.r5.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row5[0].f2_35[0]", tooltip: "Row: 5. Column: (a) Description of property (Exa" },
  "p2.r5.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row5[0].f2_36[0]", tooltip: "Row: 5. Column: (b) Date acquired (Mo., day, yr." },
  "p2.r5.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row5[0].f2_37[0]", tooltip: "Row: 5. Column: (c) Date sold or disposed of (Mo" },
  "p2.r5.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row5[0].f2_38[0]", tooltip: "Row: 5. Column: (d) Proceeds (sales price) (see" },
  "p2.r5.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row5[0].f2_39[0]", tooltip: "Row: 5. Column: (e) Cost or other basis. See the" },
  "p2.r5.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row5[0].f2_40[0]", tooltip: "Row: 5. Column: Adjustment, if any, to gain or l" },
  "p2.r5.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row5[0].f2_41[0]", tooltip: "Row: 5. Column: Adjustment, if any, to gain or l" },
  "p2.r5.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row5[0].f2_42[0]", tooltip: "Row: 5. Column: (h) Gain or (loss). Subtract col" },
  "p2.r6.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row6[0].f2_43[0]", tooltip: "Row: 6. Column: (a) Description of property (Exa" },
  "p2.r6.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row6[0].f2_44[0]", tooltip: "Row: 6. Column: (b) Date acquired (Mo., day, yr." },
  "p2.r6.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row6[0].f2_45[0]", tooltip: "Row: 6. Column: (c) Date sold or disposed of (Mo" },
  "p2.r6.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row6[0].f2_46[0]", tooltip: "Row: 6. Column: (d) Proceeds (sales price) (see" },
  "p2.r6.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row6[0].f2_47[0]", tooltip: "Row: 6. Column: (e) Cost or other basis. See the" },
  "p2.r6.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row6[0].f2_48[0]", tooltip: "Row: 6. Column: Adjustment, if any, to gain or l" },
  "p2.r6.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row6[0].f2_49[0]", tooltip: "Row: 6. Column: Adjustment, if any, to gain or l" },
  "p2.r6.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row6[0].f2_50[0]", tooltip: "Row: 6. Column: (h) Gain or (loss). Subtract col" },
  "p2.r7.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row7[0].f2_51[0]", tooltip: "Row: 7. Column: (a) Description of property (Exa" },
  "p2.r7.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row7[0].f2_52[0]", tooltip: "Row: 7. Column: (b) Date acquired (Mo., day, yr." },
  "p2.r7.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row7[0].f2_53[0]", tooltip: "Row: 7. Column: (c) Date sold or disposed of (Mo" },
  "p2.r7.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row7[0].f2_54[0]", tooltip: "Row: 7. Column: (d) Proceeds (sales price) (see" },
  "p2.r7.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row7[0].f2_55[0]", tooltip: "Row: 7. Column: (e) Cost or other basis. See the" },
  "p2.r7.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row7[0].f2_56[0]", tooltip: "Row: 7. Column: Adjustment, if any, to gain or l" },
  "p2.r7.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row7[0].f2_57[0]", tooltip: "Row: 7. Column: Adjustment, if any, to gain or l" },
  "p2.r7.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row7[0].f2_58[0]", tooltip: "Row: 7. Column: (h) Gain or (loss). Subtract col" },
  "p2.r8.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row8[0].f2_59[0]", tooltip: "Row: 8. Column: (a) Description of property (Exa" },
  "p2.r8.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row8[0].f2_60[0]", tooltip: "Row: 8. Column: (b) Date acquired (Mo., day, yr." },
  "p2.r8.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row8[0].f2_61[0]", tooltip: "Row: 8. Column: (c) Date sold or disposed of (Mo" },
  "p2.r8.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row8[0].f2_62[0]", tooltip: "Row: 8. Column: (d) Proceeds (sales price) (see" },
  "p2.r8.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row8[0].f2_63[0]", tooltip: "Row: 8. Column: (e) Cost or other basis. See the" },
  "p2.r8.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row8[0].f2_64[0]", tooltip: "Row: 8. Column: Adjustment, if any, to gain or l" },
  "p2.r8.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row8[0].f2_65[0]", tooltip: "Row: 8. Column: Adjustment, if any, to gain or l" },
  "p2.r8.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row8[0].f2_66[0]", tooltip: "Row: 8. Column: (h) Gain or (loss). Subtract col" },
  "p2.r9.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row9[0].f2_67[0]", tooltip: "Row: 9. Column: (a) Description of property (Exa" },
  "p2.r9.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row9[0].f2_68[0]", tooltip: "Row: 9. Column: (b) Date acquired (Mo., day, yr." },
  "p2.r9.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row9[0].f2_69[0]", tooltip: "Row: 9. Column: (c) Date sold or disposed of (Mo" },
  "p2.r9.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row9[0].f2_70[0]", tooltip: "Row: 9. Column: (d) Proceeds (sales price) (see" },
  "p2.r9.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row9[0].f2_71[0]", tooltip: "Row: 9. Column: (e) Cost or other basis. See the" },
  "p2.r9.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row9[0].f2_72[0]", tooltip: "Row: 9. Column: Adjustment, if any, to gain or l" },
  "p2.r9.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row9[0].f2_73[0]", tooltip: "Row: 9. Column: Adjustment, if any, to gain or l" },
  "p2.r9.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row9[0].f2_74[0]", tooltip: "Row: 9. Column: (h) Gain or (loss). Subtract col" },
  "p2.r10.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row10[0].f2_75[0]", tooltip: "Row: 10. Column: (a) Description of property (Ex" },
  "p2.r10.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row10[0].f2_76[0]", tooltip: "Row: 10. Column: (b) Date acquired (Mo., day, yr" },
  "p2.r10.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row10[0].f2_77[0]", tooltip: "Row: 10. Column: (c) Date sold or disposed of (M" },
  "p2.r10.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row10[0].f2_78[0]", tooltip: "Row: 10. Column: (d) Proceeds (sales price) (see" },
  "p2.r10.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row10[0].f2_79[0]", tooltip: "Row: 10. Column: (e) Cost or other basis. See th" },
  "p2.r10.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row10[0].f2_80[0]", tooltip: "Row: 10. Column: Adjustment, if any, to gain or" },
  "p2.r10.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row10[0].f2_81[0]", tooltip: "Row: 10. Column: Adjustment, if any, to gain or" },
  "p2.r10.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row10[0].f2_82[0]", tooltip: "Row: 10. Column: (h) Gain or (loss). Subtract co" },
  "p2.r11.a": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row11[0].f2_83[0]", tooltip: "Row: 11. Column: (a) Description of property (Ex" },
  "p2.r11.b": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row11[0].f2_84[0]", tooltip: "Row: 11. Column: (b) Date acquired (Mo., day, yr" },
  "p2.r11.c": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row11[0].f2_85[0]", tooltip: "Row: 11. Column: (c) Date sold or disposed of (M" },
  "p2.r11.d": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row11[0].f2_86[0]", tooltip: "Row: 11. Column: (d) Proceeds (sales price) (see" },
  "p2.r11.e": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row11[0].f2_87[0]", tooltip: "Row: 11. Column: (e) Cost or other basis. See th" },
  "p2.r11.f": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row11[0].f2_88[0]", tooltip: "Row: 11. Column: Adjustment, if any, to gain or" },
  "p2.r11.g": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row11[0].f2_89[0]", tooltip: "Row: 11. Column: Adjustment, if any, to gain or" },
  "p2.r11.h": { name: "topmostSubform[0].Page2[0].Table_Line1_Part2[0].Row11[0].f2_90[0]", tooltip: "Row: 11. Column: (h) Gain or (loss). Subtract co" },
  "p2.total.d": { name: "topmostSubform[0].Page2[0].f2_91[0]", tooltip: ". (d) Proceeds (sales price) (see instructions)." },
  "p2.total.e": { name: "topmostSubform[0].Page2[0].f2_92[0]", tooltip: "and see Column (e) in the separate instructions." },
  "p2.total.f": { name: "topmostSubform[0].Page2[0].f2_93[0]", tooltip: "ate instructions. (f) Code(s) from instructions." },
  "p2.total.g": { name: "topmostSubform[0].Page2[0].f2_94[0]", tooltip: "separate instructions. (g) Amount of adjustment." },
  "p2.total.h": { name: "topmostSubform[0].Page2[0].f2_95[0]", tooltip: "lumn (d) and combine the result with column (g)." },
};

type Key = keyof typeof fields;

export const FORM_8949: FormDefinition<Key> = {
  id: "f8949",
  title: "Form 8949",
  year: 2026,
  file: "f8949.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f8949--dft.pdf",
  revision: "Draft created 4/1/26",
  coverPages: 1,
  fields,
};

const ROWS_PER_PART = 11;
type Chunk = { box: Form8949Box; rows: Form8949Row[] };

const chunks = (groups: Form8949Group[]): Chunk[] =>
  groups.flatMap((g) =>
    Array.from({ length: Math.ceil(g.rows.length / ROWS_PER_PART) }, (_, i) => ({
      box: g.box,
      rows: g.rows.slice(i * ROWS_PER_PART, (i + 1) * ROWS_PER_PART),
    })),
  );

/** MM/DD/YYYY, or VARIOUS when there's no single acquisition date. */
const date = (iso: string) => (iso ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : "VARIOUS");

function fillPart(v: Partial<Record<Key, FieldValue>>, part: "p1" | "p2", chunk: Chunk, header: { name: string; ssn: string }) {
  Object.assign(v, { [`${part}.name`]: header.name, [`${part}.ssn`]: header.ssn, [`${part}.box${chunk.box}`]: true });
  const totals = { d: 0, e: 0, g: 0, h: 0 };
  chunk.rows.forEach((row, i) => {
    const d = roundDollars(row.proceeds);
    const e = roundDollars(row.costBasis);
    const g = roundDollars(row.adjustment);
    const h = d - e + g;
    totals.d += d;
    totals.e += e;
    totals.g += g;
    totals.h += h;
    const cell = (col: string) => `${part}.r${i + 1}.${col}` as Key;
    Object.assign(v, {
      [cell("a")]: row.description,
      [cell("b")]: date(row.dateAcquired),
      [cell("c")]: date(row.dateSold),
      [cell("d")]: amount(d),
      [cell("e")]: amount(e),
      [cell("f")]: row.adjustmentCode,
      [cell("g")]: amount(g),
      [cell("h")]: amountOrZero(h),
    });
  });
  Object.assign(v, {
    [`${part}.total.d`]: amount(totals.d),
    [`${part}.total.e`]: amount(totals.e),
    [`${part}.total.g`]: amount(totals.g),
    [`${part}.total.h`]: amountOrZero(totals.h),
  });
}

/**
 * Form 8949 copies. Each copy holds one box's short-term sales on page 1
 * and one box's long-term sales on page 2, 11 rows each.
 */
export function fillForm8949(ctx: FormContext): FilledForm<Key>[] {
  const d = ctx.result.scheduleD;
  if (!d) return [];
  const short = chunks(d.form8949.filter((g) => g.term === "short"));
  const long = chunks(d.form8949.filter((g) => g.term === "long"));
  const header = { name: namesOnReturn(ctx), ssn: primarySsn(ctx) };
  return Array.from({ length: Math.max(short.length, long.length) }, (_, i) => {
    const v: Partial<Record<Key, FieldValue>> = {};
    if (short[i]) fillPart(v, "p1", short[i], header);
    if (long[i]) fillPart(v, "p2", long[i], header);
    return { form: FORM_8949, label: `copy ${i + 1}`, values: compact(v) };
  });
}
