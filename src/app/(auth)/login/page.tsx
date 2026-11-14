"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Stethoscope } from "lucide-react";
import Link from "next/link";

const DEMO_EMAIL = "michael@demo-clinic.example";
const DEMO_PASSWORD = "demo123";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";
  const showDemoHint = demoMode || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const [email, setEmail] = useState(demoMode ? DEMO_EMAIL : "");
  const [password, setPassword] = useState(demoMode ? DEMO_PASSWORD : "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Prefill if ?demo=1 is added after mount (e.g. navigating back)
  useEffect(() => {
    if (demoMode) {
      setEmail(DEMO_EMAIL);
      setPassword(DEMO_PASSWORD);
    }
  }, [demoMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-white">Kaizara</CardTitle>
            <CardDescription className="text-zinc-400">
              Peptide & Longevity Clinic OS
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800 space-y-4">
            <p className="text-sm text-zinc-400 text-center">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign up
              </Link>
            </p>
            {showDemoHint && (
              <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-zinc-300 text-center">
                <p className="font-medium text-blue-300 mb-1">Demo login prefilled</p>
                <p className="text-zinc-400">
                  {DEMO_EMAIL} / {DEMO_PASSWORD}
                </p>
                <p className="text-zinc-500 mt-1">Press Sign in to continue.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
