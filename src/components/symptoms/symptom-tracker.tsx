"use client";

import { useState, useMemo, useEffect, Component, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Brain,
  Heart,
  Moon,
  Zap,
  Frown,
  Meh,
  Smile,
  Plus,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { format, isValid } from "date-fns";

// Error boundary for chart rendering
class ChartErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

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

// Symptom type definition
export interface SymptomType {
  id: string;
  name: string;
  description?: string;
  category?: string; // ROS system category
  icon?: string;
}

// Symptom entry definition
export interface SymptomEntry {
  id: string;
  score: number;
  notes?: string;
  recordedAt: Date;
  source: "SUBJECTIVE" | "OBJECTIVE";
  symptomTypeId: string;
  symptomType: SymptomType;
}

// ROS system order for display
export const rosSystemOrder = [
  "Constitutional",
  "Psychiatric",
  "Neurologic",
  "Musculoskeletal",
  "Skin",
  "Cardiovascular",
  "Respiratory",
  "GI",
  "Endocrine",
  "Lifestyle",
];

// Default symptom types grouped by ROS system
export const defaultSymptomTypes: SymptomType[] = [
  // Constitutional
  { id: "fatigue", name: "Fatigue", description: "Persistent tiredness or exhaustion", category: "Constitutional", icon: "Zap" },
  { id: "energy", name: "Energy Level", description: "Overall vitality and ability to engage in activities", category: "Constitutional", icon: "Zap" },
  { id: "sleep-quality", name: "Sleep Quality", description: "How well and restfully you slept", category: "Constitutional", icon: "Moon" },

  // Psychiatric
  { id: "anxiety", name: "Anxiety", description: "General feelings of worry, nervousness, or unease", category: "Psychiatric", icon: "Brain" },
  { id: "mood", name: "Mood", description: "General emotional state and outlook", category: "Psychiatric", icon: "Heart" },
  { id: "stress", name: "Stress Level", description: "Perceived mental and emotional pressure", category: "Psychiatric", icon: "Brain" },
  { id: "libido", name: "Libido", description: "Sexual desire and interest", category: "Psychiatric", icon: "Heart" },

  // Neurologic
  { id: "focus", name: "Focus & Concentration", description: "Ability to concentrate and maintain attention", category: "Neurologic", icon: "Brain" },
  { id: "headache", name: "Headache", description: "Head pain or pressure", category: "Neurologic", icon: "Brain" },
  { id: "brain-fog", name: "Brain Fog", description: "Difficulty thinking clearly or concentrating", category: "Neurologic", icon: "Brain" },

  // Musculoskeletal - specific pain types
  { id: "shoulder-pain", name: "Shoulder Pain", description: "Pain or discomfort in shoulder area", category: "Musculoskeletal", icon: "Activity" },
  { id: "knee-pain", name: "Knee Pain", description: "Pain or discomfort in knee area", category: "Musculoskeletal", icon: "Activity" },
  { id: "back-pain", name: "Back Pain", description: "Pain in upper or lower back", category: "Musculoskeletal", icon: "Activity" },
  { id: "joint-pain", name: "Overall Joint Pain", description: "General joint discomfort or stiffness", category: "Musculoskeletal", icon: "Activity" },
  { id: "neck-pain", name: "Neck Pain", description: "Pain or stiffness in neck area", category: "Musculoskeletal", icon: "Activity" },
  { id: "muscle-soreness", name: "Muscle Soreness", description: "General muscle aches or soreness", category: "Musculoskeletal", icon: "Activity" },

  // Skin
  { id: "eczema", name: "Eczema", description: "Skin irritation, redness, or flare-ups", category: "Skin", icon: "Activity" },
  { id: "acne", name: "Acne", description: "Breakouts or skin blemishes", category: "Skin", icon: "Activity" },
  { id: "skin-dryness", name: "Skin Dryness", description: "Dry or flaky skin", category: "Skin", icon: "Activity" },

  // Cardiovascular
  { id: "heart-palpitations", name: "Heart Palpitations", description: "Noticeable or irregular heartbeat", category: "Cardiovascular", icon: "Heart" },

  // Respiratory
  { id: "shortness-of-breath", name: "Shortness of Breath", description: "Difficulty breathing or feeling winded", category: "Respiratory", icon: "Activity" },

  // GI
  { id: "bloating", name: "Bloating", description: "Abdominal fullness or distension", category: "GI", icon: "Activity" },
  { id: "nausea", name: "Nausea", description: "Feeling of sickness or upset stomach", category: "GI", icon: "Activity" },
  { id: "appetite", name: "Appetite", description: "Hunger and desire to eat", category: "GI", icon: "Activity" },

  // Endocrine
  { id: "hot-flashes", name: "Hot Flashes", description: "Sudden feelings of warmth", category: "Endocrine", icon: "Zap" },
  { id: "night-sweats", name: "Night Sweats", description: "Excessive sweating during sleep", category: "Endocrine", icon: "Moon" },

  // Lifestyle
  { id: "nutrition", name: "Nutrition Adherence", description: "How well you followed your nutrition plan today", category: "Lifestyle", icon: "Activity" },
  { id: "hydration", name: "Hydration", description: "Daily water and fluid intake", category: "Lifestyle", icon: "Activity" },
];

// Get score color based on value (0-100)
// For most symptoms, lower is better (anxiety, pain, stress, fatigue)
// For some, higher is better (mood, energy, sleep quality, focus, libido)
function getScoreColor(score: number, higherIsBetter: boolean = false): string {
  if (higherIsBetter) {
    if (score >= 75) return "text-emerald-500";
    if (score >= 50) return "text-yellow-500";
    if (score >= 25) return "text-orange-500";
    return "text-red-500";
  } else {
    if (score <= 25) return "text-emerald-500";
    if (score <= 50) return "text-yellow-500";
    if (score <= 75) return "text-orange-500";
    return "text-red-500";
  }
}

function getScoreBgColor(score: number, higherIsBetter: boolean = false): string {
  if (higherIsBetter) {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-yellow-500";
    if (score >= 25) return "bg-orange-500";
    return "bg-red-500";
  } else {
    if (score <= 25) return "bg-emerald-500";
    if (score <= 50) return "bg-yellow-500";
    if (score <= 75) return "bg-orange-500";
    return "bg-red-500";
  }
}

function getScoreLabel(score: number, higherIsBetter: boolean = false): string {
  if (higherIsBetter) {
    if (score >= 75) return "Excellent";
    if (score >= 50) return "Good";
    if (score >= 25) return "Fair";
    return "Poor";
  } else {
    if (score <= 25) return "Minimal";
    if (score <= 50) return "Moderate";
    if (score <= 75) return "Significant";
    return "Severe";
  }
}

// Symptoms where higher is better
const higherIsBetterSymptoms = ["Mood", "Sleep Quality", "Energy Level", "Focus & Concentration", "Libido", "Nutrition Adherence", "Hydration", "Appetite"];

function isHigherBetter(symptomName: string): boolean {
  return higherIsBetterSymptoms.includes(symptomName);
}

// Get icon component for symptom
function getSymptomIcon(iconName?: string) {
  switch (iconName) {
    case "Brain": return Brain;
    case "Heart": return Heart;
    case "Moon": return Moon;
    case "Zap": return Zap;
    case "Activity": return Activity;
    default: return Activity;
  }
}

// Calculate trend
function calculateTrend(data: { date: string; score: number }[]): {
  direction: "up" | "down" | "stable";
  percentChange: number;
} {
  if (data.length < 2) return { direction: "stable", percentChange: 0 };

  const oldest = data[0].score;
  const newest = data[data.length - 1].score;
  const percentChange = ((newest - oldest) / Math.max(oldest, 1)) * 100;

  if (Math.abs(percentChange) < 5) return { direction: "stable", percentChange: 0 };
  return {
    direction: percentChange > 0 ? "up" : "down",
    percentChange: Math.abs(percentChange),
  };
}

// Props for symptom entry dialog
interface SymptomEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  symptomTypes: SymptomType[];
  onSubmit: (entries: { symptomTypeId: string; score: number; notes?: string }[]) => void;
  patientName?: string;
  isPatientView?: boolean;
}

