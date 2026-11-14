"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  Mic,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  Activity,
  Star,
  HeartPulse,
  UserPlus,
  Truck,
  FlaskConical,
  Target,
} from "lucide-react";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import Link from "next/link";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

interface EncounterSummary {
  id: string;
  status: string;
  scheduledAt: string;
  encounterType: string;
  patient: { id: string; firstName: string; lastName: string };
}

interface InventoryItemSummary {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
  category: string | null;
}

interface DashboardStats {
  patientCount: number;
  encountersToday: number;
  encountersByStatus: {
    COMPLETED: number;
    IN_PROGRESS: number;
    SCHEDULED: number;
  };
  lowStockCount: number;
  lowStockItems: InventoryItemSummary[];
  totalInventoryItems: number;
  totalInventoryUnits: number;
  todayEncounters: EncounterSummary[];
  recentActivity: {
    id: string;
    action: string;
    resource: string;
    description: string | null;
    userName: string | null;
    createdAt: string;
  }[];
  recentPatients: {
    id: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  }[];
}

interface OnboardingState {
  hasPatient: boolean;
  hasEncounter: boolean;
  hasInventory: boolean;
  hasProvider: boolean;
  hasClinicSetup: boolean;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = (session?.user?.role as string) || "STAFF";
  const showFinancials = role === "ADMIN" || role === "PROVIDER";

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, onboardingRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/onboarding"),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }

        if (onboardingRes.ok) {
          setOnboarding(await onboardingRes.json());
        }
      } catch {
        // Stats unavailable
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const showOnboarding =
    onboarding &&
    !(
      onboarding.hasPatient &&
      onboarding.hasEncounter &&
      onboarding.hasInventory &&
      onboarding.hasProvider &&
      onboarding.hasClinicSetup
    );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const patientCount = stats?.patientCount || 0;
  const encountersToday = stats?.encountersToday || 0;
  const completedCount = stats?.encountersByStatus.COMPLETED || 0;
  const inProgressCount = stats?.encountersByStatus.IN_PROGRESS || 0;
  const scheduledCount = stats?.encountersByStatus.SCHEDULED || 0;
  const lowStockItems = stats?.lowStockItems || [];
  const todayEncounters = stats?.todayEncounters || [];
  const recentActivity = stats?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Onboarding Checklist for new clinics */}
      {showOnboarding && onboarding && (
        <OnboardingChecklist
          clinicName={session?.user?.clinicName || "Your Clinic"}
          hasClinicSetup={onboarding.hasClinicSetup}
          hasProvider={onboarding.hasProvider}
          hasPatient={onboarding.hasPatient}
          hasEncounter={onboarding.hasEncounter}
          hasInventory={onboarding.hasInventory}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Button variant="outline" asChild>
            <Link href="/patients">
              <Users className="mr-2 h-4 w-4" />
              View Patients
            </Link>
          </Button>
          <Button asChild>
            <Link href="/consult/new">
              <Mic className="mr-2 h-4 w-4" />
              Start Consult
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={`grid gap-4 sm:grid-cols-2 ${showFinancials ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {/* Monthly Revenue - ADMIN only */}
        {showFinancials && (
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Monthly Revenue
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect billing to track
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Patients */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Patients
                </p>
                <p className="text-2xl font-bold">{patientCount}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {patientCount === 0 ? "Add your first patient" : "in your clinic"}
                  </span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Patient Value - Financials only */}
        {showFinancials && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Patient Value
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect billing to track
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Consults */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today&apos;s Consults
                </p>
                <p className="text-2xl font-bold">
                  {completedCount}/{encountersToday}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {inProgressCount > 0 ? (
                    <>
                      <Clock className="h-3 w-3 text-primary animate-pulse" />
                      <span className="text-xs text-primary font-medium">
                        {inProgressCount} in progress
                      </span>
                    </>
                  ) : scheduledCount > 0 ? (
                    <span className="text-xs text-muted-foreground">{scheduledCount} upcoming</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {encountersToday === 0 ? "None scheduled" : "All completed"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule - Spans 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Today&apos;s Schedule</CardTitle>
              <CardDescription>
                {encountersToday === 0
                  ? "No consultations today"
                  : `${completedCount} of ${encountersToday} completed`}
              </CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {todayEncounters.length > 0 ? (
              <div className="space-y-3">
                {todayEncounters.map((encounter) => (
                  <Link
                    key={encounter.id}
                    href={`/encounters/${encounter.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          encounter.status === "COMPLETED"
                            ? "bg-emerald-500"
                            : encounter.status === "IN_PROGRESS"
                            ? "bg-primary animate-pulse"
                            : "bg-muted-foreground"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {encounter.patient.firstName} {encounter.patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(encounter.scheduledAt), "h:mm a")} &middot; {encounter.encounterType.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        encounter.status === "COMPLETED"
                          ? "default"
                          : encounter.status === "IN_PROGRESS"
                          ? "secondary"
                          : "outline"
                      }
                      className={encounter.status === "COMPLETED" ? "bg-emerald-500" : ""}
                    >
                      {encounter.status === "COMPLETED"
                        ? "Done"
                        : encounter.status === "IN_PROGRESS"
                        ? "Active"
                        : format(new Date(encounter.scheduledAt), "h:mm a")}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No consultations scheduled today</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/encounters">View All Encounters</Link>
                  </Button>
                </div>
              </div>
            )}
            {todayEncounters.length > 0 && (
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/encounters">
                  View All Encounters
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest interactions</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.userName || "System"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description || `${activity.action} ${activity.resource}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(activity.createdAt), "h:mm a")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Growth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Patients</CardTitle>
              <CardDescription>{patientCount} total patients</CardDescription>
            </div>
            <UserPlus className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold">{patientCount}</span>
              <span className="text-sm text-muted-foreground">registered</span>
            </div>
            {stats?.recentPatients && stats.recentPatients.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recently Added</p>
                {stats.recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(patient.createdAt), "MMM d")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Add patients to see them here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold">Inventory Status</CardTitle>
              <CardDescription>
                {lowStockItems.length > 0
                  ? `${lowStockItems.length} items need attention`
                  : stats?.totalInventoryItems
                  ? "All items well stocked"
                  : "No inventory tracked yet"}
              </CardDescription>
            </div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length > 0 && (
                <>
                  <div className="rounded-lg bg-destructive/10 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Low Stock Alert
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {lowStockItems.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                        <Badge variant="destructive" className="ml-2 shrink-0">
                          {item.quantity}/{item.minStock}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  <span className="font-medium">{stats?.totalInventoryUnits || 0}</span>
                  <span className="text-muted-foreground"> total units in stock</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/inventory">
                    View Inventory
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 justify-start" asChild>
                <Link href="/consult/new">
                  <Mic className="h-5 w-5 text-primary" />
                  <span className="font-medium">Start AI Consult</span>
                  <span className="text-xs text-muted-foreground">Voice-powered notes</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 justify-start" asChild>
                <Link href="/patients">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <span className="font-medium">Add Patient</span>
                  <span className="text-xs text-muted-foreground">New registration</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 justify-start" asChild>
                <Link href="/labs">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  <span className="font-medium">Upload Labs</span>
                  <span className="text-xs text-muted-foreground">AI-parsed results</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 justify-start" asChild>
                <Link href="/shipping">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="font-medium">Ship Order</span>
                  <span className="text-xs text-muted-foreground">Create shipment</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
