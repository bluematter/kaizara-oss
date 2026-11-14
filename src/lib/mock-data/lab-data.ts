// ============================================================================
// DEMO MODE - PROTOTYPE LAB DATA
// ============================================================================
// This lab data is for demonstration purposes only.
// Replace with real database queries before production deployment.
// ============================================================================

export interface LabMarker {
  name: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number | null;
    max: number | null;
  };
  status: "normal" | "low" | "high" | "critical";
  category: string;
}

export interface LabPanel {
  id: string;
  patientId: string;
  collectedAt: Date;
  reportedAt: Date;
  specimenId: string;
  labProvider: string;
  fasting: boolean;
  markers: LabMarker[];
  aiSummary?: string;
}

// Helper to determine status
function getStatus(value: number, min: number | null, max: number | null): "normal" | "low" | "high" {
  if (min !== null && value < min) return "low";
  if (max !== null && value > max) return "high";
  return "normal";
}

// Nov 2025 lab data (previous "current")
export const jamieRiveraNov2025LabData: LabPanel = {
  id: "lab-panel-9mo",
  patientId: "jamie-rivera",
  collectedAt: new Date("2025-11-04T09:00:00-08:00"),
  reportedAt: new Date("2025-11-10T11:49:00-08:00"),
  specimenId: "EN868086A",
  labProvider: "Quest Diagnostics",
  fasting: true,
  markers: [
    { name: "White Blood Cell Count", value: 6.0, unit: "Thousand/uL", referenceRange: { min: 3.8, max: 10.8 }, status: "normal", category: "CBC" },
    { name: "Red Blood Cell Count", value: 5.30, unit: "Million/uL", referenceRange: { min: 4.20, max: 5.80 }, status: "normal", category: "CBC" },
    { name: "Hemoglobin", value: 16.0, unit: "g/dL", referenceRange: { min: 13.2, max: 17.1 }, status: "normal", category: "CBC" },
    { name: "Hematocrit", value: 48.9, unit: "%", referenceRange: { min: 38.5, max: 50.0 }, status: "normal", category: "CBC" },
    { name: "Platelet Count", value: 152, unit: "Thousand/uL", referenceRange: { min: 140, max: 400 }, status: "normal", category: "CBC" },
    { name: "Glucose", value: 95, unit: "mg/dL", referenceRange: { min: 65, max: 99 }, status: "normal", category: "Metabolic" },
    { name: "Creatinine", value: 1.40, unit: "mg/dL", referenceRange: { min: 0.60, max: 1.26 }, status: "high", category: "Metabolic" },
    { name: "eGFR", value: 68, unit: "mL/min/1.73m2", referenceRange: { min: 60, max: null }, status: "normal", category: "Metabolic" },
    { name: "Bilirubin, Total", value: 1.0, unit: "mg/dL", referenceRange: { min: 0.2, max: 1.2 }, status: "normal", category: "Metabolic" },
    { name: "Hemoglobin A1c", value: 5.4, unit: "%", referenceRange: { min: null, max: 5.7 }, status: "normal", category: "Diabetes" },
    { name: "TSH", value: 3.56, unit: "mIU/L", referenceRange: { min: 0.40, max: 4.50 }, status: "normal", category: "Thyroid" },
    { name: "T4, Free", value: 1.3, unit: "ng/dL", referenceRange: { min: 0.8, max: 1.8 }, status: "normal", category: "Thyroid" },
    { name: "T3, Free", value: 3.5, unit: "pg/mL", referenceRange: { min: 2.3, max: 4.2 }, status: "normal", category: "Thyroid" },
    { name: "Iron, Total", value: 105, unit: "mcg/dL", referenceRange: { min: 50, max: 180 }, status: "normal", category: "Iron" },
    { name: "Ferritin", value: 110, unit: "ng/mL", referenceRange: { min: 18, max: 300 }, status: "normal", category: "Iron" },
    { name: "Testosterone, Total", value: 504, unit: "ng/dL", referenceRange: { min: 250, max: 1100 }, status: "low", category: "Hormones" },
    { name: "Testosterone, Free", value: 85.6, unit: "pg/mL", referenceRange: { min: 46.0, max: 224.0 }, status: "normal", category: "Hormones" },
    { name: "DHEA Sulfate", value: 280, unit: "mcg/dL", referenceRange: { min: 93, max: 415 }, status: "normal", category: "Hormones" },
    { name: "Cortisol, AM", value: 17.2, unit: "mcg/dL", referenceRange: { min: 4.0, max: 22.0 }, status: "normal", category: "Hormones" },
    { name: "IGF-1", value: 242, unit: "ng/mL", referenceRange: { min: 53, max: 331 }, status: "normal", category: "Growth Factors" },
    { name: "Cholesterol, Total", value: 224, unit: "mg/dL", referenceRange: { min: null, max: 200 }, status: "high", category: "Lipids" },
    { name: "HDL Cholesterol", value: 48, unit: "mg/dL", referenceRange: { min: 40, max: null }, status: "normal", category: "Lipids" },
    { name: "LDL Cholesterol", value: 149, unit: "mg/dL", referenceRange: { min: null, max: 100 }, status: "high", category: "Lipids" },
    { name: "Triglycerides", value: 142, unit: "mg/dL", referenceRange: { min: null, max: 150 }, status: "normal", category: "Lipids" },
    { name: "hs-CRP", value: 0.4, unit: "mg/L", referenceRange: { min: null, max: 1.0 }, status: "normal", category: "Inflammation" },
    { name: "Vitamin D, 25-OH", value: 56, unit: "ng/mL", referenceRange: { min: 30, max: 100 }, status: "normal", category: "Vitamins" },
  ],
};

