import type { CPTCode } from "../types";

export const cpt_96372: CPTCode = {
  code: "96372",
  title: "Giving an injection under the skin or into muscle",
  shortDescription:
    "Administration of a therapeutic, prophylactic, or diagnostic substance by subcutaneous or intramuscular injection — reported per injection, separately from the drug itself.",
  longDescription: `CPT 96372 covers the administration work — the clinical staff time, supervision, and needle — when a drug is injected subcutaneously (SC) or intramuscularly (IM). It does **not** include the drug. The substance being injected is billed separately with a J-code or appropriate HCPCS code.

For peptide, longevity, HRT, and weight-loss clinics, 96372 is typically the most frequently billed administration code. Every Sermorelin shot, every BPC-157 administration, every B12 injection, every testosterone cypionate dose, every Semaglutide pen demo in the office — if a clinician or nurse is administering it, 96372 is the code that captures the work.

The code requires **direct physician supervision** in most payer contexts. That doesn't mean the physician is in the room — it means they're on the premises and immediately available. In cash-pay clinics this distinction rarely matters for billing (you're not submitting to an insurer), but it absolutely matters for documentation integrity and future audit defense.

96372 is billed **per injection**, not per visit. A patient receiving three separate injections at one visit (say, Sermorelin + BPC-157 + Glutathione) is billed 96372 × 3, with appropriate modifiers. Payers flag unmodified high-count submissions, so get the modifier logic right the first time.

If the patient self-administers at home after clinic training, you cannot bill 96372 — that's a teaching visit, not an injection administration. This distinction trips up a lot of new peptide clinics.`,
  category: "Injection",
  clinicalContext: `Peptide clinics: Sermorelin, BPC-157, TB-500, Ipamorelin, CJC-1295, Semax, Selank, NAD+ (IM form), GHK-Cu, Glutathione IM.
HRT: Testosterone cypionate/enanthate, estradiol valerate, progesterone in oil.
Weight loss / GLP-1: Semaglutide, Tirzepatide, B12, MIC, lipotropic blends.
General wellness: B12, vitamin D, Kenalog (J3301 — see that page).
Any clinician- or RN-administered SC/IM medication that isn't specifically covered by a more specific code (e.g. 90471 for vaccines).`,
  modifiers: [
    {
      code: "-25",
      when: "Attach to the E/M code (not to 96372 itself) when a significant, separately identifiable E/M service is performed on the same day as the injection. Required when billing a visit plus injection.",
    },
    {
      code: "-59",
      when: "Distinct procedural service. Use when multiple 96372 injections are given at separate anatomic sites and a payer edit would otherwise bundle them. Under CMS rules, -XS (separate site) is preferred when accepted.",
    },
    {
      code: "-76",
      when: "Repeat procedure by same physician. Occasionally used when the same injection type is given twice in a single visit for different indications.",
    },
    {
      code: "-JW",
      when: "Attach to the drug J-code (not 96372) when drug is discarded from a single-dose vial. Required by Medicare; optional but recommended for audit trail on cash-pay.",
    },
  ],
  relatedCodes: [
    { code: "96373", title: "Intra-arterial injection (rarely used outside hospital)" },
    { code: "96374", title: "IV push, single drug" },
    { code: "96401", title: "Chemotherapy SC/IM administration (not interchangeable)" },
    { code: "90471", title: "Vaccine administration (use this for vaccines, NOT 96372)" },
    { code: "J3301", title: "Kenalog 10mg (triamcinolone) — paired with 96372 for joint/trigger point" },
    { code: "J1817", title: "Insulin" },
    { code: "J1071", title: "Testosterone cypionate 1mg" },
  ],
  commonDiagnoses: [
    { code: "E28.39", description: "Other primary ovarian failure (supports hormone therapy)" },
    { code: "E29.1", description: "Testicular hypofunction (supports TRT)" },
    { code: "E66.9", description: "Obesity, unspecified (supports GLP-1 injections)" },
    { code: "E34.9", description: "Endocrine disorder, unspecified" },
    { code: "M79.1", description: "Myalgia (supports BPC-157, peptide therapy)" },
    { code: "R53.83", description: "Other fatigue (supports B12, NAD+)" },
    { code: "E55.9", description: "Vitamin D deficiency" },
  ],
  documentationRequirements: [
    "Drug name, manufacturer, lot number, and expiration date",
    "Dose administered (with units) and route (IM or SC) — IM/SC ambiguity is the #1 audit flag",
    "Anatomic site of injection (deltoid, gluteal, abdominal SC, etc.)",
    "Who administered the injection (licensed staff name + credentials)",
    "Indication for the injection (ties to ICD-10)",
    "Patient response / tolerance post-injection",
    "For multi-injection visits: clearly distinguish each injection in the note, otherwise payer bundling logic will reject the claim",
    "For single-dose vial drugs with waste: document amount administered AND amount discarded",
  ],
  reimbursement: {
    medicareRate: "~$23 national average (2025 PFS, varies by locality)",
    notes: `In cash-pay practices, 96372 is typically bundled into the patient's injection visit fee ($25-$75 per injection) and never billed to insurance. Commercial payers reimburse $25-$55 depending on contract. Payers do not reimburse separately for the injection administration if the drug is billed with a code that has administration bundled (e.g. chemotherapy codes, some infusion codes).`,
  },
  specialties: [
    "Peptide therapy clinics",
    "Longevity / anti-aging clinics",
    "HRT / men's health clinics",
    "Weight loss / GLP-1 clinics",
    "Functional / integrative medicine",
    "Concierge medicine",
    "IV hydration clinics",
  ],
  kaizaraAngle: `96372 is the single code peptide and longevity clinics bill most. The billing doesn't break — the documentation does. Auditors and internal quality reviewers catch clinics on lot numbers and anatomic sites, not on the claim itself.

Kaizara's injection workflow ties every 96372 charge to (a) the inventory lot being drawn from, (b) the expiration date at time of administration, (c) the administering clinician, and (d) the anatomic site — automatically, as part of the charting flow, not as a separate documentation task. If your clinic is growing past 500 injections a month, manual lot-number tracking in a paper log or a spreadsheet is where errors start compounding.`,
  updatedAt: "2026-04-22",
  reviewedBy: "jordan-hale",
  reviewedAt: "2026-04-22",
};
