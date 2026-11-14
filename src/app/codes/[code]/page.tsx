import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Stethoscope } from "lucide-react";
import { cptCodes, getCPTCode } from "@/lib/cpt";
import { getAuthor, authorCoversCategory } from "@/lib/cpt/authors";
import { SITE_URL } from "@/lib/site-url";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(cptCodes).map((code) => ({ code }));
}

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const data = getCPTCode(code);
  if (!data) return { title: "Code not found" };

  const title = `CPT ${data.code}: ${data.title} | Billing Guide | Kaizara`;
  const description =
    data.shortDescription.length <= 160
      ? data.shortDescription
      : data.shortDescription.slice(0, 157) + "...";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/codes/${data.code}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/codes/${data.code}`,
      type: "article",
    },
  };
}

export default async function CPTCodePage({ params }: Props) {
  const { code } = await params;
  const data = getCPTCode(code);
  if (!data) notFound();

  const reviewer = getAuthor(data.reviewedBy);
  const showReviewer = reviewer && authorCoversCategory(reviewer, data.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalCode",
    codeValue: data.code,
    codingSystem: "CPT",
    name: data.title,
    description: data.shortDescription,
    url: `${SITE_URL}/codes/${data.code}`,
    dateModified: data.updatedAt,
    ...(showReviewer && {
      reviewedBy: {
        "@type": "Person",
        name: reviewer.name,
        honorificSuffix: reviewer.credentials,
        jobTitle: reviewer.title,
        sameAs: reviewer.sameAs.filter((u) => !u.includes("REPLACE")),
      },
    }),
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top nav */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Stethoscope className="h-5 w-5" />
            <span>Kaizara</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/codes" className="hover:underline">CPT directory</Link>
            <Link href="/login" className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/codes" className="hover:underline">CPT codes</Link></li>
            <li aria-hidden>/</li>
            <li className="text-zinc-900 dark:text-zinc-100" aria-current="page">{data.code}</li>
          </ol>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          <p className="text-sm font-mono uppercase tracking-wider text-zinc-500 mb-2">
            CPT · {data.category}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            {data.code}: {data.title}
          </h1>
          <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {data.shortDescription}
          </p>

          {showReviewer && reviewer && (
            <div className="mt-6 flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                {reviewer.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1">
                <p>
                  <span className="text-zinc-500">Medically reviewed by</span>{" "}
                  <Link href={`/authors/${reviewer.slug}`} className="font-medium hover:underline">
                    {reviewer.name}, {reviewer.credentials}
                  </Link>
                </p>
                {data.reviewedAt && (
                  <p className="text-xs text-zinc-500">
                    Last reviewed{" "}
                    <time dateTime={data.reviewedAt}>
                      {new Date(data.reviewedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Full description */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">What CPT {data.code} covers</h2>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {data.longDescription.split("\n\n").map((p, i) => (
              <p key={i} className="leading-relaxed">{p}</p>
            ))}
          </div>
        </section>

        {/* Clinical context */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">When this code is used</h2>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
            {data.clinicalContext}
          </div>
        </section>

        {/* Modifiers */}
        {data.modifiers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Modifiers</h2>
            <dl className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              {data.modifiers.map((m) => (
                <div key={m.code} className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-2 p-4">
                  <dt className="font-mono text-sm font-semibold">{m.code}</dt>
                  <dd className="text-sm text-zinc-700 dark:text-zinc-300">{m.when}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Documentation */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Documentation requirements</h2>
          <p className="text-sm text-zinc-500 mb-4">
            What auditors (and payer claims reviewers) look for. Missing any of these is where most rejections come from — not the code itself.
          </p>
          <ul className="space-y-2">
            {data.documentationRequirements.map((req, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" aria-hidden />
                <span className="text-zinc-700 dark:text-zinc-300">{req}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Reimbursement */}
        {data.reimbursement && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Reimbursement</h2>
            {data.reimbursement.medicareRate && (
              <p className="mb-3">
                <span className="text-zinc-500">Medicare national average:</span>{" "}
                <span className="font-medium">{data.reimbursement.medicareRate}</span>
              </p>
            )}
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {data.reimbursement.notes}
            </p>
          </section>
        )}

        {/* Related codes */}
        {data.relatedCodes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Related codes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.relatedCodes.map((r) => {
                const internal = cptCodes[r.code];
                const content = (
                  <div className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                    <p className="font-mono font-semibold text-sm">{r.code}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{r.title}</p>
                  </div>
                );
                return internal ? (
                  <Link key={r.code} href={`/codes/${r.code}`}>{content}</Link>
                ) : (
                  <div key={r.code}>{content}</div>
                );
              })}
            </div>
          </section>
        )}

        {/* Common diagnoses */}
        {data.commonDiagnoses.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Commonly paired ICD-10 diagnoses</h2>
            <dl className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              {data.commonDiagnoses.map((d) => (
                <div key={d.code} className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 p-4">
                  <dt className="font-mono text-sm font-semibold">{d.code}</dt>
                  <dd className="text-sm text-zinc-700 dark:text-zinc-300">{d.description}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Kaizara CTA */}
        {data.kaizaraAngle && (
          <section className="mb-12 rounded-xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-6 dark:border-zinc-800 dark:from-blue-950/30 dark:to-zinc-900">
            <h2 className="text-xl font-semibold mb-3">How Kaizara handles CPT {data.code}</h2>
            <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line mb-4">
              {data.kaizaraAngle}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login?demo=1"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
              >
                See the workflow
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Start free trial
              </Link>
            </div>
          </section>
        )}

        {/* Freshness + back */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex items-center justify-between text-sm text-zinc-500">
          <p>
            Last updated <time dateTime={data.updatedAt}>{new Date(data.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
          </p>
          <Link href="/codes" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            All CPT codes
          </Link>
        </footer>

        <p className="mt-8 text-xs text-zinc-400 leading-relaxed">
          This page is for general educational and billing-context purposes only. CPT codes and
          their usage are governed by payer contracts, regional rules, and clinical judgment. Verify
          coding decisions against current CMS guidance, your payer contracts, and your compliance
          program. CPT® is a registered trademark of the American Medical Association.
        </p>
      </main>
    </div>
  );
}
