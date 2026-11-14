"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
// Tabs removed - now using scrollable single-page layout with anchor nav
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  Clock,
  Edit3,
  Loader2,
  ChevronLeft,
  Stethoscope,
  ClipboardList,
  FileText,
  Activity,
  Scale,
  Heart,
  Thermometer,
  Wind,
  Layers,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

// ROS systems and their common findings
const ROS_SYSTEMS = {
  "Constitutional": ["Fever", "Chills", "Weight loss", "Weight gain", "Fatigue", "Malaise", "Night sweats"],
  "Eyes": ["Vision changes", "Eye pain", "Redness", "Discharge", "Dry eyes"],
  "ENT": ["Hearing loss", "Tinnitus", "Sore throat", "Nasal congestion", "Sinus pressure", "Nosebleeds"],
  "Cardiovascular": ["Chest pain", "Palpitations", "Edema", "Shortness of breath on exertion", "Claudication"],
  "Respiratory": ["Cough", "Shortness of breath", "Wheezing", "Hemoptysis"],
  "GI": ["Nausea", "Vomiting", "Diarrhea", "Constipation", "Abdominal pain", "Bloating", "Heartburn"],
  "GU": ["Frequency", "Urgency", "Dysuria", "Hematuria", "Incontinence"],
  "Musculoskeletal": ["Joint pain", "Stiffness", "Swelling", "Back pain", "Muscle weakness", "Limited ROM"],
  "Skin": ["Rash", "Itching", "Lesions", "Dryness", "Bruising", "Hair loss"],
  "Neurologic": ["Headache", "Dizziness", "Numbness", "Tingling", "Weakness", "Tremor", "Brain fog"],
  "Psychiatric": ["Depression", "Anxiety", "Sleep disturbance", "Irritability", "Memory issues", "Difficulty concentrating"],
  "Endocrine": ["Heat/cold intolerance", "Excessive thirst", "Excessive hunger", "Hair changes", "Low libido"],
  "Hematologic": ["Easy bruising", "Bleeding", "Lymph node swelling"],
  "Allergic/Immunologic": ["Seasonal allergies", "Drug allergies", "Food sensitivities", "Recurrent infections"],
} as const;

