// Lab Marker Scoring System
// Provides gradient-based scoring from 0-100 based on optimal ranges
// Factors in age, sex, and evidence-based optimal ranges

export interface PatientContext {
  age: number;
  sex: "male" | "female";
  height?: number; // inches
  weight?: number; // lbs
}

export interface OptimalRange {
  critical_low?: number;
  low?: number;
  optimal_low: number;
  optimal_high: number;
  high?: number;
  critical_high?: number;
}

export interface MarkerDefinition {
  name: string;
  unit: string;
  category: string;
  getOptimalRange: (context: PatientContext) => OptimalRange;
  interpretation?: (value: number, score: number, context: PatientContext) => string;
}

// Score from 0-100 based on where value falls in the range
// 100 = optimal, 75 = good, 50 = suboptimal, 25 = concerning, 0 = critical
export function calculateScore(value: number, range: OptimalRange): number {
  const { critical_low, low, optimal_low, optimal_high, high, critical_high } = range;

  // In optimal range = 100
  if (value >= optimal_low && value <= optimal_high) {
    return 100;
  }

  // Above optimal
  if (value > optimal_high) {
    if (critical_high !== undefined && value >= critical_high) return 0;
    if (high !== undefined && value >= high) {
      // Between high and critical_high = 0-25
      if (critical_high !== undefined) {
        const pct = (critical_high - value) / (critical_high - high);
        return Math.round(pct * 25);
      }
      return 15;
    }
    // Between optimal_high and high = 50-75
    if (high !== undefined) {
      const pct = (high - value) / (high - optimal_high);
      return Math.round(50 + pct * 25);
    }
    // No high defined, gradual decline
    const overage = value - optimal_high;
    const range_size = optimal_high - optimal_low;
    const pct = Math.max(0, 1 - overage / range_size);
    return Math.round(pct * 75);
  }

  // Below optimal
  if (value < optimal_low) {
    if (critical_low !== undefined && value <= critical_low) return 0;
    if (low !== undefined && value <= low) {
      // Between critical_low and low = 0-25
      if (critical_low !== undefined) {
        const pct = (value - critical_low) / (low - critical_low);
        return Math.round(pct * 25);
      }
      return 15;
    }
    // Between low and optimal_low = 50-75
    if (low !== undefined) {
      const pct = (value - low) / (optimal_low - low);
      return Math.round(50 + pct * 25);
    }
    // No low defined, gradual decline
    const underage = optimal_low - value;
    const range_size = optimal_high - optimal_low;
    const pct = Math.max(0, 1 - underage / range_size);
    return Math.round(pct * 75);
  }

  return 100;
}

// Get color based on score
export function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-500";
  if (score >= 75) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  if (score >= 25) return "text-orange-500";
  return "text-red-500";
}

export function getScoreBgColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Optimal";
  if (score >= 75) return "Good";
  if (score >= 50) return "Suboptimal";
  if (score >= 25) return "Concerning";
  return "Critical";
}

