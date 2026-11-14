"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  Users,
  Stethoscope,
  Gift,
  Save,
  AlertCircle,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Plus,
  UserPlus,
  FileText,
} from "lucide-react";
import { TemplateBuilder, type SOAPTemplate } from "@/components/templates/template-builder";

// Notification settings defaults
const defaultSettings = {
  patientPerkReminder: {
    enabled: true,
    daysBefore: 7,
    frequency: "once" as "once" | "daily" | "weekly",
    channels: ["email"] as ("email" | "sms" | "push")[],
  },
  patientExpirationWarning: {
    enabled: true,
    daysBefore: 3,
    frequency: "daily" as "once" | "daily" | "weekly",
    channels: ["email"] as ("email" | "sms" | "push")[],
  },
  patientWeeklySurvey: {
    enabled: true,
    dayOfWeek: "monday" as string,
    channels: ["email"] as ("email" | "sms" | "push")[],
  },
  providerExpiringPerks: {
    enabled: true,
    daysBefore: 5,
    frequency: "weekly" as "once" | "daily" | "weekly",
    channels: ["email"] as ("email" | "sms" | "push")[],
  },
  providerDecliningScores: {
    enabled: true,
    threshold: 15,
    channels: ["email"] as ("email" | "sms" | "push")[],
  },
  providerLowStock: {
    enabled: true,
    channels: ["email"] as ("email" | "sms" | "push")[],
  },
};

interface ClinicData {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [clinicLoading, setClinicLoading] = useState(true);
  const [clinicSaving, setClinicSaving] = useState(false);
  const [clinicSaved, setClinicSaved] = useState(false);

  // Clinic form state
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [newMember, setNewMember] = useState({ name: "", email: "", role: "PROVIDER" });

