import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { getCPTCodesByCategory, getAllCPTCodes } from "@/lib/cpt";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "CPT Code Directory for Integrative, Peptide & Cash-Pay Clinics | Kaizara",
  description:
    "Clinically reviewed CPT code reference for peptide therapy, HRT, longevity, and integrative-medicine clinics. Billing gotchas, modifiers, documentation, and reimbursement notes.",
  alternates: { canonical: `${SITE_URL}/codes` },
};

export default function CPTIndexPage() {
  const byCategory = getCPTCodesByCategory();
  const total = getAllCPTCodes().length;
  const categoryOrder = ["Injection", "E/M", "Preventive", "Lab", "Procedure", "HCPCS"] as const;

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Stethoscope className="h-5 w-5" />
            <span>Kaizara</span>
          </Link>
          <Link href="/login" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <p className="text-sm font-mono uppercase tracking-wider text-zinc-500 mb-2">
            Reference
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            CPT code directory
          </h1>
          <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed">
            A clinically reviewed reference for the CPT codes peptide, HRT, longevity, and
            integrative-medicine clinics bill most. Every page covers real documentation gotchas,
            modifier logic, and reimbursement context — not just the code description.
          </p>
        </div>

        <p className="text-sm text-zinc-500 mb-8">
          {total} {total === 1 ? "code" : "codes"} · more added weekly
        </p>

        <div className="space-y-10">
          {categoryOrder.map((category) => {
            const codes = byCategory[category];
            if (!codes || codes.length === 0) return null;
            return (
              <section key={category}>
                <h2 className="text-xl font-semibold mb-4">{category}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {codes.map((c) => (
                    <Link
                      key={c.code}
                      href={`/codes/${c.code}`}
                      className="group block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="font-mono font-semibold">{c.code}</span>
                        <span className="text-xs text-zinc-500">{c.category}</span>
                      </div>
                      <p className="font-medium group-hover:underline">{c.title}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                        {c.shortDescription}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-12 text-xs text-zinc-400 leading-relaxed">
          This directory is for general educational and billing-context purposes only. Verify
          coding decisions against current CMS guidance, your payer contracts, and your compliance
          program. CPT® is a registered trademark of the American Medical Association.
        </p>
      </main>
    </div>
  );
}
