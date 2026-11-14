"use client";

import { useState, useMemo, useEffect, Suspense, Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Target,
  Lightbulb,
  Activity,
  Calendar,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Zap,
  Heart,
  Brain,
  Dumbbell,
  Moon,
  Apple,
  Pill,
  ChevronDown,
  Menu,
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
  Legend,
} from "recharts";
import { format, addMonths, isValid } from "date-fns";

// Safe date formatter that handles invalid dates gracefully
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
import {
  type PatientContext,
  type OptimalRange,
  markerDefinitions,
  getScoreColor,
  getScoreBgColor,
  getScoreLabel,
  calculateScore,
} from "@/lib/lab-scoring";

// Historical lab data point
interface HistoricalDataPoint {
  date: Date;
  markers: Record<string, number>;
}

// Props for the component
interface BiomarkerTrendsProps {
  isOpen: boolean;
  onClose: () => void;
  patientContext: PatientContext;
  historicalData: HistoricalDataPoint[];
  currentMarkers: Array<{
    name: string;
    value: number;
    unit: string;
    score: number;
    label: string;
    color: string;
    bgColor: string;
    interpretation?: string;
    optimalRange: OptimalRange;
  }>;
  patientName?: string;
  isPatientView?: boolean; // Simplified view for patients
}

// Comprehensive marker descriptions
const markerDescriptions: Record<string, string> = {
  "IGF-1": "Insulin-like Growth Factor 1 is a hormone similar in structure to insulin that plays a key role in childhood growth and continues to have anabolic effects in adults. It's produced primarily in the liver in response to Growth Hormone (GH) and is the best marker for assessing GH status and response to GH-releasing peptides like Sermorelin.",
  "Testosterone, Total": "The primary male sex hormone responsible for muscle mass, bone density, fat distribution, libido, mood, and cognitive function. In men, levels naturally decline ~1% per year after age 30. Optimal levels are associated with better cardiovascular health, mental clarity, and overall vitality.",
  "Testosterone, Free": "The biologically active form of testosterone not bound to proteins. Only 2-3% of total testosterone is free and available for tissues to use. This is often a better indicator of testosterone status than total testosterone, especially when SHBG levels are abnormal.",
  "Hemoglobin A1c": "A 3-month average of blood sugar levels, reflecting how well glucose is being managed. It measures the percentage of hemoglobin proteins coated with sugar. Lower is better - optimal levels indicate excellent metabolic health and reduced risk of diabetes complications.",
  "Glucose": "Blood sugar level at the time of the test. Fasting glucose should be measured after 8-12 hours without eating. It's a snapshot of metabolic health and insulin function.",
  "TSH": "Thyroid Stimulating Hormone controls thyroid function. Higher TSH often indicates an underactive thyroid (hypothyroidism), while lower TSH may indicate overactive thyroid. The thyroid controls metabolism, energy, weight, mood, and body temperature.",
  "Free T4": "The active form of thyroxine, the main thyroid hormone. It regulates metabolism, heart rate, body temperature, and energy levels. Low Free T4 with high TSH confirms hypothyroidism.",
  "Free T3": "The most active thyroid hormone, converted from T4 in tissues. It directly affects metabolism at the cellular level. Some people have difficulty converting T4 to T3, making this an important marker.",
  "Vitamin D, 25-OH": "The storage form of Vitamin D, essential for bone health, immune function, mood, hormone production, and muscle function. Most people are deficient due to limited sun exposure. Optimal levels are associated with reduced cancer risk and better overall health.",
  "Vitamin B12": "Essential for nerve function, DNA synthesis, and red blood cell formation. Deficiency can cause fatigue, weakness, memory problems, and nerve damage. Common in vegetarians/vegans and those with absorption issues.",
  "Folate": "A B-vitamin crucial for DNA synthesis, cell division, and preventing neural tube defects. Works closely with B12. Important for cardiovascular health as it helps metabolize homocysteine.",
  "Iron": "Essential mineral for oxygen transport in blood. Iron deficiency is the most common nutritional deficiency worldwide, causing fatigue, weakness, and impaired cognitive function.",
  "Ferritin": "The storage form of iron. Low ferritin indicates depleted iron stores, often before anemia develops. High ferritin can indicate inflammation or iron overload conditions.",
  "hs-CRP": "High-sensitivity C-Reactive Protein is a marker of systemic inflammation produced by the liver. Elevated levels are associated with increased cardiovascular disease risk, chronic disease, and accelerated aging. Lower is better.",
  "Homocysteine": "An amino acid that, when elevated, is associated with increased cardiovascular disease risk, cognitive decline, and bone fractures. B-vitamins (B6, B12, folate) help metabolize it.",
  "LDL Cholesterol": "Low-Density Lipoprotein carries cholesterol to tissues. When elevated, it can accumulate in artery walls, contributing to atherosclerosis. Particle size matters - small dense LDL is more atherogenic than large buoyant LDL.",
  "HDL Cholesterol": "High-Density Lipoprotein removes excess cholesterol from tissues and returns it to the liver. Higher levels are protective against heart disease. It's the 'good' cholesterol you want more of.",
  "Cholesterol, Total": "The sum of all cholesterol in your blood. While often used as a screening tool, the ratio of HDL to total cholesterol and LDL particle size are more meaningful for assessing cardiovascular risk.",
  "Triglycerides": "Fats in the blood that store excess energy from your diet. High levels are associated with metabolic syndrome, insulin resistance, and increased cardiovascular risk. Strongly influenced by carbohydrate intake and alcohol.",
  "VLDL": "Very Low-Density Lipoprotein carries triglycerides from the liver to tissues. Elevated VLDL is associated with increased cardiovascular risk and often indicates metabolic dysfunction.",
  "White Blood Cell Count": "Measures immune cells that fight infection. Elevated counts may indicate infection, inflammation, or stress. Low counts may indicate immune suppression or bone marrow issues.",
  "Red Blood Cell Count": "Measures oxygen-carrying cells. Low counts indicate anemia. High counts may indicate dehydration, lung disease, or other conditions affecting oxygen delivery.",
  "Hemoglobin": "The protein in red blood cells that carries oxygen. Low hemoglobin indicates anemia, causing fatigue and reduced exercise capacity. Optimal levels ensure adequate oxygen delivery to tissues.",
  "Hematocrit": "The percentage of blood volume made up of red blood cells. Elevated levels may indicate dehydration or conditions that increase red blood cell production. Low levels indicate anemia.",
  "MCV": "Mean Corpuscular Volume measures the average size of red blood cells. Low MCV suggests iron deficiency, while high MCV may indicate B12 or folate deficiency.",
  "MCH": "Mean Corpuscular Hemoglobin measures the average amount of hemoglobin per red blood cell. Helps classify types of anemia.",
  "MCHC": "Mean Corpuscular Hemoglobin Concentration measures the average concentration of hemoglobin in red blood cells. Used to help diagnose anemia types.",
  "Platelets": "Blood cells that help with clotting. Low platelets increase bleeding risk, while high platelets may increase clotting risk.",
  "DHEA-S": "Dehydroepiandrosterone Sulfate is a hormone precursor produced by the adrenal glands. It's converted to testosterone and estrogen. Levels decline with age and are associated with vitality and stress resilience.",
  "Estradiol": "The primary form of estrogen. In men, optimal levels support bone health and libido, but excess can cause issues. In women, it's crucial for reproductive health, bone density, and cardiovascular protection.",
  "Cortisol": "The primary stress hormone. Chronically elevated cortisol leads to muscle loss, fat gain, immune suppression, and cognitive decline. Optimal levels follow a daily rhythm - high in morning, low at night.",
  "PSA": "Prostate-Specific Antigen is produced by the prostate gland. Elevated levels may indicate prostate enlargement, inflammation, or cancer. Important screening tool for men over 50.",
  "GGT": "Gamma-Glutamyl Transferase is a liver enzyme. Elevated levels may indicate liver disease, bile duct problems, or alcohol use. Also associated with cardiovascular risk.",
  "ALT": "Alanine Aminotransferase is a liver enzyme. Elevated levels indicate liver cell damage from various causes including fatty liver, medications, or hepatitis.",
  "AST": "Aspartate Aminotransferase is found in liver, heart, and muscle. Elevated levels can indicate liver damage but are less specific to liver than ALT.",
  "Alkaline Phosphatase": "An enzyme found in liver, bone, and intestines. Elevated levels may indicate liver disease, bile duct problems, or bone disorders. Also normally elevated during growth and pregnancy.",
  "Bilirubin": "A yellow compound produced when red blood cells break down. Elevated levels can indicate liver problems or increased red blood cell destruction.",
  "Albumin": "A protein made by the liver that maintains fluid balance and carries substances in blood. Low levels may indicate liver disease, kidney disease, or malnutrition.",
  "BUN": "Blood Urea Nitrogen measures kidney function and protein metabolism. Elevated levels may indicate kidney dysfunction or dehydration.",
  "Creatinine": "A waste product from muscle metabolism filtered by kidneys. Elevated levels indicate reduced kidney function. Used to calculate eGFR.",
  "eGFR": "Estimated Glomerular Filtration Rate measures how well kidneys filter blood. Lower values indicate reduced kidney function. Important for assessing kidney health.",
  "Sodium": "An electrolyte crucial for fluid balance, nerve function, and muscle contraction. Abnormal levels can indicate dehydration, kidney issues, or hormonal imbalances.",
  "Potassium": "An electrolyte essential for heart function, muscle contraction, and nerve signaling. Both high and low levels can be dangerous for heart rhythm.",
  "Chloride": "An electrolyte that helps maintain fluid balance and pH. Usually changes along with sodium levels.",
  "CO2": "Carbon dioxide/bicarbonate measures blood pH balance. Abnormal levels may indicate respiratory or metabolic issues.",
  "Calcium": "Essential mineral for bone health, muscle function, nerve signaling, and blood clotting. Blood levels are tightly regulated by parathyroid hormone and vitamin D.",
  "Magnesium": "A mineral involved in over 300 enzymatic reactions including energy production, muscle function, and blood pressure regulation. Deficiency is common and often overlooked.",
  "Phosphorus": "Works with calcium for bone health and is involved in energy production (ATP). Levels are regulated alongside calcium.",
  "Uric Acid": "A waste product from purine metabolism. Elevated levels can cause gout and kidney stones, and are associated with metabolic syndrome and cardiovascular risk.",
  "SHBG": "Sex Hormone Binding Globulin binds testosterone and estrogen, making them inactive. High SHBG means less free testosterone available. Affected by thyroid, insulin, and liver function.",
  "Insulin": "The hormone that regulates blood sugar. Fasting insulin is a sensitive marker for insulin resistance - elevated levels indicate metabolic dysfunction before glucose becomes abnormal.",
  "Prolactin": "A hormone primarily known for milk production but also affects libido and fertility. Elevated levels in men can lower testosterone and cause symptoms.",
  "LH": "Luteinizing Hormone stimulates testosterone production in men and ovulation in women. Used to assess pituitary and gonadal function.",
  "FSH": "Follicle Stimulating Hormone supports sperm production in men and egg development in women. Elevated FSH in men may indicate testicular issues.",
  "T4, Free": "The active, unbound form of thyroxine, the main thyroid hormone. Free T4 is what's available for tissues to use. Low levels with high TSH indicate hypothyroidism, while high levels with low TSH indicate hyperthyroidism.",
  "T3, Free": "The most potent thyroid hormone, converted from T4 in tissues. Free T3 directly affects metabolism, energy, heart rate, and body temperature at the cellular level.",
  "Testosterone, Bioavailable": "The portion of testosterone that's either free or loosely bound to albumin, available for tissues to use. This is a more accurate measure of usable testosterone than total testosterone alone.",
  "Sex Hormone Binding Globulin": "A protein made by the liver that binds to testosterone and estrogen, making them inactive. High SHBG means less free testosterone available. Affected by thyroid function, insulin levels, and liver health.",
  "DHEA Sulfate": "The sulfated form of DHEA, a hormone precursor produced by the adrenal glands. It's converted into testosterone and estrogen. Levels peak in your 20s and decline with age, associated with vitality and stress resilience.",
  "Cortisol, AM": "Morning cortisol levels, measured in the first few hours after waking when cortisol should be at its peak. This peak provides energy and alertness. Low morning cortisol may indicate adrenal fatigue or dysfunction.",
  "IGF-1 Z Score": "A standardized score comparing your IGF-1 level to age and sex-matched reference ranges. A score of 0 is average, positive scores are above average, negative scores below. Useful for tracking GH therapy response.",
  "Iron, Total": "Serum iron measures the amount of iron circulating in your blood bound to transferrin. Levels fluctuate throughout the day and with meals. Used alongside TIBC and ferritin to assess iron status.",
  "Iron Binding Capacity": "Total Iron Binding Capacity (TIBC) measures how much transferrin is available to bind iron. High TIBC with low iron suggests iron deficiency. Low TIBC may indicate chronic disease or iron overload.",
  "% Saturation": "Iron saturation percentage shows what percent of transferrin is carrying iron. Low saturation (<20%) suggests iron deficiency; high saturation (>45%) may indicate iron overload or hemochromatosis.",
  "CHOL/HDL Ratio": "The ratio of total cholesterol to HDL cholesterol, a better predictor of cardiovascular risk than total cholesterol alone. Lower is better - under 4.5 is optimal, over 5 indicates increased risk.",
  "Non-HDL Cholesterol": "All cholesterol particles except HDL (total cholesterol minus HDL). Includes LDL and VLDL. Many experts consider this a better predictor of cardiovascular risk than LDL alone.",
  "TG/HDL Ratio": "The ratio of triglycerides to HDL cholesterol. A marker of insulin resistance and metabolic health. Optimal is under 2; over 3 suggests insulin resistance and increased cardiovascular risk.",
  "RDW": "Red Cell Distribution Width measures variation in red blood cell size. Elevated RDW can indicate iron deficiency, B12/folate deficiency, or mixed anemias. Also associated with inflammation and mortality risk.",
  "Platelet Count": "Platelets are cell fragments that help blood clot. Low counts (thrombocytopenia) increase bleeding risk; high counts (thrombocytosis) may indicate inflammation, infection, or blood disorders.",
  "MPV": "Mean Platelet Volume measures the average size of platelets. Larger platelets are more active and may indicate increased clotting risk. Can help differentiate causes of low platelet counts.",
  "Absolute Neutrophils": "Neutrophils are the most common white blood cell and first responders to bacterial infection. Low counts increase infection risk; high counts often indicate bacterial infection or inflammation.",
  "Absolute Lymphocytes": "Lymphocytes include T-cells, B-cells, and NK cells - crucial for adaptive immunity and fighting viral infections. Low counts may indicate immune suppression; high counts may suggest viral infection.",
  "Absolute Monocytes": "Monocytes are white blood cells that become macrophages and dendritic cells in tissues. Elevated levels may indicate chronic infection, inflammation, or certain blood disorders.",
  "Absolute Eosinophils": "Eosinophils fight parasites and are involved in allergic reactions. High counts may indicate allergies, asthma, parasites, or certain conditions. Very high levels need investigation.",
  "Absolute Basophils": "Basophils are the rarest white blood cells, involved in allergic reactions and inflammation. Elevated levels are rare but may indicate allergic conditions or certain blood disorders.",
  "BUN (Urea Nitrogen)": "Blood Urea Nitrogen is a waste product from protein metabolism filtered by kidneys. Elevated levels may indicate kidney dysfunction, dehydration, high protein intake, or GI bleeding.",
  "BUN/Creatinine Ratio": "The ratio helps distinguish between different causes of elevated BUN. High ratio may indicate dehydration, GI bleeding, or heart failure. Low ratio may suggest liver disease or low protein intake.",
  "Carbon Dioxide": "Bicarbonate (CO2) measures the body's acid-base balance. Low levels may indicate metabolic acidosis; high levels may suggest metabolic alkalosis. Important for kidney function assessment.",
  "Protein, Total": "Total protein measures albumin and globulins combined. Low levels may indicate liver disease, malnutrition, or kidney loss. High levels may suggest dehydration or chronic inflammation.",
  "Globulin": "Globulins are proteins including antibodies and transport proteins. High levels may indicate chronic inflammation, infection, or immune disorders. Low levels may suggest immune deficiency.",
  "Albumin/Globulin Ratio": "The A/G ratio helps assess liver function and immune status. Low ratio may indicate overproduction of globulins (inflammation) or underproduction of albumin (liver disease).",
  "Bilirubin, Total": "Bilirubin is a yellow pigment from red blood cell breakdown. Elevated levels cause jaundice and may indicate liver disease, bile duct obstruction, or excessive red cell destruction.",
  "PSA, Total": "Prostate-Specific Antigen is produced by the prostate gland. Elevated levels may indicate prostate enlargement (BPH), infection (prostatitis), or cancer. Important screening tool for men.",
  "PSA, Free": "The portion of PSA not bound to proteins. The free-to-total ratio helps distinguish between BPH and cancer - a higher percentage of free PSA suggests benign conditions.",
  "PSA % Free": "The percentage of PSA that's free (unbound). Higher percentages (>25%) suggest benign prostatic conditions, while lower percentages may warrant further investigation for prostate cancer.",
  "EBV VCA IgM": "Antibodies against Epstein-Barr Virus capsid antigen. IgM antibodies indicate recent or active EBV infection (infectious mononucleosis). Usually become negative within a few months.",
  "EBV VCA IgG": "IgG antibodies against EBV capsid antigen indicate past infection. Most adults are positive, indicating previous exposure. These antibodies persist for life and provide immunity.",
  "EBV Nuclear Ag IgG": "Antibodies against EBV nuclear antigen appear 3-6 months after infection and indicate past infection. Used to confirm that an infection is not recent.",
  "ANA Screen": "Antinuclear Antibody test screens for autoimmune conditions. A negative result essentially rules out systemic lupus. Positive results require further testing to identify specific antibodies.",
  "ABO Group": "Your blood type (A, B, AB, or O) determined by antigens on red blood cells. Important for blood transfusions and organ transplants. Blood type is inherited and doesn't change.",
  "Rh Type": "The Rh factor (positive or negative) is another blood group antigen. Important for pregnancy - Rh-negative mothers carrying Rh-positive babies need preventive treatment.",
};

