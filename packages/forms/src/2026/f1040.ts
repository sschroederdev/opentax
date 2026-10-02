import { isAge65OrOlder, isCtcQualifyingChild } from "@opentax/engine";
import { primarySsn, RELATIONSHIP_LABELS } from "../common.ts";
import { amount, amountOrZero, compact, ssn } from "../format.ts";
import type { FieldValue, FilledForm, FormContext, FormDefinition, PacketNote } from "../types.ts";

const fields = {
  "8": { name: "topmostSubform[0].Page1[0].f1_72[0]", tooltip: "8. Additional income from Schedule 1, line 10." },
  "9": { name: "topmostSubform[0].Page1[0].f1_73[0]", tooltip: "9. Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7a, and 8." },
  "10": { name: "topmostSubform[0].Page1[0].f1_74[0]", tooltip: "10. Adjustments to income from Schedule 1, line" },
  "14": { name: "topmostSubform[0].Page2[0].f2_06[0]", tooltip: "14. Add lines 12e, 12f, 13a, and 13b." },
  "15": { name: "topmostSubform[0].Page2[0].f2_07[0]", tooltip: "15. Subtract line 14 from line 11b. If zero or l" },
  "16": { name: "topmostSubform[0].Page2[0].f2_09[0]", tooltip: "16. Amount." },
  "17": { name: "topmostSubform[0].Page2[0].f2_10[0]", tooltip: "17. Amount from Schedule 2, line 3." },
  "18": { name: "topmostSubform[0].Page2[0].f2_11[0]", tooltip: "18. Add lines 16 and 17." },
  "19": { name: "topmostSubform[0].Page2[0].f2_12[0]", tooltip: "19. Child tax credit or credit for other depende" },
  "20": { name: "topmostSubform[0].Page2[0].f2_13[0]", tooltip: "20. Amount from Schedule 3, line 8." },
  "21": { name: "topmostSubform[0].Page2[0].f2_14[0]", tooltip: "21. Add lines 19 and 20." },
  "22": { name: "topmostSubform[0].Page2[0].f2_15[0]", tooltip: "22. Subtract line 21 from line 18. If zero or le" },
  "23": { name: "topmostSubform[0].Page2[0].f2_16[0]", tooltip: "23. Additional taxes, including self-employment" },
  "26": { name: "topmostSubform[0].Page2[0].f2_24[0]", tooltip: "26. 2026 estimated tax payments and amount appli" },
  "28": { name: "topmostSubform[0].Page2[0].f2_27[0]", tooltip: "28. Additional child tax credit (A C T C) from S" },
  "31": { name: "topmostSubform[0].Page2[0].Line31-32_ReadOrder[0].f2_30[0]", tooltip: "31. Amount from Schedule 3, line 15." },
  "33": { name: "topmostSubform[0].Page2[0].f2_34[0]", tooltip: "33. Add lines 25d, 26, and 32c. These are your t" },
  "34": { name: "topmostSubform[0].Page2[0].f2_35[0]", tooltip: "34. If line 33 is more than line 24c, subtract l" },
  "37": { name: "topmostSubform[0].Page2[0].f2_40[0]", tooltip: "37. Subtract line 33 from line 24c. This is the" },
  "name.first": { name: "topmostSubform[0].Page1[0].f1_14[0]", tooltip: "Your first name and middle initial." },
  "name.last": { name: "topmostSubform[0].Page1[0].f1_15[0]", tooltip: "Last name." },
  "name.ssn": { name: "topmostSubform[0].Page1[0].f1_16[0]", tooltip: "Your social security number." },
  "spouse.first": { name: "topmostSubform[0].Page1[0].f1_17[0]", tooltip: "return, spouse's first name and middle initial." },
  "spouse.last": { name: "topmostSubform[0].Page1[0].f1_18[0]", tooltip: "Last name." },
  "spouse.ssn": { name: "topmostSubform[0].Page1[0].f1_19[0]", tooltip: "Spouse's social security number." },
  "address.street": { name: "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_20[0]", tooltip: "reet). If you have a P.O. box, see instructions." },
  "address.apt": { name: "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_21[0]", tooltip: "Apt. no." },
  "address.city": { name: "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_22[0]", tooltip: "e a foreign address, also complete spaces below." },
  "address.state": { name: "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_23[0]", tooltip: "State." },
  "address.zip": { name: "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_24[0]", tooltip: "Z I P code." },
  "mainHomeInUs": { name: "topmostSubform[0].Page1[0].c1_5[0]", tooltip: "urn, was in the U.S. for more than half of 2026." },
  "campaign.you": { name: "topmostSubform[0].Page1[0].c1_6[0]", tooltip: "x below will not change your tax or refund. You." },
  "campaign.spouse": { name: "topmostSubform[0].Page1[0].c1_7[0]", tooltip: "Spouse." },
  "status.single": { name: "topmostSubform[0].Page1[0].c1_8[0]", tooltip: "Filing Status. Check only one box. Single." },
  "status.mfj": { name: "topmostSubform[0].Page1[0].c1_8[1]", tooltip: "ed filing jointly (even if only one had income)." },
  "status.mfs": { name: "topmostSubform[0].Page1[0].c1_8[2]", tooltip: "Married filing separately (M F S)." },
  "status.mfsSpouseName": { name: "topmostSubform[0].Page1[0].f1_28[0]", tooltip: "Enter spouse’s S S N above and full name here:" },
  "status.hoh": { name: "topmostSubform[0].Page1[0].HOH-QSS_ReadOrder[0].c1_8[0]", tooltip: "Head of household (H O H)." },
  "status.qss": { name: "topmostSubform[0].Page1[0].HOH-QSS_ReadOrder[0].c1_8[1]", tooltip: "Qualifying surviving spouse (Q S S)." },
  "digitalAssets.yes": { name: "topmostSubform[0].Page1[0].c1_10[0]", tooltip: "r a financial interest in a digital asset)? Yes." },
  "digitalAssets.no": { name: "topmostSubform[0].Page1[0].c1_10[1]", tooltip: "No." },
  "lawful.you.yes": { name: "topmostSubform[0].Page1[0].c1_11[0]", tooltip: "work in the U.S.? (see instructions). You: Yes." },
  "lawful.you.no": { name: "topmostSubform[0].Page1[0].c1_11[1]", tooltip: "No." },
  "lawful.spouse.yes": { name: "topmostSubform[0].Page1[0].c1_12[0]", tooltip: "Spouse: Yes." },
  "lawful.spouse.no": { name: "topmostSubform[0].Page1[0].c1_12[1]", tooltip: "No." },
  "dependents.moreThanFour": { name: "topmostSubform[0].Page1[0].Dependents_ReadOrder[0].c1_13[0]", tooltip: "our dependents, see instructions and check here." },
  "dep1.first": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row1[0].f1_31[0]", tooltip: "Row: (1) First name. Column: Dependent 1." },
  "dep2.first": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row1[0].f1_32[0]", tooltip: "Row: (1) First name. Column: Dependent 2." },
  "dep3.first": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row1[0].f1_33[0]", tooltip: "Row: (1) First name. Column: Dependent 3." },
  "dep4.first": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row1[0].f1_34[0]", tooltip: "Row: (1) First name. Column: Dependent 4." },
  "dep1.last": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row2[0].f1_35[0]", tooltip: "Row: (2) Last name. Column: Dependent 1." },
  "dep2.last": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row2[0].f1_36[0]", tooltip: "Row: (2) Last name. Column: Dependent 2." },
  "dep3.last": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row2[0].f1_37[0]", tooltip: "Row: (2) Last name. Column: Dependent 3." },
  "dep4.last": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row2[0].f1_38[0]", tooltip: "Row: (2) Last name. Column: Dependent 4." },
  "dep1.ssn": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row3[0].f1_39[0]", tooltip: "Row: (3) S S N. Column: Dependent 1." },
  "dep2.ssn": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row3[0].f1_40[0]", tooltip: "Row: (3) S S N. Column: Dependent 2." },
  "dep3.ssn": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row3[0].f1_41[0]", tooltip: "Row: (3) S S N. Column: Dependent 3." },
  "dep4.ssn": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row3[0].f1_42[0]", tooltip: "Row: (3) S S N. Column: Dependent 4." },
  "dep1.relationship": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row4[0].f1_43[0]", tooltip: "Row: (4) Relationship. Column: Dependent 1." },
  "dep2.relationship": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row4[0].f1_44[0]", tooltip: "Row: (4) Relationship. Column: Dependent 2." },
  "dep3.relationship": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row4[0].f1_45[0]", tooltip: "Row: (4) Relationship. Column: Dependent 3." },
  "dep4.relationship": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row4[0].f1_46[0]", tooltip: "Row: (4) Relationship. Column: Dependent 4." },
  "dep1.livedWithYou": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row5[0].Dependent1[0].c1_14[0]", tooltip: "Row: (5) Check if lived with you more than half" },
  "dep1.inUs": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row5[0].Dependent1[0].c1_15[0]", tooltip: "Row: (5) Check if lived with you more than half" },
  "dep2.livedWithYou": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row5[0].Dependent2[0].c1_16[0]", tooltip: "Row: (5) Check if lived with you more than half" },
  "dep2.inUs": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row5[0].Dependent2[0].c1_17[0]", tooltip: "Row: (5) Check if lived with you more than half" },
  "dep3.livedWithYou": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row5[0].Dependent3[0].c1_18[0]", tooltip: "Row: (5) Check if lived with you more than half" },
  "dep3.inUs": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row5[0].Dependent3[0].c1_19[0]", tooltip: "Row: (5) Check if lived with you more than half" },
  "dep4.livedWithYou": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row5[0].Dependent4[0].c1_20[0]", tooltip: "Row: (5) Check if lived with you more than half" },
  "dep4.inUs": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row5[0].Dependent4[0].c1_21[0]", tooltip: "Row: (5) Check if lived with you more than half" },
  "dep1.student": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row6[0].Dependent1[0].c1_22[0]", tooltip: "Row: (6) Check if. Column: Dependent 1. Full-tim" },
  "dep1.disabled": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row6[0].Dependent1[0].c1_23[0]", tooltip: "Row: (6) Check if. Column: Dependent 1. Permanen" },
  "dep2.student": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row6[0].Dependent2[0].c1_24[0]", tooltip: "Row: (6) Check if. Column: Dependent 2. Full-tim" },
  "dep2.disabled": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row6[0].Dependent2[0].c1_25[0]", tooltip: "Row: (6) Check if. Column: Dependent 2. Permanen" },
  "dep3.student": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row6[0].Dependent3[0].c1_26[0]", tooltip: "Row: (6) Check if. Column: Dependent 3. Full-tim" },
  "dep3.disabled": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row6[0].Dependent3[0].c1_27[0]", tooltip: "Row: (6) Check if. Column: Dependent 3. Permanen" },
  "dep4.student": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row6[0].Dependent4[0].c1_28[0]", tooltip: "Row: (6) Check if. Column: Dependent 4. Full-tim" },
  "dep4.disabled": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row6[0].Dependent4[0].c1_29[0]", tooltip: "Row: (6) Check if. Column: Dependent 4. Permanen" },
  "dep1.ctc": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row7[0].Dependent1[0].c1_30[0]", tooltip: "Row: (7) Credits. Column: Dependent 1. Child tax" },
  "dep1.odc": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row7[0].Dependent1[0].c1_30[1]", tooltip: "Row: (7) Credits. Column: Dependent 1. Credit fo" },
  "dep2.ctc": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row7[0].Dependent2[0].c1_31[0]", tooltip: "Row: (7) Credits. Column: Dependent 2. Child tax" },
  "dep2.odc": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row7[0].Dependent2[0].c1_31[1]", tooltip: "Row: (7) Credits. Column: Dependent 2. Credit fo" },
  "dep3.ctc": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row7[0].Dependent3[0].c1_32[0]", tooltip: "Row: (7) Credits. Column: Dependent 3. Child tax" },
  "dep3.odc": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row7[0].Dependent3[0].c1_32[1]", tooltip: "Row: (7) Credits. Column: Dependent 3. Credit fo" },
  "dep4.ctc": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row7[0].Dependent4[0].c1_33[0]", tooltip: "Row: (7) Credits. Column: Dependent 4. Child tax" },
  "dep4.odc": { name: "topmostSubform[0].Page1[0].Table_Dependents[0].Row7[0].Dependent4[0].c1_33[1]", tooltip: "Row: (7) Credits. Column: Dependent 4. Credit fo" },
  "livedApart": { name: "topmostSubform[0].Page1[0].c1_34[0]", tooltip: "ame household as your spouse at the end of 2026." },
  "1a": { name: "topmostSubform[0].Page1[0].f1_47[0]", tooltip: "1a. Total amount from Form(s) W-2, box 1 (see in" },
  "1z": { name: "topmostSubform[0].Page1[0].f1_57[0]", tooltip: "1z. Add lines 1a through 1h." },
  "2a": { name: "topmostSubform[0].Page1[0].f1_58[0]", tooltip: "2a. Tax-exempt interest. Attach Sch. B if requir" },
  "2b": { name: "topmostSubform[0].Page1[0].f1_59[0]", tooltip: "2b. Taxable interest." },
  "3a": { name: "topmostSubform[0].Page1[0].f1_60[0]", tooltip: "3a. Qualified dividends. Attach Sch. B if requir" },
  "3b": { name: "topmostSubform[0].Page1[0].f1_61[0]", tooltip: "3b. Ordinary dividends." },
  "7a": { name: "topmostSubform[0].Page1[0].f1_70[0]", tooltip: "7a. Capital gain or (loss). Attach Schedule D if" },
  "7b.noScheduleD": { name: "topmostSubform[0].Page1[0].c1_45[0]", tooltip: "7b. Check if: Schedule D not required." },
  "11a": { name: "topmostSubform[0].Page1[0].f1_75[0]", tooltip: "11a. Subtract line 10 from line 9. This is your" },
  "11b": { name: "topmostSubform[0].Page2[0].f2_01[0]", tooltip: "11b. Amount from line 11a (adjusted gross income" },
  "12a.you": { name: "topmostSubform[0].Page2[0].c2_1[0]", tooltip: "12a. Someone can claim. You as a dependent." },
  "12a.spouse": { name: "topmostSubform[0].Page2[0].c2_2[0]", tooltip: "12a. Your spouse as a dependent." },
  "12d.youBorn": { name: "topmostSubform[0].Page2[0].c2_5[0]", tooltip: "12d. You: Were born before January 2, 1962." },
  "12d.youBlind": { name: "topmostSubform[0].Page2[0].c2_6[0]", tooltip: "12d. Are blind." },
  "12d.spouseBorn": { name: "topmostSubform[0].Page2[0].c2_7[0]", tooltip: "12d. Spouse: Was born before January 2, 1962." },
  "12d.spouseBlind": { name: "topmostSubform[0].Page2[0].c2_8[0]", tooltip: "12d. Is blind." },
  "12e": { name: "topmostSubform[0].Page2[0].f2_02[0]", tooltip: "12e. Standard deduction or itemized deductions (" },
  "12f": { name: "topmostSubform[0].Page2[0].f2_03[0]", tooltip: "12f. Charitable contribution deduction for non-i" },
  "13a": { name: "topmostSubform[0].Page2[0].f2_04[0]", tooltip: "13a. Additional deductions from Schedule 1-A, li" },
  "13b": { name: "topmostSubform[0].Page2[0].f2_05[0]", tooltip: "13b. Qualified business income deduction from Fo" },
  "24a": { name: "topmostSubform[0].Page2[0].f2_17[0]", tooltip: "24a. Add lines 22 and 23. This is your total tax" },
  "24c": { name: "topmostSubform[0].Page2[0].f2_19[0]", tooltip: "24c. Add lines 24a and 24b." },
  "25a": { name: "topmostSubform[0].Page2[0].Line25_ReadOrder[0].f2_20[0]", tooltip: "ederal income tax withheld from: a. Form(s) W-2." },
  "25b": { name: "topmostSubform[0].Page2[0].f2_21[0]", tooltip: "25b. Form(s) 1099." },
  "25c": { name: "topmostSubform[0].Page2[0].f2_22[0]", tooltip: "25c. Other forms (see instructions)." },
  "25d": { name: "topmostSubform[0].Page2[0].f2_23[0]", tooltip: "25d. Add lines 25a through 25c." },
  "27a": { name: "topmostSubform[0].Page2[0].f2_26[0]", tooltip: "27a. Earned income credit (E I C). If you have a" },
  "32a": { name: "topmostSubform[0].Page2[0].Line31-32_ReadOrder[0].f2_31[0]", tooltip: "32a. Add lines 27a, 28, 29, 30, and 31." },
  "32b": { name: "topmostSubform[0].Page2[0].f2_32[0]", tooltip: "32b. Amount from Schedule 3-A. If you entered an" },
  "32c": { name: "topmostSubform[0].Page2[0].f2_33[0]", tooltip: "32c. Subtract line 32b from line 32a." },
  "35a": { name: "topmostSubform[0].Page2[0].f2_36[0]", tooltip: "35a. Amount." },
  "35b": { name: "topmostSubform[0].Page2[0].RoutingNo[0].f2_37[0]", tooltip: "35b. Routing number." },
  "35c.checking": { name: "topmostSubform[0].Page2[0].c2_15[0]", tooltip: "35c. Type: Checking." },
  "35c.savings": { name: "topmostSubform[0].Page2[0].c2_15[1]", tooltip: "35c. Savings." },
  "35d": { name: "topmostSubform[0].Page2[0].AccountNo[0].f2_38[0]", tooltip: "35d. Account number." },
  "designee.no": { name: "topmostSubform[0].Page2[0].c2_16[1]", tooltip: "No." },
  "occupation.you": { name: "topmostSubform[0].Page2[0].f2_45[0]", tooltip: ". Keep a copy for your records. Your occupation." },
  "occupation.spouse": { name: "topmostSubform[0].Page2[0].f2_47[0]", tooltip: "Spouse's occupation." },
  "phone": { name: "topmostSubform[0].Page2[0].f2_49[0]", tooltip: "Phone no." },
  "email": { name: "topmostSubform[0].Page2[0].f2_50[0]", tooltip: "Email address." },
};

