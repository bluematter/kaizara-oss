"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Search,
  Plus,
  Mic,
  Clock,
  CheckCircle2,
  Calendar,
} from "lucide-react";
// Real data only - no mock imports
import { AddPatientDialog } from "@/components/patients/add-patient-dialog";
import { format } from "date-fns";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  portalSlug: string;
  portalEnabled: boolean;
  createdAt: string;
  memberships?: { status: string; membership: { name: string } }[];
  consultations?: { id: string; scheduledAt: string; status: string }[];
}

interface ConsultationSummary {
  id: string;
  scheduledAt: string;
  status: string;
  chiefComplaint: string | null;
  patient: { id: string; firstName: string; lastName: string };
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [todayDate, setTodayDate] = useState<string>("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Set date on client side only to avoid hydration mismatch
  useEffect(() => {
    setTodayDate(format(new Date(), "EEEE, MMMM d, yyyy"));
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPatients = useCallback(async () => {
    try {
      const url = debouncedSearch
        ? `/api/patients?search=${encodeURIComponent(debouncedSearch)}`
        : "/api/patients";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setPatients(data.patients || []);
      setTotalPatients(data.total || 0);
    } catch {
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  const fetchConsultations = useCallback(async () => {
    try {
      const res = await fetch("/api/encounters?limit=10");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.encounters?.length > 0) {
        setConsultations(
          data.encounters.map((e: Record<string, unknown>) => ({
            id: e.id,
            scheduledAt: e.scheduledAt,
            status: e.status,
            chiefComplaint: e.chiefComplaint,
            patient: e.patient,
          }))
        );
      }
    } catch {
      // Use mock consultations as fallback
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const displayPatients = patients;
  const todayConsults = consultations;

  const completedCount = todayConsults.filter(
    (c) => c.status === "COMPLETED"
  ).length;
  const inProgressConsult = todayConsults.find(
    (c) => c.status === "IN_PROGRESS"
  );
  const scheduledCount = todayConsults.filter(
    (c) => c.status === "SCHEDULED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patients</h2>
          <p className="text-muted-foreground">
            Manage patients and today&apos;s consultations
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
          <Button asChild>
            <Link href="/consult/new">
              <Mic className="mr-2 h-4 w-4" />
              Start Consult
            </Link>
          </Button>
        </div>
      </div>

      <AddPatientDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchPatients}
      />

      {/* Today's Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today&apos;s Schedule
                </p>
                <p className="text-2xl font-bold">{todayConsults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10">
                <CheckCircle2 className="h-6 w-6 text-emerald" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  In Progress
                </p>
                <p className="text-2xl font-bold">
                  {inProgressConsult ? 1 : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Remaining
                </p>
                <p className="text-2xl font-bold">{scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Consultations */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Consultations</CardTitle>
          <CardDescription>
            {todayDate || "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayConsults.map((consult) => (
              <div
                key={consult.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  consult.status === "IN_PROGRESS"
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
              >
                <Link
                  href={`/patients/${consult.patient?.id}`}
                  className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                >
                  <div
                    className={`h-3 w-3 rounded-full ${
                      consult.status === "COMPLETED"
                        ? "bg-emerald"
                        : consult.status === "IN_PROGRESS"
                        ? "bg-primary animate-pulse"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {consult.patient?.firstName?.[0]}
                      {consult.patient?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium hover:underline">
                      {consult.patient?.firstName} {consult.patient?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {consult.chiefComplaint}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">
                      {format(new Date(consult.scheduledAt), "h:mm a")}
                    </p>
                    <Badge
                      variant={
                        consult.status === "COMPLETED"
                          ? "default"
                          : consult.status === "IN_PROGRESS"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {consult.status === "COMPLETED"
                        ? "Completed"
                        : consult.status === "IN_PROGRESS"
                        ? "In Progress"
                        : "Scheduled"}
                    </Badge>
                  </div>
                  {consult.status === "SCHEDULED" && (
                    <Button asChild>
                      <Link href={`/consult/${consult.id}`}>
                        <Mic className="mr-2 h-4 w-4" />
                        Start
                      </Link>
                    </Button>
                  )}
                  {consult.status === "IN_PROGRESS" && (
                    <Button variant="secondary" asChild>
                      <Link href={`/consult/${consult.id}`}>Continue</Link>
                    </Button>
                  )}
                  {consult.status === "COMPLETED" && (
                    <Button variant="outline" asChild>
                      <Link href={`/patients/${consult.patient?.id}`}>View</Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Patients */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Patients</CardTitle>
              <CardDescription>
                {`${totalPatients} patients in your clinic`}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Next Appointment</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery
                          ? "No patients match your search"
                          : "No patients yet. Add your first patient to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayPatients.map((patient) => {
                      const activeMembership = patient.memberships?.[0];
                      const nextAppt = patient.consultations?.[0];
                      return (
                        <TableRow
                          key={patient.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            (window.location.href = `/patients/${patient.id}`)
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {patient.firstName[0]}
                                  {patient.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <Link
                                  href={`/patients/${patient.id}`}
                                  className="font-medium hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {patient.firstName} {patient.lastName}
                                </Link>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{patient.email}</p>
                              <p className="text-muted-foreground">
                                {patient.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {activeMembership ? (
                              <Badge variant="secondary">
                                {activeMembership.membership.name}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                None
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {nextAppt ? (
                              <div className="text-sm">
                                <p className="font-medium">
                                  {format(new Date(nextAppt.scheduledAt), "MMM d, yyyy")}
                                </p>
                                <p className="text-muted-foreground">
                                  {format(new Date(nextAppt.scheduledAt), "h:mm a")}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                None scheduled
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link href={`/patients/${patient.id}`}>
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
