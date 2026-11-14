"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pill,
  Phone,
  Mail,
  Activity,
  ClipboardList,
  TestTube,
  Truck,
  MessageSquare,
  ChevronDown,
  TrendingUp,
  HeartPulse,
  CreditCard,
  Star,
  CheckCircle2,
  LogOut,
  Loader2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  jamieRiveraLabData,
  jamieRiveraHistoricalLabs,
} from "@/lib/mock-data/lab-data";
import { format, isValid } from "date-fns";
import {
  scoreLabPanel,
  calculateOverallScore,
  type PatientContext,
} from "@/lib/lab-scoring";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { HealthChat } from "@/components/chat/health-chat";
import { BiomarkerTrends } from "@/components/labs/biomarker-trends";
import { PatientMessages } from "@/components/messaging/patient-messages";
import {
  SymptomEntryDialog,
  SymptomTrends,
  SymptomsSummary,
  defaultSymptomTypes,
  type SymptomEntry,
} from "@/components/symptoms/symptom-tracker";

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

type PortalPatient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dateOfBirth: string | null;
  portalMustChangePassword: boolean;
  clinic: { id: string; name: string; slug: string } | null;
};

// Demo-only mock data — rendered only for the seeded demo patient.
const mockProtocol = {
  name: "Longevity Optimization Protocol",
  description: "Comprehensive peptide therapy for anti-aging and performance",
  medications: [
    { name: "Sermorelin", dosage: "300mcg", frequency: "Nightly before bed", route: "Subcutaneous" },
    { name: "BPC-157", dosage: "250mcg", frequency: "Twice daily", route: "Subcutaneous" },
    { name: "NAD+ Nasal Spray", dosage: "100mg", frequency: "Daily", route: "Intranasal" },
  ],
  startDate: new Date("2025-08-01"),
  nextLabDate: new Date("2026-02-01"),
  notes: "Continue current protocol. Excellent IGF-1 response. Retest in 3 months.",
};

const nextShipment = {
  date: new Date("2025-12-15"),
  items: [
    { name: "Sermorelin 9mg vial", quantity: 1 },
    { name: "BPC-157 5mg vial", quantity: 2 },
    { name: "Bacteriostatic Water", quantity: 2 },
    { name: "Insulin Syringes (30-pack)", quantity: 1 },
  ],
  status: "Processing",
};

const DEMO_PATIENT_EMAIL = "demo.patient@example.com";

