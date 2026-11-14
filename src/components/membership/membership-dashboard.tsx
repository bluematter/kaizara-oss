"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  Sparkles,
  FlaskConical,
  Stethoscope,
  Pill,
  Zap,
  ChevronRight,
} from "lucide-react";
import { format, isValid, differenceInDays, startOfMonth, endOfMonth } from "date-fns";

// Safe date formatter
function safeFormat(date: Date | string | number | undefined | null, formatStr: string, fallback = "—"): string {
  if (!date) return fallback;
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (!isValid(dateObj)) return fallback;
    return format(dateObj, formatStr);
  } catch {
    return fallback;
  }
}

// Types
export interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  unitPrice?: number;
  duration?: number;
}

export interface MembershipService {
  serviceId: string;
  service: Service;
  includedQuantity: number;
}

export interface Membership {
  id: string;
  name: string;
  description?: string;
  price?: number;
  services: MembershipService[];
}

export interface ServiceUsage {
  id: string;
  usedAt: Date;
  quantity: number;
  serviceId: string;
  service: Service;
  notes?: string;
}

export interface PatientMembership {
  id: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "EXPIRED";
  startDate: Date;
  endDate?: Date;
  membership: Membership;
  serviceUsages: ServiceUsage[];
}

// Default services for demo
export const defaultServices: Service[] = [
  { id: "labs-monthly", name: "Monthly Lab Panel", description: "Comprehensive blood work including hormones, metabolic panel, and inflammatory markers", category: "Labs", unitPrice: 350 },
  { id: "consult-initial", name: "Initial Consultation", description: "60-minute comprehensive health evaluation", category: "Consultation", unitPrice: 300, duration: 60 },
  { id: "consult-followup", name: "Follow-up Consultation", description: "30-minute progress check and protocol adjustment", category: "Consultation", unitPrice: 150, duration: 30 },
  { id: "iv-therapy", name: "IV Therapy Session", description: "Customized IV nutrient infusion", category: "Treatment", unitPrice: 200, duration: 45 },
  { id: "peptide-protocol", name: "Peptide Protocol Management", description: "Monthly peptide protocol optimization", category: "Treatment", unitPrice: 100 },
  { id: "body-comp", name: "Body Composition Analysis", description: "DEXA scan or InBody analysis", category: "Labs", unitPrice: 150 },
];

// Default memberships for demo
export const defaultMemberships: Membership[] = [
  {
    id: "premium",
    name: "Premium Longevity",
    description: "Comprehensive optimization program with unlimited consultations and monthly labs",
    price: 599,
    services: [
      { serviceId: "labs-monthly", service: defaultServices[0], includedQuantity: 1 },
      { serviceId: "consult-followup", service: defaultServices[2], includedQuantity: 4 },
      { serviceId: "iv-therapy", service: defaultServices[3], includedQuantity: 2 },
      { serviceId: "peptide-protocol", service: defaultServices[4], includedQuantity: 1 },
      { serviceId: "body-comp", service: defaultServices[5], includedQuantity: 1 },
    ],
  },
  {
    id: "essential",
    name: "Essential Care",
    description: "Core optimization with quarterly labs and monthly consultations",
    price: 299,
    services: [
      { serviceId: "labs-monthly", service: defaultServices[0], includedQuantity: 1 },
      { serviceId: "consult-followup", service: defaultServices[2], includedQuantity: 2 },
      { serviceId: "peptide-protocol", service: defaultServices[4], includedQuantity: 1 },
    ],
  },
];

// Get icon for service category
function getServiceIcon(category?: string) {
  switch (category) {
    case "Labs": return FlaskConical;
    case "Consultation": return Stethoscope;
    case "Treatment": return Zap;
    default: return Pill;
  }
}

// Get status badge color
function getStatusColor(status: PatientMembership["status"]) {
  switch (status) {
    case "ACTIVE": return "bg-emerald-500";
    case "PAUSED": return "bg-yellow-500";
    case "CANCELLED": return "bg-red-500";
    case "EXPIRED": return "bg-gray-500";
  }
}

// Membership Card component
interface MembershipCardProps {
  patientMembership: PatientMembership;
  compact?: boolean;
  editable?: boolean; // Allow staff to adjust service quantities
}

