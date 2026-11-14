"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  ChevronRight,
} from "lucide-react";

interface Encounter {
  id: string;
  scheduledAt: string;
  encounterType: string;
  encounterMode: string;
  chartType: string;
  chiefComplaint?: string | null;
  signStatus: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  provider: {
    id: string;
    name: string;
  };
  template?: {
    id: string;
    name: string;
  } | null;
}

interface EncounterListProps {
  encounters: Encounter[];
  patientId?: string; // If viewing from patient context
  showPatientColumn?: boolean;
  onNewEncounter?: () => void;
  title?: string;
  description?: string;
}

const signStatusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  DRAFT: { label: "Draft", icon: Edit3, className: "bg-slate-500/10 text-slate-600" },
  UNSIGNED: { label: "Unsigned", icon: AlertCircle, className: "bg-amber-500/10 text-amber-600" },
  PENDING_COSIGN: { label: "Pending Co-sign", icon: Clock, className: "bg-blue-500/10 text-blue-600" },
  SIGNED: { label: "Signed", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600" },
  AMENDED: { label: "Amended", icon: Edit3, className: "bg-purple-500/10 text-purple-600" },
};

const encounterTypeLabels: Record<string, string> = {
  OFFICE_VISIT: "Office Visit",
  FOLLOW_UP: "Follow-up",
  NEW_PATIENT: "New Patient",
  TELEHEALTH: "Telehealth",
  PHONE_CONSULT: "Phone Consult",
  IV_THERAPY: "IV Therapy",
  INJECTION: "Injection",
  LAB_REVIEW: "Lab Review",
  PROCEDURE: "Procedure",
};

export function EncounterList({
  encounters,
  patientId,
  showPatientColumn = true,
  onNewEncounter,
  title = "Encounters",
  description = "Clinical encounters and chart notes",
}: EncounterListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Derive unique providers and encounter types from data
  const uniqueProviders = Array.from(
    new Map(encounters.map((e) => [e.provider.id, e.provider])).values()
  );
  const uniqueTypes = Array.from(new Set(encounters.map((e) => e.encounterType)));

  // Filter encounters
  const filteredEncounters = encounters.filter((enc) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const patientName = `${enc.patient.firstName} ${enc.patient.lastName}`.toLowerCase();
      const providerName = enc.provider.name?.toLowerCase() || "";
      const complaint = enc.chiefComplaint?.toLowerCase() || "";
      if (!patientName.includes(search) && !providerName.includes(search) && !complaint.includes(search)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== "all" && enc.signStatus !== statusFilter) {
      return false;
    }

    // Provider filter
    if (providerFilter !== "all" && enc.provider.id !== providerFilter) {
      return false;
    }

    // Encounter type filter
    if (typeFilter !== "all" && enc.encounterType !== typeFilter) {
      return false;
    }

    return true;
  });

  // Count by status
  const statusCounts = encounters.reduce((acc, enc) => {
    acc[enc.signStatus] = (acc[enc.signStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onNewEncounter && (
            <Button onClick={onNewEncounter}>
              <Plus className="h-4 w-4 mr-2" />
              New Encounter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patient by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {uniqueProviders.length > 1 && (
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {uniqueProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Chart Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status ({encounters.length})</SelectItem>
                {Object.entries(signStatusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label} ({statusCounts[value] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Appointment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {encounterTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(providerFilter !== "all" || statusFilter !== "all" || typeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setProviderFilter("all");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="text-xs text-muted-foreground"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Quick Status Badges */}
        {statusCounts.UNSIGNED > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {statusCounts.UNSIGNED} unsigned encounter{statusCounts.UNSIGNED !== 1 ? "s" : ""} need attention
              </span>
            </div>
          </div>
        )}

        {/* Table */}
        {filteredEncounters.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {showPatientColumn && <TableHead>Patient</TableHead>}
                  <TableHead>Visit Type</TableHead>
                  <TableHead className="hidden md:table-cell">Chief Complaint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Provider</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEncounters.map((encounter) => {
                  const statusConfig = signStatusConfig[encounter.signStatus] || signStatusConfig.DRAFT;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={encounter.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {format(new Date(encounter.scheduledAt), "MMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(encounter.scheduledAt), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      {showPatientColumn && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {encounter.patient.firstName} {encounter.patient.lastName}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline">
                          {encounterTypeLabels[encounter.encounterType] || encounter.encounterType}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px]">
                        <span className="text-sm text-muted-foreground truncate block">
                          {encounter.chiefComplaint || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {encounter.provider.name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/encounters/${encounter.id}`}>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || providerFilter !== "all" || typeFilter !== "all"
                ? "No encounters match your filters"
                : "No encounters yet"}
            </p>
            {onNewEncounter && !searchTerm && statusFilter === "all" && providerFilter === "all" && typeFilter === "all" && (
              <Button variant="outline" className="mt-4" onClick={onNewEncounter}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Encounter
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
