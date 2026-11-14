"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Loader2, ShieldAlert, Check, KeyRound } from "lucide-react";

type PortalStatus = {
  hasPassword: boolean;
  email: string | null;
  portalEnabled: boolean;
  lastLoginAt: string | null;
  mustChangePassword: boolean;
  tempPasswordExpiresAt: string | null;
  locked: boolean;
};

type Props = {
  patientId: string;
  patientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

export function PortalAccessDialog({ patientId, patientName, open, onOpenChange }: Props) {
  const [status, setStatus] = useState<PortalStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ password: string; email: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setGenerated(null);
      setError(null);
      setCopied(false);
      return;
    }
    setLoading(true);
    fetch(`/api/patients/${patientId}/portal-password`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStatus(data);
      })
      .catch(() => setError("Could not load portal status."))
      .finally(() => setLoading(false));
  }, [open, patientId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/portal-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate password.");
        return;
      }
      setGenerated({ password: data.tempPassword, email: data.email, expiresAt: data.expiresAt });
      // refresh status in the background
      fetch(`/api/patients/${patientId}/portal-password`)
        .then((r) => r.json())
        .then((d) => setStatus(d))
        .catch(() => {});
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Portal access</DialogTitle>
          <DialogDescription>
            Manage {patientName}'s patient portal login.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && status && !generated && (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{status.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Has password</span>
                <span className="font-medium">{status.hasPassword ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last login</span>
                <span className="font-medium">{formatDate(status.lastLoginAt)}</span>
              </div>
              {status.mustChangePassword && status.tempPasswordExpiresAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temp password expires</span>
                  <span className="font-medium">{formatDate(status.tempPasswordExpiresAt)}</span>
                </div>
              )}
              {status.locked && (
                <div className="flex justify-between text-amber-500">
                  <span>Account locked</span>
                  <span>Yes (temporarily)</span>
                </div>
              )}
            </div>

            {!status.email && (
              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                Add an email to this patient before granting portal access.
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Generating a new password will invalidate the patient's current password and force a change on their next login.
            </div>
          </div>
        )}

        {generated && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                This password is shown <strong>once</strong>. Copy it now and give it to the patient securely. They'll be required to change it on first login. Expires {formatDate(generated.expiresAt)}.
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input readOnly value={generated.email} className="mt-1 font-mono text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Temporary password</label>
              <div className="mt-1 flex gap-2">
                <Input readOnly value={generated.password} className="font-mono text-sm" />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} title="Copy">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {!generated ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button
                onClick={handleGenerate}
                disabled={generating || !status?.email}
                type="button"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    {status?.hasPassword ? "Reset password" : "Generate password"}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