// Symptom entry dialog for recording new entries
export function SymptomEntryDialog({
  isOpen,
  onClose,
  symptomTypes,
  onSubmit,
  patientName,
  isPatientView = false,
}: SymptomEntryDialogProps) {
  const [entries, setEntries] = useState<Record<string, { score: number; notes: string }>>({});
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [step, setStep] = useState<"select" | "score">("select");

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEntries({});
      setSelectedSymptoms([]);
      setStep("select");
    }
  }, [isOpen]);

  const handleSymptomToggle = (symptomId: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleScoreChange = (symptomId: string, score: number) => {
    setEntries(prev => ({
      ...prev,
      [symptomId]: { ...prev[symptomId], score, notes: prev[symptomId]?.notes || "" }
    }));
  };

  const handleNotesChange = (symptomId: string, notes: string) => {
    setEntries(prev => ({
      ...prev,
      [symptomId]: { ...prev[symptomId], score: prev[symptomId]?.score ?? 50, notes }
    }));
  };

  const handleSubmit = () => {
    const submissionEntries = selectedSymptoms.map(symptomId => ({
      symptomTypeId: symptomId,
      score: entries[symptomId]?.score ?? 50,
      notes: entries[symptomId]?.notes || undefined,
    }));
    onSubmit(submissionEntries);
    onClose();
  };

  const selectedSymptomTypes = symptomTypes.filter(s => selectedSymptoms.includes(s.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-2xl h-[85vh] max-h-[700px] flex flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {step === "select" ? "Track Symptoms" : "Rate Your Symptoms"}
          </DialogTitle>
          <DialogDescription>
            {step === "select"
              ? `${isPatientView ? "Select" : `Select for ${patientName || "patient"}`} the symptoms to track today`
              : "Rate each symptom on a scale of 0-100"
            }
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <ScrollArea className="flex-1 min-h-0 px-6">
            <div className="space-y-5 pb-4">
              {rosSystemOrder
                .filter(system => symptomTypes.some(s => s.category === system))
                .map((system) => (
                  <div key={system}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{system}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {symptomTypes
                        .filter(s => s.category === system)
                        .map((symptom) => {
                          const Icon = getSymptomIcon(symptom.icon);
                          const isSelected = selectedSymptoms.includes(symptom.id);

                          return (
                            <button
                              key={symptom.id}
                              onClick={() => handleSymptomToggle(symptom.id)}
                              className={`p-3 rounded-lg border text-left transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
                                  isSelected ? "bg-primary/20" : "bg-muted"
                                }`}>
                                  <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                </div>
                                <p className="font-medium text-sm flex-1">{symptom.name}</p>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="flex-1 min-h-0 px-6">
            <div className="space-y-6 pb-4">
              {selectedSymptomTypes.map((symptom) => {
                const Icon = getSymptomIcon(symptom.icon);
                const score = entries[symptom.id]?.score ?? 50;
                const higherIsBetter = isHigherBetter(symptom.name);
                const scoreColor = getScoreColor(score, higherIsBetter);
                const scoreLabel = getScoreLabel(score, higherIsBetter);

                return (
                  <Card key={symptom.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{symptom.name}</CardTitle>
                            {symptom.description && (
                              <CardDescription className="text-xs">{symptom.description}</CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${scoreColor}`}>{score}</p>
                          <p className="text-xs text-muted-foreground">{scoreLabel}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{higherIsBetter ? "Poor" : "Minimal"}</span>
                          <span>{higherIsBetter ? "Excellent" : "Severe"}</span>
                        </div>
                        <Slider
                          value={[score]}
                          onValueChange={([value]) => handleScoreChange(symptom.id, value)}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between">
                          {[0, 25, 50, 75, 100].map((mark) => (
                            <button
                              key={mark}
                              onClick={() => handleScoreChange(symptom.id, mark)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {mark}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        placeholder="Add notes (optional)..."
                        value={entries[symptom.id]?.notes || ""}
                        onChange={(e) => handleNotesChange(symptom.id, e.target.value)}
                        className="resize-none"
                        rows={2}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="shrink-0 p-6 pt-4 border-t">
          {step === "select" ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep("score")}
                disabled={selectedSymptoms.length === 0}
              >
                Continue ({selectedSymptoms.length} selected)
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={handleSubmit}>
                Save Entries
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Custom tooltip for symptom chart
function SymptomChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium mb-1 text-white">{label}</p>
      <p className="text-lg font-bold text-primary">{payload[0].value}</p>
    </div>
  );
}

// Props for symptom trends dialog
interface SymptomTrendsProps {
  isOpen: boolean;
  onClose: () => void;
  symptomTypes: SymptomType[];
  entries: SymptomEntry[];
  patientName?: string;
  isPatientView?: boolean;
  initialSelectedSymptom?: string;
}

// Symptom trends dialog for viewing history
export function SymptomTrends({
  isOpen,
  onClose,
  symptomTypes,
  entries,
  patientName,
  isPatientView = false,
  initialSelectedSymptom,
}: SymptomTrendsProps) {
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(initialSelectedSymptom || null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (initialSelectedSymptom && isOpen) {
      setSelectedSymptom(initialSelectedSymptom);
    }
  }, [initialSelectedSymptom, isOpen]);

  // Get entries grouped by symptom type
  const entriesBySymptom = useMemo(() => {
    const grouped: Record<string, SymptomEntry[]> = {};
    entries.forEach(entry => {
      if (!grouped[entry.symptomTypeId]) {
        grouped[entry.symptomTypeId] = [];
      }
      grouped[entry.symptomTypeId].push(entry);
    });
    // Sort entries by date
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    });
    return grouped;
  }, [entries]);

  // Get symptom types with entries
  const symptomsWithData = useMemo(() => {
    return symptomTypes.filter(s => entriesBySymptom[s.id]?.length > 0);
  }, [symptomTypes, entriesBySymptom]);

  // Get selected symptom details
  const selectedSymptomType = useMemo(() => {
    return symptomTypes.find(s => s.id === selectedSymptom);
  }, [selectedSymptom, symptomTypes]);

  // Get chart data for selected symptom
  const chartData = useMemo(() => {
    if (!selectedSymptom || !entriesBySymptom[selectedSymptom]) return [];
    return entriesBySymptom[selectedSymptom].map(entry => ({
      date: safeFormat(entry.recordedAt, "MMM d"),
      score: entry.score,
      notes: entry.notes,
    }));
  }, [selectedSymptom, entriesBySymptom]);

  // Get latest entry for selected symptom
  const latestEntry = useMemo(() => {
    if (!selectedSymptom || !entriesBySymptom[selectedSymptom]) return null;
    const symptomEntries = entriesBySymptom[selectedSymptom];
    return symptomEntries[symptomEntries.length - 1];
  }, [selectedSymptom, entriesBySymptom]);

  if (!isMounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[90vh] md:max-h-[90vh] h-[95dvh] md:h-auto p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isPatientView ? "Your Symptom Trends" : "Symptom Tracking"}
              </DialogTitle>
              <DialogDescription>
                {patientName ? `${patientName} • ` : ""}
                Track changes in symptoms over time
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Mobile selector */}
        <div className="md:hidden px-4 py-3 border-b shrink-0">
          <Select
            value={selectedSymptom || ""}
            onValueChange={setSelectedSymptom}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a symptom" />
            </SelectTrigger>
            <SelectContent>
              {symptomsWithData.map((symptom) => {
                const latestScore = entriesBySymptom[symptom.id]?.[entriesBySymptom[symptom.id].length - 1]?.score ?? 0;
                const higherIsBetter = isHigherBetter(symptom.name);
                const scoreColor = getScoreColor(latestScore, higherIsBetter);

                return (
                  <SelectItem key={symptom.id} value={symptom.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{symptom.name}</span>
                      <span className={`font-bold ${scoreColor}`}>{latestScore}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden md:block w-64 border-r shrink-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Tracked Symptoms ({symptomsWithData.length})
                </p>
                {symptomsWithData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No symptom data recorded yet.</p>
                ) : (
                  symptomsWithData.map((symptom) => {
                    const Icon = getSymptomIcon(symptom.icon);
                    const symptomEntries = entriesBySymptom[symptom.id] || [];
                    const latestScore = symptomEntries[symptomEntries.length - 1]?.score ?? 0;
                    const higherIsBetter = isHigherBetter(symptom.name);
                    const scoreColor = getScoreColor(latestScore, higherIsBetter);
                    const trend = calculateTrend(symptomEntries.map(e => ({
                      date: safeFormat(e.recordedAt, "MMM d"),
                      score: e.score
                    })));
                    const isSelected = selectedSymptom === symptom.id;

                    // For trend, if higher is better, up is good. If lower is better, down is good.
                    const trendIsGood = higherIsBetter
                      ? trend.direction === "up"
                      : trend.direction === "down";

                    return (
                      <button
                        key={symptom.id}
                        onClick={() => setSelectedSymptom(symptom.id)}
                        className={`w-full text-left rounded-lg border p-3 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{symptom.name}</span>
                          </div>
                          {trend.direction !== "stable" && (
                            trend.direction === "up" ? (
                              <TrendingUp className={`h-4 w-4 ${trendIsGood ? "text-emerald-500" : "text-red-500"}`} />
                            ) : (
                              <TrendingDown className={`h-4 w-4 ${trendIsGood ? "text-emerald-500" : "text-red-500"}`} />
                            )
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-lg font-bold ${scoreColor}`}>{latestScore}</span>
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {symptomEntries.length} entries
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <ScrollArea className="h-full w-full">
              {selectedSymptom && selectedSymptomType && latestEntry ? (
                <div className="p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedSymptomType.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{selectedSymptomType.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${getScoreColor(latestEntry.score, isHigherBetter(selectedSymptomType.name))}`}>
                        {latestEntry.score}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getScoreLabel(latestEntry.score, isHigherBetter(selectedSymptomType.name))}
                      </p>
                    </div>
                  </div>

                  {/* Score interpretation */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getScoreBgColor(latestEntry.score, isHigherBetter(selectedSymptomType.name))}`}>
                          {latestEntry.score >= 75 ? (
                            isHigherBetter(selectedSymptomType.name) ? <Smile className="h-5 w-5 text-white" /> : <Frown className="h-5 w-5 text-white" />
                          ) : latestEntry.score >= 50 ? (
                            <Meh className="h-5 w-5 text-white" />
                          ) : latestEntry.score >= 25 ? (
                            <Meh className="h-5 w-5 text-white" />
                          ) : (
                            isHigherBetter(selectedSymptomType.name) ? <Frown className="h-5 w-5 text-white" /> : <Smile className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {isHigherBetter(selectedSymptomType.name)
                              ? latestEntry.score >= 75 ? "Great job! Keep it up." : latestEntry.score >= 50 ? "Room for improvement." : "Let's work on this."
                              : latestEntry.score <= 25 ? "Well managed!" : latestEntry.score <= 50 ? "Moderate levels." : "This needs attention."
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Last recorded {safeFormat(latestEntry.recordedAt, "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trend chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Trend Over Time</CardTitle>
                      <CardDescription>
                        {chartData.length} recorded entries
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {chartData.length < 2 ? (
                        <div className="h-[200px] flex flex-col items-center justify-center text-center">
                          <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                          <p className="font-medium text-muted-foreground">Not Enough Data</p>
                          <p className="text-sm text-muted-foreground/70 max-w-md mt-1">
                            Record at least 2 entries to see trends over time.
                          </p>
                        </div>
                      ) : (
                        <ChartErrorBoundary fallback={<div className="h-[250px] flex items-center justify-center">Unable to render chart</div>}>
                          <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                  <linearGradient id="symptomScoreGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />
                                <XAxis
                                  dataKey="date"
                                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                                  axisLine={{ stroke: "#475569" }}
                                  tickLine={{ stroke: "#475569" }}
                                />
                                <YAxis
                                  domain={[0, 100]}
                                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                                  axisLine={{ stroke: "#475569" }}
                                  tickLine={{ stroke: "#475569" }}
                                  width={35}
                                />
                                <Tooltip content={<SymptomChartTooltip />} />
                                <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="5 5" strokeOpacity={0.5} />
                                <Area
                                  type="monotone"
                                  dataKey="score"
                                  stroke="#3b82f6"
                                  fill="url(#symptomScoreGradient)"
                                  strokeWidth={2.5}
                                  dot={false}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="score"
                                  stroke="#3b82f6"
                                  strokeWidth={2.5}
                                  dot={{ fill: "#3b82f6", r: 4, strokeWidth: 2, stroke: "#1e293b" }}
                                  activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </ChartErrorBoundary>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent entries */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[...entriesBySymptom[selectedSymptom]].reverse().slice(0, 5).map((entry, idx) => {
                          const higherIsBetter = isHigherBetter(selectedSymptomType.name);
                          const scoreColor = getScoreColor(entry.score, higherIsBetter);

                          return (
                            <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                              <div>
                                <p className="text-sm font-medium">
                                  {safeFormat(entry.recordedAt, "MMMM d, yyyy")}
                                </p>
                                {entry.notes && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{entry.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${scoreColor}`}>{entry.score}</span>
                                <Badge variant="outline" className="text-xs">
                                  {entry.source === "SUBJECTIVE" ? "Self-reported" : "Clinical"}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">
                    {symptomsWithData.length === 0 ? "No Symptoms Tracked" : "Select a Symptom"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    {symptomsWithData.length === 0
                      ? "Start tracking symptoms to see trends and changes over time."
                      : "Choose a symptom from the list to view detailed trends and history."
                    }
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact symptom card for dashboard display
interface SymptomCardProps {
  symptom: SymptomType;
  entries: SymptomEntry[];
  onViewTrends: () => void;
  isMostFrequent?: boolean;
}

export function SymptomCard({ symptom, entries, onViewTrends, isMostFrequent = false }: SymptomCardProps) {
  const Icon = getSymptomIcon(symptom.icon);
  const latestEntry = entries[entries.length - 1];
  const higherIsBetter = isHigherBetter(symptom.name);

  if (!latestEntry) return null;

  const scoreColor = getScoreColor(latestEntry.score, higherIsBetter);
  const scoreBgColor = getScoreBgColor(latestEntry.score, higherIsBetter);
  const scoreLabel = getScoreLabel(latestEntry.score, higherIsBetter);

  const trend = calculateTrend(entries.map(e => ({
    date: safeFormat(e.recordedAt, "MMM d"),
    score: e.score
  })));

  const trendIsGood = higherIsBetter
    ? trend.direction === "up"
    : trend.direction === "down";

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onViewTrends}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isMostFrequent ? "bg-primary/10" : "bg-muted"}`}>
              <Icon className={`h-4 w-4 ${isMostFrequent ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{symptom.name}</p>
                {isMostFrequent && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Top</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{entries.length} entries</p>
            </div>
          </div>
          {trend.direction !== "stable" && (
            <div className="flex items-center gap-1">
              {trend.direction === "up" ? (
                <TrendingUp className={`h-4 w-4 ${trendIsGood ? "text-emerald-500" : "text-red-500"}`} />
              ) : (
                <TrendingDown className={`h-4 w-4 ${trendIsGood ? "text-emerald-500" : "text-red-500"}`} />
              )}
              <span className={`text-xs ${trendIsGood ? "text-emerald-500" : "text-red-500"}`}>
                {trend.percentChange.toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className={`text-2xl font-bold ${scoreColor}`}>{latestEntry.score}</span>
            <span className="text-sm text-muted-foreground ml-1">/ 100</span>
          </div>
          <Badge className={`${scoreBgColor} text-white`}>
            {scoreLabel}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Last: {safeFormat(latestEntry.recordedAt, "MMM d")}
        </p>
      </CardContent>
    </Card>
  );
}

// Summary widget showing all tracked symptoms
interface SymptomsSummaryProps {
  symptomTypes: SymptomType[];
  entries: SymptomEntry[];
  onAddEntry: () => void;
  onViewTrends: (symptomId: string) => void;
  isPatientView?: boolean;
}

export function SymptomsSummary({
  symptomTypes,
  entries,
  onAddEntry,
  onViewTrends,
  isPatientView = false,
}: SymptomsSummaryProps) {
  const entriesBySymptom = useMemo(() => {
    const grouped: Record<string, SymptomEntry[]> = {};
    entries.forEach(entry => {
      if (!grouped[entry.symptomTypeId]) {
        grouped[entry.symptomTypeId] = [];
      }
      grouped[entry.symptomTypeId].push(entry);
    });
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    });
    return grouped;
  }, [entries]);

  // Sort by frequency: most entries first
  const symptomsWithData = useMemo(() => {
    return symptomTypes
      .filter(s => entriesBySymptom[s.id]?.length > 0)
      .sort((a, b) => (entriesBySymptom[b.id]?.length || 0) - (entriesBySymptom[a.id]?.length || 0));
  }, [symptomTypes, entriesBySymptom]);

  const maxEntries = symptomsWithData.length > 0 ? (entriesBySymptom[symptomsWithData[0]?.id]?.length || 0) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Symptom Tracking</CardTitle>
          </div>
          <Button size="sm" onClick={onAddEntry}>
            <Plus className="h-4 w-4 mr-1" />
            {isPatientView ? "Log Symptoms" : "Record Symptoms"}
          </Button>
        </div>
        <CardDescription>
          {symptomsWithData.length === 0
            ? "No symptoms tracked yet"
            : `${symptomsWithData.length} symptoms being monitored — sorted by frequency`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {symptomsWithData.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {isPatientView
                ? "Start logging your symptoms to track changes over time."
                : "Add symptom entries to begin tracking patient outcomes."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symptomsWithData.slice(0, 4).map((symptom, idx) => (
              <SymptomCard
                key={symptom.id}
                symptom={symptom}
                entries={entriesBySymptom[symptom.id]}
                onViewTrends={() => onViewTrends(symptom.id)}
                isMostFrequent={idx === 0 && maxEntries > 1}
              />
            ))}
          </div>
        )}
        {symptomsWithData.length > 4 && (
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={() => onViewTrends(symptomsWithData[0].id)}
          >
            View all {symptomsWithData.length} symptoms
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