// Marker definitions with age/sex-adjusted optimal ranges
export const markerDefinitions: Record<string, MarkerDefinition> = {
  // === HORMONES ===
  "Testosterone, Total": {
    name: "Testosterone, Total",
    unit: "ng/dL",
    category: "Hormones",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { critical_low: 5, low: 10, optimal_low: 15, optimal_high: 70, high: 100, critical_high: 150 };
      }
      // Male ranges by age - optimal declines with age but we want to optimize
      if (ctx.age < 30) {
        return { critical_low: 200, low: 400, optimal_low: 700, optimal_high: 1000, high: 1200, critical_high: 1500 };
      } else if (ctx.age < 40) {
        return { critical_low: 200, low: 350, optimal_low: 600, optimal_high: 900, high: 1100, critical_high: 1400 };
      } else if (ctx.age < 50) {
        return { critical_low: 180, low: 300, optimal_low: 550, optimal_high: 850, high: 1000, critical_high: 1300 };
      } else if (ctx.age < 60) {
        return { critical_low: 150, low: 250, optimal_low: 500, optimal_high: 800, high: 950, critical_high: 1200 };
      } else {
        return { critical_low: 150, low: 220, optimal_low: 450, optimal_high: 750, high: 900, critical_high: 1100 };
      }
    },
    interpretation: (value, score, ctx) => {
      if (ctx.sex === "male") {
        if (score >= 90) return "Excellent testosterone levels for your age. Great for energy, muscle, and cognition.";
        if (score >= 75) return "Good testosterone levels. Room for optimization through lifestyle or therapy.";
        if (score >= 50) return "Suboptimal for your age. Consider sleep optimization, strength training, zinc, and vitamin D.";
        if (score >= 25) return "Low testosterone. Discuss TRT or clomiphene with your provider.";
        return "Critically low. Recommend endocrinology evaluation and likely TRT.";
      }
      return score >= 75 ? "Normal range for females." : "Evaluate for hormonal imbalance.";
    }
  },

  "Testosterone, Free": {
    name: "Testosterone, Free",
    unit: "pg/mL",
    category: "Hormones",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { low: 0.1, optimal_low: 0.5, optimal_high: 5, high: 10 };
      }
      if (ctx.age < 40) {
        return { critical_low: 30, low: 70, optimal_low: 120, optimal_high: 220, high: 280 };
      } else if (ctx.age < 50) {
        return { critical_low: 25, low: 60, optimal_low: 100, optimal_high: 200, high: 260 };
      } else {
        return { critical_low: 20, low: 50, optimal_low: 80, optimal_high: 180, high: 240 };
      }
    }
  },

  "IGF-1": {
    name: "IGF-1",
    unit: "ng/mL",
    category: "Growth Factors",
    getOptimalRange: (ctx) => {
      // IGF-1 optimal varies significantly by age
      if (ctx.age < 30) {
        return { critical_low: 100, low: 180, optimal_low: 250, optimal_high: 400, high: 450, critical_high: 550 };
      } else if (ctx.age < 40) {
        return { critical_low: 80, low: 150, optimal_low: 200, optimal_high: 350, high: 420, critical_high: 500 };
      } else if (ctx.age < 50) {
        return { critical_low: 70, low: 120, optimal_low: 170, optimal_high: 300, high: 380, critical_high: 450 };
      } else if (ctx.age < 60) {
        return { critical_low: 60, low: 100, optimal_low: 140, optimal_high: 260, high: 340, critical_high: 400 };
      } else {
        return { critical_low: 50, low: 80, optimal_low: 110, optimal_high: 220, high: 300, critical_high: 360 };
      }
    },
    interpretation: (value, score, ctx) => {
      if (score >= 90) return "Excellent IGF-1 levels. Great response to any GH secretagogue protocols.";
      if (score >= 75) return "Good IGF-1. Consider optimizing with Sermorelin, Ipamorelin, or CJC-1295.";
      if (score >= 50) return "Suboptimal IGF-1. Peptide therapy could significantly improve this.";
      return "Low IGF-1. Strong candidate for growth hormone optimization.";
    }
  },

  "IGF-1 Z Score": {
    name: "IGF-1 Z Score",
    unit: "",
    category: "Growth Factors",
    getOptimalRange: () => ({
      critical_low: -2.5,
      low: -1.5,
      optimal_low: -0.5,
      optimal_high: 1.5,
      high: 2.0,
      critical_high: 3.0
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "IGF-1 within optimal range for age.";
      if (value < -1.0) return "Below average for age. Consider GH optimization.";
      if (value > 2.0) return "Above average. Monitor for excess.";
      return "Within normal variation for age.";
    }
  },

  "TSH": {
    name: "TSH",
    unit: "mIU/L",
    category: "Thyroid",
    getOptimalRange: () => ({
      critical_low: 0.1,
      low: 0.3,
      optimal_low: 0.5,
      optimal_high: 2.0,
      high: 4.0,
      critical_high: 10.0
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Optimal thyroid function.";
      if (value > 2.0 && value <= 4.0) return "Upper range TSH suggests subclinical hypothyroidism. Consider thyroid support.";
      if (value > 4.0) return "Elevated TSH indicates hypothyroidism. Evaluate T3, T4, and thyroid antibodies.";
      if (value < 0.5) return "Low TSH may indicate hyperthyroidism. Further evaluation recommended.";
      return "Thyroid function assessment needed.";
    }
  },

  "Estradiol": {
    name: "Estradiol",
    unit: "pg/mL",
    category: "Hormones",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { low: 15, optimal_low: 30, optimal_high: 400, high: 500 }; // Varies by cycle
      }
      // Male - want moderate levels
      return { critical_low: 5, low: 15, optimal_low: 20, optimal_high: 35, high: 50, critical_high: 80 };
    }
  },

  "DHEA Sulfate": {
    name: "DHEA Sulfate",
    unit: "mcg/dL",
    category: "Hormones",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        if (ctx.age < 40) return { low: 100, optimal_low: 200, optimal_high: 400, high: 500 };
        return { low: 60, optimal_low: 130, optimal_high: 300, high: 400 };
      }
      if (ctx.age < 40) return { low: 150, optimal_low: 300, optimal_high: 500, high: 600 };
      if (ctx.age < 50) return { low: 120, optimal_low: 250, optimal_high: 450, high: 550 };
      return { low: 80, optimal_low: 180, optimal_high: 400, high: 500 };
    }
  },

  "Cortisol, AM": {
    name: "Cortisol, AM",
    unit: "mcg/dL",
    category: "Hormones",
    getOptimalRange: () => ({
      critical_low: 3,
      low: 6,
      optimal_low: 10,
      optimal_high: 18,
      high: 23,
      critical_high: 30
    })
  },

  // === METABOLIC ===
  "Hemoglobin A1c": {
    name: "Hemoglobin A1c",
    unit: "%",
    category: "Diabetes",
    getOptimalRange: () => ({
      optimal_low: 4.0,
      optimal_high: 5.0,
      high: 5.7,
      critical_high: 6.5
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Excellent glucose control. Low diabetes and cardiovascular risk.";
      if (value <= 5.6) return "Good glucose control. In non-diabetic range.";
      if (value <= 6.4) return "Prediabetic range. Focus on diet, exercise, and consider metformin.";
      return "Diabetic range. Requires medical management.";
    }
  },

  "Glucose": {
    name: "Glucose",
    unit: "mg/dL",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 50,
      low: 65,
      optimal_low: 72,
      optimal_high: 90,
      high: 100,
      critical_high: 126
    })
  },

  "Creatinine": {
    name: "Creatinine",
    unit: "mg/dL",
    category: "Metabolic",
    getOptimalRange: (ctx) => {
      // Higher muscle mass = higher creatinine
      if (ctx.sex === "female") {
        return { low: 0.4, optimal_low: 0.5, optimal_high: 1.0, high: 1.2, critical_high: 1.5 };
      }
      return { low: 0.6, optimal_low: 0.7, optimal_high: 1.1, high: 1.3, critical_high: 1.8 };
    }
  },

  "eGFR": {
    name: "eGFR",
    unit: "mL/min/1.73m2",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 15,
      low: 30,
      optimal_low: 90,
      optimal_high: 120
    }),
    interpretation: (value, score) => {
      if (value >= 90) return "Normal kidney function.";
      if (value >= 60) return "Mildly reduced kidney function. Monitor and stay hydrated.";
      if (value >= 30) return "Moderately reduced kidney function. Nephrology consult recommended.";
      return "Severely reduced kidney function. Urgent nephrology referral.";
    }
  },

  // === LIPIDS ===
  "Cholesterol, Total": {
    name: "Cholesterol, Total",
    unit: "mg/dL",
    category: "Lipids",
    getOptimalRange: () => ({
      optimal_low: 120,
      optimal_high: 180,
      high: 200,
      critical_high: 280
    })
  },

  "LDL Cholesterol": {
    name: "LDL Cholesterol",
    unit: "mg/dL",
    category: "Lipids",
    getOptimalRange: () => ({
      optimal_low: 40,
      optimal_high: 80,
      high: 100,
      critical_high: 160
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Excellent LDL. Low cardiovascular risk.";
      if (value <= 100) return "Good LDL. Acceptable for most people.";
      if (value <= 130) return "Borderline high. Consider diet and exercise modifications.";
      if (value <= 160) return "High LDL. Discuss statin therapy with provider.";
      return "Very high LDL. Strong indication for medication.";
    }
  },

  "HDL Cholesterol": {
    name: "HDL Cholesterol",
    unit: "mg/dL",
    category: "Lipids",
    getOptimalRange: (ctx) => {
      // Higher is better for HDL
      if (ctx.sex === "female") {
        return { critical_low: 35, low: 45, optimal_low: 60, optimal_high: 100 };
      }
      return { critical_low: 30, low: 40, optimal_low: 55, optimal_high: 90 };
    }
  },

  "Triglycerides": {
    name: "Triglycerides",
    unit: "mg/dL",
    category: "Lipids",
    getOptimalRange: () => ({
      optimal_low: 30,
      optimal_high: 80,
      high: 150,
      critical_high: 500
    })
  },

  // === INFLAMMATION ===
  "hs-CRP": {
    name: "hs-CRP",
    unit: "mg/L",
    category: "Inflammation",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 0.5,
      high: 1.0,
      critical_high: 3.0
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Excellent. Very low inflammation and cardiovascular risk.";
      if (value <= 1.0) return "Low cardiovascular risk from inflammation.";
      if (value <= 3.0) return "Moderate inflammatory risk. Consider anti-inflammatory diet.";
      return "High inflammation. Evaluate for underlying causes.";
    }
  },

  // === VITAMINS ===
  "Vitamin D, 25-OH": {
    name: "Vitamin D, 25-OH",
    unit: "ng/mL",
    category: "Vitamins",
    getOptimalRange: () => ({
      critical_low: 10,
      low: 20,
      optimal_low: 50,
      optimal_high: 80,
      high: 100,
      critical_high: 150
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Optimal vitamin D. Great for immune function, bone health, and hormones.";
      if (value >= 30) return "Adequate but not optimal. Consider 5000 IU/day supplementation.";
      if (value >= 20) return "Insufficient. Supplement with 5000-10000 IU/day.";
      return "Deficient. High-dose repletion needed (50,000 IU/week).";
    }
  },

  // === IRON ===
  "Ferritin": {
    name: "Ferritin",
    unit: "ng/mL",
    category: "Iron",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { critical_low: 5, low: 15, optimal_low: 50, optimal_high: 150, high: 200, critical_high: 400 };
      }
      return { critical_low: 10, low: 30, optimal_low: 75, optimal_high: 200, high: 300, critical_high: 500 };
    }
  },

  // === CBC ===
  "Hemoglobin": {
    name: "Hemoglobin",
    unit: "g/dL",
    category: "CBC",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { critical_low: 8, low: 11, optimal_low: 12.5, optimal_high: 15, high: 16, critical_high: 18 };
      }
      return { critical_low: 9, low: 12.5, optimal_low: 14, optimal_high: 17, high: 18, critical_high: 20 };
    }
  },

  "Hematocrit": {
    name: "Hematocrit",
    unit: "%",
    category: "CBC",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { critical_low: 28, low: 34, optimal_low: 36, optimal_high: 44, high: 48, critical_high: 55 };
      }
      return { critical_low: 30, low: 38, optimal_low: 40, optimal_high: 50, high: 52, critical_high: 58 };
    }
  },

  "White Blood Cell Count": {
    name: "White Blood Cell Count",
    unit: "Thousand/uL",
    category: "CBC",
    getOptimalRange: () => ({
      critical_low: 2.0,
      low: 4.0,
      optimal_low: 4.5,
      optimal_high: 8.5,
      high: 11.0,
      critical_high: 20.0
    })
  },

  "Red Blood Cell Count": {
    name: "Red Blood Cell Count",
    unit: "Million/uL",
    category: "CBC",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { critical_low: 3.0, low: 3.8, optimal_low: 4.0, optimal_high: 5.2, high: 5.5, critical_high: 6.5 };
      }
      return { critical_low: 3.5, low: 4.2, optimal_low: 4.5, optimal_high: 5.8, high: 6.2, critical_high: 7.0 };
    }
  },

  "MCV": {
    name: "MCV",
    unit: "fL",
    category: "CBC",
    getOptimalRange: () => ({
      critical_low: 60,
      low: 75,
      optimal_low: 80,
      optimal_high: 96,
      high: 100,
      critical_high: 115
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Normal red blood cell size.";
      if (value < 80) return "Microcytic. Consider iron deficiency or thalassemia.";
      if (value > 100) return "Macrocytic. Consider B12/folate deficiency or liver disease.";
      return "Borderline. Monitor trends.";
    }
  },

  "MCH": {
    name: "MCH",
    unit: "pg",
    category: "CBC",
    getOptimalRange: () => ({
      critical_low: 20,
      low: 26,
      optimal_low: 27,
      optimal_high: 33,
      high: 35,
      critical_high: 40
    })
  },

  "MCHC": {
    name: "MCHC",
    unit: "g/dL",
    category: "CBC",
    getOptimalRange: () => ({
      critical_low: 28,
      low: 31,
      optimal_low: 32,
      optimal_high: 36,
      high: 37,
      critical_high: 40
    })
  },

  "RDW": {
    name: "RDW",
    unit: "%",
    category: "CBC",
    getOptimalRange: () => ({
      optimal_low: 11.0,
      optimal_high: 14.5,
      high: 16.0,
      critical_high: 20.0
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Normal red cell size variation.";
      if (value > 14.5) return "Elevated RDW suggests mixed anemia or nutritional deficiency.";
      return "Monitor.";
    }
  },

  "Platelet Count": {
    name: "Platelet Count",
    unit: "Thousand/uL",
    category: "CBC",
    getOptimalRange: () => ({
      critical_low: 50,
      low: 140,
      optimal_low: 150,
      optimal_high: 350,
      high: 400,
      critical_high: 600
    })
  },

  "MPV": {
    name: "MPV",
    unit: "fL",
    category: "CBC",
    getOptimalRange: () => ({
      low: 7.0,
      optimal_low: 8.0,
      optimal_high: 11.0,
      high: 12.5,
      critical_high: 15.0
    })
  },

  "Absolute Neutrophils": {
    name: "Absolute Neutrophils",
    unit: "cells/uL",
    category: "CBC",
    getOptimalRange: () => ({
      critical_low: 1000,
      low: 1500,
      optimal_low: 1800,
      optimal_high: 7000,
      high: 8000,
      critical_high: 12000
    })
  },

  "Absolute Lymphocytes": {
    name: "Absolute Lymphocytes",
    unit: "cells/uL",
    category: "CBC",
    getOptimalRange: () => ({
      critical_low: 500,
      low: 1000,
      optimal_low: 1200,
      optimal_high: 3500,
      high: 4000,
      critical_high: 6000
    })
  },

  "Absolute Monocytes": {
    name: "Absolute Monocytes",
    unit: "cells/uL",
    category: "CBC",
    getOptimalRange: () => ({
      low: 100,
      optimal_low: 200,
      optimal_high: 800,
      high: 1000,
      critical_high: 1500
    })
  },

  "Absolute Eosinophils": {
    name: "Absolute Eosinophils",
    unit: "cells/uL",
    category: "CBC",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 400,
      high: 500,
      critical_high: 1500
    })
  },

  "Absolute Basophils": {
    name: "Absolute Basophils",
    unit: "cells/uL",
    category: "CBC",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 100,
      high: 200,
      critical_high: 500
    })
  },

  // === METABOLIC PANEL ===
  "BUN (Urea Nitrogen)": {
    name: "BUN (Urea Nitrogen)",
    unit: "mg/dL",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 3,
      low: 7,
      optimal_low: 10,
      optimal_high: 20,
      high: 25,
      critical_high: 50
    })
  },

  "BUN/Creatinine Ratio": {
    name: "BUN/Creatinine Ratio",
    unit: "",
    category: "Metabolic",
    getOptimalRange: () => ({
      low: 6,
      optimal_low: 10,
      optimal_high: 20,
      high: 25,
      critical_high: 35
    })
  },

  "Sodium": {
    name: "Sodium",
    unit: "mmol/L",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 125,
      low: 135,
      optimal_low: 137,
      optimal_high: 144,
      high: 146,
      critical_high: 155
    })
  },

  "Potassium": {
    name: "Potassium",
    unit: "mmol/L",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 2.5,
      low: 3.5,
      optimal_low: 3.8,
      optimal_high: 5.0,
      high: 5.3,
      critical_high: 6.5
    })
  },

  "Chloride": {
    name: "Chloride",
    unit: "mmol/L",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 90,
      low: 96,
      optimal_low: 98,
      optimal_high: 106,
      high: 110,
      critical_high: 120
    })
  },

  "Carbon Dioxide": {
    name: "Carbon Dioxide",
    unit: "mmol/L",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 15,
      low: 21,
      optimal_low: 23,
      optimal_high: 29,
      high: 32,
      critical_high: 40
    })
  },

  "Calcium": {
    name: "Calcium",
    unit: "mg/dL",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 7.0,
      low: 8.5,
      optimal_low: 9.0,
      optimal_high: 10.2,
      high: 10.5,
      critical_high: 12.0
    })
  },

  "Protein, Total": {
    name: "Protein, Total",
    unit: "g/dL",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 4.0,
      low: 6.0,
      optimal_low: 6.5,
      optimal_high: 8.0,
      high: 8.5,
      critical_high: 10.0
    })
  },

  "Albumin": {
    name: "Albumin",
    unit: "g/dL",
    category: "Metabolic",
    getOptimalRange: () => ({
      critical_low: 2.5,
      low: 3.5,
      optimal_low: 4.0,
      optimal_high: 5.0,
      high: 5.5,
      critical_high: 6.0
    })
  },

  "Globulin": {
    name: "Globulin",
    unit: "g/dL",
    category: "Metabolic",
    getOptimalRange: () => ({
      low: 1.5,
      optimal_low: 2.0,
      optimal_high: 3.5,
      high: 4.0,
      critical_high: 5.0
    })
  },

  "Albumin/Globulin Ratio": {
    name: "Albumin/Globulin Ratio",
    unit: "",
    category: "Metabolic",
    getOptimalRange: () => ({
      low: 1.0,
      optimal_low: 1.2,
      optimal_high: 2.2,
      high: 2.5
    })
  },

  // === LIVER ENZYMES ===
  "AST": {
    name: "AST",
    unit: "U/L",
    category: "Liver",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { optimal_low: 10, optimal_high: 25, high: 35, critical_high: 100 };
      }
      return { optimal_low: 10, optimal_high: 30, high: 40, critical_high: 120 };
    },
    interpretation: (value, score) => {
      if (score >= 90) return "Healthy liver enzyme levels.";
      if (value <= 80) return "Mildly elevated. May be due to exercise or minor liver stress.";
      return "Elevated. Evaluate liver health, medications, and alcohol use.";
    }
  },

  "ALT": {
    name: "ALT",
    unit: "U/L",
    category: "Liver",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { optimal_low: 7, optimal_high: 25, high: 35, critical_high: 100 };
      }
      return { optimal_low: 7, optimal_high: 30, high: 45, critical_high: 120 };
    },
    interpretation: (value, score) => {
      if (score >= 90) return "Healthy ALT levels.";
      if (value <= 80) return "Mildly elevated. Consider fatty liver or medication effects.";
      return "Elevated. Liver evaluation recommended.";
    }
  },

  "Alkaline Phosphatase": {
    name: "Alkaline Phosphatase",
    unit: "U/L",
    category: "Liver",
    getOptimalRange: (ctx) => {
      if (ctx.age < 20) {
        return { low: 50, optimal_low: 100, optimal_high: 350, high: 400, critical_high: 600 };
      }
      return { low: 30, optimal_low: 40, optimal_high: 100, high: 120, critical_high: 200 };
    }
  },

  "Bilirubin, Total": {
    name: "Bilirubin, Total",
    unit: "mg/dL",
    category: "Liver",
    getOptimalRange: () => ({
      optimal_low: 0.1,
      optimal_high: 1.0,
      high: 1.5,
      critical_high: 3.0
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Normal bilirubin metabolism.";
      if (value <= 2.0) return "Mildly elevated. May be Gilbert syndrome (benign).";
      return "Elevated. Evaluate liver and gallbladder function.";
    }
  },

  "GGT": {
    name: "GGT",
    unit: "U/L",
    category: "Liver",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { optimal_low: 5, optimal_high: 30, high: 45, critical_high: 100 };
      }
      return { optimal_low: 8, optimal_high: 45, high: 65, critical_high: 150 };
    }
  },

  // === IRON PANEL ===
  "Iron, Total": {
    name: "Iron, Total",
    unit: "mcg/dL",
    category: "Iron",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { critical_low: 30, low: 50, optimal_low: 60, optimal_high: 150, high: 180, critical_high: 300 };
      }
      return { critical_low: 40, low: 60, optimal_low: 80, optimal_high: 170, high: 200, critical_high: 350 };
    }
  },

  "Iron Binding Capacity": {
    name: "Iron Binding Capacity",
    unit: "mcg/dL",
    category: "Iron",
    getOptimalRange: () => ({
      critical_low: 200,
      low: 250,
      optimal_low: 260,
      optimal_high: 400,
      high: 450,
      critical_high: 550
    })
  },

  "% Saturation": {
    name: "% Saturation",
    unit: "%",
    category: "Iron",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { critical_low: 10, low: 15, optimal_low: 20, optimal_high: 45, high: 50, critical_high: 70 };
      }
      return { critical_low: 15, low: 20, optimal_low: 25, optimal_high: 50, high: 55, critical_high: 75 };
    }
  },

  // === THYROID ===
  "T4, Free": {
    name: "T4, Free",
    unit: "ng/dL",
    category: "Thyroid",
    getOptimalRange: () => ({
      critical_low: 0.5,
      low: 0.8,
      optimal_low: 1.0,
      optimal_high: 1.6,
      high: 2.0,
      critical_high: 3.0
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Optimal free T4 levels.";
      if (value < 1.0) return "Low T4 suggests hypothyroidism.";
      if (value > 1.8) return "Elevated T4 may indicate hyperthyroidism.";
      return "Monitor thyroid function.";
    }
  },

  "T3, Free": {
    name: "T3, Free",
    unit: "pg/mL",
    category: "Thyroid",
    getOptimalRange: () => ({
      critical_low: 1.5,
      low: 2.0,
      optimal_low: 2.5,
      optimal_high: 4.0,
      high: 4.5,
      critical_high: 6.0
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Optimal free T3 - good cellular thyroid function.";
      if (value < 2.5) return "Low T3 may cause fatigue. Consider T3 optimization.";
      if (value > 4.5) return "Elevated T3 may indicate hyperthyroidism.";
      return "Monitor thyroid function.";
    }
  },

  // === ADDITIONAL HORMONES ===
  "Sex Hormone Binding Globulin": {
    name: "Sex Hormone Binding Globulin",
    unit: "nmol/L",
    category: "Hormones",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { low: 20, optimal_low: 30, optimal_high: 120, high: 150, critical_high: 200 };
      }
      // For men, moderate SHBG is better - too high reduces free testosterone
      return { low: 10, optimal_low: 20, optimal_high: 50, high: 70, critical_high: 100 };
    },
    interpretation: (value, score, ctx) => {
      if (ctx.sex === "male") {
        if (value > 50) return "High SHBG reduces free testosterone. Consider boron supplementation.";
        if (value < 20) return "Low SHBG may indicate insulin resistance.";
      }
      return score >= 75 ? "Normal SHBG levels." : "Evaluate hormone balance.";
    }
  },

  "Testosterone, Bioavailable": {
    name: "Testosterone, Bioavailable",
    unit: "ng/dL",
    category: "Hormones",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { low: 1, optimal_low: 3, optimal_high: 25, high: 40 };
      }
      if (ctx.age < 40) {
        return { critical_low: 50, low: 100, optimal_low: 150, optimal_high: 350, high: 400 };
      } else if (ctx.age < 50) {
        return { critical_low: 40, low: 80, optimal_low: 120, optimal_high: 300, high: 350 };
      } else {
        return { critical_low: 30, low: 60, optimal_low: 100, optimal_high: 250, high: 300 };
      }
    }
  },

  "LH": {
    name: "LH",
    unit: "mIU/mL",
    category: "Hormones",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { low: 1.0, optimal_low: 2.0, optimal_high: 15.0, high: 25.0, critical_high: 100 }; // Varies by cycle
      }
      return { low: 1.0, optimal_low: 2.0, optimal_high: 9.0, high: 12.0, critical_high: 25.0 };
    }
  },

  "FSH": {
    name: "FSH",
    unit: "mIU/mL",
    category: "Hormones",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { low: 1.0, optimal_low: 3.0, optimal_high: 12.0, high: 25.0, critical_high: 100 }; // Varies by cycle
      }
      return { low: 1.0, optimal_low: 1.5, optimal_high: 10.0, high: 15.0, critical_high: 30.0 };
    }
  },

  "Prolactin": {
    name: "Prolactin",
    unit: "ng/mL",
    category: "Hormones",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { low: 2, optimal_low: 4, optimal_high: 25, high: 30, critical_high: 100 };
      }
      return { low: 2, optimal_low: 3, optimal_high: 15, high: 20, critical_high: 50 };
    }
  },

  // === LIPIDS (additional) ===
  "VLDL Cholesterol": {
    name: "VLDL Cholesterol",
    unit: "mg/dL",
    category: "Lipids",
    getOptimalRange: () => ({
      optimal_low: 5,
      optimal_high: 25,
      high: 35,
      critical_high: 50
    })
  },

  "Non-HDL Cholesterol": {
    name: "Non-HDL Cholesterol",
    unit: "mg/dL",
    category: "Lipids",
    getOptimalRange: () => ({
      optimal_low: 50,
      optimal_high: 100,
      high: 130,
      critical_high: 190
    })
  },

  // === URIC ACID ===
  "Uric Acid": {
    name: "Uric Acid",
    unit: "mg/dL",
    category: "Metabolic",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { low: 2.0, optimal_low: 2.5, optimal_high: 5.5, high: 6.5, critical_high: 9.0 };
      }
      return { low: 2.5, optimal_low: 3.0, optimal_high: 6.5, high: 7.5, critical_high: 10.0 };
    },
    interpretation: (value, score, ctx) => {
      const threshold = ctx.sex === "female" ? 6.0 : 7.0;
      if (score >= 90) return "Optimal uric acid levels.";
      if (value > threshold) return "Elevated. Risk for gout and kidney stones. Reduce purines and alcohol.";
      return "Monitor uric acid levels.";
    }
  },

  // === INFLAMMATION (additional) ===
  "ESR": {
    name: "ESR",
    unit: "mm/hr",
    category: "Inflammation",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        if (ctx.age < 50) return { optimal_low: 0, optimal_high: 20, high: 30, critical_high: 60 };
        return { optimal_low: 0, optimal_high: 30, high: 45, critical_high: 80 };
      }
      if (ctx.age < 50) return { optimal_low: 0, optimal_high: 15, high: 25, critical_high: 50 };
      return { optimal_low: 0, optimal_high: 20, high: 35, critical_high: 70 };
    }
  },

  "Homocysteine": {
    name: "Homocysteine",
    unit: "umol/L",
    category: "Inflammation",
    getOptimalRange: () => ({
      optimal_low: 5,
      optimal_high: 9,
      high: 12,
      critical_high: 20
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Optimal homocysteine. Low cardiovascular risk.";
      if (value <= 12) return "Mildly elevated. Consider B vitamins (B6, B12, folate).";
      return "High homocysteine. Increased cardiovascular risk. Supplement B vitamins.";
    }
  },

  // === VITAMINS (additional) ===
  "Vitamin B12": {
    name: "Vitamin B12",
    unit: "pg/mL",
    category: "Vitamins",
    getOptimalRange: () => ({
      critical_low: 150,
      low: 300,
      optimal_low: 500,
      optimal_high: 1000,
      high: 1500
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Optimal B12 for energy and neurological health.";
      if (value >= 300) return "Adequate but consider optimization with methylcobalamin.";
      if (value >= 200) return "Low-normal. Supplement recommended.";
      return "Deficient. Risk of neurological issues. Supplement urgently.";
    }
  },

  "Folate": {
    name: "Folate",
    unit: "ng/mL",
    category: "Vitamins",
    getOptimalRange: () => ({
      critical_low: 2,
      low: 4,
      optimal_low: 10,
      optimal_high: 25,
      high: 40
    })
  },

  "Magnesium": {
    name: "Magnesium",
    unit: "mg/dL",
    category: "Vitamins",
    getOptimalRange: () => ({
      critical_low: 1.2,
      low: 1.7,
      optimal_low: 2.0,
      optimal_high: 2.5,
      high: 2.7,
      critical_high: 3.5
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Optimal magnesium. Important for 300+ enzyme reactions.";
      if (value < 2.0) return "Suboptimal. Consider magnesium glycinate supplementation.";
      return "Monitor magnesium levels.";
    }
  },

  "Zinc": {
    name: "Zinc",
    unit: "mcg/dL",
    category: "Vitamins",
    getOptimalRange: () => ({
      critical_low: 40,
      low: 60,
      optimal_low: 80,
      optimal_high: 120,
      high: 150,
      critical_high: 200
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Optimal zinc. Great for immune function and testosterone.";
      if (value < 80) return "Low zinc. Consider 30-50mg daily supplementation.";
      return "Adequate zinc levels.";
    }
  },

  // === LIPID RATIOS ===
  "CHOL/HDL Ratio": {
    name: "CHOL/HDL Ratio",
    unit: "",
    category: "Lipids",
    getOptimalRange: (ctx) => {
      if (ctx.sex === "female") {
        return { optimal_low: 1.0, optimal_high: 3.5, high: 4.5, critical_high: 6.0 };
      }
      return { optimal_low: 1.0, optimal_high: 4.0, high: 5.0, critical_high: 7.0 };
    },
    interpretation: (value, score) => {
      if (score >= 90) return "Excellent ratio. Low cardiovascular risk.";
      if (value <= 5.0) return "Acceptable ratio. Consider improving HDL.";
      return "High ratio indicates increased cardiovascular risk.";
    }
  },

  "TG/HDL Ratio": {
    name: "TG/HDL Ratio",
    unit: "",
    category: "Lipids",
    getOptimalRange: () => ({
      optimal_low: 0.5,
      optimal_high: 2.0,
      high: 3.5,
      critical_high: 6.0
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "Excellent. Indicates good insulin sensitivity.";
      if (value <= 3.5) return "Acceptable. Monitor metabolic health.";
      return "Elevated ratio suggests insulin resistance.";
    }
  },

  // === PROSTATE ===
  "PSA, Total": {
    name: "PSA, Total",
    unit: "ng/mL",
    category: "Prostate",
    getOptimalRange: (ctx) => {
      // PSA increases with age
      if (ctx.age < 50) {
        return { optimal_low: 0, optimal_high: 2.5, high: 4.0, critical_high: 10.0 };
      } else if (ctx.age < 60) {
        return { optimal_low: 0, optimal_high: 3.5, high: 4.5, critical_high: 10.0 };
      } else if (ctx.age < 70) {
        return { optimal_low: 0, optimal_high: 4.5, high: 6.5, critical_high: 10.0 };
      } else {
        return { optimal_low: 0, optimal_high: 6.5, high: 7.5, critical_high: 10.0 };
      }
    },
    interpretation: (value, score, ctx) => {
      if (score >= 90) return "Normal PSA for your age.";
      if (value <= 4.0) return "Within normal limits. Annual monitoring recommended.";
      if (value <= 10.0) return "Elevated. Consider urology referral for evaluation.";
      return "Significantly elevated. Urology evaluation recommended.";
    }
  },

  "PSA, Free": {
    name: "PSA, Free",
    unit: "ng/mL",
    category: "Prostate",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 1.0,
      high: 2.0,
      critical_high: 4.0
    })
  },

  "PSA % Free": {
    name: "PSA % Free",
    unit: "%",
    category: "Prostate",
    getOptimalRange: () => ({
      critical_low: 10,
      low: 15,
      optimal_low: 25,
      optimal_high: 100
    }),
    interpretation: (value, score) => {
      if (score >= 90) return "High free PSA percentage. Lower prostate cancer risk.";
      if (value >= 15) return "Acceptable. Continue monitoring.";
      return "Low free PSA percentage. Consider urology evaluation.";
    }
  },

  // === IMMUNOLOGY ===
  "ANA Screen": {
    name: "ANA Screen",
    unit: "",
    category: "Immunology",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 0,
      high: 1,
      critical_high: 1
    }),
    interpretation: (value, score) => {
      if (value === 0) return "Negative. No autoimmune antibodies detected.";
      return "Positive. May indicate autoimmune condition. Further evaluation needed.";
    }
  },

  // === VIRAL MARKERS ===
  "EBV VCA IgM": {
    name: "EBV VCA IgM",
    unit: "U/mL",
    category: "Viral",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 35,
      high: 40,
      critical_high: 100
    }),
    interpretation: (value, score) => {
      if (value < 36) return "Negative. No acute EBV infection.";
      return "Positive. May indicate recent or active EBV infection.";
    }
  },

  "EBV VCA IgG": {
    name: "EBV VCA IgG",
    unit: "U/mL",
    category: "Viral",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 17,
      high: 22
    }),
    interpretation: (value, score) => {
      if (value < 18) return "Negative. No prior EBV exposure.";
      return "Positive. Indicates past EBV infection (common in adults).";
    }
  },

  "EBV Nuclear Ag IgG": {
    name: "EBV Nuclear Ag IgG",
    unit: "U/mL",
    category: "Viral",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 17,
      high: 22
    }),
    interpretation: (value, score) => {
      if (value < 18) return "Negative.";
      return "Positive. Confirms past EBV infection.";
    }
  },

  // === BLOOD TYPE (informational - always "optimal") ===
  "ABO Group": {
    name: "ABO Group",
    unit: "",
    category: "Blood Type",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 100
    })
  },

  "Rh Type": {
    name: "Rh Type",
    unit: "",
    category: "Blood Type",
    getOptimalRange: () => ({
      optimal_low: 0,
      optimal_high: 100
    })
  }
};

