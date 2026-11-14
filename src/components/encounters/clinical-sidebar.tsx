"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  Pill,
  Stethoscope,
  Leaf,
  Syringe,
  ChevronDown,
  ChevronRight,
  Activity,
  Heart,
  Scale,
} from "lucide-react";
import { format } from "date-fns";

interface ClinicalData {
  allergies: Array<{
    id: string;
    allergen: string;
    reaction?: string | null;
    severity: string;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dosage?: string | null;
    frequency?: string | null;
  }>;
  diagnoses: Array<{
    id: string;
    icd10Code?: string | null;
    description: string;
    isPrimary: boolean;
  }>;
  supplements: Array<{
    id: string;
    name: string;
    dosage?: string | null;
    frequency?: string | null;
  }>;
  vitals?: Array<{
    type: string;
    value: number;
    value2?: number | null;
    unit: string;
    measuredAt: string;
  }>;
  recentInjections?: Array<{
    id: string;
    medication: string;
    dose: string;
    administeredAt: string;
  }>;
}

interface ClinicalSidebarProps {
  patientId: string;
  patientName?: string;
  data: ClinicalData;
  onAddAllergy?: () => void;
  onAddMedication?: () => void;
  onAddDiagnosis?: () => void;
  onAddSupplement?: () => void;
}