export const F1040: FormDefinition<keyof typeof fields> = {
  id: "f1040",
  title: "Form 1040",
  year: 2026,
  file: "f1040.pdf",
  url: "https://www.irs.gov/pub/irs-dft/f1040--dft.pdf",
  revision: "Draft created 8/19/26",
  coverPages: 1,
  fields,
};


type Key = keyof typeof fields;
type DependentSlot = "dep1" | "dep2" | "dep3" | "dep4";

export function fill1040(ctx: FormContext, notes: PacketNote[]): FilledForm<Key> {
  const { input, result, details } = ctx;
  const f = result.form1040;
  const year = input.taxYear;
  const joint = input.filingStatus === "marriedFilingJointly";
  const spouse = input.spouse;
  const v: Partial<Record<Key, FieldValue | undefined>> = {};

  // Name, address, and filing status
  v["name.first"] = [input.taxpayer.firstName, details.taxpayer.middleInitial].filter(Boolean).join(" ");
  v["name.last"] = input.taxpayer.lastName;
  v["name.ssn"] = primarySsn(ctx);
  if (!details.taxpayer.ssn.trim()) {
    notes.push({ form: "Return", message: "Write your social security number on Form 1040 and at the top of each schedule." });
  }
  if (spouse && (joint || input.filingStatus === "marriedFilingSeparately")) {
    if (joint) {
      v["spouse.first"] = [spouse.firstName, details.spouse.middleInitial].filter(Boolean).join(" ");
      v["spouse.last"] = spouse.lastName;
    } else {
      v["status.mfsSpouseName"] = `${spouse.firstName} ${spouse.lastName}`.trim();
    }
    v["spouse.ssn"] = ssn(details.spouse.ssn);
  }
  const a = details.address;
  v["address.street"] = a.street;
  v["address.apt"] = a.apartment;
  v["address.city"] = a.city;
  v["address.state"] = a.state;
  v["address.zip"] = a.zip;
  v.mainHomeInUs = input.mainHomeInUsMoreThanHalfYear;
  v["campaign.you"] = details.taxpayer.presidentialCampaign;
  v["campaign.spouse"] = joint && details.spouse.presidentialCampaign;
  const statusKey = {
    single: "status.single",
    marriedFilingJointly: "status.mfj",
    marriedFilingSeparately: "status.mfs",
    headOfHousehold: "status.hoh",
    qualifyingSurvivingSpouse: "status.qss",
  } as const;
  v[statusKey[input.filingStatus]] = true;

  // Digital assets and work authorization
  const soldDigitalAssets = input.capitalAssetSales.some((s) => s.assetType === "digitalAsset");
  const digitalAssets = details.digitalAssets ?? (soldDigitalAssets ? true : null);
  if (digitalAssets === null) {
    notes.push({ form: "Form 1040", message: "Answer the digital asset question on page 1." });
  } else {
    v[digitalAssets ? "digitalAssets.yes" : "digitalAssets.no"] = true;
  }
  const lawful = (answer: boolean | null, yes: Key, no: Key, who: string) => {
    if (answer === null) notes.push({ form: "Form 1040", message: `Answer the work authorization question on page 1 for ${who}.` });
    else v[answer ? yes : no] = true;
  };
  lawful(details.taxpayer.lawfullyAuthorizedToWork, "lawful.you.yes", "lawful.you.no", "yourself");
  if (joint) lawful(details.spouse.lawfullyAuthorizedToWork, "lawful.spouse.yes", "lawful.spouse.no", "your spouse");

  // Dependents
  input.dependents.slice(0, 4).forEach((d, i) => {
    const slot = `dep${i + 1}` as DependentSlot;
    v[`${slot}.first`] = d.firstName;
    v[`${slot}.last`] = d.lastName;
    v[`${slot}.ssn`] = ssn(details.dependentSsns[i] ?? "");
    v[`${slot}.relationship`] = RELATIONSHIP_LABELS[d.relationship];
    // monthsLivedWithFiler counts months in the United States.
    v[`${slot}.livedWithYou`] = d.monthsLivedWithFiler > 6;
    v[`${slot}.inUs`] = d.monthsLivedWithFiler > 6;
    v[`${slot}.student`] = d.fullTimeStudent;
    v[`${slot}.disabled`] = d.permanentlyDisabled;
    const credit: Key = isCtcQualifyingChild(d, year) ? `${slot}.ctc` : `${slot}.odc`;
    v[credit] = true;
  });
  if (input.dependents.length > 4) {
    v["dependents.moreThanFour"] = true;
    notes.push({ form: "Form 1040", message: "List dependents after the fourth on a statement and attach it." });
  }
  v.livedApart =
    (input.filingStatus === "marriedFilingSeparately" || input.filingStatus === "headOfHousehold") &&
    input.screening.livedApartFromSpouseLastSixMonths;

  // Income
  v["1a"] = amount(f.wages);
  v["1z"] = amount(f.wages);
  v["2a"] = amount(f.taxExemptInterest);
  v["2b"] = amount(f.taxableInterest);
  v["3a"] = amount(f.qualifiedDividends);
  v["3b"] = amount(f.ordinaryDividends);
  v["7a"] = amount(f.capitalGainOrLoss);
  v["7b.noScheduleD"] = !result.scheduleD && f.capitalGainOrLoss !== 0;
  v["8"] = amount(f.additionalIncome);
  v["9"] = amountOrZero(f.totalIncome);
  v["10"] = amount(f.adjustmentsToIncome);
  v["11a"] = amountOrZero(f.adjustedGrossIncome);

  // Deductions and tax
  v["11b"] = amountOrZero(f.adjustedGrossIncome);
  v["12a.you"] = input.taxpayer.canBeClaimedAsDependent;
  v["12a.spouse"] = joint && !!spouse?.canBeClaimedAsDependent;
  v["12d.youBorn"] = isAge65OrOlder(input.taxpayer, year);
  v["12d.youBlind"] = input.taxpayer.blind;
  if (joint && spouse) {
    v["12d.spouseBorn"] = isAge65OrOlder(spouse, year);
    v["12d.spouseBlind"] = spouse.blind;
  }
  v["12e"] = amount(f.standardDeduction);
  v["12f"] = amount(f.charitableDeduction);
  v["13a"] = amount(f.scheduleOneADeductions);
  v["13b"] = amount(f.qualifiedBusinessIncomeDeduction);
  const line14 = f.standardDeduction + f.charitableDeduction + f.scheduleOneADeductions + f.qualifiedBusinessIncomeDeduction;
  v["14"] = amount(line14);
  v["15"] = amountOrZero(f.taxableIncome);
  v["16"] = amountOrZero(f.tax);
  v["18"] = amountOrZero(f.tax);
  v["19"] = amount(f.childTaxCreditAndCreditForOtherDependents);
  v["21"] = amount(f.childTaxCreditAndCreditForOtherDependents);
  const line22 = Math.max(0, f.tax - f.childTaxCreditAndCreditForOtherDependents);
  v["22"] = amountOrZero(line22);
  v["23"] = amount(f.otherTaxes);
  v["24a"] = amountOrZero(f.totalTax);
  v["24c"] = amountOrZero(f.totalTax);

  // Payments
  const withholdingOther = f.federalWithholding - f.withholdingW2 - f.withholding1099;
  v["25a"] = amount(f.withholdingW2);
  v["25b"] = amount(f.withholding1099);
  v["25c"] = amount(withholdingOther);
  v["25d"] = amount(f.federalWithholding);
  v["26"] = amount(f.estimatedTaxPayments);
  v["27a"] = amount(f.earnedIncomeCredit);
  v["28"] = amount(f.additionalChildTaxCredit);
  v["31"] = amount(f.excessSocialSecurityWithheld);
  const line32a = f.earnedIncomeCredit + f.additionalChildTaxCredit + f.excessSocialSecurityWithheld;
  v["32a"] = amount(line32a);
  v["32b"] = amount(f.federalPublicBenefitReduction);
  v["32c"] = amount(line32a - f.federalPublicBenefitReduction);
  v["33"] = amountOrZero(f.totalPayments);

  // Refund or amount owed
  if (f.refund > 0) {
    v["34"] = amount(f.refund);
    v["35a"] = amount(f.refund);
    const bank = details.directDeposit;
    if (bank) {
      v["35b"] = bank.routingNumber;
      v["35d"] = bank.accountNumber;
      v[bank.accountType === "savings" ? "35c.savings" : "35c.checking"] = true;
    }
  }
  if (f.amountOwed > 0) v["37"] = amount(f.amountOwed);

  v["designee.no"] = true;
  v["occupation.you"] = details.taxpayer.occupation;
  if (joint) v["occupation.spouse"] = details.spouse.occupation;
  v.phone = details.phone;
  v.email = details.email;

  return { form: F1040, values: compact(v) };
}
