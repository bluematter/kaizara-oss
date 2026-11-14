"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mic,
  MicOff,
  Save,
  ArrowLeft,
  Clock,
  FileText,
  Package,
  Sparkles,
  CheckCircle2,
  User,
  TestTube,
  StickyNote,
} from "lucide-react";
// Real data - consult page fetches from API
import { format } from "date-fns";

// Fake transcription simulation
const fakeTranscripts = [
  "Patient reports feeling much better since starting the BPC-157 protocol...",
  "The knee pain has significantly reduced, approximately 60% improvement...",
  "No adverse reactions reported. Patient tolerating the injections well...",
  "Mobility has increased. Can now walk without discomfort for extended periods...",
  "Recommend continuing the current protocol for another 2 weeks...",
  "Will reassess at follow-up. Consider adding TB-500 if needed...",
];

// Fake AI summary
const fakeAISummary = `**Chief Complaint:** Follow-up for BPC-157 protocol for knee pain

**Subjective:**
Patient reports significant improvement in knee pain since starting BPC-157 protocol 4 weeks ago. Pain reduced by approximately 60%. No adverse reactions to subcutaneous injections. Mobility has improved - can now walk extended distances without discomfort.

**Assessment:**
- Excellent response to BPC-157 therapy
- No signs of adverse effects
- Functional improvement noted

**Plan:**
1. Continue BPC-157 250mcg twice daily for 2 more weeks
2. Follow-up in 2 weeks for reassessment
3. Consider adding TB-500 if plateau in improvement
4. Patient to continue home exercises

**Inventory Deducted:**
- BPC-157 5mg vial x1 (Lot: LOT-2024-001)`;

export default function ConsultPage() {
  const params = useParams();
  const consultId = params.id as string;
  const isNew = consultId === "new";

  const [consult, setConsult] = useState<{ id: string; patient: { id: string; firstName: string; lastName: string; email?: string; phone?: string }; chiefComplaint?: string; aiSummary?: string; providerNotes?: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [providerNotes, setProviderNotes] = useState("");
  const [templates, setTemplates] = useState<{ id: string; name: string; subjective?: { freeform?: string; sections?: { label: string; defaultContent?: string }[] } }[]>([]);

  // Fetch templates
  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const applyTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (!t?.subjective) return;
    if (t.subjective.freeform) {
      setProviderNotes(t.subjective.freeform);
    } else if (t.subjective.sections) {
      const text = t.subjective.sections
        .map((s) => `${s.label}:\n${s.defaultContent || ""}`)
        .join("\n\n");
      setProviderNotes(text);
    }
  };

  // Fetch encounter data if not new
  useEffect(() => {
    if (isNew) return;
    fetch(`/api/encounters/${consultId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setConsult(data);
          if (data.aiSummary) setAiSummary(data.aiSummary);
          if (data.providerNotes) setProviderNotes(data.providerNotes);
        }
      })
      .catch(() => {});
  }, [consultId, isNew]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Fake transcription effect
  useEffect(() => {
    if (!isRecording) return;

    const timer = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    let transcriptIndex = 0;
    const transcriptTimer = setInterval(() => {
      if (transcriptIndex < fakeTranscripts.length) {
        setTranscription((prev) =>
          prev ? `${prev}\n\n${fakeTranscripts[transcriptIndex]}` : fakeTranscripts[transcriptIndex]
        );
        transcriptIndex++;
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(transcriptTimer);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Simulate AI processing
    setTimeout(() => {
      setAiSummary(fakeAISummary);
    }, 1500);
  };

  const handleSave = () => {
    setShowSaveDialog(false);
    setIsSaved(true);
  };

  if (!isNew && !consult) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Loading consultation...</p>
      </div>
    );
  }

  const patient = consult?.patient || { id: "", firstName: "New", lastName: "Patient", email: "", phone: "" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/patients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Consultation" : "Consultation"}
            </h2>
            <p className="text-muted-foreground">
              {patient.firstName} {patient.lastName} ·{" "}
              {format(new Date(), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {isSaved ? (
            <Badge className="flex items-center gap-2 px-4 py-2">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </Badge>
          ) : (
            <Button onClick={() => setShowSaveDialog(true)} disabled={!aiSummary}>
              <Save className="mr-2 h-4 w-4" />
              Save & Deduct Inventory
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{patient.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{patient.phone}</p>
            </div>
            {consult?.chiefComplaint && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Chief Complaint</p>
                  <p className="font-medium">{consult.chiefComplaint}</p>
                </div>
              </>
            )}
            <Separator />
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/patients/${patient.id}?tab=labs`}>
                <TestTube className="mr-2 h-4 w-4" />
                View Lab Results
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recording Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  AI Scribe
                </CardTitle>
                <CardDescription>
                  Record the consultation for automatic transcription and summary
                </CardDescription>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                  <span className="font-mono text-lg font-medium">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Record Button */}
            <div className="flex justify-center">
              {!isRecording ? (
                <Button
                  size="lg"
                  className="h-20 w-20 rounded-full"
                  onClick={() => setIsRecording(true)}
                >
                  <Mic className="h-8 w-8" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-20 w-20 rounded-full"
                  onClick={handleStopRecording}
                >
                  <MicOff className="h-8 w-8" />
                </Button>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {isRecording
                ? "Recording... Click to stop"
                : "Click to start recording"}
            </p>

            {/* Live Transcription */}
            {transcription && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Live Transcription</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{transcription}</p>
                  {isRecording && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provider Notes */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  Provider Notes
                </CardTitle>
                <CardDescription>
                  Type your own notes during or after the consultation
                </CardDescription>
              </div>
              {templates.length > 0 && (
                <Select onValueChange={applyTemplate}>
                  <SelectTrigger className="w-[200px]">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Apply template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your notes here... These are saved alongside the AI transcription."
              value={providerNotes}
              onChange={(e) => setProviderNotes(e.target.value)}
              rows={6}
              className="resize-y"
            />
          </CardContent>
        </Card>

        {/* AI Summary */}
        {aiSummary && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Generated Summary
              </CardTitle>
              <CardDescription>
                Review and edit before saving to patient record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card p-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {aiSummary}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Save Consultation & Deduct Inventory</DialogTitle>
            <DialogDescription>
              The following items will be deducted from inventory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">BPC-157 5mg</p>
                    <p className="text-xs text-muted-foreground">
                      Lot: LOT-2024-001
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">-1 vial</Badge>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                Inventory will be updated after save
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