export function ClinicalSidebar({
  patientId,
  patientName,
  data,
  onAddAllergy,
  onAddMedication,
  onAddDiagnosis,
  onAddSupplement,
}: ClinicalSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    allergies: true,
    diagnoses: true,
    medications: true,
    supplements: true,
    vitals: true,
    injections: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getLatestVital = (type: string) => {
    return data.vitals?.find((v) => v.type === type);
  };

  const latestWeight = getLatestVital("WEIGHT");
  const latestBP = getLatestVital("BLOOD_PRESSURE");
  const latestHR = getLatestVital("HEART_RATE");

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {/* Patient Header */}
        {patientName && (
          <div className="px-1 pb-3 border-b border-border/30">
            <h3 className="font-semibold text-foreground">{patientName}</h3>
            <p className="text-xs text-muted-foreground">Clinical Summary</p>
          </div>
        )}

        {/* Allergies */}
        <div className="rounded-xl bg-card border border-border/40 overflow-hidden">
          <Collapsible open={openSections.allergies} onOpenChange={() => toggleSection("allergies")}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Allergies</p>
                    <p className="text-xl font-bold">{data.allergies.length}</p>
                  </div>
                </div>
                {openSections.allergies ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border/30">
                {data.allergies.length > 0 ? (
                  data.allergies.map((allergy, idx) => (
                    <div
                      key={allergy.id}
                      className={`flex items-center gap-3 px-3 py-2.5 ${idx !== data.allergies.length - 1 ? 'border-b border-border/20' : ''}`}
                    >
                      <div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{allergy.allergen}</p>
                        <p className="text-xs text-muted-foreground">{allergy.reaction}</p>
                      </div>
                      <span className="text-[10px] text-red-400 font-semibold uppercase">
                        {allergy.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-3 text-center">
                    <p className="text-xs text-muted-foreground">NKDA</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Diagnoses */}
        <div className="rounded-xl bg-card border border-border/40 overflow-hidden">
          <Collapsible open={openSections.diagnoses} onOpenChange={() => toggleSection("diagnoses")}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Diagnoses</p>
                    <p className="text-xl font-bold">{data.diagnoses.length}</p>
                  </div>
                </div>
                {openSections.diagnoses ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border/30">
                {data.diagnoses.length > 0 ? (
                  data.diagnoses.map((dx, idx) => (
                    <div
                      key={dx.id}
                      className={`flex items-center gap-3 px-3 py-2.5 ${idx !== data.diagnoses.length - 1 ? 'border-b border-border/20' : ''}`}
                    >
                      <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        {dx.isPrimary ? (
                          <span className="text-[10px] font-bold text-purple-400">1°</span>
                        ) : (
                          <Stethoscope className="h-3.5 w-3.5 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{dx.description}</p>
                        {dx.icd10Code && (
                          <p className="text-xs text-muted-foreground font-mono">{dx.icd10Code}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-3 text-center">
                    <p className="text-xs text-muted-foreground">No diagnoses</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Medications */}
        <div className="rounded-xl bg-card border border-border/40 overflow-hidden">
          <Collapsible open={openSections.medications} onOpenChange={() => toggleSection("medications")}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                    <Pill className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Medications</p>
                    <p className="text-xl font-bold">{data.medications.length}</p>
                  </div>
                </div>
                {openSections.medications ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border/30">
                {data.medications.length > 0 ? (
                  data.medications.map((med, idx) => (
                    <div
                      key={med.id}
                      className={`flex items-center gap-3 px-3 py-2.5 ${idx !== data.medications.length - 1 ? 'border-b border-border/20' : ''}`}
                    >
                      <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Pill className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{med.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-3 text-center">
                    <p className="text-xs text-muted-foreground">No medications</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Supplements */}
        <div className="rounded-xl bg-card border border-border/40 overflow-hidden">
          <Collapsible open={openSections.supplements} onOpenChange={() => toggleSection("supplements")}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Supplements</p>
                    <p className="text-xl font-bold">{data.supplements.length}</p>
                  </div>
                </div>
                {openSections.supplements ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t border-border/30">
                {data.supplements.length > 0 ? (
                  data.supplements.map((supp, idx) => (
                    <div
                      key={supp.id}
                      className={`flex items-center gap-3 px-3 py-2.5 ${idx !== data.supplements.length - 1 ? 'border-b border-border/20' : ''}`}
                    >
                      <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <Leaf className="h-3.5 w-3.5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{supp.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[supp.dosage, supp.frequency].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-3 text-center">
                    <p className="text-xs text-muted-foreground">No supplements</p>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Vitals */}
        {data.vitals && data.vitals.length > 0 && (
          <div className="rounded-xl bg-card border border-border/40 overflow-hidden">
            <Collapsible open={openSections.vitals} onOpenChange={() => toggleSection("vitals")}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Vitals</p>
                      <p className="text-sm font-medium text-muted-foreground">Latest</p>
                    </div>
                  </div>
                  {openSections.vitals ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/30">
                  {latestWeight && (
                    <div className={`flex items-center gap-3 px-3 py-2.5 ${latestBP || latestHR ? 'border-b border-border/20' : ''}`}>
                      <div className="h-7 w-7 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <Scale className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="text-base font-semibold">{latestWeight.value} <span className="text-sm font-normal text-muted-foreground">{latestWeight.unit}</span></p>
                      </div>
                    </div>
                  )}
                  {latestBP && (
                    <div className={`flex items-center gap-3 px-3 py-2.5 ${latestHR ? 'border-b border-border/20' : ''}`}>
                      <div className="h-7 w-7 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <Activity className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Blood Pressure</p>
                        <p className="text-base font-semibold">{latestBP.value}/{latestBP.value2} <span className="text-sm font-normal text-muted-foreground">{latestBP.unit}</span></p>
                      </div>
                    </div>
                  )}
                  {latestHR && (
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div className="h-7 w-7 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <Heart className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Heart Rate</p>
                        <p className="text-base font-semibold">{latestHR.value} <span className="text-sm font-normal text-muted-foreground">{latestHR.unit}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Recent Injections */}
        {data.recentInjections && data.recentInjections.length > 0 && (
          <div className="rounded-xl bg-card border border-border/40 overflow-hidden">
            <Collapsible open={openSections.injections} onOpenChange={() => toggleSection("injections")}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                      <Syringe className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Injections</p>
                      <p className="text-xl font-bold">{data.recentInjections.length}</p>
                    </div>
                  </div>
                  {openSections.injections ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/30">
                  {data.recentInjections.map((inj, idx) => (
                    <div
                      key={inj.id}
                      className={`flex items-center gap-3 px-3 py-2.5 ${idx !== data.recentInjections!.length - 1 ? 'border-b border-border/20' : ''}`}
                    >
                      <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Syringe className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{inj.medication}</p>
                        <p className="text-xs text-muted-foreground">
                          {inj.dose} · {format(new Date(inj.administeredAt), "MMM d")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
