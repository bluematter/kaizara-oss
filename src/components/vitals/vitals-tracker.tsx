"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Scale,
  Heart,
  Activity,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Target,
  Trophy,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
// Vitals data will come from API in future; start empty for now
const mockVitals: Record<string, { id: string; type: string; value: number; value2?: number; unit: string; measuredAt: Date }[]> = {};
const mockWeightGoals: Record<string, { targetWeight: number; goalWeight: number; startWeight: number; startDate: Date; targetDate: Date }> = {};
import { format, subDays } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts";

interface VitalsTrackerProps {
  patientId: string;
  patientName?: string;
  isPortalView?: boolean; // Simplified view for patient portal
}

type VitalType = "WEIGHT" | "BLOOD_PRESSURE" | "HEART_RATE";

const vitalConfig: Record<VitalType, { label: string; unit: string; icon: typeof Scale; color: string }> = {
  WEIGHT: { label: "Weight", unit: "lbs", icon: Scale, color: "hsl(221.2 83.2% 53.3%)" },
  BLOOD_PRESSURE: { label: "Blood Pressure", unit: "mmHg", icon: Activity, color: "hsl(346.8 77.2% 49.8%)" },
  HEART_RATE: { label: "Heart Rate", unit: "bpm", icon: Heart, color: "hsl(142.1 76.2% 36.3%)" },
};

