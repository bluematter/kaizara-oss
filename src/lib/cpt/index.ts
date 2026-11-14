import type { CPTCode } from "./types";
import { cpt_96372 } from "./codes/96372";

export const cptCodes: Record<string, CPTCode> = {
  "96372": cpt_96372,
};

export function getCPTCode(code: string): CPTCode | null {
  return cptCodes[code] ?? null;
}

export function getAllCPTCodes(): CPTCode[] {
  return Object.values(cptCodes);
}

export function getCPTCodesByCategory(): Record<string, CPTCode[]> {
  const grouped: Record<string, CPTCode[]> = {};
  for (const code of getAllCPTCodes()) {
    (grouped[code.category] ??= []).push(code);
  }
  return grouped;
}

export * from "./types";
export * from "./authors";