// Current lab data - Feb 2026 (most recent)
export const jamieRiveraLabData: LabPanel = {
  id: "lab-panel-feb2026",
  patientId: "jamie-rivera",
  collectedAt: new Date("2026-02-10T09:00:00-08:00"),
  reportedAt: new Date("2026-02-14T14:00:00-08:00"),
  specimenId: "EN920142A",
  labProvider: "Quest Diagnostics",
  fasting: true,
  markers: [
    // CBC Panel
    { name: "White Blood Cell Count", value: 6.1, unit: "Thousand/uL", referenceRange: { min: 3.8, max: 10.8 }, status: "normal", category: "CBC" },
    { name: "Red Blood Cell Count", value: 5.57, unit: "Million/uL", referenceRange: { min: 4.20, max: 5.80 }, status: "normal", category: "CBC" },
    { name: "Hemoglobin", value: 17.0, unit: "g/dL", referenceRange: { min: 13.2, max: 17.1 }, status: "normal", category: "CBC" },
    { name: "Hematocrit", value: 50.0, unit: "%", referenceRange: { min: 38.5, max: 50.0 }, status: "normal", category: "CBC" },
    { name: "MCV", value: 89.8, unit: "fL", referenceRange: { min: 80.0, max: 100.0 }, status: "normal", category: "CBC" },
    { name: "MCH", value: 30.5, unit: "pg", referenceRange: { min: 27.0, max: 33.0 }, status: "normal", category: "CBC" },
    { name: "MCHC", value: 34.0, unit: "g/dL", referenceRange: { min: 32.0, max: 36.0 }, status: "normal", category: "CBC" },
    { name: "RDW", value: 12.0, unit: "%", referenceRange: { min: 11.0, max: 15.0 }, status: "normal", category: "CBC" },
    { name: "Platelet Count", value: 143, unit: "Thousand/uL", referenceRange: { min: 140, max: 400 }, status: "normal", category: "CBC" },
    { name: "MPV", value: 11.8, unit: "fL", referenceRange: { min: 7.5, max: 12.5 }, status: "normal", category: "CBC" },
    { name: "Absolute Neutrophils", value: 2800, unit: "cells/uL", referenceRange: { min: 1500, max: 7800 }, status: "normal", category: "CBC" },
    { name: "Absolute Lymphocytes", value: 2450, unit: "cells/uL", referenceRange: { min: 850, max: 3900 }, status: "normal", category: "CBC" },
    { name: "Absolute Monocytes", value: 400, unit: "cells/uL", referenceRange: { min: 200, max: 950 }, status: "normal", category: "CBC" },
    { name: "Absolute Eosinophils", value: 340, unit: "cells/uL", referenceRange: { min: 15, max: 500 }, status: "normal", category: "CBC" },
    { name: "Absolute Basophils", value: 45, unit: "cells/uL", referenceRange: { min: 0, max: 200 }, status: "normal", category: "CBC" },

    // Comprehensive Metabolic Panel
    { name: "Glucose", value: 87, unit: "mg/dL", referenceRange: { min: 65, max: 99 }, status: "normal", category: "Metabolic" },
    { name: "BUN (Urea Nitrogen)", value: 22, unit: "mg/dL", referenceRange: { min: 7, max: 25 }, status: "normal", category: "Metabolic" },
    { name: "Creatinine", value: 1.40, unit: "mg/dL", referenceRange: { min: 0.60, max: 1.26 }, status: "high", category: "Metabolic" },
    { name: "eGFR", value: 68, unit: "mL/min/1.73m2", referenceRange: { min: 60, max: null }, status: "normal", category: "Metabolic" },
    { name: "BUN/Creatinine Ratio", value: 16, unit: "", referenceRange: { min: 6, max: 22 }, status: "normal", category: "Metabolic" },
    { name: "Sodium", value: 141, unit: "mmol/L", referenceRange: { min: 135, max: 146 }, status: "normal", category: "Metabolic" },
    { name: "Potassium", value: 4.5, unit: "mmol/L", referenceRange: { min: 3.5, max: 5.3 }, status: "normal", category: "Metabolic" },
    { name: "Chloride", value: 102, unit: "mmol/L", referenceRange: { min: 98, max: 110 }, status: "normal", category: "Metabolic" },
    { name: "Carbon Dioxide", value: 26, unit: "mmol/L", referenceRange: { min: 20, max: 32 }, status: "normal", category: "Metabolic" },
    { name: "Calcium", value: 9.7, unit: "mg/dL", referenceRange: { min: 8.6, max: 10.3 }, status: "normal", category: "Metabolic" },
    { name: "Protein, Total", value: 7.1, unit: "g/dL", referenceRange: { min: 6.1, max: 8.1 }, status: "normal", category: "Metabolic" },
    { name: "Albumin", value: 4.9, unit: "g/dL", referenceRange: { min: 3.6, max: 5.1 }, status: "normal", category: "Metabolic" },
    { name: "Globulin", value: 2.2, unit: "g/dL", referenceRange: { min: 1.9, max: 3.7 }, status: "normal", category: "Metabolic" },
    { name: "Albumin/Globulin Ratio", value: 2.2, unit: "", referenceRange: { min: 1.0, max: 2.5 }, status: "normal", category: "Metabolic" },
    { name: "Bilirubin, Total", value: 1.4, unit: "mg/dL", referenceRange: { min: 0.2, max: 1.2 }, status: "high", category: "Metabolic" },
    { name: "Alkaline Phosphatase", value: 72, unit: "U/L", referenceRange: { min: 36, max: 130 }, status: "normal", category: "Metabolic" },
    { name: "AST", value: 19, unit: "U/L", referenceRange: { min: 10, max: 40 }, status: "normal", category: "Metabolic" },
    { name: "ALT", value: 28, unit: "U/L", referenceRange: { min: 9, max: 46 }, status: "normal", category: "Metabolic" },

    // HbA1c
    { name: "Hemoglobin A1c", value: 5.3, unit: "%", referenceRange: { min: null, max: 5.7 }, status: "normal", category: "Diabetes" },

    // Thyroid
    { name: "TSH", value: 4.00, unit: "mIU/L", referenceRange: { min: 0.40, max: 4.50 }, status: "normal", category: "Thyroid" },
    { name: "T4, Free", value: 1.5, unit: "ng/dL", referenceRange: { min: 0.8, max: 1.8 }, status: "normal", category: "Thyroid" },
    { name: "T3, Free", value: 3.8, unit: "pg/mL", referenceRange: { min: 2.3, max: 4.2 }, status: "normal", category: "Thyroid" },

    // Iron Panel
    { name: "Iron, Total", value: 97, unit: "mcg/dL", referenceRange: { min: 50, max: 180 }, status: "normal", category: "Iron" },
    { name: "Iron Binding Capacity", value: 347, unit: "mcg/dL", referenceRange: { min: 250, max: 425 }, status: "normal", category: "Iron" },
    { name: "% Saturation", value: 28, unit: "%", referenceRange: { min: 20, max: 48 }, status: "normal", category: "Iron" },
    { name: "Ferritin", value: 387, unit: "ng/mL", referenceRange: { min: 18, max: 300 }, status: "high", category: "Iron" },

    // Hormones
    { name: "Testosterone, Total", value: 508, unit: "ng/dL", referenceRange: { min: 250, max: 1100 }, status: "low", category: "Hormones" },
    { name: "Testosterone, Free", value: 77.2, unit: "pg/mL", referenceRange: { min: 46.0, max: 224.0 }, status: "normal", category: "Hormones" },
    { name: "Testosterone, Bioavailable", value: 179.0, unit: "ng/dL", referenceRange: { min: 110.0, max: 575.0 }, status: "normal", category: "Hormones" },
    { name: "Sex Hormone Binding Globulin", value: 50, unit: "nmol/L", referenceRange: { min: 10, max: 50 }, status: "normal", category: "Hormones" },
    { name: "DHEA Sulfate", value: 306, unit: "mcg/dL", referenceRange: { min: 93, max: 415 }, status: "normal", category: "Hormones" },
    { name: "FSH", value: 12.9, unit: "mIU/mL", referenceRange: { min: 1.6, max: 8.0 }, status: "high", category: "Hormones" },
    { name: "LH", value: 6.6, unit: "mIU/mL", referenceRange: { min: 1.5, max: 9.3 }, status: "normal", category: "Hormones" },
    { name: "Estradiol", value: 15, unit: "pg/mL", referenceRange: { min: null, max: 39 }, status: "normal", category: "Hormones" },
    { name: "DHT", value: 30, unit: "ng/dL", referenceRange: { min: 12, max: 65 }, status: "normal", category: "Hormones" },
    { name: "Cortisol, AM", value: 22.0, unit: "mcg/dL", referenceRange: { min: 4.0, max: 22.0 }, status: "normal", category: "Hormones" },

    // IGF-1
    { name: "IGF-1", value: 234, unit: "ng/mL", referenceRange: { min: 53, max: 331 }, status: "normal", category: "Growth Factors" },
    { name: "IGF-1 Z Score", value: 1.1, unit: "SD", referenceRange: { min: -2.0, max: 2.0 }, status: "normal", category: "Growth Factors" },

    // Lipid Panel
    { name: "Cholesterol, Total", value: 239, unit: "mg/dL", referenceRange: { min: null, max: 200 }, status: "high", category: "Lipids" },
    { name: "HDL Cholesterol", value: 49, unit: "mg/dL", referenceRange: { min: 40, max: null }, status: "normal", category: "Lipids" },
    { name: "Triglycerides", value: 137, unit: "mg/dL", referenceRange: { min: null, max: 150 }, status: "normal", category: "Lipids" },
    { name: "LDL Cholesterol", value: 163, unit: "mg/dL", referenceRange: { min: null, max: 100 }, status: "high", category: "Lipids" },
    { name: "CHOL/HDL Ratio", value: 4.9, unit: "", referenceRange: { min: null, max: 5.0 }, status: "normal", category: "Lipids" },
    { name: "Non-HDL Cholesterol", value: 190, unit: "mg/dL", referenceRange: { min: null, max: 130 }, status: "high", category: "Lipids" },
    { name: "TG/HDL Ratio", value: 2.8, unit: "", referenceRange: { min: null, max: 3.0 }, status: "normal", category: "Lipids" },

    // Inflammation
    { name: "hs-CRP", value: 0.3, unit: "mg/L", referenceRange: { min: null, max: 1.0 }, status: "normal", category: "Inflammation" },

    // Vitamin D
    { name: "Vitamin D, 25-OH", value: 64, unit: "ng/mL", referenceRange: { min: 30, max: 100 }, status: "normal", category: "Vitamins" },
  ],
  aiSummary: `
## Lab Results Summary for Jamie Rivera
**Collection Date:** February 10, 2026 | **Age:** 35 | **Fasting:** Yes

### Overall Assessment: Continued Improvement with Key Areas to Monitor

Your 12-month follow-up shows continued positive trends across most categories.

#### Metabolic Health - Improved
- **HbA1c at 5.3%** - Improved from 5.4%, excellent glucose control
- **Fasting Glucose: 87 mg/dL** - Improved from 95, well within range
- **Creatinine: 1.40 mg/dL** - Stable, still slightly elevated (continue monitoring)
- **Bilirubin: 1.4 mg/dL** - Slightly elevated (likely Gilbert's syndrome, benign)

#### Hormone Panel
- **Total Testosterone: 508 ng/dL** - Stable, still suboptimal for age (goal: 700-900)
- **Free Testosterone: 77.2 pg/mL** - Slightly decreased from 85.6
- **FSH: 12.9 mIU/mL** - Elevated (above reference range)
- **IGF-1: 234 ng/mL (Z-Score: +1.1)** - Good, maintaining response
- **DHEA-S: 306 mcg/dL** - Improved from 280
- **Cortisol: 22.0 mcg/dL** - At upper limit of range

#### Iron - New Flag
- **Ferritin: 387 ng/mL** - Significantly elevated from 110 (investigate cause)

#### Cardiovascular Health - Mixed
- **Total Cholesterol: 239 mg/dL** - Increased from 224
- **LDL Cholesterol: 163 mg/dL** - Increased from 149
- **Triglycerides: 137 mg/dL** - Improved from 142
- **hs-CRP: 0.3 mg/L** - Excellent, down from 0.4

#### Areas of Strength
- Excellent inflammation (hs-CRP 0.3 - lowest yet)
- Strong Vitamin D at 64 ng/mL (up from 56)
- Improved glucose metabolism
- Stable CBC panel

#### Recommendations
1. **Investigate elevated Ferritin** - At 387, significantly above optimal. Rule out hemochromatosis
2. **Address FSH elevation** - May indicate testicular stress; discuss with endocrinologist
3. **Lipid management** - LDL trending up; consider more aggressive intervention
4. **Cortisol management** - At upper limit; assess stress levels and sleep quality
5. Follow up in 3 months with iron studies and hormone panel
`
};

