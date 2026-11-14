import type { ClinicalAuthor } from "./types";

/**
 * Clinical authors / reviewers for CPT content.
 *
 * E-E-A-T posture:
 * - Real, verifiable people only — no composites, no stock.
 * - Each author has at least 2 externally verifiable links in `sameAs` (NPI registry,
 *   state license lookup, LinkedIn, clinic site, PubMed, etc.).
 * - `reviewScope` must match the CPT categories the author can credibly review.
 *   A naturopathic doctor shouldn't appear as reviewer on chiropractic or surgical
 *   codes — omit the byline rather than fake it.
 *
 * When adding a new author, confirm:
 *   - Consent (email / signed contributor agreement on file)
 *   - Credentials exactly as they appear on state license
 *   - NPI (free lookup at https://npiregistry.cms.hhs.gov)
 *   - At least one external link (LinkedIn minimum)
 */
export const authors: Record<string, ClinicalAuthor> = {
  "jordan-hale": {
    slug: "jordan-hale",
    name: "Dr. Jordan Hale",
    credentials: "ND",
    title: "Sample reviewer, Demo Clinic",
    bio: "Sample reviewer profile. Replace with your own clinician.",
    sameAs: [],
    reviewScope: ["Injection", "E/M", "Preventive", "Lab", "HCPCS"],
  },
};

/** Look up an author, returning null if missing or still a placeholder. */
export function getAuthor(slug: string | undefined): ClinicalAuthor | null {
  if (!slug) return null;
  const a = authors[slug];
  if (!a) return null;
  if (a.credentials.includes("REPLACE")) return null;
  return a;
}

/** Does this author's scope cover a given CPT category? */
export function authorCoversCategory(
  author: ClinicalAuthor,
  category: string,
): boolean {
  return author.reviewScope.includes(category as ClinicalAuthor["reviewScope"][number]);
}