function ROSChecklist({ value, onChange, disabled }: {
  value: Record<string, string>;
  onChange: (ros: Record<string, string>) => void;
  disabled: boolean;
}) {
  const [expandedSystems, setExpandedSystems] = useState<string[]>([]);

  const toggleSystem = (system: string) => {
    setExpandedSystems(prev =>
      prev.includes(system) ? prev.filter(s => s !== system) : [...prev, system]
    );
  };

  const toggleFinding = (system: string, finding: string) => {
    const current = value[system] || "";
    const findings = current ? current.split(", ") : [];
    const updated = findings.includes(finding)
      ? findings.filter(f => f !== finding)
      : [...findings, finding];

    onChange({
      ...value,
      [system]: updated.join(", "),
    });
  };

  const getPositiveFindings = (system: string): string[] => {
    const current = value[system] || "";
    return current ? current.split(", ").filter(Boolean) : [];
  };

  return (
    <div className="space-y-2">
      {Object.entries(ROS_SYSTEMS).map(([system, findings]) => {
        const positive = getPositiveFindings(system);
        const isExpanded = expandedSystems.includes(system);

        return (
          <div key={system} className="rounded-lg border border-border">
            <button
              type="button"
              onClick={() => toggleSystem(system)}
              disabled={disabled}
              className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{system}</span>
                {positive.length > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {positive.length} positive
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {isExpanded ? "−" : "+"}
              </span>
            </button>
            {isExpanded && (
              <div className="px-3 pb-3 pt-1 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {findings.map((finding) => (
                    <label key={finding} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={positive.includes(finding)}
                        onCheckedChange={() => toggleFinding(system, finding)}
                        disabled={disabled}
                      />
                      <span className={positive.includes(finding) ? "text-destructive font-medium" : ""}>
                        {finding}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SOAPData {
  subjective?: {
    chiefComplaint?: string;
    hpi?: string;
    ros?: Record<string, string>;
    pmh?: string;
    socialHistory?: string;
    familyHistory?: string;
  };
  objective?: {
    vitals?: {
      weight?: number;
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
      oxygenSat?: number;
    };
    physicalExam?: string;
    measurements?: string;
  };
  assessment?: {
    clinicalImpression?: string;
    diagnoses?: Array<{
      icd10?: string;
      description: string;
      isPrimary?: boolean;
    }>;
  };
  plan?: {
    orders?: string;
    prescriptions?: string;
    followUp?: string;
    patientEducation?: string;
    referrals?: string;
  };
}

interface Encounter {
  id: string;
  scheduledAt: string;
  encounterType: string;
  encounterMode: string;
  chartType: string;
  chiefComplaint?: string | null;
  signStatus: string;
  signedAt?: string | null;
  signedBy?: { id: string; name: string } | null;
  subjective?: SOAPData["subjective"] | null;
  objective?: SOAPData["objective"] | null;
  assessment?: SOAPData["assessment"] | null;
  plan?: SOAPData["plan"] | null;
  transcription?: string | null;
  aiSummary?: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | null;
  };
  provider: {
    id: string;
    name: string;
  };
  template?: {
    id: string;
    name: string;
    macros?: Record<string, string>;
  } | null;
}

// SOAP Templates - "patch" style overlays that merge into existing content
interface SOAPTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subjective?: Partial<SOAPData["subjective"]>;
  objective?: Partial<SOAPData["objective"]>;
  assessment?: Partial<SOAPData["assessment"]>;
  plan?: Partial<SOAPData["plan"]>;
}

const SOAP_TEMPLATES: SOAPTemplate[] = [
  {
    id: "peptide-followup",
    name: "Peptide Follow-up",
    description: "Standard peptide therapy check-in",
    category: "Follow-up",
    subjective: {
      hpi: "Patient presents for routine peptide therapy follow-up. Reports [improved/stable/worsening] symptoms since last visit. [Side effects: none/mild injection site reaction/other]. Adherence to protocol: [good/fair/poor].",
      pmh: "",
    },
    objective: {
      physicalExam: "General: Well-appearing, no acute distress\nSkin: Injection sites examined - no signs of infection, abscess, or lipodystrophy\nMusculoskeletal: [ROM assessment if applicable]",
    },
    assessment: {
      clinicalImpression: "Patient on [peptide name] protocol for [indication]. [Responding well / Suboptimal response / Needs adjustment]. Labs reviewed - [within normal limits / notable findings].",
    },
    plan: {
      prescriptions: "• Continue current peptide protocol:\n  - [Peptide] [dose] [route] [frequency]\n• [Adjust/maintain] dosing based on response",
      orders: "• Comprehensive metabolic panel\n• CBC with differential\n• [Specific markers to monitor]",
      followUp: "Return in 4 weeks for reassessment and lab review.",
      patientEducation: "Reviewed injection technique and rotation sites. Proper storage in refrigerator. Report any unusual symptoms.",
    },
  },
  {
    id: "iv-therapy",
    name: "IV Therapy Session",
    description: "IV nutrient infusion documentation",
    category: "Treatment",
    subjective: {
      hpi: "Patient presents for scheduled IV therapy session. Chief concern: [fatigue/recovery/immune support/anti-aging]. No adverse reactions to previous infusions. NPO status: [appropriate/not applicable].",
    },
    objective: {
      vitals: { weight: undefined, bloodPressure: "", heartRate: undefined, temperature: undefined, oxygenSat: undefined },
      physicalExam: "General: Well-appearing, well-hydrated\nSkin: IV access site assessed - no signs of infiltration or phlebitis\nCardiovascular: RRR, no murmurs\nLungs: Clear to auscultation",
    },
    assessment: {
      clinicalImpression: "Patient appropriate for IV nutrient therapy. No contraindications identified. Hydration status adequate.",
    },
    plan: {
      orders: "• IV infusion administered:\n  - [NAD+ 500mg / Myers Cocktail / Custom blend]\n  - Volume: [500mL / 1000mL] Normal Saline\n  - Duration: [45 min / 60 min / 90 min]\n  - Rate: [as tolerated]\n• Monitored throughout infusion - no adverse reactions",
      followUp: "Schedule next session in [1-2 weeks]. Call if any delayed reactions.",
      patientEducation: "Increase fluid intake for 24 hours. May experience [warmth/flushing/metallic taste] during infusion - this is normal.",
    },
  },
  {
    id: "new-patient-longevity",
    name: "New Patient - Longevity",
    description: "Initial longevity/optimization consultation",
    category: "New Patient",
    subjective: {
      hpi: "New patient presenting for longevity optimization consultation. Primary goals: [energy/body composition/hormone optimization/cognitive function/anti-aging]. Current health concerns: [list]. Current supplements and medications: [list].",
      socialHistory: "Occupation: \nExercise: [type, frequency, duration]\nDiet: [approach - Mediterranean, keto, etc.]\nSleep: [hours, quality]\nStress: [level, management]\nAlcohol: \nTobacco: \nRecreational substances: ",
      familyHistory: "Father: \nMother: \nSiblings: \nGrandparents: \nFamily history of: [heart disease/cancer/diabetes/autoimmune/dementia]",
    },
    objective: {
      physicalExam: "General: [appearance, body habitus]\nVitals: [see above]\nSkin: [quality, turgor, lesions]\nMusculoskeletal: [posture, ROM, strength]\nNeuro: [cognition, reflexes]\nBody composition: [if available - BF%, lean mass]",
    },
    assessment: {
      clinicalImpression: "New patient evaluation for longevity optimization. Baseline assessment indicates [overall health status]. Key areas for optimization: [list priorities].",
    },
    plan: {
      orders: "• Comprehensive baseline labs:\n  - CBC, CMP, Lipid panel\n  - Thyroid panel (TSH, Free T3, Free T4)\n  - Hormone panel (Total/Free Testosterone, Estradiol, DHEA-S, IGF-1)\n  - Inflammatory markers (hs-CRP, Homocysteine)\n  - Metabolic (HbA1c, Fasting Insulin)\n  - Vitamin D, B12, Folate, Ferritin\n• DEXA scan for body composition",
      prescriptions: "• Initial supplement recommendations:\n  - [Based on assessment]\n• Peptide protocol to be determined after lab review",
      followUp: "Return in 2 weeks for lab review and treatment plan discussion.",
      patientEducation: "Discussed longevity optimization approach. Provided information on available protocols. Labs to be drawn fasting before 10am.",
    },
  },
  {
    id: "glp1-management",
    name: "GLP-1 Management",
    description: "Semaglutide/Tirzepatide follow-up",
    category: "Follow-up",
    subjective: {
      hpi: "Patient on [Semaglutide/Tirzepatide] for weight management. Current dose: [dose]. Duration on medication: [weeks/months]. Reports [appetite suppression/nausea/other GI symptoms]. Weight change since last visit: [lbs]. Adherence: [good/fair/poor].",
    },
    objective: {
      physicalExam: "General: [appearance]\nAbdomen: Soft, non-tender, no distension\nSkin: Injection sites - no abnormalities\nExtremities: No edema",
    },
    assessment: {
      clinicalImpression: "Patient on GLP-1 receptor agonist therapy for weight optimization. [Good response / Plateau / Need dose adjustment]. Current BMI: []. Total weight loss: [lbs] ([%] of starting weight).",
    },
    plan: {
      prescriptions: "• [Continue/Adjust] [Semaglutide/Tirzepatide]:\n  - Current dose: []\n  - New dose: [if adjusting]\n  - Route: SubQ weekly",
      orders: "• Comprehensive metabolic panel\n• HbA1c\n• Lipid panel\n• Thyroid function",
      followUp: "Return in 4 weeks for weight check and dose titration.",
      patientEducation: "Continue high-protein diet (min 100g/day). Stay hydrated. Report persistent nausea, vomiting, or abdominal pain.",
    },
  },
  {
    id: "lab-review",
    name: "Lab Review",
    description: "Review and discuss lab results",
    category: "Follow-up",
    subjective: {
      hpi: "Patient presents for lab result review. Labs drawn on [date]. Patient reports [current symptoms/concerns since labs drawn].",
    },
    assessment: {
      clinicalImpression: "Lab results reviewed and discussed with patient.\n\nNotable findings:\n- [Marker]: [value] ([interpretation])\n- [Marker]: [value] ([interpretation])\n\nOverall assessment: [summary]",
    },
    plan: {
      orders: "• Repeat labs in [timeframe]:\n  - [specific markers to recheck]",
      prescriptions: "• Protocol adjustments based on labs:\n  - [changes]",
      followUp: "Recheck labs in [4-8 weeks]. Follow up after results available.",
      patientEducation: "Reviewed lab results in detail. Discussed significance of [key findings]. Provided recommendations for [diet/lifestyle/supplements].",
    },
  },
];

interface SOAPChartProps {
  encounter: Encounter;
  onSave?: (data: Partial<Encounter>) => Promise<void>;
  onSign?: () => void;
  readOnly?: boolean;
}

const signStatusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  DRAFT: { label: "Draft", icon: Edit3, className: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30" },
  UNSIGNED: { label: "Unsigned", icon: AlertCircle, className: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" },
  PENDING_COSIGN: { label: "Pending Co-sign", icon: Clock, className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30" },
  SIGNED: { label: "Signed", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" },
  AMENDED: { label: "Amended", icon: Edit3, className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30" },
};

export function SOAPChart({ encounter, onSave, onSign, readOnly = false }: SOAPChartProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("subjective");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Custom templates from API
  const [customTemplates, setCustomTemplates] = useState<Array<{
    id: string;
    name: string;
    description?: string | null;
    subjective?: unknown;
    objective?: unknown;
    assessment?: unknown;
    plan?: unknown;
  }>>([]);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setCustomTemplates(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Form state
  const [subjective, setSubjective] = useState<SOAPData["subjective"]>(
    (encounter.subjective as SOAPData["subjective"]) || {}
  );
  const [objective, setObjective] = useState<SOAPData["objective"]>(
    (encounter.objective as SOAPData["objective"]) || {}
  );
  const [assessment, setAssessment] = useState<SOAPData["assessment"]>(
    (encounter.assessment as SOAPData["assessment"]) || {}
  );
  const [plan, setPlan] = useState<SOAPData["plan"]>(
    (encounter.plan as SOAPData["plan"]) || {}
  );

  // Detect freeform mode from saved data
  const savedSubjective = encounter.subjective as Record<string, unknown> | null;
  const isSavedFreeform = savedSubjective && typeof savedSubjective === "object" && "freeform" in savedSubjective;

  const [chartMode, setChartMode] = useState<"soap" | "freeform">(isSavedFreeform ? "freeform" : "soap");
  const [freeformNotes, setFreeformNotes] = useState<string>(
    isSavedFreeform ? (savedSubjective.freeform as string) || "" : ""
  );

  const isSigned = encounter.signStatus === "SIGNED" || encounter.signStatus === "AMENDED";
  const [amendMode, setAmendMode] = useState(false);
  const isReadOnly = readOnly || (isSigned && !amendMode);

  // Track active section on scroll via IntersectionObserver
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const sections = container.querySelectorAll("[id^='soap-']");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("soap-", "");
            setActiveTab(id);
          }
        }
      },
      { root: container, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Apply a SOAP template as a "patch" - merges into existing content
  const applyTemplate = (templateId: string) => {
    if (isReadOnly) return;

    // Check hardcoded templates first, then custom templates from API
    const builtIn = SOAP_TEMPLATES.find((t) => t.id === templateId);
    const custom = !builtIn ? customTemplates.find((t) => t.id === templateId) : null;

    if (!builtIn && !custom) return;

    setHasChanges(true);

    if (builtIn) {
      // Apply built-in template (structured SOAP fields) — always SOAP mode
      setChartMode("soap");
      if (builtIn.subjective) {
        setSubjective((prev) => ({
          ...prev,
          hpi: prev?.hpi || builtIn.subjective?.hpi || "",
          pmh: prev?.pmh || builtIn.subjective?.pmh || prev?.pmh || "",
          socialHistory: prev?.socialHistory || builtIn.subjective?.socialHistory || "",
          familyHistory: prev?.familyHistory || builtIn.subjective?.familyHistory || "",
          ros: prev?.ros || builtIn.subjective?.ros || prev?.ros,
        }));
      }
      if (builtIn.objective) {
        setObjective((prev) => ({
          ...prev,
          vitals: prev?.vitals || builtIn.objective?.vitals || prev?.vitals,
          physicalExam: prev?.physicalExam || builtIn.objective?.physicalExam || "",
          measurements: prev?.measurements || builtIn.objective?.measurements || "",
        }));
      }
      if (builtIn.assessment) {
        setAssessment((prev) => ({
          ...prev,
          clinicalImpression: prev?.clinicalImpression || builtIn.assessment?.clinicalImpression || "",
          diagnoses: prev?.diagnoses?.length ? prev.diagnoses : builtIn.assessment?.diagnoses || prev?.diagnoses,
        }));
      }
      if (builtIn.plan) {
        setPlan((prev) => ({
          ...prev,
          orders: prev?.orders || builtIn.plan?.orders || "",
          prescriptions: prev?.prescriptions || builtIn.plan?.prescriptions || "",
          followUp: prev?.followUp || builtIn.plan?.followUp || "",
          patientEducation: prev?.patientEducation || builtIn.plan?.patientEducation || "",
          referrals: prev?.referrals || builtIn.plan?.referrals || "",
        }));
      }
    } else if (custom) {
      // Apply custom template - may be freeform or structured
      const subj = custom.subjective as Record<string, unknown> | null;
      const obj = custom.objective as Record<string, unknown> | null;
      const assess = custom.assessment as Record<string, unknown> | null;
      const planData = custom.plan as Record<string, unknown> | null;

      if (subj) {
        // Handle freeform templates — switch to freeform mode
        if (typeof subj === "object" && "freeform" in subj && typeof subj.freeform === "string") {
          setChartMode("freeform");
          setFreeformNotes(subj.freeform as string);
        } else {
          // Structured custom template — stay in SOAP mode
          setChartMode("soap");
          setSubjective((prev) => ({
            ...prev,
            hpi: prev?.hpi || (subj.hpi as string) || "",
            chiefComplaint: prev?.chiefComplaint || (subj.chiefComplaint as string) || "",
            pmh: prev?.pmh || (subj.pmh as string) || "",
            socialHistory: prev?.socialHistory || (subj.socialHistory as string) || "",
            familyHistory: prev?.familyHistory || (subj.familyHistory as string) || "",
          }));
        }
      }
      if (obj && typeof obj === "object") {
        setObjective((prev) => ({
          ...prev,
          physicalExam: prev?.physicalExam || (obj.physicalExam as string) || "",
          measurements: prev?.measurements || (obj.measurements as string) || "",
        }));
      }
      if (assess && typeof assess === "object") {
        setAssessment((prev) => ({
          ...prev,
          clinicalImpression: prev?.clinicalImpression || (assess.clinicalImpression as string) || "",
        }));
      }
      if (planData && typeof planData === "object") {
        setPlan((prev) => ({
          ...prev,
          orders: prev?.orders || (planData.orders as string) || "",
          prescriptions: prev?.prescriptions || (planData.prescriptions as string) || "",
          followUp: prev?.followUp || (planData.followUp as string) || "",
          patientEducation: prev?.patientEducation || (planData.patientEducation as string) || "",
          referrals: prev?.referrals || (planData.referrals as string) || "",
        }));
      }
    }
  };

  const handleFieldChange = useCallback((
    section: "subjective" | "objective" | "assessment" | "plan",
    field: string,
    value: unknown
  ) => {
    setHasChanges(true);

    switch (section) {
      case "subjective":
        setSubjective((prev) => ({ ...prev, [field]: value }));
        break;
      case "objective":
        setObjective((prev) => ({ ...prev, [field]: value }));
        break;
      case "assessment":
        setAssessment((prev) => ({ ...prev, [field]: value }));
        break;
      case "plan":
        setPlan((prev) => ({ ...prev, [field]: value }));
        break;
    }
  }, []);

  const handleSave = async () => {
    if (!onSave) return;
    if (isReadOnly && !amendMode) return;

    setIsSaving(true);
    try {
      const saveData = chartMode === "freeform"
        ? {
            subjective: { freeform: freeformNotes },
            objective: { vitals: objective?.vitals },
            assessment: null,
            plan: null,
            chiefComplaint: null,
            ...(amendMode ? { isAmendment: true } : {}),
          }
        : {
            subjective,
            objective,
            assessment,
            plan,
            chiefComplaint: subjective?.chiefComplaint,
            ...(amendMode ? { isAmendment: true } : {}),
          };
      await onSave(saveData as Partial<Encounter>);
      setHasChanges(false);
      if (amendMode) setAmendMode(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const statusConfig = signStatusConfig[encounter.signStatus] || signStatusConfig.DRAFT;
  const StatusIcon = statusConfig.icon;

  // Encounter mode labels
  const modeLabels: Record<string, string> = {
    IN_PERSON: "In Person",
    TELEHEALTH: "Telehealth",
    PHONE: "Phone",
  };
  const typeLabels: Record<string, string> = {
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
  const chartTypeLabels: Record<string, string> = {
    BRIEF: "Brief",
    COMPREHENSIVE: "Comprehensive",
    SOAP: "SOAP",
    SOAP_TEMPLATE: "SOAP",
    PROCEDURE_NOTE: "Procedure Note",
  };

  // Calculate patient age
  const patientAge = encounter.patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(encounter.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card backdrop-blur-sm px-6 py-4 space-y-4">
        {/* Top row: back button, status badge, actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-9 w-9 rounded-lg hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">
              {encounter.patient.firstName} {encounter.patient.lastName}
            </h1>
            <Badge variant="outline" className={`${statusConfig.className} border`}>
              <StatusIcon className="h-3 w-3 mr-1.5" />
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {!isReadOnly && (
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="w-[180px]">
                  <Layers className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Apply Template" />
                </SelectTrigger>
                <SelectContent>
                  {customTemplates.length > 0 && (
                    <div>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">My Templates</div>
                      {customTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <span className="font-medium">{template.name}</span>
                            {template.description && (
                              <span className="text-xs text-muted-foreground ml-2">{template.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  )}
                  {Array.from(new Set(SOAP_TEMPLATES.map((t) => t.category))).map((category) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{category}</div>
                      {SOAP_TEMPLATES.filter((t) => t.category === category).map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <span className="font-medium">{template.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{template.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasChanges && !isReadOnly && (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {amendMode ? "Save Amendment" : "Save Draft"}
              </Button>
            )}
            {amendMode && (
              <Button variant="outline" onClick={() => setAmendMode(false)} className="gap-2">
                Cancel Edit
              </Button>
            )}
            {isSigned && !amendMode && (
              <Button variant="outline" onClick={() => setAmendMode(true)} className="gap-2">
                <Edit3 className="h-4 w-4" />
                Unlock to Edit
              </Button>
            )}
            {!isSigned && onSign && (
              <Button onClick={onSign} className="gap-2 bg-primary hover:bg-primary/90">
                <FileSignature className="h-4 w-4" />
                Sign
              </Button>
            )}
          </div>
        </div>

        {/* Encounter info grid */}
        <div className="rounded-lg border border-border bg-muted/30 px-5 py-3.5">
          <div className="grid grid-cols-3 gap-x-10 gap-y-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Patient</p>
              <p className="font-medium">{encounter.patient.firstName} {encounter.patient.lastName}{patientAge !== null ? `, ${patientAge}y` : ""}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Date</p>
              <p className="font-medium">{format(new Date(encounter.scheduledAt), "MMM d, yyyy 'at' h:mm a")}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Provider</p>
              <p className="font-medium">{encounter.provider.name}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Visit Type</p>
              <p className="font-medium">{typeLabels[encounter.encounterType] || encounter.encounterType?.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">Mode</p>
              <p className="font-medium">{modeLabels[encounter.encounterMode] || encounter.encounterMode?.replace("_", " ") || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-0.5">
                {isSigned ? "Signed by" : "Chart Type"}
              </p>
              <p className="font-medium">
                {isSigned && encounter.signedBy
                  ? `${encounter.signedBy.name}${encounter.signedAt ? ` — ${format(new Date(encounter.signedAt), "MMM d, yyyy")}` : ""}`
                  : chartTypeLabels[encounter.chartType] || encounter.chartType || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Sticky SOAP navigation — only in structured mode */}
        {chartMode === "soap" && (
          <div className="border-b border-border bg-card px-6">
            <div className="flex items-center gap-1 h-14">
              {[
                { id: "subjective", label: "Subjective", letter: "S" },
                { id: "objective", label: "Objective", letter: "O" },
                { id: "assessment", label: "Assessment", letter: "A" },
                { id: "plan", label: "Plan", letter: "P" },
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveTab(section.id);
                    document.getElementById(`soap-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`px-5 h-10 rounded-lg flex items-center transition-all ${
                    activeTab === section.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className={`flex items-center justify-center h-6 w-6 rounded-md mr-2 ${
                    activeTab === section.id ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                  }`}>
                    <span className="font-bold text-sm">{section.letter}</span>
                  </div>
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
          {chartMode === "freeform" ? (
            /* ===================== FREEFORM MODE ===================== */
            <div className="p-6 pb-24 max-w-4xl space-y-6">
              {/* Vitals — always shown, clinically required */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5" />
                        Weight
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="175"
                          value={objective?.vitals?.weight || ""}
                          onChange={(e) => handleFieldChange("objective", "vitals", {
                            ...objective?.vitals,
                            weight: e.target.value ? parseFloat(e.target.value) : undefined,
                          })}
                          disabled={isReadOnly}
                          className="bg-background border-border pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">lbs</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        Blood Pressure
                      </Label>
                      <Input
                        placeholder="120/80"
                        value={objective?.vitals?.bloodPressure || ""}
                        onChange={(e) => handleFieldChange("objective", "vitals", {
                          ...objective?.vitals,
                          bloodPressure: e.target.value,
                        })}
                        disabled={isReadOnly}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5" />
                        Heart Rate
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="72"
                          value={objective?.vitals?.heartRate || ""}
                          onChange={(e) => handleFieldChange("objective", "vitals", {
                            ...objective?.vitals,
                            heartRate: e.target.value ? parseInt(e.target.value) : undefined,
                          })}
                          disabled={isReadOnly}
                          className="bg-background border-border pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">bpm</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Thermometer className="h-3.5 w-3.5" />
                        Temperature
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="98.6"
                          value={objective?.vitals?.temperature || ""}
                          onChange={(e) => handleFieldChange("objective", "vitals", {
                            ...objective?.vitals,
                            temperature: e.target.value ? parseFloat(e.target.value) : undefined,
                          })}
                          disabled={isReadOnly}
                          className="bg-background border-border pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">°F</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Wind className="h-3.5 w-3.5" />
                        O2 Sat
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="98"
                          value={objective?.vitals?.oxygenSat || ""}
                          onChange={(e) => handleFieldChange("objective", "vitals", {
                            ...objective?.vitals,
                            oxygenSat: e.target.value ? parseInt(e.target.value) : undefined,
                          })}
                          disabled={isReadOnly}
                          className="bg-background border-border pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Freeform Notes */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Encounter Notes
                  </CardTitle>
                  <CardDescription>Your template headers and notes for this encounter</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Start typing your encounter notes..."
                    value={freeformNotes}
                    onChange={(e) => {
                      setFreeformNotes(e.target.value);
                      setHasChanges(true);
                    }}
                    disabled={isReadOnly}
                    rows={30}
                    className="bg-background border-border focus:border-primary resize-y min-h-[500px] font-mono text-sm"
                  />
                </CardContent>
              </Card>

            </div>
          ) : (
            /* ===================== STRUCTURED SOAP MODE ===================== */
          <div className="p-6 pb-24 max-w-4xl space-y-10">
            {/* Subjective */}
            <div id="soap-subjective" className="scroll-mt-4 space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      History of Present Illness
                    </CardTitle>
                    <CardDescription>Chief complaint and OLDCARTS documentation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="CC: Patient presents with...&#10;&#10;Onset: When did it start?&#10;Location: Where is it?&#10;Duration: How long?&#10;Character: What does it feel like?&#10;Aggravating/Alleviating: Better/worse with?&#10;Radiation: Does it spread?&#10;Timing: Constant or intermittent?&#10;Severity: 1-10 scale"
                      value={subjective?.hpi || ""}
                      onChange={(e) => handleFieldChange("subjective", "hpi", e.target.value)}
                      disabled={isReadOnly}
                      rows={8}
                      className="bg-background border-border focus:border-primary resize-none"
                    />
                  </CardContent>
                </Card>

                {/* Review of Systems Checklist */}
                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Review of Systems
                    </CardTitle>
                    <CardDescription>Check all that apply. Unchecked items are negative/denied.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ROSChecklist
                      value={subjective?.ros || {}}
                      onChange={(ros) => handleFieldChange("subjective", "ros", ros)}
                      disabled={isReadOnly}
                    />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Past Medical History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Relevant past medical history, surgeries, hospitalizations..."
                      value={subjective?.pmh || ""}
                      onChange={(e) => handleFieldChange("subjective", "pmh", e.target.value)}
                      disabled={isReadOnly}
                      rows={3}
                      className="bg-background border-border focus:border-primary resize-none"
                    />
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base">Social History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Lifestyle, occupation, exercise, diet, habits..."
                        value={subjective?.socialHistory || ""}
                        onChange={(e) => handleFieldChange("subjective", "socialHistory", e.target.value)}
                        disabled={isReadOnly}
                        rows={4}
                        className="bg-background border-border focus:border-primary resize-none"
                      />
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base">Family History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Relevant family medical history..."
                        value={subjective?.familyHistory || ""}
                        onChange={(e) => handleFieldChange("subjective", "familyHistory", e.target.value)}
                        disabled={isReadOnly}
                        rows={4}
                        className="bg-background border-border focus:border-primary resize-none"
                      />
                    </CardContent>
                  </Card>
                </div>
            </div>

            {/* Objective */}
            <div id="soap-objective" className="scroll-mt-4 space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Vital Signs
                    </CardTitle>
                    <CardDescription>Current measurements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Scale className="h-3.5 w-3.5" />
                          Weight
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="175"
                            value={objective?.vitals?.weight || ""}
                            onChange={(e) => handleFieldChange("objective", "vitals", {
                              ...objective?.vitals,
                              weight: e.target.value ? parseFloat(e.target.value) : undefined,
                            })}
                            disabled={isReadOnly}
                            className="bg-background border-border pr-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">lbs</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5" />
                          Blood Pressure
                        </Label>
                        <Input
                          placeholder="120/80"
                          value={objective?.vitals?.bloodPressure || ""}
                          onChange={(e) => handleFieldChange("objective", "vitals", {
                            ...objective?.vitals,
                            bloodPressure: e.target.value,
                          })}
                          disabled={isReadOnly}
                          className="bg-background border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Heart className="h-3.5 w-3.5" />
                          Heart Rate
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="72"
                            value={objective?.vitals?.heartRate || ""}
                            onChange={(e) => handleFieldChange("objective", "vitals", {
                              ...objective?.vitals,
                              heartRate: e.target.value ? parseInt(e.target.value) : undefined,
                            })}
                            disabled={isReadOnly}
                            className="bg-background border-border pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">bpm</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Thermometer className="h-3.5 w-3.5" />
                          Temperature
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="98.6"
                            value={objective?.vitals?.temperature || ""}
                            onChange={(e) => handleFieldChange("objective", "vitals", {
                              ...objective?.vitals,
                              temperature: e.target.value ? parseFloat(e.target.value) : undefined,
                            })}
                            disabled={isReadOnly}
                            className="bg-background border-border pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">°F</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Wind className="h-3.5 w-3.5" />
                          O₂ Sat
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="98"
                            value={objective?.vitals?.oxygenSat || ""}
                            onChange={(e) => handleFieldChange("objective", "vitals", {
                              ...objective?.vitals,
                              oxygenSat: e.target.value ? parseInt(e.target.value) : undefined,
                            })}
                            disabled={isReadOnly}
                            className="bg-background border-border pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Physical Examination
                    </CardTitle>
                    <CardDescription>Document examination findings by system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="General: Well-appearing, no acute distress&#10;HEENT: Normal&#10;CV: RRR, no murmurs&#10;Lungs: Clear bilateral&#10;Abdomen: Soft, non-tender&#10;Skin: No rashes or lesions&#10;Neuro: Alert, oriented, no focal deficits"
                      value={objective?.physicalExam || ""}
                      onChange={(e) => handleFieldChange("objective", "physicalExam", e.target.value)}
                      disabled={isReadOnly}
                      rows={8}
                      className="bg-background border-border focus:border-primary resize-none font-mono text-sm"
                    />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Additional Measurements</CardTitle>
                    <CardDescription>Body composition, circumferences, other measurements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Body fat %, waist circumference, BMI..."
                      value={objective?.measurements || ""}
                      onChange={(e) => handleFieldChange("objective", "measurements", e.target.value)}
                      disabled={isReadOnly}
                      rows={3}
                      className="bg-background border-border focus:border-primary resize-none"
                    />
                  </CardContent>
                </Card>
            </div>

            {/* Assessment */}
            <div id="soap-assessment" className="scroll-mt-4 space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Clinical Impression
                    </CardTitle>
                    <CardDescription>Overall assessment and clinical reasoning</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Synthesize subjective and objective findings. Document your clinical reasoning and differential diagnosis..."
                      value={assessment?.clinicalImpression || ""}
                      onChange={(e) => handleFieldChange("assessment", "clinicalImpression", e.target.value)}
                      disabled={isReadOnly}
                      rows={6}
                      className="bg-background border-border focus:border-primary resize-none"
                    />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Diagnoses
                    </CardTitle>
                    <CardDescription>ICD-10 coded diagnoses for this encounter</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm flex items-center gap-2">
                          <Badge variant="default" className="h-5 px-1.5 text-xs bg-primary/20 text-primary border-0">1°</Badge>
                          Primary Diagnosis
                        </Label>
                        <Input
                          placeholder="e.g., Fatigue [R53.83]"
                          value={assessment?.diagnoses?.[0]?.description || ""}
                          onChange={(e) => {
                            const newDiagnoses = [...(assessment?.diagnoses || [])];
                            newDiagnoses[0] = {
                              ...newDiagnoses[0],
                              description: e.target.value,
                              isPrimary: true,
                            };
                            handleFieldChange("assessment", "diagnoses", newDiagnoses);
                          }}
                          disabled={isReadOnly}
                          className="bg-background border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Secondary Diagnosis</Label>
                        <Input
                          placeholder="Additional diagnosis..."
                          value={assessment?.diagnoses?.[1]?.description || ""}
                          onChange={(e) => {
                            const newDiagnoses = [...(assessment?.diagnoses || [])];
                            if (!newDiagnoses[0]) newDiagnoses[0] = { description: "", isPrimary: true };
                            newDiagnoses[1] = { description: e.target.value };
                            handleFieldChange("assessment", "diagnoses", newDiagnoses);
                          }}
                          disabled={isReadOnly}
                          className="bg-background border-border"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Plan */}
            <div id="soap-plan" className="scroll-mt-4 space-y-6">
                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Orders & Treatments
                    </CardTitle>
                    <CardDescription>Labs, imaging, procedures, treatments ordered</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="• Comprehensive metabolic panel&#10;• Lipid panel&#10;• Testosterone, free and total&#10;• IV NAD+ 500mg"
                      value={plan?.orders || ""}
                      onChange={(e) => handleFieldChange("plan", "orders", e.target.value)}
                      disabled={isReadOnly}
                      rows={4}
                      className="bg-background border-border focus:border-primary resize-none"
                    />
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Prescriptions & Supplements
                    </CardTitle>
                    <CardDescription>Medications, peptides, supplements prescribed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="• BPC-157 250mcg SubQ daily&#10;• Sermorelin 300mcg nightly&#10;• Vitamin D3 5000 IU daily"
                      value={plan?.prescriptions || ""}
                      onChange={(e) => handleFieldChange("plan", "prescriptions", e.target.value)}
                      disabled={isReadOnly}
                      rows={4}
                      className="bg-background border-border focus:border-primary resize-none"
                    />
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base">Follow-up</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Return in 4 weeks for lab review and protocol adjustment..."
                        value={plan?.followUp || ""}
                        onChange={(e) => handleFieldChange("plan", "followUp", e.target.value)}
                        disabled={isReadOnly}
                        rows={3}
                        className="bg-background border-border focus:border-primary resize-none"
                      />
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base">Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Specialist referrals if needed..."
                        value={plan?.referrals || ""}
                        onChange={(e) => handleFieldChange("plan", "referrals", e.target.value)}
                        disabled={isReadOnly}
                        rows={3}
                        className="bg-background border-border focus:border-primary resize-none"
                      />
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border bg-card">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Patient Education</CardTitle>
                    <CardDescription>Instructions and information provided to patient</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Reviewed injection technique and storage requirements. Patient to continue food diary and track symptoms..."
                      value={plan?.patientEducation || ""}
                      onChange={(e) => handleFieldChange("plan", "patientEducation", e.target.value)}
                      disabled={isReadOnly}
                      rows={3}
                      className="bg-background border-border focus:border-primary resize-none"
                    />
                  </CardContent>
                </Card>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Signed Footer */}
      {isSigned && encounter.signedAt && encounter.signedBy && (
        <div className={`border-t px-6 py-4 ${amendMode ? "bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-border" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/5 dark:border-border"}`}>
          <div className="flex items-center gap-2 text-sm">
            {amendMode ? (
              <>
                <Edit3 className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <span className="text-amber-700 dark:text-amber-400">
                  Editing notes only — date, patient, and encounter details are locked. Originally signed by {encounter.signedBy.name} on{" "}
                  {format(new Date(encounter.signedAt), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                <span className="text-emerald-700 dark:text-emerald-400">
                  Signed by {encounter.signedBy.name} on{" "}
                  {format(new Date(encounter.signedAt), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