// Calculate scores for all markers
export function scoreLabPanel(
  markers: Array<{ name: string; value: number; unit: string }>,
  context: PatientContext
): Array<{
  name: string;
  value: number;
  unit: string;
  score: number;
  label: string;
  color: string;
  bgColor: string;
  interpretation?: string;
  optimalRange: OptimalRange;
}> {
  return markers.map((marker) => {
    const definition = markerDefinitions[marker.name];

    if (!definition) {
      // No definition, return neutral score
      return {
        ...marker,
        score: 75,
        label: "N/A",
        color: "text-gray-500",
        bgColor: "bg-gray-500",
        optimalRange: { optimal_low: 0, optimal_high: 0 }
      };
    }

    const optimalRange = definition.getOptimalRange(context);
    const score = calculateScore(marker.value, optimalRange);
    const interpretation = definition.interpretation?.(marker.value, score, context);

    return {
      ...marker,
      score,
      label: getScoreLabel(score),
      color: getScoreColor(score),
      bgColor: getScoreBgColor(score),
      interpretation,
      optimalRange
    };
  });
}

// Calculate overall health score
export function calculateOverallScore(
  scoredMarkers: Array<{ score: number; name: string }>
): { score: number; label: string; color: string } {
  // Weight certain markers more heavily
  const weights: Record<string, number> = {
    "Testosterone, Total": 1.5,
    "IGF-1": 1.3,
    "Hemoglobin A1c": 1.5,
    "hs-CRP": 1.4,
    "LDL Cholesterol": 1.3,
    "HDL Cholesterol": 1.2,
    "Vitamin D, 25-OH": 1.2,
    "TSH": 1.2,
    "eGFR": 1.3,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  scoredMarkers.forEach((marker) => {
    const weight = weights[marker.name] || 1.0;
    weightedSum += marker.score * weight;
    totalWeight += weight;
  });

  const overallScore = Math.round(weightedSum / totalWeight);

  return {
    score: overallScore,
    label: getScoreLabel(overallScore),
    color: getScoreColor(overallScore)
  };
}