// For trending, historical data showing real lab panels only (Nov 2025 + Feb 2026)
export const jamieRiveraHistoricalLabs: { date: Date; markers: Record<string, number> }[] = [
  {
    // Nov 2025 labs (real panel)
    date: new Date("2025-11-04"),
    markers: {
      // CBC Panel
      "White Blood Cell Count": 6.0,
      "Red Blood Cell Count": 5.30,
      "Hemoglobin": 16.0,
      "Hematocrit": 48.9,
      "MCV": 92.3,
      "MCH": 30.2,
      "MCHC": 32.7,
      "RDW": 12.1,
      "Platelet Count": 152,
      "MPV": 11.7,
      "Absolute Neutrophils": 2718,
      "Absolute Lymphocytes": 2496,
      "Absolute Monocytes": 408,
      "Absolute Eosinophils": 330,
      "Absolute Basophils": 48,

      // Metabolic Panel
      "Glucose": 95,
      "BUN (Urea Nitrogen)": 23,
      "Creatinine": 1.40,
      "eGFR": 68,
      "BUN/Creatinine Ratio": 16,
      "Sodium": 140,
      "Potassium": 4.4,
      "Chloride": 101,
      "Carbon Dioxide": 25,
      "Calcium": 9.6,
      "Protein, Total": 7.0,
      "Albumin": 4.8,
      "Globulin": 2.2,
      "Albumin/Globulin Ratio": 2.2,
      "Bilirubin, Total": 1.0,
      "Alkaline Phosphatase": 74,
      "AST": 20,
      "ALT": 30,

      // Diabetes
      "Hemoglobin A1c": 5.4,

      // Thyroid
      "TSH": 3.56,
      "T4, Free": 1.3,
      "T3, Free": 3.5,

      // Iron Panel
      "Iron, Total": 105,
      "Iron Binding Capacity": 394,
      "% Saturation": 29,
      "Ferritin": 110,

      // Hormones
      "Testosterone, Total": 504,
      "Testosterone, Free": 85.6,
      "Testosterone, Bioavailable": 197.2,
      "Sex Hormone Binding Globulin": 48,
      "DHEA Sulfate": 280,
      "LH": 5.6,
      "Estradiol": 5.6,
      "Cortisol, AM": 17.2,

      // Growth Factors
      "IGF-1": 242,
      "IGF-1 Z Score": 1.2,

      // Lipids
      "Cholesterol, Total": 224,
      "HDL Cholesterol": 48,
      "Triglycerides": 142,
      "LDL Cholesterol": 149,
      "CHOL/HDL Ratio": 4.7,
      "Non-HDL Cholesterol": 176,
      "TG/HDL Ratio": 3.0,

      // Inflammation
      "hs-CRP": 0.4,

      // PSA
      "PSA, Total": 0.5,
      "PSA, Free": 0.3,
      "PSA % Free": 60,

      // Vitamins
      "Vitamin D, 25-OH": 56,

      // EBV Panel
      "EBV VCA IgM": 36,
      "EBV VCA IgG": 504,
      "EBV Nuclear Ag IgG": 175,
    }
  },
  {
    // Feb 2026 labs (Quest Diagnostics)
    date: new Date("2026-02-10"),
    markers: {
      // CBC Panel
      "White Blood Cell Count": 6.1,
      "Red Blood Cell Count": 5.57,
      "Hemoglobin": 17.0,
      "Hematocrit": 50.0,
      "MCV": 89.8,
      "MCH": 30.5,
      "MCHC": 34.0,
      "RDW": 12.0,
      "Platelet Count": 143,
      "MPV": 11.8,
      "Absolute Neutrophils": 2800,
      "Absolute Lymphocytes": 2450,
      "Absolute Monocytes": 400,
      "Absolute Eosinophils": 340,
      "Absolute Basophils": 45,

      // Metabolic Panel
      "Glucose": 87,
      "BUN (Urea Nitrogen)": 22,
      "Creatinine": 1.40,
      "eGFR": 68,
      "BUN/Creatinine Ratio": 16,
      "Sodium": 141,
      "Potassium": 4.5,
      "Chloride": 102,
      "Carbon Dioxide": 26,
      "Calcium": 9.7,
      "Protein, Total": 7.1,
      "Albumin": 4.9,
      "Globulin": 2.2,
      "Albumin/Globulin Ratio": 2.2,
      "Bilirubin, Total": 1.4,
      "Alkaline Phosphatase": 72,
      "AST": 19,
      "ALT": 28,

      // Diabetes
      "Hemoglobin A1c": 5.3,

      // Thyroid
      "TSH": 4.00,
      "T4, Free": 1.5,
      "T3, Free": 3.8,

      // Iron Panel
      "Iron, Total": 97,
      "Iron Binding Capacity": 347,
      "% Saturation": 28,
      "Ferritin": 387,

      // Hormones
      "Testosterone, Total": 508,
      "Testosterone, Free": 77.2,
      "Testosterone, Bioavailable": 179.0,
      "Sex Hormone Binding Globulin": 50,
      "DHEA Sulfate": 306,
      "LH": 6.6,
      "FSH": 12.9,
      "Estradiol": 15,
      "DHT": 30,
      "Cortisol, AM": 22.0,

      // Growth Factors
      "IGF-1": 234,
      "IGF-1 Z Score": 1.1,

      // Lipids
      "Cholesterol, Total": 239,
      "HDL Cholesterol": 49,
      "Triglycerides": 137,
      "LDL Cholesterol": 163,
      "CHOL/HDL Ratio": 4.9,
      "Non-HDL Cholesterol": 190,
      "TG/HDL Ratio": 2.8,

      // Inflammation
      "hs-CRP": 0.3,

      // Vitamins
      "Vitamin D, 25-OH": 64,

      // EBV Panel
      "EBV VCA IgM": 34,
      "EBV VCA IgG": 510,
      "EBV Nuclear Ag IgG": 178,
    }
  }
];

