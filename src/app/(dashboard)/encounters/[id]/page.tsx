"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { SOAPChart, SignDialog } from "@/components/encounters";
import { Skeleton } from "@/components/ui/skeleton";

interface EncounterData {
  id: string;
  scheduledAt: string;
  encounterType: string;
  encounterMode: string;
  chartType: string;
  chiefComplaint?: string | null;
  signStatus: string;
  signedAt?: string | null;
  signedBy?: { id: string; name: string } | null;
  subjective?: {
    chiefComplaint?: string;
    hpi?: string;
  } | null;
  objective?: {
    vitals?: {
      weight?: number;
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
    };
    physicalExam?: string;
  } | null;
  assessment?: {
    clinicalImpression?: string;
    diagnoses?: Array<{ icd10?: string; description: string; isPrimary?: boolean }>;
  } | null;
  plan?: {
    orders?: string;
    prescriptions?: string;
    followUp?: string;
    patientEducation?: string;
  } | null;
  transcription?: string | null;
  aiSummary?: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
  };
  provider: { id: string; name: string };
  template?: { id: string; name: string } | null;
}

export default function EncounterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [encounter, setEncounter] = useState<EncounterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEncounter() {
      try {
        const res = await fetch(`/api/encounters/${resolvedParams.id}`);
        if (!res.ok) {
          setError("Encounter not found");
          return;
        }
        const data = await res.json();
        setEncounter(data);
      } catch {
        setError("Failed to load encounter");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEncounter();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  if (error || !encounter) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-muted-foreground">{error || "Encounter not found"}</p>
      </div>
    );
  }

  const handleSave = async (data: Partial<EncounterData>) => {
    try {
      const res = await fetch(`/api/encounters/${encounter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setEncounter(updated);
      }
    } catch {
      // Save failed silently for now
    }
  };

  const handleSign = async () => {
    try {
      const res = await fetch(`/api/encounters/${encounter.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEncounter(updated);
        setShowSignDialog(false);
      }
    } catch {
      // Sign failed
    }
  };

  const patientName = `${encounter.patient.firstName} ${encounter.patient.lastName}`;

  return (
    <div className="h-[calc(100vh-80px)] -m-6">
      <SOAPChart
        encounter={encounter}
        onSave={handleSave}
        onSign={() => setShowSignDialog(true)}
      />

      <SignDialog
        open={showSignDialog}
        onOpenChange={setShowSignDialog}
        encounterId={encounter.id}
        patientName={patientName}
        encounterDate={new Date(encounter.scheduledAt).toLocaleDateString()}
        onSign={handleSign}
      />
    </div>
  );
}
