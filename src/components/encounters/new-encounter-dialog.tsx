"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  User,
  FileText,
  Video,
  Phone,
  Users,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface NewEncounterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId?: string;
  patientName?: string;
  providers?: Array<{ id: string; name: string }>;
  templates?: Array<{ id: string; name: string; encounterType?: string }>;
  facilities?: string[];
}

const encounterTypes = [
  { value: "OFFICE_VISIT", label: "Office Visit" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "NEW_PATIENT", label: "New Patient" },
  { value: "TELEHEALTH", label: "Telehealth" },
  { value: "PHONE_CONSULT", label: "Phone Consult" },
  { value: "IV_THERAPY", label: "IV Therapy" },
  { value: "INJECTION", label: "Injection Visit" },
  { value: "LAB_REVIEW", label: "Lab Review" },
  { value: "PROCEDURE", label: "Procedure" },
];

const encounterModes = [
  { value: "IN_PERSON", label: "In Person", icon: Users },
  { value: "PHONE", label: "Phone", icon: Phone },
  { value: "VIDEO", label: "Video", icon: Video },
];

const chartTypes = [
  { value: "QUICK", label: "Quick Note", description: "Minimal documentation" },
  { value: "BRIEF", label: "Brief", description: "Standard one-page chart" },
  { value: "COMPREHENSIVE", label: "Comprehensive", description: "Full SOAP with all sections" },
  { value: "SOAP_TEMPLATE", label: "Template", description: "Use a pre-built template" },
  { value: "AI_SCRIBE", label: "AI Scribe", description: "AI-assisted documentation" },
];

export function NewEncounterDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  providers = [],
  templates = [],
  facilities = ["Main Clinic"],
}: NewEncounterDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [encounterType, setEncounterType] = useState("OFFICE_VISIT");
  const [encounterMode, setEncounterMode] = useState("IN_PERSON");
  const [chartType, setChartType] = useState("BRIEF");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>(providers[0]?.id || "");
  const [facility, setFacility] = useState(facilities[0] || "Main Clinic");
  const [scheduledAt, setScheduledAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [chiefComplaint, setChiefComplaint] = useState("");

  const handleCreate = async () => {
    if (!patientId) {
      setError("Patient is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/encounters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          providerId: selectedProvider || undefined,
          scheduledAt: new Date(scheduledAt).toISOString(),
          encounterType,
          encounterMode,
          chartType,
          templateId: selectedTemplate || undefined,
          facility,
          chiefComplaint: chiefComplaint || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create encounter");
      }

      const encounter = await response.json();
      onOpenChange(false);
      router.push(`/encounters/${encounter.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create encounter");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Encounter</DialogTitle>
          <DialogDescription>
            {patientName
              ? `Create a new encounter for ${patientName}`
              : "Create a new clinical encounter"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Patient Display (if pre-selected) */}
          {patientName && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{patientName}</p>
                <p className="text-xs text-muted-foreground">Patient</p>
              </div>
            </div>
          )}

          {/* Provider Selection */}
          {providers.length > 0 && (
            <div className="space-y-2">
              <Label>Encounter with</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Encounter Type */}
          <div className="space-y-2">
            <Label>Visit Type</Label>
            <Select value={encounterType} onValueChange={setEncounterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {encounterTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Encounter Mode */}
          <div className="space-y-2">
            <Label>Encounter Mode</Label>
            <div className="flex gap-2">
              {encounterModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Button
                    key={mode.value}
                    type="button"
                    variant={encounterMode === mode.value ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setEncounterMode(mode.value)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {mode.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Chart Type */}
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {chartTypes.slice(0, 4).map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={chartType === type.value ? "default" : "outline"}
                  className="h-auto flex-col items-start p-3"
                  onClick={() => setChartType(type.value)}
                >
                  <span className="font-medium">{type.label}</span>
                  <span className="text-xs opacity-70">{type.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Template Selection (if chart type is SOAP_TEMPLATE) */}
          {chartType === "SOAP_TEMPLATE" && templates.length > 0 && (
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate || ""} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Facility */}
          <div className="space-y-2">
            <Label>Facility</Label>
            <Select value={facility} onValueChange={setFacility}>
              <SelectTrigger>
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date/Time */}
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          {/* Chief Complaint (optional) */}
          <div className="space-y-2">
            <Label>Chief Complaint (optional)</Label>
            <Textarea
              placeholder="Reason for visit..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={2}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || !patientId}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Encounter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
