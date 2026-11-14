"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

export default function PortalChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/portal/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not change password.");
        setIsLoading(false);
        return;
      }
      router.push("/p/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/portal/logout", { method: "POST" });
    router.push("/p/login");
    router.refresh();
  };

  return (
    <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900/50 border-zinc-800">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-white">Set your password</CardTitle>
            <CardDescription className="text-zinc-400">
              Choose a new password to continue. Minimum 12 characters, with upper, lower, and a number.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current" className="text-zinc-300">Current password</Label>
              <Input
                id="current"
                name="current"
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new" className="text-zinc-300">New password</Label>
              <Input
                id="new"
                name="new"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                minLength={12}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-zinc-300">Confirm new password</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={12}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            {error && (
              <div className="rounded-md border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
            >
              Sign out
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