export function VitalsTracker({ patientId, patientName, isPortalView = false }: VitalsTrackerProps) {
  const [addVitalDialogOpen, setAddVitalDialogOpen] = useState(false);
  const [selectedVitalType, setSelectedVitalType] = useState<VitalType>("WEIGHT");
  const [activeTab, setActiveTab] = useState<VitalType>("WEIGHT");

  // Get vitals for this patient
  const patientVitals = mockVitals[patientId as keyof typeof mockVitals] || [];

  // Group vitals by type
  const weightData = patientVitals
    .filter((v) => v.type === "WEIGHT")
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .map((v) => ({
      date: format(new Date(v.measuredAt), "MMM d"),
      value: v.value,
      fullDate: v.measuredAt,
    }));

  const bpData = patientVitals
    .filter((v) => v.type === "BLOOD_PRESSURE")
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .map((v) => ({
      date: format(new Date(v.measuredAt), "MMM d"),
      systolic: v.value,
      diastolic: v.value2,
      fullDate: v.measuredAt,
    }));

  const hrData = patientVitals
    .filter((v) => v.type === "HEART_RATE")
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .map((v) => ({
      date: format(new Date(v.measuredAt), "MMM d"),
      value: v.value,
      fullDate: v.measuredAt,
    }));

  // Calculate stats
  const latestWeight = weightData[weightData.length - 1]?.value;
  const firstWeight = weightData[0]?.value;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

  const latestBP = bpData[bpData.length - 1];
  const latestHR = hrData[hrData.length - 1]?.value;

  // Weight goal calculations
  const weightGoal = mockWeightGoals[patientId as keyof typeof mockWeightGoals];
  const hasWeightGoal = !!weightGoal;

  let goalProgress = 0;
  let weightToLose = 0;
  let weightLostSoFar = 0;
  let daysRemaining = 0;
  let weeklyRateNeeded = 0;
  let onTrack = false;

  if (hasWeightGoal && latestWeight) {
    weightToLose = weightGoal.startWeight - weightGoal.goalWeight;
    weightLostSoFar = weightGoal.startWeight - latestWeight;
    goalProgress = Math.min(100, Math.max(0, (weightLostSoFar / weightToLose) * 100));

    const now = new Date();
    const msRemaining = weightGoal.targetDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    const weeksRemaining = daysRemaining / 7;
    const weightRemaining = latestWeight - weightGoal.goalWeight;
    weeklyRateNeeded = weeksRemaining > 0 ? weightRemaining / weeksRemaining : 0;

    // Calculate if on track (losing at least 1 lb per week on average)
    const daysSinceStart = Math.ceil((now.getTime() - weightGoal.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksSinceStart = daysSinceStart / 7;
    const averageWeeklyLoss = weeksSinceStart > 0 ? weightLostSoFar / weeksSinceStart : 0;
    onTrack = averageWeeklyLoss >= 0.5 || goalProgress >= 100; // On track if losing 0.5+ lbs/week
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {isPortalView ? "My Vitals" : `Vitals${patientName ? ` - ${patientName}` : ""}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            Track weight, blood pressure, and heart rate
          </p>
        </div>
        <Dialog open={addVitalDialogOpen} onOpenChange={setAddVitalDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Log Vital
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Log Vital</DialogTitle>
              <DialogDescription>
                Record a new vital measurement
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Vital Type</Label>
                <Select
                  value={selectedVitalType}
                  onValueChange={(v) => setSelectedVitalType(v as VitalType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEIGHT">Weight</SelectItem>
                    <SelectItem value="BLOOD_PRESSURE">Blood Pressure</SelectItem>
                    <SelectItem value="HEART_RATE">Heart Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedVitalType === "WEIGHT" && (
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input id="weight" type="number" step="0.1" placeholder="175.5" />
                </div>
              )}

              {selectedVitalType === "BLOOD_PRESSURE" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="systolic">Systolic (mmHg)</Label>
                    <Input id="systolic" type="number" placeholder="120" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
                    <Input id="diastolic" type="number" placeholder="80" />
                  </div>
                </div>
              )}

              {selectedVitalType === "HEART_RATE" && (
                <div className="space-y-2">
                  <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                  <Input id="heartRate" type="number" placeholder="72" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddVitalDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setAddVitalDialogOpen(false)}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Weight */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Scale className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-xl font-bold">
                    {latestWeight ? `${latestWeight} lbs` : "—"}
                  </p>
                </div>
              </div>
              {weightChange !== 0 && (
                <Badge
                  variant="outline"
                  className={weightChange < 0 ? "text-emerald-500 bg-emerald-500/10" : "text-orange-500 bg-orange-500/10"}
                >
                  {weightChange < 0 ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(weightChange)} lbs
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Blood Pressure */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <Activity className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <p className="text-xl font-bold">
                    {latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : "—"}
                  </p>
                </div>
              </div>
              {latestBP && latestBP.systolic <= 120 && latestBP.diastolic && latestBP.diastolic <= 80 && (
                <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10">
                  Normal
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Heart Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Heart className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="text-xl font-bold">
                    {latestHR ? `${latestHR} bpm` : "—"}
                  </p>
                </div>
              </div>
              {latestHR && latestHR >= 60 && latestHR <= 100 && (
                <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10">
                  Normal
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weight Loss Goal Progress */}
      {hasWeightGoal && latestWeight && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Weight Loss Goal</CardTitle>
                  <CardDescription>
                    Target: {weightGoal.goalWeight} lbs by {format(weightGoal.targetDate, "MMM d, yyyy")}
                  </CardDescription>
                </div>
              </div>
              {goalProgress >= 100 ? (
                <Badge className="bg-emerald-500 text-white">
                  <Trophy className="h-3 w-3 mr-1" />
                  Goal Achieved!
                </Badge>
              ) : onTrack ? (
                <Badge variant="outline" className="text-emerald-500 bg-emerald-500/10">
                  On Track
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-500 bg-orange-500/10">
                  Needs Focus
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{goalProgress.toFixed(0)}%</span>
              </div>
              <Progress value={goalProgress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Start: {weightGoal.startWeight} lbs</span>
                <span>Goal: {weightGoal.goalWeight} lbs</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-emerald-500">
                  {weightLostSoFar > 0 ? `-${weightLostSoFar}` : weightLostSoFar}
                </p>
                <p className="text-xs text-muted-foreground">lbs lost</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">
                  {Math.max(0, latestWeight - weightGoal.goalWeight).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">lbs to go</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{daysRemaining}</p>
                <p className="text-xs text-muted-foreground">days left</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">
                  {weeklyRateNeeded > 0 ? weeklyRateNeeded.toFixed(1) : "0"}
                </p>
                <p className="text-xs text-muted-foreground">lbs/week needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Card>
        <CardHeader className="pb-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VitalType)}>
            <TabsList>
              <TabsTrigger value="WEIGHT">Weight</TabsTrigger>
              <TabsTrigger value="BLOOD_PRESSURE">Blood Pressure</TabsTrigger>
              <TabsTrigger value="HEART_RATE">Heart Rate</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {activeTab === "WEIGHT" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">8-Week Weight Trend</p>
                  {weightChange !== 0 && (
                    <p className={`text-sm font-medium ${weightChange < 0 ? "text-emerald-500" : "text-orange-500"}`}>
                      {weightChange < 0 ? "Lost" : "Gained"} {Math.abs(weightChange)} lbs total
                    </p>
                  )}
                </div>
              </div>
              {weightData.length > 0 ? (
                <ChartContainer
                  config={{
                    weight: {
                      label: "Weight",
                      color: "hsl(221.2 83.2% 53.3%)",
                    },
                  }}
                  className="h-[200px] w-full"
                >
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      domain={['dataMin - 5', 'dataMax + 5']}
                      tickFormatter={(v) => `${v}`}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3">
                            <p className="text-sm text-slate-300">{payload[0].payload.date}</p>
                            <p className="text-lg font-bold text-blue-400">{payload[0].value} lbs</p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(221.2 83.2% 53.3%)"
                      fill="url(#weightGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No weight data recorded yet
                </div>
              )}
            </div>
          )}

          {activeTab === "BLOOD_PRESSURE" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Blood Pressure History</p>
              {bpData.length > 0 ? (
                <ChartContainer
                  config={{
                    systolic: {
                      label: "Systolic",
                      color: "hsl(346.8 77.2% 49.8%)",
                    },
                    diastolic: {
                      label: "Diastolic",
                      color: "hsl(24.6 95% 53.1%)",
                    },
                  }}
                  className="h-[200px] w-full"
                >
                  <LineChart data={bpData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[60, 140]} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3">
                            <p className="text-sm text-slate-300">{data.date}</p>
                            <p className="text-lg font-bold text-red-400">{data.systolic}/{data.diastolic} mmHg</p>
                          </div>
                        );
                      }}
                    />
                    <Line type="monotone" dataKey="systolic" stroke="hsl(346.8 77.2% 49.8%)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="diastolic" stroke="hsl(24.6 95% 53.1%)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No blood pressure data recorded yet
                </div>
              )}
            </div>
          )}

          {activeTab === "HEART_RATE" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Heart Rate History</p>
              {hrData.length > 0 ? (
                <ChartContainer
                  config={{
                    heartRate: {
                      label: "Heart Rate",
                      color: "hsl(142.1 76.2% 36.3%)",
                    },
                  }}
                  className="h-[200px] w-full"
                >
                  <AreaChart data={hrData}>
                    <defs>
                      <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[50, 90]} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3">
                            <p className="text-sm text-slate-300">{payload[0].payload.date}</p>
                            <p className="text-lg font-bold text-emerald-400">{payload[0].value} bpm</p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(142.1 76.2% 36.3%)"
                      fill="url(#hrGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No heart rate data recorded yet
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
