"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  TestTube,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface LabPanel {
  id: string;
  collectedAt: string;
  reportedAt: string | null;
  labProvider: string;
  status: string;
  patientId: string;
  markers: { id: string; name: string; value: number; unit: string; status: string; category: string }[];
}

interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export default function LabsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [labsByPatient, setLabsByPatient] = useState<Record<string, LabPanel[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch patients first
        const pRes = await fetch("/api/patients?limit=100");
        if (!pRes.ok) return;
        const pData = await pRes.json();
        const pts = pData.patients || [];
        setPatients(pts);

        // Fetch labs for each patient
        const labResults: Record<string, LabPanel[]> = {};
        await Promise.all(
          pts.map(async (p: PatientSummary) => {
            try {
              const lRes = await fetch(`/api/labs?patientId=${p.id}`);
              if (lRes.ok) {
                const lData = await lRes.json();
                if (lData.panels?.length > 0) {
                  labResults[p.id] = lData.panels;
                }
              }
            } catch {
              // Skip this patient
            }
          })
        );
        setLabsByPatient(labResults);
      } catch {
        // Fetch failed
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Flatten all panels with patient info
  const allPanels = patients.flatMap((p) =>
    (labsByPatient[p.id] || []).map((panel) => ({
      ...panel,
      patient: p,
    }))
  ).sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime());

  const totalMarkers = allPanels.reduce((sum, p) => sum + (p.markers?.length || 0), 0);
  const outOfRange = allPanels.reduce(
    (sum, p) => sum + (p.markers?.filter((m) => m.status !== "NORMAL").length || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
          <h2 className="text-2xl font-bold tracking-tight">Lab Results</h2>
          <p className="text-muted-foreground">
            Upload, parse, and track patient bloodwork
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload labs from individual patient pages
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TestTube className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Panels</p>
                <p className="text-2xl font-bold">{allPanels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Markers</p>
                <p className="text-2xl font-bold">{totalMarkers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Range</p>
                <p className="text-2xl font-bold">{outOfRange}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Panels Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Lab Panels</CardTitle>
          <CardDescription>
            {allPanels.length === 0
              ? "No lab results yet. Upload labs from a patient's page."
              : `${allPanels.length} lab panels across ${Object.keys(labsByPatient).length} patients`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPanels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TestTube className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">No lab results uploaded yet</p>
              <p className="text-xs mt-1">Go to a patient&apos;s page to upload lab PDFs</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/patients">View Patients</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date Collected</TableHead>
                    <TableHead>Lab Provider</TableHead>
                    <TableHead>Markers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPanels.map((panel) => {
                    const abnormalCount = panel.markers?.filter((m) => m.status !== "NORMAL").length || 0;
                    return (
                      <TableRow key={panel.id}>
                        <TableCell>
                          <Link
                            href={`/patients/${panel.patient.id}?tab=labs`}
                            className="font-medium hover:underline"
                          >
                            {panel.patient.firstName} {panel.patient.lastName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {format(new Date(panel.collectedAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{panel.labProvider}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{panel.markers?.length || 0} markers</span>
                            {abnormalCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {abnormalCount} flagged
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={panel.status === "COMPLETED" || panel.status === "REVIEWED" ? "default" : "secondary"}
                          >
                            {panel.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/patients/${panel.patient.id}?tab=labs`}>
                              <ExternalLink className="mr-2 h-3 w-3" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