// Full lab panel data for each date (for the date selector)
// Only real panels: Nov 2025 and Feb 2026
export const jamieRiveraLabPanels: LabPanel[] = [
  jamieRiveraLabData,
  jamieRiveraNov2025LabData,
];

// Key biomarkers for peptide/longevity clinics
export const keyBiomarkers = [
  { name: "IGF-1", description: "Growth factor - tracks response to GH secretagogues", unit: "ng/mL", category: "Growth Factors" },
  { name: "Testosterone, Total", description: "Primary male hormone", unit: "ng/dL", category: "Hormones" },
  { name: "Testosterone, Free", description: "Bioavailable testosterone", unit: "pg/mL", category: "Hormones" },
  { name: "Hemoglobin A1c", description: "3-month glucose average", unit: "%", category: "Metabolic" },
  { name: "hs-CRP", description: "Inflammation marker", unit: "mg/L", category: "Inflammation" },
  { name: "Vitamin D, 25-OH", description: "Vitamin D status", unit: "ng/mL", category: "Vitamins" },
  { name: "TSH", description: "Thyroid function", unit: "mIU/L", category: "Thyroid" },
  { name: "Ferritin", description: "Iron stores", unit: "ng/mL", category: "Iron" },
];

export const labCategories = [
  "CBC",
  "Metabolic",
  "Diabetes",
  "Thyroid",
  "Hormones",
  "Growth Factors",
  "Lipids",
  "Iron",
  "Inflammation",
  "Vitamins",
  "Prostate",
  "Immunology",
  "Viral",
];
