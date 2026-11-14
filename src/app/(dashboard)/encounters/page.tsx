"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import { EncounterList, NewEncounterDialog } from "@/components/encounters";

interface Encounter {
  id: string;
  scheduledAt: string;
  encounterType: string;
  encounterMode: string;
  chartType: string;
  chiefComplaint?: string | null;
  signStatus: string;
  patient: { id: string; firstName: string; lastName: string };
  provider: { id: string; name: string };
  template: { id: string; name: string } | null;
}

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [patients, setPatients] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const fetchEncounters = useCallback(async () => {
    try {
      const res = await fetch("/api/encounters?limit=100");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEncounters(data.encounters || []);
    } catch {
      setEncounters([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [templates, setTemplates] = useState<{ id: string; name: string; encounterType?: string }[]>([]);

  useEffect(() => {
    fetchEncounters();
    // Also fetch patients for the new encounter dialog
    fetch("/api/patients?limit=100")
      .then((r) => r.ok ? r.json() : { patients: [] })
      .then((data) => setPatients(data.patients || []))
      .catch(() => {});
    // Fetch templates
    fetch("/api/templates")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTemplates(Array.isArray(data) ? data.map((t: { id: string; name: string; encounterType?: string }) => ({ id: t.id, name: t.name, encounterType: t.encounterType })) : []))
      .catch(() => {});
  }, [fetchEncounters]);

  // Count stats
  const unsignedCount = encounters.filter(
    (e) => e.signStatus === "UNSIGNED" || e.signStatus === "DRAFT"
  ).length;
  const signedCount = encounters.filter((e) => e.signStatus === "SIGNED").length;
  const todayCount = encounters.filter((e) => {
    const today = new Date();
    const encDate = new Date(e.scheduledAt);
    return encDate.toDateString() === today.toDateString();
  }).length;

  const handleNewEncounter = () => {
    setSelectedPatientId(patients[0]?.id || null);
    setShowNewDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chart Notes</h2>
          <p className="text-muted-foreground">
            Clinical encounters and documentation
          </p>
        </div>
        <Button onClick={handleNewEncounter}>
          <Plus className="mr-2 h-4 w-4" />
          New Encounter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unsigned</p>
                <p className="text-2xl font-bold">{unsignedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Signed</p>
                <p className="text-2xl font-bold">{signedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{encounters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Encounter List */}
      <EncounterList
        encounters={encounters}
        showPatientColumn={true}
        onNewEncounter={handleNewEncounter}
        title="All Encounters"
        description="View and manage clinical encounters"
      />

      {/* New Encounter Dialog */}
      <NewEncounterDialog
        open={showNewDialog}
        onOpenChange={(open) => {
          setShowNewDialog(open);
          if (!open) fetchEncounters(); // Refresh after creating
        }}
        patientId={selectedPatientId || undefined}
        patientName={
          selectedPatientId
            ? (() => {
                const p = patients.find((p) => p.id === selectedPatientId);
                return p ? `${p.firstName} ${p.lastName}` : undefined;
              })()
            : undefined
        }
        providers={[]}
        templates={templates}
        facilities={["Main Clinic", "Telehealth"]}
      />
    </div>
  );
}
