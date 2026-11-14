import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { authors, getAuthor } from "@/lib/cpt/authors";
import { getAllCPTCodes } from "@/lib/cpt";
import { SITE_URL } from "@/lib/site-url";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(authors).map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getAuthor(slug);
  if (!a) return { title: "Author not found" };
  return {
    title: `${a.name}, ${a.credentials} | ${a.title.split(" · ")[0]} | Kaizara`,
    description: a.bio.slice(0, 160),
    alternates: { canonical: `${SITE_URL}/authors/${a.slug}` },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) notFound();

  // Find all pages this author has reviewed
  const reviewedCodes = getAllCPTCodes().filter((c) => c.reviewedBy === author.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    honorificSuffix: author.credentials,
    jobTitle: author.title,
    description: author.bio,
    url: `${SITE_URL}/authors/${author.slug}`,
    sameAs: author.sameAs.filter((u) => !u.includes("TODO") && !u.startsWith("//")),
    ...(author.image && { image: author.image }),
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Stethoscope className="h-5 w-5" />
            <span>Kaizara</span>
          </Link>
          <Link href="/codes" className="text-sm hover:underline">CPT directory</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-start gap-6 mb-8">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-semibold shrink-0">
            {author.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {author.name}, {author.credentials}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">{author.title}</p>
          </div>
        </div>

        <section className="prose prose-zinc dark:prose-invert max-w-none mb-10">
          <p>{author.bio}</p>
        </section>

        {author.licenses && author.licenses.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Licensure
            </h2>
            <ul className="space-y-1">
              {author.licenses.map((l) => (
                <li key={`${l.state}-${l.number}`} className="text-sm">
                  {l.type} · {l.state} · License {l.number}
                </li>
              ))}
            </ul>
          </section>
        )}

        {author.npi && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              NPI
            </h2>
            <a
              href={`https://npiregistry.cms.hhs.gov/provider-view/${author.npi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline"
            >
              {author.npi} (verify at CMS NPI Registry)
            </a>
          </section>
        )}

        {author.sameAs.filter((u) => !u.includes("TODO") && !u.startsWith("//")).length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Elsewhere
            </h2>
            <ul className="space-y-1">
              {author.sameAs
                .filter((u) => !u.includes("TODO") && !u.startsWith("//"))
                .map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {reviewedCodes.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Reviewed pages ({reviewedCodes.length})
            </h2>
            <ul className="space-y-2">
              {reviewedCodes.map((c) => (
                <li key={c.code}>
                  <Link href={`/codes/${c.code}`} className="hover:underline">
                    <span className="font-mono font-semibold">CPT {c.code}</span>
                    <span className="text-zinc-500"> — </span>
                    <span>{c.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
