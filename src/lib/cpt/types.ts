export type CPTCategory = "E/M" | "Injection" | "Lab" | "Procedure" | "Preventive" | "HCPCS";

export type CPTModifier = {
  code: string;
  when: string;
};

export type RelatedCode = {
  code: string;
  title: string;
  href?: string;
};

export type CommonDiagnosis = {
  code: string;
  description: string;
};

/** Credentialed contributor — used for E-E-A-T signals on YMYL-adjacent pages. */
export type ClinicalAuthor = {
  /** URL-safe slug for author bio page. */
  slug: string;
  name: string;
  /** Credentials after name. E.g. "MD, FACP" or "ND" or "DO". */
  credentials: string;
  /** Short role at the clinic / Kaizara. */
  title: string;
  /** One-paragraph bio shown on author page and optionally inline. */
  bio: string;
  /** Verifiable external presence — at least 2 required for real E-E-A-T. */
  sameAs: string[];
  /** State medical license (number + state) if public. Builds trust. */
  licenses?: { state: string; number: string; type: string }[];
  /** NPI registry number — public; enables NPI lookup verification. */
  npi?: string;
  /** Clinical scope — which CPT categories this author is qualified to review. */
  reviewScope: CPTCategory[];
  /** Optional — image URL for byline. */
  image?: string;
};

export type CPTCode = {
  code: string;
  /** Short human title — shown in H1 alongside code. E.g. "Therapeutic IM/SC Injection" */
  title: string;
  /** One-sentence official-style description. */
  shortDescription: string;
  /** Rich prose — 3–5 paragraphs. Real clinical/billing context, not slop. */
  longDescription: string;
  category: CPTCategory;
  /** When this code is typically used in practice. */
  clinicalContext: string;
  /** Common modifiers and when to use them. */
  modifiers: CPTModifier[];
  /** Related / commonly paired codes. */
  relatedCodes: RelatedCode[];
  /** Typical ICD-10 diagnoses billed alongside this code. */
  commonDiagnoses: CommonDiagnosis[];
  /** Documentation gotchas — what auditors look for. */
  documentationRequirements: string[];
  /** Reimbursement realism. */
  reimbursement?: {
    medicareRate?: string;
    notes: string;
  };
  /** Specialties that bill this code most heavily. */
  specialties: string[];
  /** Kaizara-specific angle — how the product helps with this workflow. Keep honest. */
  kaizaraAngle?: string;
  /** ISO date — used for freshness signal in schema. */
  updatedAt: string;
  /** Clinical reviewer slug — must have this category in reviewScope. Omit rather than fake. */
  reviewedBy?: string;
  /** ISO date of last clinical review. */
  reviewedAt?: string;
};
