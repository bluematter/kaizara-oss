// ============================================================================
// DEMO MODE CONFIGURATION
// ============================================================================
// Toggle this to switch between demo data and real database queries.
// When selling to real clinics, set DEMO_MODE = false
// ============================================================================

export const DEMO_MODE = false;

// Future: This could be per-clinic setting stored in database
// export async function isDemoMode(clinicId: string): Promise<boolean> {
//   const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
//   return clinic?.demoMode ?? false;
// }
