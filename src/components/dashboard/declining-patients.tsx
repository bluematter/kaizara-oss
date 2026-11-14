"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingDown,
  Phone,
  Mail,
  ChevronRight,
  Activity,
} from "lucide-react";
import Link from "next/link";

// Mock data for patients needing attention
// In production, this would come from analyzing symptom/vitals trends
export const mockDecliningPatients = [
  {
    id: "patient-004",
    name: "Lisa Anderson",
    metric: "Energy Level",
    currentScore: 42,
    previousScore: 65,
    percentChange: -35,
    daysSinceLastEntry: 2,
    trend: "declining" as const,
  },
  {
    id: "patient-001",
    name: "James Wilson",
    metric: "Sleep Quality",
    currentScore: 38,
    previousScore: 52,
    percentChange: -27,
    daysSinceLastEntry: 4,
    trend: "declining" as const,
  },
  {
    id: "patient-003",
    name: "Robert Martinez",
    metric: "Pain Level",
    currentScore: 72,
    previousScore: 45,
    percentChange: 60, // For pain, increase is bad
    daysSinceLastEntry: 1,
    trend: "worsening" as const,
  },
];

interface DecliningPatientsProps {
  limit?: number;
}

export function DecliningPatients({ limit = 5 }: DecliningPatientsProps) {
  const patients = mockDecliningPatients.slice(0, limit);

  if (patients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">All Patients Stable</CardTitle>
          </div>
          <CardDescription>
            No patients showing concerning trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-3">
              <Activity className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              All patient scores are stable or improving
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-base">Patients Needing Attention</CardTitle>
              <CardDescription className="text-xs">
                {patients.length} patient{patients.length !== 1 ? "s" : ""} with declining scores
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10">
            {patients.length} alert{patients.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/patients/${patient.id}`}
                  className="font-medium text-sm hover:underline truncate"
                >
                  {patient.name}
                </Link>
                <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{patient.metric}</span>
                <span>•</span>
                <span className="text-red-500 font-medium">
                  {patient.previousScore} → {patient.currentScore}
                </span>
                <Badge
                  variant="outline"
                  className="text-red-500 border-red-500/30 bg-red-500/10 text-[10px] px-1.5 py-0"
                >
                  {patient.percentChange > 0 ? "+" : ""}{patient.percentChange}%
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Last entry: {patient.daysSinceLastEntry === 0 ? "Today" : `${patient.daysSinceLastEntry} day${patient.daysSinceLastEntry !== 1 ? "s" : ""} ago`}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Send email"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Call patient"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                asChild
              >
                <Link href={`/patients/${patient.id}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full mt-2" asChild>
          <Link href="/patients?filter=declining">
            View all declining patients
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