  // Template state
  const [templates, setTemplates] = useState<SOAPTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) setTemplates(await res.json());
    } catch { /* ignore */ }
    finally { setTemplatesLoading(false); }
  };

  useEffect(() => {
    fetch("/api/clinic")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setClinic(data);
          setClinicName(data.name || "");
          setClinicAddress(data.address || "");
          setClinicPhone(data.phone || "");
          setClinicEmail(data.email || "");
        }
      })
      .catch(() => {})
      .finally(() => setClinicLoading(false));

    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTeamMembers(Array.isArray(data) ? data : []))
      .catch(() => setTeamMembers([]))
      .finally(() => setTeamLoading(false));

    fetchTemplates();
  }, []);

  const handleAddMember = async () => {
    setMemberError("");
    if (!newMember.name.trim()) { setMemberError("Name is required"); return; }
    if (!newMember.email.trim()) { setMemberError("Email is required"); return; }

    setAddingMember(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });
      if (res.ok) {
        const user = await res.json();
        setTeamMembers((prev) => [...prev, user]);
        setAddMemberOpen(false);
        setNewMember({ name: "", email: "", role: "PROVIDER" });
        setMemberError("");
      } else {
        const data = await res.json();
        setMemberError(data.error || "Failed to add team member");
      }
    } catch {
      setMemberError("Network error — please try again");
    } finally {
      setAddingMember(false);
    }
  };

  const handleClinicSave = async () => {
    setClinicSaving(true);
    try {
      const res = await fetch("/api/clinic", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clinicName,
          address: clinicAddress || null,
          phone: clinicPhone || null,
          email: clinicEmail || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setClinic(updated);
        setClinicSaved(true);
        setTimeout(() => setClinicSaved(false), 3000);
      }
    } catch {
      // Failed
    } finally {
      setClinicSaving(false);
    }
  };

  const handleNotificationSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updatePatientPerkReminder = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      patientPerkReminder: { ...prev.patientPerkReminder, [field]: value },
    }));
  };

  const updatePatientExpiration = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      patientExpirationWarning: { ...prev.patientExpirationWarning, [field]: value },
    }));
  };

  const updatePatientSurvey = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      patientWeeklySurvey: { ...prev.patientWeeklySurvey, [field]: value },
    }));
  };

  const updateProviderExpiring = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      providerExpiringPerks: { ...prev.providerExpiringPerks, [field]: value },
    }));
  };

  const updateProviderDeclining = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      providerDecliningScores: { ...prev.providerDecliningScores, [field]: value },
    }));
  };

  const updateProviderLowStock = (field: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      providerLowStock: { ...prev.providerLowStock, [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your clinic and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="clinic">
            <Building2 className="h-4 w-4 mr-2" />
            Clinic
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            SOAP Templates
          </TabsTrigger>
          <TabsTrigger value="integrations" disabled>
            <Gift className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Clinic Tab */}
        <TabsContent value="clinic" className="space-y-6">
          {clinicLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-64" />
            </div>
          ) : (
            <>
              {clinicSaved && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <p className="text-sm text-emerald-500 font-medium">Clinic settings saved!</p>
                </div>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Clinic Profile</CardTitle>
                      <CardDescription>
                        Basic information about your clinic
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clinic-name">Clinic Name</Label>
                      <Input
                        id="clinic-name"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        placeholder="Enter clinic name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic-email">
                        <span className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          Clinic Email
                        </span>
                      </Label>
                      <Input
                        id="clinic-email"
                        type="email"
                        value={clinicEmail}
                        onChange={(e) => setClinicEmail(e.target.value)}
                        placeholder="hello@yourclinic.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic-phone">
                        <span className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          Phone Number
                        </span>
                      </Label>
                      <Input
                        id="clinic-phone"
                        type="tel"
                        value={clinicPhone}
                        onChange={(e) => setClinicPhone(e.target.value)}
                        placeholder="(555) 555-5555"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Clinic Slug</Label>
                      <Input
                        value={clinic?.slug || ""}
                        disabled
                        className="text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used for patient portal URLs. Cannot be changed.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinic-address">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        Address
                      </span>
                    </Label>
                    <Textarea
                      id="clinic-address"
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      placeholder="123 Main St, Suite 100&#10;San Diego, CA 92101"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleClinicSave} disabled={clinicSaving}>
                      {clinicSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Clinic Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Team Members</CardTitle>
                        <CardDescription>
                          Providers and staff at your clinic
                        </CardDescription>
                      </div>
                    </div>
                    <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add Team Member</DialogTitle>
                          <DialogDescription>
                            Add a provider or staff member to your clinic. They can log in with these credentials.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {memberError && (
                            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                              <p className="text-sm text-destructive">{memberError}</p>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="member-name">Full Name</Label>
                            <Input
                              id="member-name"
                              placeholder="Dr. Jane Smith"
                              value={newMember.name}
                              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="member-email">Email</Label>
                            <Input
                              id="member-email"
                              type="email"
                              placeholder="jane@yourclinic.com"
                              value={newMember.email}
                              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="member-role">Role</Label>
                            <Select
                              value={newMember.role}
                              onValueChange={(v) => setNewMember({ ...newMember, role: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PROVIDER">Provider (Doctor/NP)</SelectItem>
                                <SelectItem value="STAFF">Staff (MA/Front Desk)</SelectItem>
                                <SelectItem value="ADMIN">Admin (Full Access)</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Providers can manage patients and sign notes. Staff can handle inventory and scheduling.
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddMember} disabled={addingMember}>
                            {addingMember ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Member
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {teamLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-14" />
                      <Skeleton className="h-14" />
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No team members yet</p>
                      <p className="text-xs mt-1">Add your first provider or staff member</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                              {(member.name || member.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.name || "Unnamed"}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <Badge variant={member.role === "ADMIN" ? "default" : member.role === "PROVIDER" ? "secondary" : "outline"}>
                            {member.role === "ADMIN" ? "Admin" : member.role === "PROVIDER" ? "Provider" : "Staff"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleNotificationSave}>
              <Save className="mr-2 h-4 w-4" />
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>

          {saved && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-emerald-500" />
              <p className="text-sm text-emerald-500 font-medium">Settings saved successfully!</p>
            </div>
          )}

          {/* Patient Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Patient Notifications</CardTitle>
                  <CardDescription>
                    Control when and how patients receive reminders
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Perk/Service Reminder */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Perk/Service Reminder</Label>
                    <Badge variant="outline" className="text-xs">Membership</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Remind patients about unused services before they expire
                  </p>
                  {settings.patientPerkReminder.enabled && (
                    <div className="grid gap-4 sm:grid-cols-3 mt-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Days Before Expiration</Label>
                        <Select value={String(settings.patientPerkReminder.daysBefore)} onValueChange={(v) => updatePatientPerkReminder("daysBefore", parseInt(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Frequency</Label>
                        <Select value={settings.patientPerkReminder.frequency} onValueChange={(v) => updatePatientPerkReminder("frequency", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Once</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Channel</Label>
                        <Select defaultValue="email">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms" disabled>SMS (Coming Soon)</SelectItem>
                            <SelectItem value="push" disabled>Push (Coming Soon)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
                <Switch checked={settings.patientPerkReminder.enabled} onCheckedChange={(v) => updatePatientPerkReminder("enabled", v)} />
              </div>

              {/* Expiration Warning */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Expiration Warning</Label>
                    <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/30">Urgent</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Final warning when services are about to expire
                  </p>
                  {settings.patientExpirationWarning.enabled && (
                    <div className="grid gap-4 sm:grid-cols-3 mt-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Days Before Expiration</Label>
                        <Select value={String(settings.patientExpirationWarning.daysBefore)} onValueChange={(v) => updatePatientExpiration("daysBefore", parseInt(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="2">2 days</SelectItem>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Frequency</Label>
                        <Select value={settings.patientExpirationWarning.frequency} onValueChange={(v) => updatePatientExpiration("frequency", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once">Once</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Channel</Label>
                        <Select defaultValue="email">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms" disabled>SMS (Coming Soon)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
                <Switch checked={settings.patientExpirationWarning.enabled} onCheckedChange={(v) => updatePatientExpiration("enabled", v)} />
              </div>

              {/* Weekly Health Survey */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Weekly Health Survey</Label>
                    <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">Engagement</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Prompt patients to rate their symptoms weekly (0-100 scale)
                  </p>
                  {settings.patientWeeklySurvey.enabled && (
                    <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Send On</Label>
                        <Select value={settings.patientWeeklySurvey.dayOfWeek} onValueChange={(v) => updatePatientSurvey("dayOfWeek", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Channel</Label>
                        <Select defaultValue="email">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms" disabled>SMS (Coming Soon)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
                <Switch checked={settings.patientWeeklySurvey.enabled} onCheckedChange={(v) => updatePatientSurvey("enabled", v)} />
              </div>
            </CardContent>
          </Card>

          {/* Provider Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Stethoscope className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Provider Notifications</CardTitle>
                  <CardDescription>Alerts for doctors and staff</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Expiring Patient Perks */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Expiring Patient Perks Report</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about patients with services expiring soon
                  </p>
                  {settings.providerExpiringPerks.enabled && (
                    <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Days Before</Label>
                        <Select value={String(settings.providerExpiringPerks.daysBefore)} onValueChange={(v) => updateProviderExpiring("daysBefore", parseInt(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Report Frequency</Label>
                        <Select value={settings.providerExpiringPerks.frequency} onValueChange={(v) => updateProviderExpiring("frequency", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily Digest</SelectItem>
                            <SelectItem value="weekly">Weekly Summary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
                <Switch checked={settings.providerExpiringPerks.enabled} onCheckedChange={(v) => updateProviderExpiring("enabled", v)} />
              </div>

              {/* Declining Patient Scores */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Declining Patient Scores</Label>
                    <Badge variant="outline" className="text-xs text-red-500 border-red-500/30">Important</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Alert when a patient&apos;s symptom scores decline significantly
                  </p>
                  {settings.providerDecliningScores.enabled && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-2 max-w-xs">
                        <Label className="text-xs text-muted-foreground">Decline Threshold (%)</Label>
                        <Select value={String(settings.providerDecliningScores.threshold)} onValueChange={(v) => updateProviderDeclining("threshold", parseInt(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10% decline</SelectItem>
                            <SelectItem value="15">15% decline</SelectItem>
                            <SelectItem value="20">20% decline</SelectItem>
                            <SelectItem value="25">25% decline</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
                <Switch checked={settings.providerDecliningScores.enabled} onCheckedChange={(v) => updateProviderDeclining("enabled", v)} />
              </div>

              {/* Low Stock Alerts */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="space-y-1 flex-1">
                  <Label className="text-base font-medium">Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when inventory items fall below minimum stock
                  </p>
                </div>
                <Switch checked={settings.providerLowStock.enabled} onCheckedChange={(v) => updateProviderLowStock("enabled", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <TemplateBuilder
            templates={templates}
            templatesLoading={templatesLoading}
            onRefresh={fetchTemplates}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
