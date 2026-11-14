import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const githubUrl = "https://github.com/bluematter/kaizara-oss";

const setupCommands = `cp .env.example .env
openssl rand -base64 32
# Set AUTH_SECRET in .env to the value above.
docker compose up -d --wait
npm install
npm run setup
npm run dev -- -p 3001`;

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <a href="#" aria-label="Kaizara home" className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-xl bg-primary font-mono text-lg font-semibold text-primary-foreground"
            >
              k
            </span>
            <span className="text-lg font-semibold tracking-tight">Kaizara</span>
          </a>
          <nav aria-label="Main navigation" className="flex items-center gap-4 sm:gap-6">
            <a href="#features" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Inside the app
            </a>
            <a href="#run-it" className="text-sm text-muted-foreground hover:text-foreground">
              Run it yourself
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-5 sm:px-8">
        <section aria-labelledby="hero-heading" className="pb-10 pt-16 sm:pb-14 sm:pt-24">
          <Badge variant="outline" className="gap-2 px-3 py-1.5 font-normal">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            Open source clinic software
          </Badge>
          <h1 id="hero-heading" className="mt-7 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            An <span className="text-primary">open source</span> clinic operating system.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Patient charts and daily clinic work in one place, built for peptide,
            longevity and cash-pay wellness clinics.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6">
              <a href="/login">Try the demo <span aria-hidden="true">↗</span></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6">
              <a href={githubUrl}>View on GitHub</a>
            </Button>
          </div>
        </section>

        <aside aria-label="Demo notice" className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 text-sm leading-relaxed">
          Demo data only. Not for real patient data until you complete the checklist in the README.
          {" "}
          <a href={`${githubUrl}#before-real-patients`} className="font-medium underline underline-offset-4">
            Read the checklist
          </a>
        </aside>

        <section id="features" aria-labelledby="features-heading" className="scroll-mt-8 py-16 sm:py-20">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="features-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              A look inside
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Drawn previews of the app. All patient details are invented.
            </p>
          </div>

          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
            <article className="min-w-0">
              <Card className="gap-0 overflow-hidden py-0 shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      JR
                    </div>
                    <div>
                      <p className="text-sm font-medium">Jamie Rivera</p>
                      <p className="text-xs text-muted-foreground">Demo patient chart</p>
                    </div>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
                <CardContent className="space-y-4 p-5">
                  {[
                    { letter: "S", label: "Subjective", note: "Patient concerns and history" },
                    { letter: "O", label: "Objective", note: "Vitals and exam findings" },
                    { letter: "A", label: "Assessment", note: "Clinical impression" },
                    { letter: "P", label: "Plan", note: "Orders and follow-up" },
                  ].map((section) => (
                    <div key={section.letter} className="flex items-start gap-3">
                      <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-md border font-mono text-xs text-primary">
                        {section.letter}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{section.label}</p>
                        <p className="text-xs leading-relaxed text-muted-foreground">{section.note}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Patient charts with SOAP notes</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Keep patient records and encounters together. Write structured
                notes, sign them and record amendments when something changes.
              </p>
            </article>

            <article className="min-w-0">
              <Card className="gap-0 overflow-hidden py-0 shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">Lab results</p>
                    <p className="text-xs text-muted-foreground">PDF upload and review</p>
                  </div>
                  <Badge variant="outline">Demo preview</Badge>
                </div>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
                    <span className="rounded border bg-muted px-2 py-2 font-mono text-xs">PDF</span>
                    <div>
                      <p className="text-sm font-medium">Sample lab report</p>
                      <p className="text-xs text-muted-foreground">Review markers before saving</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      <span>Biomarker trends</span>
                      <span>Sample history</span>
                    </div>
                    <div aria-hidden="true" className="mt-4 flex h-20 items-end gap-3 border-b px-2">
                      <div className="h-1/2 flex-1 rounded-t bg-primary/30" />
                      <div className="h-2/3 flex-1 rounded-t bg-primary/40" />
                      <div className="h-1/2 flex-1 rounded-t bg-primary/50" />
                      <div className="h-3/4 flex-1 rounded-t bg-primary/60" />
                      <div className="h-2/3 flex-1 rounded-t bg-primary/70" />
                      <div className="h-5/6 flex-1 rounded-t bg-primary" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Earlier results to latest</p>
                  </div>
                </CardContent>
              </Card>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Lab PDFs, with a closer look</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Parse lab PDFs with a fal.ai key, review the markers and save
                results to a patient chart. The demo portal shows sample trends;
                those charts are not connected to uploaded labs yet.
              </p>
            </article>

            <article className="min-w-0">
              <Card className="gap-0 overflow-hidden py-0 shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">Inventory</p>
                    <p className="text-xs text-muted-foreground">Lot details at a glance</p>
                  </div>
                  <Badge variant="outline">Sample stock</Badge>
                </div>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">Clinic supplies</p>
                    <Badge variant="secondary">In stock</Badge>
                  </div>
                  <dl className="divide-y rounded-lg border px-4 text-sm">
                    <div className="flex flex-wrap justify-between gap-2 py-3">
                      <dt className="text-muted-foreground">Lot number</dt>
                      <dd className="font-mono text-xs">DEMO-LOT</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 py-3">
                      <dt className="text-muted-foreground">Expiry</dt>
                      <dd>Tracked per lot</dd>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 py-3">
                      <dt className="text-muted-foreground">Stock level</dt>
                      <dd>Low stock alerts</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Inventory with lot tracking</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Track quantities and expiry dates by lot. See what is running
                low, with supplier details and costs alongside each item.
              </p>
            </article>

            <article className="min-w-0">
              <Card className="gap-0 overflow-hidden py-0 shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">Patient portal</p>
                    <p className="text-xs text-muted-foreground">A separate patient login</p>
                  </div>
                  <Badge variant="outline">Demo thread</Badge>
                </div>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-muted px-3 py-1.5">Lab results</span>
                    <span className="rounded-md bg-primary/10 px-3 py-1.5 text-primary">Messages</span>
                  </div>
                  <div className="max-w-[85%] rounded-xl rounded-bl-sm bg-muted p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Clinic</p>
                    <p className="text-sm">Your sample results are ready to review.</p>
                  </div>
                  <div className="ml-auto max-w-[85%] rounded-xl rounded-br-sm border border-primary/20 bg-primary/5 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Demo patient</p>
                    <p className="text-sm">Thanks. I have a question for my next visit.</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Preview only. Messages are not delivered.</p>
                </CardContent>
              </Card>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Patient portal and messaging</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Patients have their own password login. Explore sample lab views
                and message threads. Both staff and patient messaging screens
                currently simulate sending.
              </p>
            </article>
          </div>
        </section>

        <section id="run-it" aria-labelledby="run-heading" className="scroll-mt-8 border-t py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
            <div className="lg:col-span-2">
              <h2 id="run-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">Run it yourself</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                From a local copy of the repo, use Node 20.9+ and npm with Docker
                Compose v2. The setup script creates the tables and seeds invented
                patients. Use a local demo database.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Set your auth secret before starting. Then open{" "}
                <a href="http://localhost:3001" className="text-foreground underline underline-offset-4">localhost:3001</a>
                {" "}and use the account shown on the login page.
              </p>
              <a href={`${githubUrl}#run-it`} className="mt-5 inline-block text-sm font-medium underline underline-offset-4">
                Full setup in the README <span aria-hidden="true">↗</span>
              </a>
            </div>
            <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-none lg:col-span-3">
              <div className="border-b bg-muted/40 px-5 py-3 font-mono text-xs text-muted-foreground">Terminal</div>
              <pre tabIndex={0} aria-label="Local setup commands" className="overflow-x-auto p-5 font-mono text-xs leading-7 sm:text-sm">
                <code>{setupCommands}</code>
              </pre>
            </Card>
          </div>
        </section>

        <section aria-labelledby="author-heading" className="border-t py-12 sm:py-16">
          <h2 id="author-heading" className="text-xl font-semibold tracking-tight">Who built this</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Kaizara was built by Michael Aubry. He builds websites and custom software for clinics.
          </p>
          <a href="https://mja.sh" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
            mja.sh <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm sm:px-8">
          <p className="text-muted-foreground">Kaizara · Open source under AGPL-3.0</p>
          <a href={githubUrl} className="underline underline-offset-4">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
