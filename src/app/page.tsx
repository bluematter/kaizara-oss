import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold">Kaizara</h1>
      <p>An open source clinic operating system for peptide, longevity and cash-pay wellness clinics.</p>
      <p className="text-sm text-gray-600">
        Demo data only. Do not enter real patient information.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="underline">Staff login</Link>
        <Link href="/p/login" className="underline">Patient portal</Link>
      </div>
    </main>
  );
}