export default function PatientPortalDashboard() {
  const router = useRouter();
  const [patient, setPatient] = useState<PortalPatient | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fullReportOpen, setFullReportOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [selectedTrendMarker, setSelectedTrendMarker] = useState<string | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);
  const [symptomEntryOpen, setSymptomEntryOpen] = useState(false);
  const [symptomTrendsOpen, setSymptomTrendsOpen] = useState(false);
  const [selectedSymptomId, setSelectedSymptomId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
    (async () => {
      try {
        const res = await fetch("/api/portal/me", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/p/login");
          return;
        }
        if (!res.ok) {
          setLoadError("Could not load your portal. Please try again.");
          return;
        }
        const data = await res.json();
        setPatient(data.patient);
      } catch {
        setLoadError("Could not load your portal. Please try again.");
      }
    })();
  }, [router]);

  const isDemo = patient?.email?.toLowerCase() === DEMO_PATIENT_EMAIL;
  const labData = isDemo ? jamieRiveraLabData : null;

  const handleLogout = async () => {
    await fetch("/api/portal/logout", { method: "POST" });
    router.push("/p/login");
    router.refresh();
  };

  const [currentTime] = useState(() => Date.now());

  const patientContext: PatientContext = useMemo(() => {
    if (patient?.dateOfBirth) {
      const dob = new Date(patient.dateOfBirth);
      if (isValid(dob)) {
        return {
          age: Math.floor((currentTime - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
          sex: "male" as const,
        };
      }
    }
    return { age: 34, sex: "male" as const };
  }, [patient?.dateOfBirth, currentTime]);

  const scoredMarkers = useMemo(() => {
    if (!labData) return [];
    return scoreLabPanel(
      labData.markers.map((m) => ({ name: m.name, value: m.value, unit: m.unit })),
      patientContext,
    );
  }, [labData, patientContext]);

  const overallScore = useMemo(() => {
    return scoredMarkers.length > 0 ? calculateOverallScore(scoredMarkers) : null;
  }, [scoredMarkers]);

  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>(() => {
    const mockEntries: SymptomEntry[] = [];
    const symptoms = ["anxiety", "fatigue", "energy", "sleep-quality", "mood"];
    const now = new Date();
    symptoms.forEach((symptomId) => {
      const symptomType = defaultSymptomTypes.find((s) => s.id === symptomId);
      if (!symptomType) return;
      for (let i = 12; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        let baseScore = 50;
        const improvement = Math.min(i * 3, 25);
        const randomVariation = Math.floor(Math.random() * 15) - 7;
        if (symptomId === "anxiety" || symptomId === "fatigue") {
          baseScore = Math.max(15, 70 - improvement + randomVariation);
        } else {
          baseScore = Math.min(90, 45 + improvement + randomVariation);
        }
        mockEntries.push({
          id: `${symptomId}-${i}`,
          score: baseScore,
          notes: i === 0 ? "Feeling better this week!" : undefined,
          recordedAt: date,
          source: "SUBJECTIVE",
          symptomTypeId: symptomId,
          symptomType,
        });
      }
    });
    return mockEntries;
  });

  const openTrendsForMarker = (markerName: string) => {
    setSelectedTrendMarker(markerName);
    setTrendsOpen(true);
  };
  const openSymptomTrends = (symptomId: string) => {
    setSelectedSymptomId(symptomId);
    setSymptomTrendsOpen(true);
  };
  const handleSymptomSubmit = (entries: { symptomTypeId: string; score: number; notes?: string }[]) => {
    const newEntries: SymptomEntry[] = entries.map((entry, idx) => {
      const symptomType = defaultSymptomTypes.find((s) => s.id === entry.symptomTypeId);
      return {
        id: `new-${Date.now()}-${idx}`,
        score: entry.score,
        notes: entry.notes,
        recordedAt: new Date(),
        source: "SUBJECTIVE" as const,
        symptomTypeId: entry.symptomTypeId,
        symptomType: symptomType!,
      };
    });
    setSymptomEntries((prev) => [...prev, ...newEntries]);
  };

  const getTrendData = (markerName: string) => {
    return jamieRiveraHistoricalLabs.map((lab) => ({
      date: safeFormat(lab.date, "MMM"),
      value: lab.markers[markerName] || 0,
    }));
  };

  const keyMarkerNames = ["IGF-1", "Testosterone, Total", "Hemoglobin A1c", "Vitamin D, 25-OH", "hs-CRP", "TSH", "LDL Cholesterol"];
  const keyMarkers = scoredMarkers.filter((m) => keyMarkerNames.includes(m.name));

  if (loadError) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-muted-foreground">{loadError}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const clinicName = patient.clinic?.name || "Your clinic";

  return (
    <div className="min-h-[100svh] bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                    <Pill className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold">Kaizara</h1>
                    <p className="text-xs text-muted-foreground">Patient Portal</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{patient.firstName} {patient.lastName}</p>
                    <p className="text-xs text-muted-foreground">{clinicName}</p>
                  </div>
                  <Button onClick={handleLogout} variant="ghost" size="sm" title="Sign out">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-2">Welcome back, {patient.firstName}!</h2>
              <p className="text-muted-foreground">
                Your health dashboard is updated with your latest results.
              </p>
              {labData && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Badge variant="default" className="bg-emerald text-emerald-foreground">
                    New Labs Available
                  </Badge>
                  <span className="text-muted-foreground">
                    Results from {safeFormat(labData.collectedAt, "MMMM d, yyyy")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="labs" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="labs" className="text-xs sm:text-sm px-1 sm:px-3">
                <TestTube className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Labs</span>
              </TabsTrigger>
              <TabsTrigger value="symptoms" className="text-xs sm:text-sm px-1 sm:px-3">
                <HeartPulse className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Symptoms</span>
              </TabsTrigger>
              <TabsTrigger value="protocol" className="text-xs sm:text-sm px-1 sm:px-3">
                <ClipboardList className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Protocol</span>
              </TabsTrigger>
              <TabsTrigger value="membership" className="text-xs sm:text-sm px-1 sm:px-3">
                <CreditCard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Plan</span>
              </TabsTrigger>
              <TabsTrigger value="shipments" className="text-xs sm:text-sm px-1 sm:px-3">
                <Truck className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ship</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-xs sm:text-sm px-1 sm:px-3">
                <MessageSquare className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Msgs</span>
              </TabsTrigger>
            </TabsList>

            {/* Labs */}
            <TabsContent value="labs" className="space-y-4">
              {labData ? (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Your Results Summary</CardTitle>
                      </div>
                      <CardDescription>
                        {safeFormat(labData.collectedAt, "MMMM d, yyyy")} | {labData.labProvider}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
                        {overallScore && (
                          <p className={`font-medium ${overallScore.color} mb-2`}>
                            Overall Score: {overallScore.score} ({overallScore.label})
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          Your comprehensive panel shows room for optimization. IGF-1 at 242 ng/mL shows excellent response to your Sermorelin protocol.
                          Testosterone at 504 ng/dL is suboptimal for your age - consider sleep optimization, strength training, zinc, and vitamin D.
                          LDL cholesterol at 149 mg/dL is elevated - discuss statin therapy or lifestyle modifications with your provider.
                          Great news: Your HbA1c (5.4%), hs-CRP (0.4 mg/L), and Vitamin D (56 ng/mL) are all in optimal ranges.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Key Biomarkers</CardTitle>
                          <CardDescription>Your most important health indicators</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="sm" onClick={() => setTrendsOpen(true)}>
                            <TrendingUp className="h-4 w-4 mr-1" />
                            View Trends
                          </Button>
                          {overallScore && (
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${overallScore.color}`}>{overallScore.score}</div>
                              <div className="text-xs text-muted-foreground">Overall Score</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {keyMarkers.map((marker) => {
                          const trendData = getTrendData(marker.name);
                          return (
                            <div
                              key={marker.name}
                              className="rounded-lg border p-4 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all"
                              onClick={() => openTrendsForMarker(marker.name)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 w-2 rounded-full ${marker.bgColor}`} />
                                  <span className="font-medium text-sm">{marker.name}</span>
                                </div>
                                <Badge variant="outline" className={`${marker.color} border-current`}>
                                  {marker.score} {marker.label}
                                </Badge>
                              </div>
                              <div className="flex items-baseline gap-2 mb-3">
                                <span className={`text-2xl font-bold ${marker.color}`}>{marker.value}</span>
                                <span className="text-sm text-muted-foreground">{marker.unit}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                Optimal: {marker.optimalRange.optimal_low}-{marker.optimalRange.optimal_high} {marker.unit}
                              </div>
                              <div className="h-[60px] w-full">
                                {isMounted ? (
                                  <ResponsiveContainer width="100%" height={60}>
                                    <LineChart data={trendData}>
                                      <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: "#3b82f6", r: 3 }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-full w-full bg-muted/30 rounded animate-pulse" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Collapsible open={fullReportOpen} onOpenChange={setFullReportOpen}>
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">Full Lab Report</CardTitle>
                              <CardDescription>
                                {scoredMarkers.length} markers analyzed • {safeFormat(labData.collectedAt, "MMMM d, yyyy")}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {fullReportOpen ? "Hide" : "Show all"}
                              </span>
                              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${fullReportOpen ? "rotate-180" : ""}`} />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-6">
                            {Array.from(new Set(labData.markers.map((m) => m.category))).map((category) => {
                              const categoryMarkers = scoredMarkers.filter((sm) => {
                                const original = labData.markers.find((m) => m.name === sm.name);
                                return original?.category === category;
                              });
                              return (
                                <div key={category}>
                                  <h4 className="font-semibold text-sm mb-4 text-primary">{category}</h4>
                                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {categoryMarkers.map((marker) => (
                                      <div
                                        key={marker.name}
                                        className="rounded-lg border p-4 space-y-2 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all"
                                        onClick={() => openTrendsForMarker(marker.name)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${marker.bgColor}`} />
                                            <span className="font-medium text-sm">{marker.name}</span>
                                          </div>
                                          <Badge variant="outline" className={`${marker.color} border-current text-xs`}>
                                            {marker.score}
                                          </Badge>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                          <span className={`text-2xl font-bold ${marker.color}`}>{marker.value}</span>
                                          <span className="text-sm text-muted-foreground">{marker.unit}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          Optimal: {marker.optimalRange.optimal_low}-{marker.optimalRange.optimal_high} {marker.unit}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No lab results yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your results will appear here after your next blood draw.
                    </p>
                  </CardContent>
                </Card>
              )}

              <BiomarkerTrends
                isOpen={trendsOpen}
                onClose={() => {
                  setTrendsOpen(false);
                  setSelectedTrendMarker(undefined);
                }}
                patientContext={patientContext}
                historicalData={jamieRiveraHistoricalLabs}
                currentMarkers={scoredMarkers}
                patientName={`${patient.firstName} ${patient.lastName}`}
                isPatientView={true}
                initialSelectedMarker={selectedTrendMarker}
              />
            </TabsContent>

            {/* Symptoms */}
            <TabsContent value="symptoms" className="space-y-4">
              <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <HeartPulse className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Track How You Feel</h3>
                      <p className="text-sm text-muted-foreground">
                        Log your symptoms to help your care team monitor your progress
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <SymptomsSummary
                symptomTypes={defaultSymptomTypes}
                entries={isDemo ? symptomEntries : []}
                onAddEntry={() => setSymptomEntryOpen(true)}
                onViewTrends={openSymptomTrends}
                isPatientView={true}
              />

              <SymptomEntryDialog
                isOpen={symptomEntryOpen}
                onClose={() => setSymptomEntryOpen(false)}
                symptomTypes={defaultSymptomTypes}
                onSubmit={handleSymptomSubmit}
                patientName={`${patient.firstName} ${patient.lastName}`}
                isPatientView={true}
              />

              <SymptomTrends
                isOpen={symptomTrendsOpen}
                onClose={() => {
                  setSymptomTrendsOpen(false);
                  setSelectedSymptomId(undefined);
                }}
                symptomTypes={defaultSymptomTypes}
                entries={isDemo ? symptomEntries : []}
                patientName={`${patient.firstName} ${patient.lastName}`}
                isPatientView={true}
                initialSelectedSymptom={selectedSymptomId}
              />
            </TabsContent>

            {/* Protocol */}
            <TabsContent value="protocol" className="space-y-4">
              {isDemo ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{mockProtocol.name}</CardTitle>
                    </div>
                    <CardDescription>{mockProtocol.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {mockProtocol.medications.map((med, i) => (
                        <div key={i} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{med.name}</span>
                            <Badge variant="secondary">{med.route}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Dosage:</span>{" "}
                              <span className="font-medium">{med.dosage}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Frequency:</span>{" "}
                              <span className="font-medium">{med.frequency}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Started</p>
                        <p className="font-medium">{safeFormat(mockProtocol.startDate, "MMMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Labs Due</p>
                        <p className="font-medium">{safeFormat(mockProtocol.nextLabDate, "MMMM d, yyyy")}</p>
                      </div>
                    </div>
                    {mockProtocol.notes && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm">
                        <p className="text-muted-foreground">Provider Notes:</p>
                        <p>{mockProtocol.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No treatment plan yet</p>
                    <p className="text-sm text-muted-foreground">
                      Your provider will share your plan here once it's ready.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Membership */}
            <TabsContent value="membership" className="space-y-4">
              {isDemo ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">Your Membership</CardTitle>
                    </div>
                    <CardDescription>Current plan and included services</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border">
                      <div>
                        <h4 className="font-semibold">Premium Longevity</h4>
                        <p className="text-sm text-muted-foreground">$599/month</p>
                      </div>
                      <Badge variant="default" className="bg-emerald-500">Active</Badge>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Included Services</h4>
                      {[
                        { name: "Monthly Lab Panel", included: 1, used: 1 },
                        { name: "Follow-up Consultations", included: 4, used: 2 },
                        { name: "IV Therapy Sessions", included: 2, used: 1 },
                        { name: "Peptide Protocol Management", included: 1, used: 1 },
                        { name: "Body Composition Analysis", included: 1, used: 0 },
                      ].map((service) => (
                        <div key={service.name} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`h-4 w-4 ${service.used >= service.included ? "text-emerald-500" : "text-muted-foreground"}`} />
                            <span className="text-sm">{service.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {service.used}/{service.included} used
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No active membership</p>
                    <p className="text-sm text-muted-foreground">Contact your clinic to enroll.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Shipments */}
            <TabsContent value="shipments" className="space-y-4">
              {isDemo ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Next Shipment</CardTitle>
                      </div>
                      <Badge>{nextShipment.status}</Badge>
                    </div>
                    <CardDescription>
                      Expected: {safeFormat(nextShipment.date, "MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {nextShipment.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm">{item.name}</span>
                          <span className="text-sm font-medium">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No shipments yet</p>
                    <p className="text-sm text-muted-foreground">You'll see upcoming shipments here.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Messages */}
            <TabsContent value="messages" className="h-[500px] sm:h-[600px]">
              <Card className="h-full overflow-hidden flex flex-col">
                <PatientMessages
                  patientName={`${patient.firstName} ${patient.lastName}`}
                  doctorName="Your Care Team"
                  doctorTitle=""
                />
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Need help?</p>
                  <p className="text-sm text-muted-foreground">Contact your care team</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    (305) 555-0199
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    care@demo-clinic.example
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="text-center text-xs text-muted-foreground py-4">
            <p>Powered by Kaizara | {clinicName}</p>
          </div>
        </div>
      </main>

      <HealthChat
        patientId={patient.id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        patientAge={patientContext.age}
        patientSex={patientContext.sex}
        labMarkers={scoredMarkers.map((m) => ({
          name: m.name,
          value: m.value,
          unit: m.unit,
          score: m.score,
          label: m.label,
          interpretation: m.interpretation,
        }))}
      />
    </div>
  );
}
