"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileSignature,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface SignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encounterId: string;
  patientName: string;
  encounterDate: string;
  onSign: () => Promise<void>;
  requireCosign?: boolean;
}

export function SignDialog({
  open,
  onOpenChange,
  encounterId,
  patientName,
  encounterDate,
  onSign,
  requireCosign = false,
}: SignDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attestations, setAttestations] = useState({
    reviewed: false,
    accurate: false,
    understand: false,
  });

  const allAttested = attestations.reviewed && attestations.accurate && attestations.understand;

  const handleSign = async () => {
    if (!allAttested) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSign();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign encounter");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Sign Encounter
          </DialogTitle>
          <DialogDescription>
            You are about to sign this clinical encounter for {patientName} on {encounterDate}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-700">Important</p>
              <p className="text-amber-600">
                Once signed, this encounter becomes part of the permanent medical record.
                Changes after signing require an official amendment.
              </p>
            </div>
          </div>

          {/* Attestations */}
          <div className="space-y-3">
            <Label>Provider Attestation</Label>

            <div className="flex items-start gap-3">
              <Checkbox
                id="reviewed"
                checked={attestations.reviewed}
                onCheckedChange={(checked) =>
                  setAttestations((prev) => ({ ...prev, reviewed: checked === true }))
                }
              />
              <label htmlFor="reviewed" className="text-sm cursor-pointer">
                I have reviewed all sections of this encounter note and confirm the information is complete.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="accurate"
                checked={attestations.accurate}
                onCheckedChange={(checked) =>
                  setAttestations((prev) => ({ ...prev, accurate: checked === true }))
                }
              />
              <label htmlFor="accurate" className="text-sm cursor-pointer">
                I attest that the clinical documentation is accurate and reflects the services provided.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="understand"
                checked={attestations.understand}
                onCheckedChange={(checked) =>
                  setAttestations((prev) => ({ ...prev, understand: checked === true }))
                }
              />
              <label htmlFor="understand" className="text-sm cursor-pointer">
                I understand this signature represents my professional certification of this medical record.
              </label>
            </div>
          </div>

          {/* Co-sign notice */}
          {requireCosign && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-700">Co-signature Required</p>
                <p className="text-blue-600">
                  This encounter will require co-signature from a supervising provider.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSign} disabled={isLoading || !allAttested}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Sign Encounter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