export function MembershipCard({ patientMembership, compact = false, editable = false }: MembershipCardProps) {
  const { membership, status, startDate, serviceUsages } = patientMembership;

  // Calculate days remaining in current billing period (assuming monthly)
  const now = new Date();
  const monthEnd = endOfMonth(now);
  const daysRemaining = differenceInDays(monthEnd, now);

  // Calculate service usage for current period
  const currentMonthStart = startOfMonth(now);
  const currentPeriodUsages = serviceUsages.filter(u =>
    new Date(u.usedAt) >= currentMonthStart
  );

  // Get usage counts by service
  const usageByService = useMemo(() => {
    const counts: Record<string, number> = {};
    currentPeriodUsages.forEach(u => {
      counts[u.serviceId] = (counts[u.serviceId] || 0) + u.quantity;
    });
    return counts;
  }, [currentPeriodUsages]);

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{membership.name}</p>
                <p className="text-sm text-muted-foreground">
                  Member since {safeFormat(startDate, "MMM yyyy")}
                </p>
              </div>
            </div>
            <Badge className={`${getStatusColor(status)} text-white`}>
              {status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{membership.name}</CardTitle>
              <CardDescription>{membership.description}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <Badge className={`${getStatusColor(status)} text-white mb-1`}>
              {status}
            </Badge>
            <p className="text-2xl font-bold">${membership.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Billing period progress */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Current Billing Period</span>
            </div>
            <span className="text-sm font-medium">{daysRemaining} days remaining</span>
          </div>
          <Progress value={((30 - daysRemaining) / 30) * 100} className="h-2" />
        </div>

        {/* Services included */}
        <div>
          <p className="text-sm font-medium mb-3">Included Services</p>
          <div className="space-y-2">
            {membership.services.map((ms) => {
              const Icon = getServiceIcon(ms.service.category);
              const used = usageByService[ms.serviceId] || 0;
              const remaining = ms.includedQuantity - used;
              const percentUsed = (used / ms.includedQuantity) * 100;

              return (
                <div key={ms.serviceId} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{ms.service.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        <span className={used > 0 ? "text-primary font-medium" : "text-muted-foreground"}>
                          {used}
                        </span>
                        <span className="text-muted-foreground"> / {ms.includedQuantity} used</span>
                      </span>
                      {remaining === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {remaining} left
                        </Badge>
                      )}
                      {editable && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
                          Adjust
                        </Button>
                      )}
                    </div>
                  </div>
                  <Progress value={percentUsed} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Member since */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Member since</span>
          <span className="font-medium">{safeFormat(startDate, "MMMM d, yyyy")}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Service Usage History component
interface ServiceUsageHistoryProps {
  usages: ServiceUsage[];
  limit?: number;
}

export function ServiceUsageHistory({ usages, limit = 5 }: ServiceUsageHistoryProps) {
  const sortedUsages = [...usages].sort((a, b) =>
    new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()
  ).slice(0, limit);

  if (sortedUsages.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No service usage recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <CardDescription>Your service usage history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedUsages.map((usage) => {
            const Icon = getServiceIcon(usage.service.category);
            return (
              <div key={usage.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{usage.service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {safeFormat(usage.usedAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">x{usage.quantity}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Membership Summary Widget for dashboard/patient view
interface MembershipSummaryProps {
  patientMembership: PatientMembership | null;
  onViewDetails?: () => void;
  isPatientView?: boolean;
}

export function MembershipSummary({ patientMembership, onViewDetails, isPatientView = false }: MembershipSummaryProps) {
  if (!patientMembership) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium mb-1">No Active Membership</p>
          <p className="text-sm text-muted-foreground mb-4">
            {isPatientView
              ? "Contact your care team to learn about membership options"
              : "Patient does not have an active membership"
            }
          </p>
          {!isPatientView && (
            <Button variant="outline" size="sm">
              Add Membership
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const { membership, status, serviceUsages } = patientMembership;

  // Calculate total services used this month
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentPeriodUsages = serviceUsages.filter(u =>
    new Date(u.usedAt) >= currentMonthStart
  );
  const totalUsed = currentPeriodUsages.reduce((sum, u) => sum + u.quantity, 0);
  const totalIncluded = membership.services.reduce((sum, ms) => sum + ms.includedQuantity, 0);

  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onViewDetails}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Membership</CardTitle>
          </div>
          <Badge className={`${getStatusColor(status)} text-white`}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-medium">{membership.name}</p>
            <p className="text-sm text-muted-foreground">${membership.price}/month</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Services used this month</span>
            <span className="text-sm font-medium">{totalUsed} / {totalIncluded}</span>
          </div>
          <Progress value={(totalUsed / totalIncluded) * 100} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}

// Generate mock patient membership data
export function generateMockPatientMembership(): PatientMembership {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - 3); // Started 3 months ago

  // Generate some mock service usages
  const usages: ServiceUsage[] = [];
  let usageId = 1;

  // Labs last month and 3 months ago
  usages.push({
    id: `usage-${usageId++}`,
    usedAt: new Date(now.getFullYear(), now.getMonth() - 1, 15),
    quantity: 1,
    serviceId: "labs-monthly",
    service: defaultServices[0],
    notes: "Quarterly comprehensive panel",
  });

  // A few follow-up consultations
  usages.push({
    id: `usage-${usageId++}`,
    usedAt: new Date(now.getFullYear(), now.getMonth(), 5),
    quantity: 1,
    serviceId: "consult-followup",
    service: defaultServices[2],
    notes: "Protocol adjustment discussion",
  });

  usages.push({
    id: `usage-${usageId++}`,
    usedAt: new Date(now.getFullYear(), now.getMonth() - 1, 20),
    quantity: 1,
    serviceId: "consult-followup",
    service: defaultServices[2],
  });

  // IV therapy
  usages.push({
    id: `usage-${usageId++}`,
    usedAt: new Date(now.getFullYear(), now.getMonth(), 10),
    quantity: 1,
    serviceId: "iv-therapy",
    service: defaultServices[3],
    notes: "NAD+ infusion",
  });

  return {
    id: "patient-membership-1",
    status: "ACTIVE",
    startDate,
    membership: defaultMemberships[0], // Premium membership
    serviceUsages: usages,
  };
}
