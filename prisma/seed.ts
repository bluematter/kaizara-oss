import { PrismaClient, MarkerStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Safety: seed is destructive (deletes + password resets). Require explicit opt-in.
  if (process.env.ALLOW_SEED !== "true") {
    console.error(
      "Refusing to seed. This script mutates real data in whichever DB DATABASE_URL points to.\n" +
        "If you are SURE you want to run it (dev only!), set ALLOW_SEED=true.",
    );
    process.exit(1);
  }
  // Belt-and-suspenders: block any URL that looks like prod.
  const url = process.env.DATABASE_URL || "";
  if (/prod|production/i.test(url)) {
    console.error("DATABASE_URL looks like production. Aborting seed.");
    process.exit(1);
  }
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("demo123", 12);

  // --- Clinic ---
  const clinic = await prisma.clinic.upsert({
    where: { slug: "demo-clinic" },
    update: {},
    create: {
      name: "Demo Clinic",
      slug: "demo-clinic",
      address: "123 Wellness Way, San Diego, CA 92101",
      phone: "(619) 555-0123",
      email: "info@demo-clinic.example",
    },
  });
  console.log("Created clinic:", clinic.name);

  // --- Users ---
  const admin = await prisma.user.upsert({
    where: { email: "michael@demo-clinic.example" },
    update: { password: hashedPassword },
    create: {
      email: "michael@demo-clinic.example",
      name: "Dr. Jordan Hale",
      password: hashedPassword,
      role: "ADMIN",
      clinicId: clinic.id,
    },
  });
  console.log("Created admin:", admin.email);

  const provider = await prisma.user.upsert({
    where: { email: "dr.torres@demo-clinic.example" },
    update: { password: hashedPassword },
    create: {
      email: "dr.torres@demo-clinic.example",
      name: "Dr. Michael Torres",
      password: hashedPassword,
      role: "PROVIDER",
      clinicId: clinic.id,
    },
  });

  // --- Patients ---
  const patientData = [
    { firstName: "Jamie", lastName: "Rivera", email: "demo.patient@example.com", phone: "(555) 000-0001", dob: "1988-04-09", slug: "jamie-rivera-portal" },
    { firstName: "James", lastName: "Wilson", email: "james.wilson@email.com", phone: "(619) 555-0101", dob: "1978-03-15", slug: "james-wilson-portal" },
    { firstName: "Emily", lastName: "Chen", email: "emily.chen@email.com", phone: "(619) 555-0102", dob: "1985-07-22", slug: "emily-chen-portal" },
    { firstName: "Robert", lastName: "Martinez", email: "robert.martinez@email.com", phone: "(619) 555-0103", dob: "1972-11-08", slug: "robert-martinez-portal" },
    { firstName: "Lisa", lastName: "Anderson", email: "lisa.anderson@email.com", phone: "(619) 555-0104", dob: "1990-05-30", slug: "lisa-anderson-portal" },
    { firstName: "David", lastName: "Kim", email: "david.kim@email.com", phone: "(619) 555-0105", dob: "1968-09-12", slug: "david-kim-portal" },
    { firstName: "Sarah", lastName: "Mitchell", email: "sarah.mitchell@email.com", phone: "(619) 555-0106", dob: "1982-01-20", slug: "sarah-mitchell-portal" },
    { firstName: "Thomas", lastName: "Garcia", email: "thomas.garcia@email.com", phone: "(619) 555-0107", dob: "1975-08-04", slug: "thomas-garcia-portal" },
  ];

  const patients = await Promise.all(
    patientData.map((p) =>
      prisma.patient.upsert({
        where: { portalSlug: p.slug },
        update: {},
        create: {
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          dateOfBirth: new Date(p.dob),
          address: `${Math.floor(Math.random() * 999) + 100} Main St`,
          city: "San Diego",
          state: "CA",
          zip: "92101",
          portalSlug: p.slug,
          clinicId: clinic.id,
        },
      })
    )
  );
  console.log(`Created ${patients.length} patients`);

  // --- Inventory (with cost + retail for margins) ---
  const inventoryItems = [
    { name: "BPC-157", sku: "BPC-157-5MG", lot: "LOT-2026-001", exp: "2027-06-15", qty: 45, min: 10, cost: 32.00, retail: 89.99, supplier: "Peptide Sciences", category: "Peptide" },
    { name: "TB-500 (Thymosin Beta-4)", sku: "TB500-5MG", lot: "LOT-2026-002", exp: "2027-08-20", qty: 32, min: 8, cost: 28.00, retail: 79.99, supplier: "Peptide Sciences", category: "Peptide" },
    { name: "Semaglutide", sku: "SEMA-2.4MG", lot: "LOT-2026-003", exp: "2026-10-10", qty: 8, min: 15, cost: 120.00, retail: 299.99, supplier: "Compounding Pharmacy", category: "GLP-1" },
    { name: "Tirzepatide", sku: "TIRZ-5MG", lot: "LOT-2026-004", exp: "2027-07-25", qty: 22, min: 10, cost: 145.00, retail: 349.99, supplier: "Compounding Pharmacy", category: "GLP-1" },
    { name: "NAD+ IV Solution", sku: "NAD-500MG", lot: "LOT-2026-005", exp: "2026-09-01", qty: 3, min: 5, cost: 85.00, retail: 199.99, supplier: "IV Solutions Inc", category: "IV Therapy" },
    { name: "Epithalon", sku: "EPITH-10MG", lot: "LOT-2026-006", exp: "2027-09-15", qty: 28, min: 5, cost: 55.00, retail: 149.99, supplier: "Peptide Sciences", category: "Peptide" },
    { name: "GHK-Cu", sku: "GHKCU-50MG", lot: "LOT-2026-007", exp: "2027-05-30", qty: 18, min: 8, cost: 22.00, retail: 69.99, supplier: "Peptide Sciences", category: "Peptide", storage: "Room Temperature" },
    { name: "Sermorelin", sku: "SERM-9MG", lot: "LOT-2026-008", exp: "2027-10-01", qty: 35, min: 12, cost: 68.00, retail: 189.99, supplier: "Compounding Pharmacy", category: "Growth Hormone" },
    { name: "CJC-1295/Ipamorelin", sku: "CJC-IPAM-10MG", lot: "LOT-2026-009", exp: "2027-04-15", qty: 40, min: 10, cost: 45.00, retail: 159.99, supplier: "Peptide Sciences", category: "Growth Hormone" },
    { name: "Glutathione IV", sku: "GLUT-2000MG", lot: "LOT-2026-010", exp: "2026-12-01", qty: 15, min: 8, cost: 18.00, retail: 79.99, supplier: "IV Solutions Inc", category: "IV Therapy" },
    { name: "Vitamin D3 Injection", sku: "VITD3-50K", lot: "LOT-2026-011", exp: "2027-11-30", qty: 50, min: 15, cost: 5.00, retail: 35.00, supplier: "Medical Supply Co", category: "Nutrient" },
    { name: "B12 Injection", sku: "B12-1000MCG", lot: "LOT-2026-012", exp: "2027-08-15", qty: 60, min: 20, cost: 3.50, retail: 25.00, supplier: "Medical Supply Co", category: "Nutrient" },
    { name: "Myers Cocktail IV Kit", sku: "MYERS-IV", lot: "LOT-2026-013", exp: "2026-11-15", qty: 12, min: 5, cost: 42.00, retail: 149.99, supplier: "IV Solutions Inc", category: "IV Therapy" },
    { name: "PT-141 (Bremelanotide)", sku: "PT141-10MG", lot: "LOT-2026-014", exp: "2027-03-20", qty: 20, min: 5, cost: 38.00, retail: 119.99, supplier: "Peptide Sciences", category: "Peptide" },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { clinicId_sku_lotNumber: { clinicId: clinic.id, sku: item.sku, lotNumber: item.lot } },
      update: { quantity: item.qty, costPrice: item.cost, unitPrice: item.retail, expirationDate: new Date(item.exp) },
      create: {
        name: item.name,
        sku: item.sku,
        lotNumber: item.lot,
        expirationDate: new Date(item.exp),
        quantity: item.qty,
        minStock: item.min,
        costPrice: item.cost,
        unitPrice: item.retail,
        supplier: item.supplier,
        category: item.category,
        storageTemp: item.storage || "Refrigerated",
        clinicId: clinic.id,
      },
    });
  }
  console.log(`Created ${inventoryItems.length} inventory items`);

  // --- Encounters with SOAP data ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // NOTE: previous versions of this seed called deleteMany on consultations/fridge
  // readings/tasks/shipments. That was only safe on an empty dev DB. Removed to
  // protect real clinic data if DATABASE_URL ever points somewhere it shouldn't.

  const encounters = [
    {
      scheduledAt: new Date(today.getTime() + 9 * 3600000),
      status: "COMPLETED" as const,
      signStatus: "SIGNED" as const,
      encounterType: "FOLLOW_UP" as const,
      chiefComplaint: "Follow-up for BPC-157 protocol - knee pain",
      subjective: { chiefComplaint: "Follow-up for BPC-157 protocol", hpi: "Patient reports significant improvement in knee pain after 4 weeks of BPC-157. Pain reduced ~60%. Mobility improved, can walk without discomfort." },
      objective: { vitals: { weight: 185, bloodPressure: "128/82", heartRate: 72, temperature: 98.4 }, physicalExam: "General: Well-appearing. Knee: Decreased swelling, improved ROM. No injection site reactions." },
      assessment: { clinicalImpression: "Excellent response to BPC-157 therapy. Knee function improving.", diagnoses: [{ icd10: "M25.562", description: "Pain in left knee", isPrimary: true }] },
      plan: { orders: "Continue BPC-157 250mcg SubQ daily x 2 more weeks", followUp: "Return in 2 weeks for reassessment", patientEducation: "Continue home exercises, ice as needed" },
      aiSummary: "Patient reports significant improvement in knee pain after 4 weeks of BPC-157. Mobility increased by ~60%. Recommend continuing protocol for 2 more weeks.",
      patientId: patients[0].id,
      providerId: admin.id,
      signedAt: new Date(),
      signedById: admin.id,
    },
    {
      scheduledAt: new Date(today.getTime() + 10 * 3600000),
      status: "COMPLETED" as const,
      signStatus: "SIGNED" as const,
      encounterType: "NEW_PATIENT" as const,
      chiefComplaint: "Initial consultation - weight management",
      subjective: { chiefComplaint: "Weight management consultation", hpi: "52yo male seeking GLP-1 therapy. BMI 32.4. Has tried diet and exercise without sustained results. No prior weight loss medication." },
      objective: { vitals: { weight: 225, bloodPressure: "138/88", heartRate: 78, temperature: 98.6 }, physicalExam: "General: Obese male in NAD. Heart: RRR. Lungs: CTA." },
      assessment: { clinicalImpression: "Obesity with BMI 32.4. Good candidate for GLP-1 therapy.", diagnoses: [{ icd10: "E66.01", description: "Morbid obesity due to excess calories", isPrimary: true }] },
      plan: { prescriptions: "Semaglutide 0.25mg SubQ weekly x 4 weeks, then titrate to 0.5mg", followUp: "Follow-up in 4 weeks for titration", patientEducation: "Dietary counseling provided. Start food diary." },
      aiSummary: "New patient seeking GLP-1 therapy for weight management. BMI 32.4. No contraindications. Started on Semaglutide 0.25mg weekly.",
      patientId: patients[1].id,
      providerId: admin.id,
      signedAt: new Date(),
      signedById: admin.id,
    },
    {
      scheduledAt: new Date(today.getTime() + 11 * 3600000),
      status: "IN_PROGRESS" as const,
      signStatus: "DRAFT" as const,
      encounterType: "IV_THERAPY" as const,
      chiefComplaint: "NAD+ IV therapy session",
      subjective: { chiefComplaint: "NAD+ IV therapy - session 3 of 4", hpi: "Patient here for 3rd NAD+ IV session. Reports improved energy and mental clarity since starting protocol." },
      patientId: patients[2].id,
      providerId: provider.id,
    },
    {
      scheduledAt: new Date(today.getTime() + 14 * 3600000),
      status: "SCHEDULED" as const,
      signStatus: "UNSIGNED" as const,
      encounterType: "FOLLOW_UP" as const,
      chiefComplaint: "Longevity protocol review - Epithalon + peptides",
      patientId: patients[3].id,
      providerId: admin.id,
    },
    {
      scheduledAt: new Date(today.getTime() + 15 * 3600000),
      status: "SCHEDULED" as const,
      signStatus: "UNSIGNED" as const,
      encounterType: "LAB_REVIEW" as const,
      chiefComplaint: "Lab review - comprehensive metabolic panel",
      patientId: patients[4].id,
      providerId: admin.id,
    },
    // Past encounters (yesterday, last week)
    {
      scheduledAt: new Date(today.getTime() - 24 * 3600000 + 9 * 3600000),
      status: "COMPLETED" as const,
      signStatus: "SIGNED" as const,
      encounterType: "INJECTION" as const,
      chiefComplaint: "Sermorelin injection - growth hormone optimization",
      subjective: { chiefComplaint: "GH optimization follow-up", hpi: "Patient on Sermorelin 300mcg nightly x 8 weeks. Reports improved sleep quality and recovery from workouts." },
      objective: { vitals: { weight: 178, bloodPressure: "122/78", heartRate: 66 }, physicalExam: "Fit male, well-muscled. Injection sites clean." },
      assessment: { clinicalImpression: "Good response to Sermorelin. Sleep and recovery improved.", diagnoses: [{ icd10: "E23.0", description: "Hypopituitarism", isPrimary: true }] },
      plan: { orders: "Continue Sermorelin 300mcg SubQ nightly", followUp: "Recheck IGF-1 in 4 weeks" },
      patientId: patients[5].id,
      providerId: admin.id,
      signedAt: new Date(today.getTime() - 24 * 3600000 + 12 * 3600000),
      signedById: admin.id,
    },
    {
      scheduledAt: new Date(today.getTime() - 7 * 24 * 3600000 + 10 * 3600000),
      status: "COMPLETED" as const,
      signStatus: "SIGNED" as const,
      encounterType: "FOLLOW_UP" as const,
      chiefComplaint: "Tirzepatide follow-up - week 8",
      subjective: { chiefComplaint: "GLP-1 therapy follow-up", hpi: "Patient on Tirzepatide 5mg weekly for 8 weeks. Lost 14 lbs so far. Mild nausea first 2 weeks, now resolved." },
      objective: { vitals: { weight: 198, bloodPressure: "130/82", heartRate: 74 }, physicalExam: "Weight down from 212 lbs baseline." },
      assessment: { clinicalImpression: "Excellent response to Tirzepatide. 14 lb weight loss in 8 weeks.", diagnoses: [{ icd10: "E66.01", description: "Morbid obesity", isPrimary: true }] },
      plan: { prescriptions: "Tirzepatide 7.5mg SubQ weekly (dose increase)", followUp: "Follow-up in 4 weeks" },
      patientId: patients[6].id,
      providerId: admin.id,
      signedAt: new Date(today.getTime() - 7 * 24 * 3600000 + 12 * 3600000),
      signedById: admin.id,
    },
  ];

  for (const enc of encounters) {
    await prisma.consultation.create({ data: enc });
  }
  console.log(`Created ${encounters.length} encounters`);

  // --- Lab Panels for Jamie Rivera ---
  // Delete existing lab data for this patient to avoid duplicates
  const existingPanels = await prisma.labPanel.findMany({ where: { patientId: patients[0].id }, select: { id: true } });
  if (existingPanels.length > 0) {
    await prisma.labMarker.deleteMany({ where: { labPanelId: { in: existingPanels.map(p => p.id) } } });
    await prisma.labPanel.deleteMany({ where: { patientId: patients[0].id } });
  }

  // Feb 2026 Panel
  const febPanel = await prisma.labPanel.create({
    data: {
      collectedAt: new Date("2026-02-10"),
      reportedAt: new Date("2026-02-12"),
      labProvider: "Quest Diagnostics",
      fasting: true,
      status: "COMPLETED",
      patientId: patients[0].id,
      aiSummary: "Overall healthy panel. Testosterone and IGF-1 at optimal levels. Vitamin D slightly low - recommend supplementation. Lipids are well-managed.",
    },
  });

  const febMarkers: { name: string; value: number; unit: string; referenceMin: number; referenceMax: number; status: MarkerStatus; category: string }[] = [
    // Metabolic
    { name: "Glucose", value: 92, unit: "mg/dL", referenceMin: 65, referenceMax: 99, status: "NORMAL", category: "Metabolic" },
    { name: "Hemoglobin A1c", value: 5.2, unit: "%", referenceMin: 4.0, referenceMax: 5.6, status: "NORMAL", category: "Metabolic" },
    { name: "Insulin, Fasting", value: 6.8, unit: "uIU/mL", referenceMin: 2.6, referenceMax: 24.9, status: "NORMAL", category: "Metabolic" },
    // Lipids
    { name: "Total Cholesterol", value: 195, unit: "mg/dL", referenceMin: 100, referenceMax: 199, status: "NORMAL", category: "Lipids" },
    { name: "LDL Cholesterol", value: 112, unit: "mg/dL", referenceMin: 0, referenceMax: 99, status: "HIGH", category: "Lipids" },
    { name: "HDL Cholesterol", value: 62, unit: "mg/dL", referenceMin: 40, referenceMax: 100, status: "NORMAL", category: "Lipids" },
    { name: "Triglycerides", value: 105, unit: "mg/dL", referenceMin: 0, referenceMax: 149, status: "NORMAL", category: "Lipids" },
    // Hormones
    { name: "Testosterone, Total", value: 685, unit: "ng/dL", referenceMin: 264, referenceMax: 916, status: "NORMAL", category: "Hormones" },
    { name: "Testosterone, Free", value: 18.2, unit: "pg/mL", referenceMin: 8.7, referenceMax: 25.1, status: "NORMAL", category: "Hormones" },
    { name: "Estradiol", value: 28, unit: "pg/mL", referenceMin: 8, referenceMax: 35, status: "NORMAL", category: "Hormones" },
    { name: "DHEA-S", value: 380, unit: "mcg/dL", referenceMin: 138, referenceMax: 475, status: "NORMAL", category: "Hormones" },
    { name: "IGF-1", value: 245, unit: "ng/mL", referenceMin: 115, referenceMax: 355, status: "NORMAL", category: "Hormones" },
    { name: "TSH", value: 1.8, unit: "mIU/L", referenceMin: 0.45, referenceMax: 4.5, status: "NORMAL", category: "Thyroid" },
    { name: "Free T4", value: 1.3, unit: "ng/dL", referenceMin: 0.82, referenceMax: 1.77, status: "NORMAL", category: "Thyroid" },
    { name: "Free T3", value: 3.2, unit: "pg/mL", referenceMin: 2.0, referenceMax: 4.4, status: "NORMAL", category: "Thyroid" },
    // Vitamins/Minerals
    { name: "Vitamin D, 25-OH", value: 38, unit: "ng/mL", referenceMin: 30, referenceMax: 100, status: "NORMAL", category: "Vitamins" },
    { name: "Vitamin B12", value: 620, unit: "pg/mL", referenceMin: 232, referenceMax: 1245, status: "NORMAL", category: "Vitamins" },
    { name: "Ferritin", value: 95, unit: "ng/mL", referenceMin: 30, referenceMax: 400, status: "NORMAL", category: "Vitamins" },
    { name: "Iron", value: 110, unit: "mcg/dL", referenceMin: 38, referenceMax: 169, status: "NORMAL", category: "Vitamins" },
    { name: "Magnesium", value: 2.1, unit: "mg/dL", referenceMin: 1.6, referenceMax: 2.6, status: "NORMAL", category: "Vitamins" },
    // CBC
    { name: "WBC", value: 6.2, unit: "10^3/uL", referenceMin: 3.4, referenceMax: 10.8, status: "NORMAL", category: "CBC" },
    { name: "RBC", value: 5.1, unit: "10^6/uL", referenceMin: 4.14, referenceMax: 5.8, status: "NORMAL", category: "CBC" },
    { name: "Hemoglobin", value: 15.2, unit: "g/dL", referenceMin: 12.6, referenceMax: 17.7, status: "NORMAL", category: "CBC" },
    { name: "Hematocrit", value: 45.1, unit: "%", referenceMin: 37.5, referenceMax: 51, status: "NORMAL", category: "CBC" },
    { name: "Platelets", value: 245, unit: "10^3/uL", referenceMin: 150, referenceMax: 379, status: "NORMAL", category: "CBC" },
    // Kidney/Liver
    { name: "Creatinine", value: 1.0, unit: "mg/dL", referenceMin: 0.76, referenceMax: 1.27, status: "NORMAL", category: "Kidney" },
    { name: "eGFR", value: 105, unit: "mL/min/1.73m2", referenceMin: 90, referenceMax: 120, status: "NORMAL", category: "Kidney" },
    { name: "BUN", value: 15, unit: "mg/dL", referenceMin: 6, referenceMax: 24, status: "NORMAL", category: "Kidney" },
    { name: "AST", value: 24, unit: "U/L", referenceMin: 0, referenceMax: 40, status: "NORMAL", category: "Liver" },
    { name: "ALT", value: 28, unit: "U/L", referenceMin: 0, referenceMax: 44, status: "NORMAL", category: "Liver" },
    // Inflammation
    { name: "CRP, High Sensitivity", value: 0.8, unit: "mg/L", referenceMin: 0, referenceMax: 3.0, status: "NORMAL", category: "Inflammation" },
    { name: "Homocysteine", value: 8.5, unit: "umol/L", referenceMin: 0, referenceMax: 10.4, status: "NORMAL", category: "Inflammation" },
  ];

  await prisma.labMarker.createMany({
    data: febMarkers.map((m) => ({ ...m, labPanelId: febPanel.id })),
  });

  // Nov 2025 Panel (historical)
  const novPanel = await prisma.labPanel.create({
    data: {
      collectedAt: new Date("2025-11-15"),
      reportedAt: new Date("2025-11-18"),
      labProvider: "Quest Diagnostics",
      fasting: true,
      status: "REVIEWED",
      patientId: patients[0].id,
      aiSummary: "Baseline panel before starting peptide protocol. Testosterone slightly below optimal. Vitamin D deficient. IGF-1 on lower end.",
    },
  });

  const novMarkers: { name: string; value: number; unit: string; referenceMin: number; referenceMax: number; status: MarkerStatus; category: string }[] = [
    { name: "Glucose", value: 98, unit: "mg/dL", referenceMin: 65, referenceMax: 99, status: "NORMAL", category: "Metabolic" },
    { name: "Hemoglobin A1c", value: 5.4, unit: "%", referenceMin: 4.0, referenceMax: 5.6, status: "NORMAL", category: "Metabolic" },
    { name: "Total Cholesterol", value: 210, unit: "mg/dL", referenceMin: 100, referenceMax: 199, status: "HIGH", category: "Lipids" },
    { name: "LDL Cholesterol", value: 128, unit: "mg/dL", referenceMin: 0, referenceMax: 99, status: "HIGH", category: "Lipids" },
    { name: "HDL Cholesterol", value: 55, unit: "mg/dL", referenceMin: 40, referenceMax: 100, status: "NORMAL", category: "Lipids" },
    { name: "Triglycerides", value: 135, unit: "mg/dL", referenceMin: 0, referenceMax: 149, status: "NORMAL", category: "Lipids" },
    { name: "Testosterone, Total", value: 520, unit: "ng/dL", referenceMin: 264, referenceMax: 916, status: "NORMAL", category: "Hormones" },
    { name: "Testosterone, Free", value: 12.5, unit: "pg/mL", referenceMin: 8.7, referenceMax: 25.1, status: "NORMAL", category: "Hormones" },
    { name: "IGF-1", value: 168, unit: "ng/mL", referenceMin: 115, referenceMax: 355, status: "NORMAL", category: "Hormones" },
    { name: "TSH", value: 2.1, unit: "mIU/L", referenceMin: 0.45, referenceMax: 4.5, status: "NORMAL", category: "Thyroid" },
    { name: "Vitamin D, 25-OH", value: 22, unit: "ng/mL", referenceMin: 30, referenceMax: 100, status: "LOW", category: "Vitamins" },
    { name: "Vitamin B12", value: 480, unit: "pg/mL", referenceMin: 232, referenceMax: 1245, status: "NORMAL", category: "Vitamins" },
    { name: "CRP, High Sensitivity", value: 1.4, unit: "mg/L", referenceMin: 0, referenceMax: 3.0, status: "NORMAL", category: "Inflammation" },
    { name: "Hemoglobin", value: 14.8, unit: "g/dL", referenceMin: 12.6, referenceMax: 17.7, status: "NORMAL", category: "CBC" },
    { name: "AST", value: 22, unit: "U/L", referenceMin: 0, referenceMax: 40, status: "NORMAL", category: "Liver" },
    { name: "ALT", value: 25, unit: "U/L", referenceMin: 0, referenceMax: 44, status: "NORMAL", category: "Liver" },
    { name: "Creatinine", value: 1.0, unit: "mg/dL", referenceMin: 0.76, referenceMax: 1.27, status: "NORMAL", category: "Kidney" },
  ];

  await prisma.labMarker.createMany({
    data: novMarkers.map((m) => ({ ...m, labPanelId: novPanel.id })),
  });

  console.log("Created 2 lab panels with markers for Jamie Rivera");

  // --- Protocols ---
  await prisma.protocol.deleteMany({ where: { patientId: { in: patients.map(p => p.id) } } });

  await prisma.protocol.createMany({
    data: [
      { name: "BPC-157 Healing Protocol", description: "Subcutaneous injection for tissue repair and joint healing", dosage: "250mcg", frequency: "Twice daily", startDate: new Date("2025-12-01"), patientId: patients[0].id, active: true },
      { name: "Sermorelin Growth Hormone", description: "Growth hormone secretagogue for anti-aging and recovery", dosage: "300mcg", frequency: "Nightly at bedtime", startDate: new Date("2025-11-15"), patientId: patients[0].id, active: true },
      { name: "Semaglutide Weight Management", description: "GLP-1 receptor agonist for metabolic health", dosage: "0.5mg (titrated from 0.25mg)", frequency: "Weekly", startDate: new Date("2026-01-15"), patientId: patients[1].id, active: true },
      { name: "NAD+ IV Optimization", description: "IV NAD+ for cellular energy and longevity", dosage: "500mg", frequency: "Weekly x 4, then monthly", startDate: new Date("2026-02-01"), patientId: patients[2].id, active: true },
      { name: "Epithalon Telomere Protocol", description: "Telomerase activator for longevity", dosage: "10mg", frequency: "Daily x 20 days, repeat every 6 months", startDate: new Date("2026-01-01"), patientId: patients[3].id, active: true },
      { name: "Tirzepatide Weight Loss", description: "Dual GIP/GLP-1 agonist for weight management", dosage: "7.5mg", frequency: "Weekly", startDate: new Date("2026-01-10"), patientId: patients[6].id, active: true },
    ],
  });
  console.log("Created protocols");

  // --- Fridge ---
  const fridge = await prisma.fridge.upsert({
    where: { id: "main-fridge-001" },
    update: {},
    create: {
      id: "main-fridge-001",
      name: "Main Peptide Fridge",
      location: "Storage Room A",
      minTemp: 2.0,
      maxTemp: 8.0,
      clinicId: clinic.id,
    },
  });

  // Delete old readings and create fresh ones
  await prisma.fridgeReading.deleteMany({ where: { fridgeId: fridge.id } });
  const now = new Date();
  const readings = [];
  for (let i = 0; i < 48; i++) {
    const recordedAt = new Date(now.getTime() - i * 30 * 60 * 1000);
    let temp = 4.5 + (Math.random() - 0.5) * 2;
    let alert = false;
    let alertType = null;
    if (i >= 11 && i <= 13) {
      temp = 12.5 + Math.random() * 2;
      alert = true;
      alertType = "HIGH_TEMP";
    }
    readings.push({
      temperature: parseFloat(temp.toFixed(1)),
      humidity: parseFloat((45 + Math.random() * 10).toFixed(1)),
      battery: 85 + Math.random() * 15,
      alert,
      alertType,
      fridgeId: fridge.id,
      recordedAt,
    });
  }
  await prisma.fridgeReading.createMany({ data: readings });
  console.log("Created fridge with readings");

  // --- Symptom Types ---
  const symptomTypes = [
    { name: "Anxiety", category: "Mental Health", icon: "brain" },
    { name: "Fatigue", category: "Physical", icon: "battery-low" },
    { name: "Energy Level", category: "Physical", icon: "zap" },
    { name: "Sleep Quality", category: "Sleep", icon: "moon" },
    { name: "Mood", category: "Mental Health", icon: "smile" },
    { name: "Pain Level", category: "Physical", icon: "activity" },
    { name: "Stress Level", category: "Mental Health", icon: "alert-triangle" },
    { name: "Brain Fog", category: "Mental Health", icon: "cloud" },
    { name: "Libido", category: "Hormonal", icon: "heart" },
    { name: "Joint Pain", category: "Physical", icon: "bone" },
  ];

  for (const st of symptomTypes) {
    await prisma.symptomType.upsert({
      where: { name: st.name },
      update: {},
      create: st,
    });
  }
  console.log("Created symptom types");

  // --- Tasks ---
  // Clear + reseed to keep demo content consistent
  await prisma.task.deleteMany({ where: { clinicId: clinic.id } });
  const day = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const inventory = await prisma.inventoryItem.findMany({ where: { clinicId: clinic.id } });
  const semaglutide = inventory.find((i) => i.sku === "SEMA-2.4MG");

  const tasks = [
    {
      title: "Review Jamie Rivera's latest lab results",
      description: "IGF-1 and testosterone follow-up — confirm Sermorelin dosing.",
      priority: "HIGH" as const,
      status: "PENDING" as const,
      dueDate: new Date(nowMs + 1 * day),
      patientId: patients[0].id,
      assignedToId: admin.id,
    },
    {
      title: "Call Emily Chen to confirm next appointment",
      priority: "MEDIUM" as const,
      status: "PENDING" as const,
      dueDate: new Date(nowMs + 2 * day),
      patientId: patients[2].id,
      assignedToId: provider.id,
    },
    {
      title: `Restock ${semaglutide?.name || "Semaglutide"} — below min`,
      description: "Current stock 8 units, min 15. Place supplier order.",
      priority: "URGENT" as const,
      status: "PENDING" as const,
      dueDate: new Date(nowMs + 1 * day),
      assignedToId: admin.id,
    },
    {
      title: "Schedule quarterly blood draw for James Wilson",
      priority: "MEDIUM" as const,
      status: "PENDING" as const,
      dueDate: new Date(nowMs + 5 * day),
      patientId: patients[1].id,
      assignedToId: provider.id,
    },
    {
      title: "Follow up with David Kim on weight loss protocol",
      priority: "LOW" as const,
      status: "PENDING" as const,
      dueDate: new Date(nowMs + 7 * day),
      patientId: patients[5].id,
      assignedToId: admin.id,
    },
    {
      title: "Update insurance info for Lisa Anderson",
      priority: "LOW" as const,
      status: "COMPLETED" as const,
      completedAt: new Date(nowMs - 1 * day),
      patientId: patients[4].id,
      assignedToId: admin.id,
    },
    {
      title: "Send monthly peptide protocol reminder emails",
      priority: "MEDIUM" as const,
      status: "COMPLETED" as const,
      completedAt: new Date(nowMs - 3 * day),
      assignedToId: admin.id,
    },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: { ...t, clinicId: clinic.id, createdById: admin.id },
    });
  }
  console.log(`Created ${tasks.length} tasks`);

  // --- Shipments ---
  await prisma.shipment.deleteMany({ where: { clinicId: clinic.id } });
  const bpc157 = inventory.find((i) => i.sku === "BPC-157-5MG");
  const tb500 = inventory.find((i) => i.sku === "TB500-5MG");
  const sermorelin = inventory.find((i) => i.sku.startsWith("SERM-"));
  const ipamorelin = inventory.find((i) => i.sku.startsWith("IPAM-"));

  const pickItem = (inv: typeof bpc157) => (inv ? [{ inventoryItemId: inv.id, quantity: 1 }] : []);

  const shipments = [
    {
      patientId: patients[0].id, // Jamie Rivera
      status: "SHIPPED" as const,
      trackingNumber: "9400 1111 2222 3333 4444 55",
      carrier: "USPS",
      shippedAt: new Date(nowMs - 2 * day),
      items: [...pickItem(sermorelin), ...pickItem(bpc157)],
    },
    {
      patientId: patients[1].id, // James Wilson
      status: "DELIVERED" as const,
      trackingNumber: "9400 1111 2222 3333 4444 66",
      carrier: "USPS",
      shippedAt: new Date(nowMs - 7 * day),
      deliveredAt: new Date(nowMs - 5 * day),
      items: pickItem(tb500),
    },
    {
      patientId: patients[2].id, // Emily Chen
      status: "PACKED" as const,
      carrier: "USPS",
      items: [...pickItem(bpc157), ...pickItem(ipamorelin)],
    },
    {
      patientId: patients[5].id, // David Kim
      status: "PENDING" as const,
      carrier: "FedEx",
      items: pickItem(semaglutide),
    },
    {
      patientId: patients[4].id, // Lisa Anderson
      status: "DELIVERED" as const,
      trackingNumber: "1Z 999 AA1 01 2345 6784",
      carrier: "UPS",
      shippedAt: new Date(nowMs - 14 * day),
      deliveredAt: new Date(nowMs - 12 * day),
      items: pickItem(sermorelin),
    },
    {
      patientId: patients[3].id, // Robert Martinez
      status: "SHIPPED" as const,
      trackingNumber: "9400 1111 2222 3333 4444 77",
      carrier: "USPS",
      shippedAt: new Date(nowMs - 1 * day),
      items: [...pickItem(bpc157), ...pickItem(tb500)],
    },
  ];

  for (const s of shipments) {
    const patient = patients.find((p) => p.id === s.patientId)!;
    await prisma.shipment.create({
      data: {
        patientId: s.patientId,
        clinicId: clinic.id,
        status: s.status,
        carrier: s.carrier,
        trackingNumber: s.trackingNumber ?? null,
        shippedAt: s.shippedAt ?? null,
        deliveredAt: s.deliveredAt ?? null,
        addressLine1: patient.address ?? "123 Main St",
        city: patient.city ?? "San Diego",
        state: patient.state ?? "CA",
        zip: patient.zip ?? "92101",
        items: s.items.length > 0 ? { create: s.items } : undefined,
      },
    });
  }
  console.log(`Created ${shipments.length} shipments`);

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