// Comprehensive improvement tips for all markers
const improvementTips: Record<string, Array<{
  icon: React.ElementType;
  category: string;
  tips: string[];
  priority: "high" | "medium" | "low";
}>> = {
  "Testosterone, Total": [
    { icon: Moon, category: "Sleep Optimization", tips: ["Aim for 7-9 hours of quality sleep", "Keep bedroom cool (65-68°F)", "Avoid screens 1 hour before bed", "Sleep in complete darkness"], priority: "high" },
    { icon: Dumbbell, category: "Exercise", tips: ["Heavy compound lifts (squats, deadlifts, bench)", "HIIT training 2-3x/week", "Avoid overtraining - rest days matter", "Train legs for maximum hormone response"], priority: "high" },
    { icon: Apple, category: "Nutrition", tips: ["Eat healthy fats (avocado, olive oil, nuts)", "Zinc-rich foods (oysters, beef, pumpkin seeds)", "Adequate protein (0.8-1g per lb bodyweight)", "Don't fear cholesterol - it's a hormone precursor"], priority: "medium" },
    { icon: Pill, category: "Supplements", tips: ["Vitamin D3 (5000 IU/day)", "Zinc (30mg/day)", "Ashwagandha (600mg/day) for stress", "Boron (10mg/day)", "Magnesium glycinate (400mg)"], priority: "medium" },
  ],
  "Testosterone, Free": [
    { icon: Dumbbell, category: "Exercise", tips: ["Resistance training increases free T", "High-intensity intervals boost hormones", "Avoid chronic cardio which can lower T"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Reduce sugar to lower SHBG", "Adequate protein supports hormone production", "Healthy fats are essential"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Boron can help lower SHBG", "Stinging nettle root", "Vitamin D optimization"], priority: "medium" },
  ],
  "IGF-1": [
    { icon: Pill, category: "Peptide Therapy", tips: ["Sermorelin (300mcg nightly) stimulates natural GH", "CJC-1295 + Ipamorelin combination", "GHRP-6 for appetite and GH release", "MK-677 (oral option)"], priority: "high" },
    { icon: Moon, category: "Sleep", tips: ["GH release peaks during deep sleep (stages 3-4)", "Maintain consistent sleep schedule", "Complete darkness - no LEDs or screens", "Cool room temperature"], priority: "high" },
    { icon: Dumbbell, category: "Exercise", tips: ["High-intensity exercise maximizes GH release", "Resistance training with short rest periods", "Sprint intervals are highly effective"], priority: "medium" },
    { icon: Apple, category: "Nutrition", tips: ["Avoid eating 2-3 hours before bed", "Protein before sleep may enhance GH", "Intermittent fasting can boost GH"], priority: "medium" },
  ],
  "Hemoglobin A1c": [
    { icon: Apple, category: "Diet", tips: ["Reduce refined carbs and sugar dramatically", "Increase fiber intake (25-35g/day)", "Time-restricted eating (16:8 fasting)", "Low glycemic foods", "Apple cider vinegar before meals"], priority: "high" },
    { icon: Dumbbell, category: "Exercise", tips: ["30 min walking after meals blunts glucose spike", "Resistance training improves insulin sensitivity", "150 min moderate cardio/week", "Any movement after eating helps"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Berberine (500mg 2-3x/day) - nature's metformin", "Chromium (200-400mcg/day)", "Alpha-lipoic acid (600mg/day)", "Cinnamon extract"], priority: "medium" },
  ],
  "Glucose": [
    { icon: Apple, category: "Diet", tips: ["Eat protein and fat before carbs", "Avoid liquid calories and fruit juice", "Choose low glycemic carbs", "Never eat carbs alone"], priority: "high" },
    { icon: Dumbbell, category: "Movement", tips: ["Walk for 10-15 min after every meal", "Standing and light movement helps", "Muscle contractions clear glucose"], priority: "high" },
    { icon: Moon, category: "Sleep", tips: ["Poor sleep raises morning glucose", "Consistent sleep schedule helps regulation"], priority: "medium" },
  ],
  "TSH": [
    { icon: Pill, category: "Thyroid Support", tips: ["Selenium (200mcg/day) - crucial for conversion", "Iodine from seaweed/kelp (150-300mcg)", "Zinc for T4 to T3 conversion", "Ashwagandha supports thyroid"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Avoid excessive raw cruciferous vegetables", "Brazil nuts for selenium (2-3/day)", "Adequate protein for hormone synthesis", "Avoid gluten if Hashimoto's"], priority: "medium" },
    { icon: Brain, category: "Stress Management", tips: ["Chronic stress suppresses thyroid function", "Practice meditation/relaxation techniques", "Prioritize sleep - thyroid repairs at night"], priority: "medium" },
  ],
  "Free T4": [
    { icon: Pill, category: "Support", tips: ["Selenium aids T4 production", "Iodine is essential building block", "Address any deficiencies first"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Tyrosine-rich foods (meat, fish, eggs)", "Avoid excessive soy products", "Adequate calories - undereating hurts thyroid"], priority: "medium" },
  ],
  "Free T3": [
    { icon: Pill, category: "Conversion Support", tips: ["Selenium crucial for T4→T3 conversion", "Zinc supports conversion enzymes", "Iron deficiency impairs conversion", "Reduce stress - cortisol blocks conversion"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Adequate protein and calories", "Avoid very low carb for extended periods", "Support liver function (where conversion happens)"], priority: "medium" },
  ],
  "Vitamin D, 25-OH": [
    { icon: Zap, category: "Sun Exposure", tips: ["15-30 min midday sun (10am-2pm)", "Arms and legs exposed without sunscreen", "More time needed with darker skin", "UVB doesn't penetrate glass"], priority: "high" },
    { icon: Pill, category: "Supplementation", tips: ["D3 5000-10000 IU/day (not D2)", "Take with fat for absorption", "K2 (MK-7) helps direct calcium properly", "Retest in 3 months"], priority: "high" },
    { icon: Apple, category: "Food Sources", tips: ["Fatty fish (salmon, mackerel, sardines)", "Egg yolks from pastured chickens", "Cod liver oil", "Fortified foods as backup"], priority: "low" },
  ],
  "Vitamin B12": [
    { icon: Pill, category: "Supplementation", tips: ["Methylcobalamin form preferred", "Sublingual absorption bypasses gut", "1000-5000mcg if deficient", "B-complex for synergy"], priority: "high" },
    { icon: Apple, category: "Food Sources", tips: ["Animal products are only natural source", "Liver is highest source", "Eggs, meat, fish, dairy", "Fortified nutritional yeast for vegans"], priority: "high" },
    { icon: Heart, category: "Address Root Cause", tips: ["Check for absorption issues", "Low stomach acid impairs absorption", "Metformin depletes B12", "Consider intrinsic factor test"], priority: "medium" },
  ],
  "Folate": [
    { icon: Apple, category: "Food Sources", tips: ["Dark leafy greens (spinach, kale)", "Legumes and lentils", "Asparagus, broccoli", "Liver"], priority: "high" },
    { icon: Pill, category: "Supplementation", tips: ["Methylfolate form (not folic acid)", "400-800mcg daily", "Higher doses if MTHFR mutation", "Take with B12"], priority: "medium" },
  ],
  "Iron": [
    { icon: Apple, category: "Food Sources", tips: ["Red meat is most bioavailable source", "Liver is extremely high in iron", "Pair plant iron with vitamin C", "Avoid coffee/tea with iron-rich meals"], priority: "high" },
    { icon: Pill, category: "Supplementation", tips: ["Only supplement if deficient", "Iron bisglycinate is gentler", "Take on empty stomach if tolerated", "Vitamin C enhances absorption"], priority: "medium" },
  ],
  "Ferritin": [
    { icon: Apple, category: "If Low", tips: ["Red meat, liver, shellfish", "Cast iron cookware adds iron", "Vitamin C enhances absorption", "Address any bleeding issues"], priority: "high" },
    { icon: Activity, category: "If High", tips: ["Blood donation lowers iron stores", "Reduce red meat intake", "Avoid iron-fortified foods", "IP6 may help chelate excess iron"], priority: "high" },
  ],
  "hs-CRP": [
    { icon: Apple, category: "Anti-inflammatory Diet", tips: ["Omega-3 rich foods (fatty fish 3x/week)", "Colorful vegetables (polyphenols)", "Turmeric/curcumin daily", "Eliminate processed/fried foods", "Extra virgin olive oil"], priority: "high" },
    { icon: Dumbbell, category: "Exercise", tips: ["Regular moderate exercise reduces inflammation", "Avoid overtraining which raises CRP", "Recovery is essential", "Walking is powerful"], priority: "medium" },
    { icon: Pill, category: "Supplements", tips: ["Fish oil (2-4g EPA+DHA/day)", "Curcumin with piperine (500-1000mg)", "Vitamin D optimization", "Magnesium"], priority: "medium" },
    { icon: Moon, category: "Lifestyle", tips: ["Sleep deprivation raises CRP", "Chronic stress is inflammatory", "Maintain healthy weight", "Address any infections"], priority: "medium" },
  ],
  "Homocysteine": [
    { icon: Pill, category: "B-Vitamins", tips: ["Methylfolate (800-1000mcg)", "Methylcobalamin B12 (1000mcg)", "B6 (P5P form, 50-100mg)", "TMG/Betaine (500-1000mg)"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Leafy greens for folate", "Animal products for B12", "Reduce coffee if very high intake", "Adequate protein"], priority: "medium" },
  ],
  "LDL Cholesterol": [
    { icon: Apple, category: "Diet", tips: ["Increase soluble fiber (oats, beans, apples)", "Reduce refined carbs more than saturated fat", "Plant sterols/stanols (2g/day)", "Mediterranean diet pattern", "Extra virgin olive oil"], priority: "high" },
    { icon: Dumbbell, category: "Exercise", tips: ["Regular aerobic exercise", "30-60 min most days", "Combination of cardio + strength", "Consistency matters most"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Citrus bergamot (500-1000mg)", "Red yeast rice (if tolerated)", "Omega-3 fish oil (2-4g/day)", "Niacin (discuss with provider)"], priority: "medium" },
  ],
  "HDL Cholesterol": [
    { icon: Dumbbell, category: "Exercise", tips: ["Aerobic exercise is #1 way to raise HDL", "HIIT particularly effective", "Consistent activity most days", "Even walking helps"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Healthy fats (olive oil, avocado, nuts)", "Moderate red wine may help", "Reduce refined carbs and sugar", "Coconut oil may raise HDL"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Niacin (extended release) is most effective", "Fish oil", "Consider if very low (<40)"], priority: "low" },
  ],
  "Cholesterol, Total": [
    { icon: Apple, category: "Diet", tips: ["Focus on HDL/Total ratio, not just total", "Healthy fats are not the enemy", "Reduce sugar and refined carbs", "Fiber lowers cholesterol"], priority: "medium" },
    { icon: Activity, category: "Context", tips: ["Total cholesterol alone is poor predictor", "Ratio and particle size matter more", "Very low cholesterol has risks too"], priority: "medium" },
  ],
  "Triglycerides": [
    { icon: Apple, category: "Diet", tips: ["Dramatically reduce sugar and refined carbs", "Limit alcohol - major TG driver", "Omega-3 fatty acids lower TGs", "Avoid fructose especially"], priority: "high" },
    { icon: Dumbbell, category: "Exercise", tips: ["Any exercise helps clear triglycerides", "Even walking after meals helps", "Consistency over intensity"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Fish oil (2-4g EPA+DHA) very effective", "Niacin lowers TGs significantly", "Berberine helps metabolic markers"], priority: "medium" },
  ],
  "White Blood Cell Count": [
    { icon: Activity, category: "If Elevated", tips: ["May indicate infection - investigate", "Chronic stress can elevate WBC", "Inflammation raises count", "Smoking raises WBC"], priority: "high" },
    { icon: Apple, category: "If Low", tips: ["Ensure adequate nutrition", "Zinc supports immune cells", "Vitamin C and D for immunity", "Rule out underlying conditions"], priority: "high" },
  ],
  "Red Blood Cell Count": [
    { icon: Apple, category: "If Low (Anemia)", tips: ["Iron-rich foods if iron deficient", "B12 and folate for production", "Adequate protein intake", "Address any blood loss"], priority: "high" },
    { icon: Activity, category: "If High", tips: ["Stay well hydrated", "May indicate chronic hypoxia", "Check oxygen saturation", "Consider altitude effects"], priority: "medium" },
  ],
  "Hemoglobin": [
    { icon: Apple, category: "If Low", tips: ["Iron-rich foods (red meat, liver)", "Vitamin C enhances iron absorption", "B12 and folate needed for production", "Avoid iron blockers with meals"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Iron only if deficient", "B12 if deficient", "EPO-stimulating factors need evaluation"], priority: "medium" },
  ],
  "Hematocrit": [
    { icon: Activity, category: "If Elevated", tips: ["Increase hydration", "Blood donation if chronically high", "May need therapeutic phlebotomy", "Check for sleep apnea"], priority: "high" },
    { icon: Apple, category: "If Low", tips: ["Address underlying anemia", "Iron, B12, folate as needed", "Adequate protein"], priority: "high" },
  ],
  "DHEA-S": [
    { icon: Pill, category: "Supplementation", tips: ["DHEA 25-50mg/day if low", "Start low and titrate up", "Take in morning", "Monitor estrogen in men"], priority: "high" },
    { icon: Brain, category: "Stress Management", tips: ["Chronic stress depletes DHEA", "Adrenal support herbs", "Adequate sleep crucial", "Adaptogenic herbs (ashwagandha)"], priority: "medium" },
  ],
  "Estradiol": [
    { icon: Apple, category: "If High (Men)", tips: ["Reduce body fat - aromatization occurs in fat", "Cruciferous vegetables (DIM/I3C)", "Limit alcohol which raises estrogen", "Avoid xenoestrogens in plastics"], priority: "high" },
    { icon: Pill, category: "Support", tips: ["DIM supplement (100-200mg)", "Calcium D-glucarate", "Zinc inhibits aromatase mildly"], priority: "medium" },
  ],
  "Cortisol": [
    { icon: Brain, category: "Stress Management", tips: ["Daily meditation/breathwork", "Regular moderate exercise", "Nature exposure", "Social connection"], priority: "high" },
    { icon: Moon, category: "Sleep", tips: ["Consistent sleep schedule", "Avoid screens before bed", "Dark, cool room", "No caffeine after noon"], priority: "high" },
    { icon: Pill, category: "Adaptogens", tips: ["Ashwagandha (300-600mg)", "Rhodiola rosea", "Phosphatidylserine at night", "Holy basil"], priority: "medium" },
  ],
  "PSA": [
    { icon: Apple, category: "Prostate Health", tips: ["Lycopene from cooked tomatoes", "Cruciferous vegetables", "Pumpkin seeds (zinc)", "Green tea"], priority: "medium" },
    { icon: Pill, category: "Supplements", tips: ["Saw palmetto (if BPH)", "Zinc (15-30mg)", "Selenium", "Vitamin D optimization"], priority: "medium" },
    { icon: Activity, category: "Lifestyle", tips: ["Regular ejaculation may help", "Maintain healthy weight", "Reduce dairy if very high intake", "Annual screening after 50"], priority: "medium" },
  ],
  "GGT": [
    { icon: Apple, category: "Liver Support", tips: ["Eliminate or reduce alcohol", "Milk thistle for liver support", "NAC (N-Acetyl Cysteine)", "Cruciferous vegetables"], priority: "high" },
    { icon: Activity, category: "Lifestyle", tips: ["Maintain healthy weight", "Avoid unnecessary medications", "Reduce toxin exposure", "Coffee may be protective"], priority: "medium" },
  ],
  "ALT": [
    { icon: Apple, category: "Liver Support", tips: ["Reduce/eliminate alcohol", "Avoid high fructose corn syrup", "Address fatty liver with diet", "Milk thistle (200-400mg)"], priority: "high" },
    { icon: Dumbbell, category: "Exercise", tips: ["Weight loss if overweight", "Regular exercise improves liver enzymes", "Avoid extreme exercise which raises ALT"], priority: "medium" },
  ],
  "AST": [
    { icon: Apple, category: "Support", tips: ["Similar to ALT recommendations", "Can also be from muscle damage", "Rest if from exercise", "Liver-supportive herbs"], priority: "medium" },
  ],
  "Creatinine": [
    { icon: Activity, category: "Kidney Health", tips: ["Stay well hydrated", "Control blood pressure", "Manage blood sugar", "Limit NSAIDs"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Moderate protein if kidneys compromised", "Reduce sodium", "Adequate hydration crucial"], priority: "medium" },
  ],
  "eGFR": [
    { icon: Activity, category: "Kidney Protection", tips: ["Control blood pressure", "Manage diabetes carefully", "Stay hydrated", "Avoid nephrotoxic drugs"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Heart-healthy diet supports kidneys", "Limit sodium", "Adequate but not excessive protein"], priority: "medium" },
  ],
  "Magnesium": [
    { icon: Pill, category: "Supplementation", tips: ["Magnesium glycinate for absorption", "400-600mg daily", "Take at night for sleep", "Citrate form if constipated"], priority: "high" },
    { icon: Apple, category: "Food Sources", tips: ["Dark chocolate (85%+)", "Pumpkin seeds", "Leafy greens", "Avocado"], priority: "medium" },
  ],
  "Calcium": [
    { icon: Apple, category: "Food Sources", tips: ["Dairy if tolerated", "Sardines with bones", "Leafy greens (kale, bok choy)", "Fortified foods"], priority: "high" },
    { icon: Pill, category: "Supplementation", tips: ["Get from food if possible", "If supplementing, take with K2", "Don't exceed 500mg at once", "Spread throughout day"], priority: "medium" },
  ],
  "Uric Acid": [
    { icon: Apple, category: "Diet", tips: ["Reduce high-purine foods moderately", "Eliminate fructose/HFCS", "Increase hydration", "Cherries may help lower uric acid"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Vitamin C (500mg) lowers uric acid", "Tart cherry extract", "Adequate hydration"], priority: "medium" },
  ],
  "SHBG": [
    { icon: Apple, category: "If High", tips: ["Increase carbohydrates moderately", "Boron supplementation (10mg)", "Check thyroid function", "Nettle root extract"], priority: "high" },
    { icon: Apple, category: "If Low", tips: ["Often indicates insulin resistance", "Address metabolic health", "Weight loss if overweight", "Reduce sugar intake"], priority: "high" },
  ],
  "Insulin": [
    { icon: Apple, category: "Diet", tips: ["Low carb or Mediterranean diet", "Time-restricted eating", "Protein and fat first at meals", "Eliminate liquid calories"], priority: "high" },
    { icon: Dumbbell, category: "Exercise", tips: ["Resistance training crucial", "Walking after meals", "Build muscle mass", "Stay active throughout day"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Berberine is highly effective", "Chromium", "Alpha-lipoic acid", "Magnesium"], priority: "medium" },
  ],
  "Iron, Total": [
    { icon: Apple, category: "If Low", tips: ["Red meat is most bioavailable source", "Pair plant iron with vitamin C", "Avoid coffee/tea with iron meals", "Cook in cast iron"], priority: "high" },
    { icon: Activity, category: "If High", tips: ["Consider blood donation", "Reduce red meat intake", "Avoid iron supplements/fortified foods", "Check for hemochromatosis"], priority: "high" },
  ],
  "% Saturation": [
    { icon: Apple, category: "If Low", tips: ["Similar approach to low iron", "Increase iron intake with vitamin C", "Address any absorption issues"], priority: "high" },
    { icon: Activity, category: "If High", tips: ["May indicate iron overload", "Blood donation helps", "Genetic testing for hemochromatosis"], priority: "high" },
  ],
  "T4, Free": [
    { icon: Pill, category: "Thyroid Support", tips: ["Selenium (200mcg/day) essential", "Iodine from diet/supplement", "Check for underlying conditions"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Tyrosine-rich foods for production", "Avoid excess soy/goitrogens", "Adequate calories for thyroid"], priority: "medium" },
  ],
  "T3, Free": [
    { icon: Pill, category: "Conversion Support", tips: ["Selenium for T4→T3 conversion", "Zinc supports conversion", "Iron needed for conversion", "Reduce stress (cortisol blocks conversion)"], priority: "high" },
    { icon: Apple, category: "Diet", tips: ["Adequate protein and calories", "Don't go very low carb long-term", "Support liver health"], priority: "medium" },
  ],
  "MCV": [
    { icon: Pill, category: "If High", tips: ["B12 supplementation (methylcobalamin)", "Folate (methylfolate form)", "Check for absorption issues", "Reduce alcohol"], priority: "high" },
    { icon: Apple, category: "If Low", tips: ["May indicate iron deficiency", "Iron-rich foods with vitamin C", "Check for chronic disease"], priority: "high" },
  ],
  "RDW": [
    { icon: Activity, category: "Investigation", tips: ["High RDW needs root cause identification", "May indicate mixed nutritional deficiencies", "Associated with inflammation", "Check iron, B12, folate"], priority: "high" },
    { icon: Apple, category: "Support", tips: ["Address any nutritional deficiencies", "Anti-inflammatory diet", "Optimize iron and B-vitamins"], priority: "medium" },
  ],
  "Platelet Count": [
    { icon: Activity, category: "If Low", tips: ["Avoid NSAIDs and aspirin", "Identify underlying cause", "May need hematology consult"], priority: "high" },
    { icon: Activity, category: "If High", tips: ["Stay hydrated", "Often reactive to inflammation", "Address underlying infection/inflammation"], priority: "medium" },
  ],
  "Testosterone, Bioavailable": [
    { icon: Dumbbell, category: "Exercise", tips: ["Heavy compound lifts boost testosterone", "HIIT training effective", "Avoid chronic cardio", "Adequate rest between workouts"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Boron may help (10mg)", "Vitamin D3 optimization", "Zinc if deficient", "Ashwagandha (600mg/day)"], priority: "medium" },
  ],
  "Sex Hormone Binding Globulin": [
    { icon: Apple, category: "If High", tips: ["Moderate carbohydrate increase", "Boron supplementation", "Check thyroid function", "Nettle root extract"], priority: "high" },
    { icon: Apple, category: "If Low", tips: ["Address insulin resistance first", "Weight loss helps", "Reduce refined carbs"], priority: "high" },
  ],
  "DHEA Sulfate": [
    { icon: Pill, category: "If Low", tips: ["DHEA 25-50mg in morning", "Start low, titrate up", "Monitor estrogen levels", "Support adrenal function"], priority: "high" },
    { icon: Brain, category: "Stress Management", tips: ["Chronic stress depletes DHEA", "Prioritize sleep", "Adaptogenic herbs", "Mind-body practices"], priority: "medium" },
  ],
  "Non-HDL Cholesterol": [
    { icon: Apple, category: "Diet", tips: ["Increase soluble fiber intake", "Mediterranean diet pattern", "Plant sterols (2g/day)", "Reduce refined carbs"], priority: "high" },
    { icon: Dumbbell, category: "Exercise", tips: ["Aerobic exercise most effective", "Consistency over intensity", "150+ min/week moderate activity"], priority: "high" },
    { icon: Pill, category: "Supplements", tips: ["Citrus bergamot (500-1000mg)", "Omega-3 fish oil", "Consider with statin if needed"], priority: "medium" },
  ],
  "BUN (Urea Nitrogen)": [
    { icon: Activity, category: "If Elevated", tips: ["Increase hydration", "May indicate dehydration", "Check kidney function", "Moderate protein if kidneys compromised"], priority: "high" },
  ],
};

// Default tips for markers without specific recommendations
const defaultTips = [
  {
    icon: Activity,
    category: "General Wellness",
    tips: ["Maintain regular exercise routine", "Prioritize quality sleep", "Manage stress levels"],
    priority: "medium" as const,
  },
  {
    icon: Apple,
    category: "Nutrition",
    tips: ["Eat whole, unprocessed foods", "Stay hydrated", "Balance macronutrients"],
    priority: "medium" as const,
  },
];

// Calculate trend direction and percentage
function calculateTrend(data: { date: string; value: number }[]): {
  direction: "up" | "down" | "stable";
  percentChange: number;
} {
  if (data.length < 2) return { direction: "stable", percentChange: 0 };

  const oldest = data[0].value;
  const newest = data[data.length - 1].value;
  const percentChange = ((newest - oldest) / oldest) * 100;

  if (Math.abs(percentChange) < 3) return { direction: "stable", percentChange: 0 };
  return {
    direction: percentChange > 0 ? "up" : "down",
    percentChange: Math.abs(percentChange),
  };
}

// Project future values based on trend - caps at optimal range
function projectFutureValues(
  data: { date: string; value: number }[],
  monthsAhead: number,
  optimalRange: OptimalRange
): { date: string; projected: number; optimal_low: number; optimal_high: number }[] {
  if (data.length < 2) return [];

  // Simple linear regression
  const n = data.length;
  const xSum = data.reduce((sum, _, i) => sum + i, 0);
  const ySum = data.reduce((sum, d) => sum + d.value, 0);
  const xySum = data.reduce((sum, d, i) => sum + i * d.value, 0);
  const xxSum = data.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
  const intercept = (ySum - slope * xSum) / n;

  const projections: { date: string; projected: number; optimal_low: number; optimal_high: number }[] = [];
  const lastDate = new Date(data[data.length - 1].date);
  const lastValue = data[data.length - 1].value;

  // Determine if we're trending toward optimal or away from it
  const optimalMid = (optimalRange.optimal_low + optimalRange.optimal_high) / 2;
  const isIncreasing = slope > 0;

  // Check if already in optimal range
  const isInOptimal = lastValue >= optimalRange.optimal_low && lastValue <= optimalRange.optimal_high;

  for (let i = 1; i <= monthsAhead; i++) {
    const futureDate = addMonths(lastDate, i);
    let projectedValue = intercept + slope * (n - 1 + i);

    // Smart capping:
    // - If trending up and would exceed optimal_high, cap at optimal_high
    // - If trending down and would go below optimal_low, cap at optimal_low
    // - If already optimal, trend toward middle of optimal range then flatten
    if (isInOptimal) {
      // If in optimal, gently trend toward middle then flatten
      const distanceToMid = optimalMid - lastValue;
      projectedValue = lastValue + (distanceToMid * 0.1 * i); // Slow drift to middle
      projectedValue = Math.max(optimalRange.optimal_low, Math.min(optimalRange.optimal_high, projectedValue));
    } else if (isIncreasing) {
      // Trending up - cap at optimal_high (or optimal_low if below and increasing toward it)
      if (lastValue < optimalRange.optimal_low) {
        // Below optimal and increasing - good! Cap at optimal_high
        projectedValue = Math.min(projectedValue, optimalRange.optimal_high);
      } else {
        // Above optimal and still increasing - bad! Cap at optimal_high
        projectedValue = Math.min(projectedValue, optimalRange.optimal_high);
      }
    } else {
      // Trending down - cap at optimal_low
      if (lastValue > optimalRange.optimal_high) {
        // Above optimal and decreasing - good! Cap at optimal_low
        projectedValue = Math.max(projectedValue, optimalRange.optimal_low);
      } else {
        // Below optimal and decreasing - bad! Cap at optimal_low
        projectedValue = Math.max(projectedValue, optimalRange.optimal_low);
      }
    }

    projections.push({
      date: safeFormat(futureDate, "MMM yyyy"),
      projected: Math.max(0, Math.round(projectedValue * 10) / 10),
      optimal_low: optimalRange.optimal_low,
      optimal_high: optimalRange.optimal_high,
    });
  }

  return projections;
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium mb-2 text-white">{label}</p>
      {payload.map((entry, index) => {
        if (entry.value === undefined || entry.value === null) return null;
        return (
          <p key={index} className="text-sm flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: "#3b82f6" }}
            />
            <span className="text-slate-300">Value:</span>
            <span className="font-bold text-white">{entry.value}</span>
          </p>
        );
      })}
    </div>
  );
}

export function BiomarkerTrends({
  isOpen,
  onClose,
  patientContext,
  historicalData,
  currentMarkers,
  patientName,
  isPatientView = false,
  initialSelectedMarker,
}: BiomarkerTrendsProps & { initialSelectedMarker?: string }) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(initialSelectedMarker || null);
  const [trendTimeframe, setTrendTimeframe] = useState("1y");

  // Update selected marker when initialSelectedMarker changes (e.g., when opening from a specific marker)
  useEffect(() => {
    if (initialSelectedMarker && isOpen) {
      setSelectedMarker(initialSelectedMarker);
    }
  }, [initialSelectedMarker, isOpen]);

  // All markers available for viewing
  const allMarkers = useMemo(() => {
    // Prioritize markers with historical data, then show all others
    const withHistory = currentMarkers.filter((m) =>
      historicalData.some((h) => h.markers[m.name] !== undefined)
    );
    const withoutHistory = currentMarkers.filter((m) =>
      !historicalData.some((h) => h.markers[m.name] !== undefined)
    );
    return [...withHistory, ...withoutHistory];
  }, [currentMarkers, historicalData]);

  // Check if marker has historical data
  const hasHistoricalData = (markerName: string) => {
    return historicalData.some((h) => h.markers[markerName] !== undefined);
  };

  // Get chart data for a specific marker
  const getChartData = (markerName: string) => {
    return historicalData
      .filter((h) => h.markers[markerName] !== undefined)
      .map((h) => ({
        date: safeFormat(h.date, "MMM yyyy"),
        value: h.markers[markerName],
      }));
  };

  // Get the selected marker details
  const selectedMarkerDetails = useMemo(() => {
    if (!selectedMarker) return null;
    return currentMarkers.find((m) => m.name === selectedMarker);
  }, [selectedMarker, currentMarkers]);

  // Get improvement tips for selected marker
  const selectedMarkerTips = useMemo(() => {
    if (!selectedMarker) return defaultTips;
    return improvementTips[selectedMarker] || defaultTips;
  }, [selectedMarker]);

  // Calculate months to optimal for selected marker
  const monthsToOptimal = useMemo(() => {
    if (!selectedMarkerDetails) return null;

    const chartData = getChartData(selectedMarkerDetails.name);
    if (chartData.length < 2) return null;

    const trend = calculateTrend(chartData);
    if (trend.direction === "stable") return null;

    const current = chartData[chartData.length - 1].value;
    const { optimal_low, optimal_high } = selectedMarkerDetails.optimalRange;
    const optimalMid = (optimal_low + optimal_high) / 2;

    // Calculate rate of change per month
    const oldest = chartData[0].value;
    const newest = chartData[chartData.length - 1].value;
    const monthsBetween = historicalData.length > 1 ?
      (historicalData[historicalData.length - 1].date.getTime() - historicalData[0].date.getTime()) / (1000 * 60 * 60 * 24 * 30) : 1;
    const ratePerMonth = (newest - oldest) / monthsBetween;

    if (Math.abs(ratePerMonth) < 0.1) return null;

    // If already optimal
    if (current >= optimal_low && current <= optimal_high) return 0;

    // Calculate months to reach optimal
    const targetValue = current < optimal_low ? optimal_low : optimal_high;
    const monthsNeeded = Math.ceil(Math.abs((targetValue - current) / ratePerMonth));

    // Check if trend is going the right direction
    const isMovingTowardsOptimal =
      (current < optimal_low && ratePerMonth > 0) ||
      (current > optimal_high && ratePerMonth < 0);

    if (!isMovingTowardsOptimal) return null;

    return monthsNeeded;
  }, [selectedMarkerDetails, historicalData]);

  // Mobile marker selector
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Track if component is mounted (for SSR safety)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[90vh] md:max-h-[90vh] h-[95dvh] md:h-auto p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg md:text-xl">
                {isPatientView ? "Your Health Trends" : "Biomarker Trends"}
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm truncate">
                {patientName ? `${patientName} • ` : ""}
                Track progress over time with AI-powered insights
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Mobile marker selector */}
        <div className="md:hidden px-4 py-3 border-b shrink-0 bg-background">
          <Select
            value={selectedMarker || ""}
            onValueChange={(value) => setSelectedMarker(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a biomarker">
                {selectedMarker && selectedMarkerDetails && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{selectedMarker}</span>
                    <Badge variant="outline" className={`${selectedMarkerDetails.color} border-current text-xs shrink-0`}>
                      {selectedMarkerDetails.score}
                    </Badge>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[50vh]">
              {allMarkers.map((marker) => {
                const chartData = getChartData(marker.name);
                const trend = calculateTrend(chartData);
                const hasTrend = hasHistoricalData(marker.name);
                const higherIsWorse = ["LDL Cholesterol", "hs-CRP", "TSH", "Triglycerides", "Hemoglobin A1c", "Glucose", "Homocysteine", "Cortisol", "Estradiol", "ALT", "AST", "GGT", "Uric Acid", "Insulin"].includes(marker.name);

                return (
                  <SelectItem key={marker.name} value={marker.name}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="truncate">{marker.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-sm font-bold ${marker.color}`}>{marker.value}</span>
                        {hasTrend && trend.direction !== "stable" && (
                          trend.direction === "up" ? (
                            <TrendingUp className={`h-3 w-3 ${higherIsWorse ? "text-destructive" : "text-emerald-500"}`} />
                          ) : (
                            <TrendingDown className={`h-3 w-3 ${higherIsWorse ? "text-emerald-500" : "text-destructive"}`} />
                          )
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden md:flex-row">
          {/* Desktop sidebar - marker list */}
          <div className="hidden md:block w-72 border-r shrink-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  All Biomarkers ({allMarkers.length})
                </p>
                {allMarkers.map((marker) => {
                  const chartData = getChartData(marker.name);
                  const trend = calculateTrend(chartData);
                  const isSelected = selectedMarker === marker.name;
                  const hasTrend = hasHistoricalData(marker.name);

                  // Determine if higher is worse for this marker
                  const higherIsWorse = ["LDL Cholesterol", "hs-CRP", "TSH", "Triglycerides", "Hemoglobin A1c", "Glucose", "Homocysteine", "Cortisol", "Estradiol", "ALT", "AST", "GGT", "Uric Acid", "Insulin"].includes(marker.name);

                  return (
                    <button
                      key={marker.name}
                      onClick={() => setSelectedMarker(marker.name)}
                      className={`w-full text-left rounded-lg border p-3 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{marker.name}</span>
                        {hasTrend ? (
                          trend.direction === "up" ? (
                            <TrendingUp className={`h-4 w-4 ${higherIsWorse ? "text-destructive" : "text-emerald-500"}`} />
                          ) : trend.direction === "down" ? (
                            <TrendingDown className={`h-4 w-4 ${higherIsWorse ? "text-emerald-500" : "text-destructive"}`} />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          )
                        ) : (
                          <Activity className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-lg font-bold ${marker.color}`}>
                          {marker.value}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {marker.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`${marker.color} border-current text-xs`}
                        >
                          {marker.score}
                        </Badge>
                        {hasTrend && trend.percentChange > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {trend.direction === "up" ? "+" : "-"}
                            {trend.percentChange.toFixed(0)}%
                          </span>
                        )}
                        {!hasTrend && (
                          <span className="text-xs text-muted-foreground/50">No history</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <ScrollArea className="h-full w-full">
              {selectedMarker && selectedMarkerDetails ? (
                <div className="p-4 md:p-6 space-y-4 md:space-y-6 pb-8">
                  {/* Header with current status */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold">{selectedMarker}</h3>
                      <div className="flex items-center flex-wrap gap-2 md:gap-3 mt-1">
                        <span className={`text-2xl md:text-3xl font-bold ${selectedMarkerDetails.color}`}>
                          {selectedMarkerDetails.value}
                        </span>
                        <span className="text-base md:text-lg text-muted-foreground">
                          {selectedMarkerDetails.unit}
                        </span>
                        <Badge className={`${selectedMarkerDetails.bgColor} text-white`}>
                          {selectedMarkerDetails.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs md:text-sm text-muted-foreground">Optimal Range</p>
                      <p className="text-base md:text-lg font-medium">
                        {selectedMarkerDetails.optimalRange.optimal_low} - {selectedMarkerDetails.optimalRange.optimal_high} {selectedMarkerDetails.unit}
                      </p>
                    </div>
                  </div>

                  {/* What is this marker? */}
                  {markerDescriptions[selectedMarker] && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 shrink-0 mt-0.5">
                          <Brain className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-1">What is {selectedMarker}?</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {markerDescriptions[selectedMarker]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Your result interpretation */}
                  {selectedMarkerDetails.interpretation && (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="font-medium text-sm mb-1">Your Result</p>
                      <p className="text-sm text-muted-foreground">{selectedMarkerDetails.interpretation}</p>
                    </div>
                  )}

                  {/* Progress to goal */}
                  {monthsToOptimal !== null && monthsToOptimal > 0 && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {isPatientView ? "You're on track!" : "Patient is on track!"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              At current rate, {isPatientView ? "you could" : "expected to"} reach optimal range in{" "}
                              <span className="font-medium text-primary">{monthsToOptimal} months</span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Trend Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">Trend Over Time</CardTitle>
                          <CardDescription>
                            Historical values with optimal range
                          </CardDescription>
                        </div>
                        <Select value={trendTimeframe} onValueChange={setTrendTimeframe}>
                          <SelectTrigger className="w-[130px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6m">6 Months</SelectItem>
                            <SelectItem value="1y">1 Year</SelectItem>
                            <SelectItem value="2y">2 Years</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const allChartData = getChartData(selectedMarker);

                        // Filter by timeframe
                        const now = new Date();
                        const cutoff = trendTimeframe === "6m" ? new Date(now.getFullYear(), now.getMonth() - 6, 1)
                          : trendTimeframe === "1y" ? new Date(now.getFullYear() - 1, now.getMonth(), 1)
                          : trendTimeframe === "2y" ? new Date(now.getFullYear() - 2, now.getMonth(), 1)
                          : new Date(2000, 0, 1); // "all"
                        const chartData = trendTimeframe === "all" ? allChartData : allChartData.filter(d => {
                          const parts = d.date.split(" ");
                          const monthIndex = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(parts[0]);
                          const year = parseInt(parts[1]);
                          if (isNaN(year)) return true;
                          const dataDate = new Date(year, monthIndex, 1);
                          return dataDate >= cutoff;
                        });

                        // If no historical data, show a message
                        if (chartData.length === 0) {
                          return (
                            <div className="h-[200px] flex flex-col items-center justify-center text-center">
                              <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                              <p className="font-medium text-muted-foreground">No Historical Data Yet</p>
                              <p className="text-sm text-muted-foreground/70 max-w-md mt-1">
                                This marker will show trends once you have multiple lab results over time.
                                Your current value is shown above.
                              </p>
                            </div>
                          );
                        }

                        const combinedData = chartData.map((d) => ({
                          date: d.date,
                          value: d.value,
                          optimal_low: selectedMarkerDetails.optimalRange.optimal_low,
                          optimal_high: selectedMarkerDetails.optimalRange.optimal_high,
                        }));

                        const chartFallback = (
                          <div className="h-[200px] flex flex-col items-center justify-center text-center">
                            <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="font-medium text-muted-foreground">Unable to render chart</p>
                            <p className="text-sm text-muted-foreground/70 max-w-md mt-1">
                              There was an issue displaying the trend chart.
                            </p>
                          </div>
                        );

                        return (
                          <ChartErrorBoundary fallback={chartFallback}>
                            <div className="h-[250px] md:h-[300px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={combinedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />
                                  <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                    axisLine={{ stroke: "#475569" }}
                                    tickLine={{ stroke: "#475569" }}
                                    interval="preserveStartEnd"
                                  />
                                  <YAxis
                                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                                    axisLine={{ stroke: "#475569" }}
                                    tickLine={{ stroke: "#475569" }}
                                    domain={['auto', 'auto']}
                                    width={40}
                                  />
                                  <Tooltip content={<CustomTooltip />} />

                                  {/* Reference lines for optimal range */}
                                  <ReferenceLine
                                    y={selectedMarkerDetails.optimalRange.optimal_low}
                                    stroke="#22c55e"
                                    strokeDasharray="5 5"
                                    strokeOpacity={0.7}
                                  />
                                  <ReferenceLine
                                    y={selectedMarkerDetails.optimalRange.optimal_high}
                                    stroke="#22c55e"
                                    strokeDasharray="5 5"
                                    strokeOpacity={0.7}
                                  />

                                  {/* Actual values */}
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: "#3b82f6", r: 4, strokeWidth: 2, stroke: "#1e3a5f" }}
                                    activeDot={{ r: 6, fill: "#3b82f6" }}
                                    name="Actual"
                                    connectNulls={true}
                                  />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                          </ChartErrorBoundary>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Improvement Tips */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        <CardTitle className="text-sm md:text-base">
                          {isPatientView ? "How to Improve" : "Optimization Recommendations"}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-xs md:text-sm">
                        Evidence-based strategies to optimize this marker
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
                        {selectedMarkerTips.map((tipGroup, idx) => {
                          const Icon = tipGroup.icon;
                          return (
                            <div
                              key={idx}
                              className={`rounded-lg border p-3 md:p-4 ${
                                tipGroup.priority === "high"
                                  ? "border-primary/30 bg-primary/5"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <div className={`flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full shrink-0 ${
                                  tipGroup.priority === "high"
                                    ? "bg-primary/20"
                                    : "bg-muted"
                                }`}>
                                  <Icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${
                                    tipGroup.priority === "high"
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-xs md:text-sm">{tipGroup.category}</p>
                                  {tipGroup.priority === "high" && (
                                    <Badge variant="outline" className="text-[10px] md:text-xs text-primary border-primary">
                                      High Impact
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <ul className="space-y-1.5 md:space-y-2">
                                {tipGroup.tips.map((tip, tipIdx) => (
                                  <li key={tipIdx} className="flex items-start gap-1.5 md:gap-2 text-xs md:text-sm">
                                    <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0 mt-0.5" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Protocol Correlation (Provider view only) */}
                  {!isPatientView && selectedMarker === "IGF-1" && (
                    <Card className="border-emerald-500/30 bg-emerald-500/5">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-emerald-500" />
                          <CardTitle className="text-base">Protocol Impact</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          IGF-1 increased <span className="font-medium text-emerald-500">+22%</span> since starting Sermorelin protocol on Aug 1, 2025.
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            Sermorelin 300mcg
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span>Nightly injection</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                // Empty state
                <div className="flex flex-col items-center justify-center h-full p-4 md:p-6 text-center">
                  <Activity className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
                  <h3 className="font-semibold text-sm md:text-base mb-2">Select a Biomarker</h3>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-md">
                    Choose a marker to view detailed trends and personalized improvement recommendations.
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
