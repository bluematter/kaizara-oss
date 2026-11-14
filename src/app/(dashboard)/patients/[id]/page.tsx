"use client";

import { PortalAccessDialog } from "@/components/patients/portal-access-dialog";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  User,
  TestTube,
  ClipboardList,
  Truck,
  Phone,
  Mail,
  Calendar,
  Mic,
  Upload,
  KeyRound,
  FileText,
  HeartPulse,
  CreditCard,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { EncounterList, NewEncounterDialog } from "@/components/encounters";
import { LabUploadDialog } from "@/components/labs/lab-upload-dialog";
import { format, isValid } from "date-fns";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PatientData = any;

interface LabMarkerData {
  name: string;
  value: number;
  unit: string;
  status: string;
  category: string;
  referenceMin?: number;
  referenceMax?: number;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  // Data state
  const [patient, setPatient] = useState<PatientData>(null);
  const [patientEncounters, setPatientEncounters] = useState<PatientData[]>([]);
  const [labPanels, setLabPanels] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);

  // Membership state
  const [patientMembership, setPatientMembership] = useState<PatientData>(null);
  const [availableMemberships, setAvailableMemberships] = useState<PatientData[]>([]);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [membershipSaving, setMembershipSaving] = useState(false);
  const [newTierOpen, setNewTierOpen] = useState(false);
  const [newTier, setNewTier] = useState({ name: "", price: "", description: "", frequency: "monthly" });

  // Dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newEncounterOpen, setNewEncounterOpen] = useState(false);
  const [portalDialogOpen, setPortalDialogOpen] = useState(false);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/patients/${patientId}?tab=${value}`, { scroll: false });
  };

  const fetchMembership = useCallback(async () => {
    try {
      const [membershipRes, tiersRes] = await Promise.all([
        fetch(`/api/patients/${patientId}/membership`),
        fetch("/api/memberships"),
      ]);
      if (membershipRes.ok) {
        const data = await membershipRes.json();
        setPatientMembership(data.patientMembership || null);
      }
      if (tiersRes.ok) {
        const data = await tiersRes.json();
        setAvailableMemberships(data.memberships || []);
      }
    } catch {
      // membership fetch failed
    }
  }, [patientId]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientRes, encountersRes, labsRes] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch(`/api/encounters?patientId=${patientId}&limit=20`),
        fetch(`/api/labs?patientId=${patientId}`),
      ]);

      if (patientRes.ok) {
        const data = await patientRes.json();
        setPatient(data);
      }
      if (encountersRes.ok) {
        const data = await encountersRes.json();
        setPatientEncounters(data.encounters || []);
      }
      if (labsRes.ok) {
        const data = await labsRes.json();
        setLabPanels(data.panels || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
    fetchMembership();
  }, [patientId, fetchMembership]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignMembership = async () => {
    if (!selectedMembershipId) return;
    setMembershipSaving(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: selectedMembershipId }),
      });
      if (res.ok) {
        setMembershipDialogOpen(false);
        setSelectedMembershipId("");
        fetchMembership();
      }
    } catch {
      // error
    }
    setMembershipSaving(false);
  };

  const handleCancelMembership = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/membership`, { method: "DELETE" });
      if (res.ok) {
        fetchMembership();
      }
    } catch {
      // error
    }
  };

  const handleCreateTier = async () => {
    if (!newTier.name.trim()) return;
    setMembershipSaving(true);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTier.name.trim(),
          price: newTier.price ? parseFloat(newTier.price) : null,
          description: [newTier.frequency === "yearly" ? "[yearly]" : "[monthly]", newTier.description.trim()].filter(Boolean).join(" ") || null,
        }),
      });
      if (res.ok) {
        setNewTierOpen(false);
        setNewTier({ name: "", price: "", description: "", frequency: "monthly" });
        // Refresh tiers list
        const tiersRes = await fetch("/api/memberships");
        if (tiersRes.ok) {
          const data = await tiersRes.json();
          setAvailableMemberships(data.memberships || []);
        }
      }
    } catch {
      // error
    }
    setMembershipSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-32 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Patient not found</p>
            <Button asChild className="mt-4">
              <Link href="/patients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Patients
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasLabs = labPanels.length > 0;
  const latestLab = hasLabs ? labPanels[0] : null;
  const markers: LabMarkerData[] = latestLab?.markers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/patients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-base sm:text-lg">
              {(patient.firstName || "?")[0]}
              {(patient.lastName || "?")[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
              {patient.firstName} {patient.lastName}
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              {patient.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{patient.email}</span>
                </span>
              )}
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" />
                  {patient.phone}
                </span>
              )}
              {!patient.email && !patient.phone && (
                <span className="text-muted-foreground">No contact info</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPortalDialogOpen(true)}
            className="flex-1 sm:flex-none"
          >
            <KeyRound className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Portal Access</span>
            <span className="sm:hidden">Portal</span>
          </Button>
          <Button size="sm" asChild className="flex-1 sm:flex-none">
            <Link href={`/consult/new?patient=${patient.id}`}>
              <Mic className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Start Consult</span>
              <span className="sm:hidden">Consult</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <User className="h-4 w-4 sm:mr-1" />
            <span className="hidden lg:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="consultations" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 sm:mr-1" />
            <span className="hidden lg:inline">Chart Notes</span>
          </TabsTrigger>
          <TabsTrigger value="labs" className="text-xs sm:text-sm">
            <TestTube className="h-4 w-4 sm:mr-1" />
            <span className="hidden lg:inline">Labs</span>
          </TabsTrigger>
          <TabsTrigger value="treatment" className="text-xs sm:text-sm">
            <ClipboardList className="h-4 w-4 sm:mr-1" />
            <span className="hidden lg:inline">Treatment</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs sm:text-sm">
            <Truck className="h-4 w-4 sm:mr-1" />
            <span className="hidden lg:inline">Orders</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date of Birth</span>
                  <span className="text-sm font-medium">
                    {patient.dateOfBirth ? safeFormat(patient.dateOfBirth, "MMM d, yyyy") : "Not set"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{patient.email || "Not set"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium">{patient.phone || "Not set"}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="text-sm font-medium text-right">
                    {patient.address ? (
                      <>
                        {patient.address}<br />
                        {patient.city}, {patient.state} {patient.zip}
                      </>
                    ) : "Not set"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Portal Access</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Latest Labs Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest Labs</CardTitle>
                <CardDescription>
                  {latestLab ? safeFormat(latestLab.collectedAt, "MMM d, yyyy") : "No labs on file"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {latestLab ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Markers Tested</span>
                      <span className="font-medium">{markers.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Normal</span>
                      <Badge variant="default" className="bg-emerald">
                        {markers.filter((m) => m.status === "NORMAL").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Out of Range</span>
                      <Badge variant="destructive">
                        {markers.filter((m) => m.status !== "NORMAL").length}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => handleTabChange("labs")}>
                      View Full Results
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <TestTube className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No lab results yet</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setUploadOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Labs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Encounters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Encounters</CardTitle>
                <CardDescription>{patientEncounters.length} on record</CardDescription>
              </CardHeader>
              <CardContent>
                {patientEncounters.length > 0 ? (
                  <div className="space-y-3">
                    {patientEncounters.slice(0, 3).map((enc: PatientData) => (
                      <div key={enc.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {safeFormat(enc.scheduledAt, "MMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {enc.chiefComplaint || "No chief complaint"}
                          </p>
                        </div>
                        <Badge variant={enc.signStatus === "SIGNED" ? "default" : "outline"} className="text-xs">
                          {enc.signStatus === "SIGNED" ? "Signed" : enc.signStatus === "DRAFT" ? "Draft" : enc.signStatus}
                        </Badge>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleTabChange("consultations")}>
                      View All
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No encounters yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Membership */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Membership</CardTitle>
                {!patientMembership && (
                  <Button variant="outline" size="sm" onClick={() => setMembershipDialogOpen(true)}>
                    <Plus className="mr-2 h-3 w-3" />
                    Assign
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {patientMembership ? (() => {
                const desc = patientMembership.membership?.description || "";
                const isYearly = desc.startsWith("[yearly]");
                const cleanDesc = desc.replace(/^\[(monthly|yearly)\]\s*/, "");
                return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{patientMembership.membership?.name}</p>
                      {cleanDesc && (
                        <p className="text-sm text-muted-foreground">{cleanDesc}</p>
                      )}
                    </div>
                    <Badge variant="default" className="bg-emerald">Active</Badge>
                  </div>
                  {patientMembership.membership?.price != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{isYearly ? "Yearly" : "Monthly"}</span>
                      <span className="font-medium">
                        ${patientMembership.membership.price}/{isYearly ? "yr" : "mo"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Since</span>
                    <span className="font-medium">{safeFormat(patientMembership.startDate, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setMembershipDialogOpen(true)}>
                      Change Plan
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleCancelMembership}>
                      <X className="mr-1 h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
                );
              })() : (
                <div className="text-center py-4">
                  <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No membership assigned</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setMembershipDialogOpen(true)}>
                    Assign Membership
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart Notes Tab */}
        <TabsContent value="consultations" className="space-y-4">
          <EncounterList
            encounters={patientEncounters}
            showPatientColumn={false}
            onNewEncounter={() => setNewEncounterOpen(true)}
            title="Chart Notes"
            description={`${patientEncounters.length} encounters on record`}
          />
          <NewEncounterDialog
            open={newEncounterOpen}
            onOpenChange={setNewEncounterOpen}
            patientId={patient.id}
            patientName={`${patient.firstName} ${patient.lastName}`}
            providers={[]}
            facilities={["Main Clinic", "Telehealth"]}
          />
        </TabsContent>

        {/* Labs Tab */}
        <TabsContent value="labs" className="space-y-4">
          {latestLab ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Lab Results</CardTitle>
                    <CardDescription>
                      {safeFormat(latestLab.collectedAt, "MMMM d, yyyy")} &middot; {latestLab.labProvider}
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setUploadOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {markers.map((marker: LabMarkerData) => (
                    <div
                      key={marker.name}
                      className={`rounded-lg border p-3 ${
                        marker.status !== "NORMAL" ? "border-destructive/30 bg-destructive/5" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">{marker.name}</p>
                        <Badge variant={marker.status === "NORMAL" ? "secondary" : "destructive"} className="text-xs">
                          {marker.status === "NORMAL" ? "Normal" : marker.status === "HIGH" ? "High" : "Low"}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {marker.value} <span className="text-sm font-normal text-muted-foreground">{marker.unit}</span>
                      </p>
                      {(marker.referenceMin != null || marker.referenceMax != null) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Ref: {marker.referenceMin ?? "—"} - {marker.referenceMax ?? "—"} {marker.unit}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Lab Results</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a lab report PDF to get started
                </p>
                <Button onClick={() => setUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Lab Report
                </Button>
              </CardContent>
            </Card>
          )}

          <LabUploadDialog
            patientId={patientId}
            patientName={`${patient.firstName} ${patient.lastName}`}
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            onSuccess={() => fetchData()}
          />
        </TabsContent>

        {/* Treatment Tab */}
        <TabsContent value="treatment" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Treatment Plan</h3>
              <p className="text-sm text-muted-foreground">
                Treatment plans, medications, and protocols will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Orders</h3>
              <p className="text-sm text-muted-foreground">
                Create a new order to ship medications to this patient
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Membership Dialog */}
      <Dialog open={membershipDialogOpen} onOpenChange={setMembershipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {patientMembership ? "Change Membership" : "Assign Membership"}
            </DialogTitle>
            <DialogDescription>
              Select a membership tier for {patient.firstName} {patient.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {availableMemberships.length > 0 ? (
              <div className="space-y-2">
                <Label>Membership Tier</Label>
                <Select value={selectedMembershipId} onValueChange={setSelectedMembershipId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMemberships.map((m: PatientData) => {
                      const isYr = m.description?.startsWith("[yearly]");
                      return (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}{m.price != null ? ` — $${m.price}/${isYr ? "yr" : "mo"}` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No membership tiers exist yet. Create one first.
              </p>
            )}
            <div className="border-t pt-4">
              <Button variant="outline" size="sm" onClick={() => { setMembershipDialogOpen(false); setNewTierOpen(true); }}>
                <Plus className="mr-2 h-3 w-3" />
                Create New Tier
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembershipDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignMembership} disabled={!selectedMembershipId || membershipSaving}>
              {membershipSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {patientMembership ? "Change Plan" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Membership Tier Dialog */}
      <Dialog open={newTierOpen} onOpenChange={setNewTierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Membership Tier</DialogTitle>
            <DialogDescription>
              Define a new membership level for your clinic
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tier Name *</Label>
              <Input
                placeholder="e.g. Basic, Premium, VIP"
                value={newTier.name}
                onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="149.00"
                  value={newTier.price}
                  onChange={(e) => setNewTier({ ...newTier, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Billing Frequency</Label>
                <Select value={newTier.frequency} onValueChange={(v) => setNewTier({ ...newTier, frequency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What's included in this tier..."
                rows={3}
                value={newTier.description}
                onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTierOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTier} disabled={!newTier.name.trim() || membershipSaving}>
              {membershipSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {patient && (
        <PortalAccessDialog
          patientId={patient.id}
          patientName={`${patient.firstName} ${patient.lastName}`}
          open={portalDialogOpen}
          onOpenChange={setPortalDialogOpen}
        />
      )}
    </div>
  );
}
