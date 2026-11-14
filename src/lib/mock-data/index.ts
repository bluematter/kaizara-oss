// ============================================================================
// DEMO MODE - PROTOTYPE DATA
// ============================================================================
// This mock data is for demonstration purposes only.
// All patient names, contact info, and health data are fictional.
// Before production deployment:
// - Replace with real database queries
// - Ensure all demo data is removed
// - Implement proper authentication and authorization
// ============================================================================

export const mockClinic = {
  id: "clinic-001",
  name: "Demo Clinic",
  slug: "demo-clinic",
};

export const mockUser = {
  id: "user-001",
  name: "Dr. Jordan Hale",
  email: "admin@demo-clinic.example",
  role: "ADMIN" as const,
  image: null,
};

export const mockProviders = [
  { id: "user-001", name: "Dr. Jordan Hale" },
  { id: "user-002", name: "Dr. Sarah Chen" },
  { id: "user-003", name: "Dr. Amanda Lopez" },
];

export const mockPatients = [
  {
    id: "jamie-rivera",
    firstName: "Jamie",
    lastName: "Rivera",
    email: "jamie@example.com",
    phone: "(555) 000-0001",
    dateOfBirth: new Date("1988-04-09"),
    portalSlug: "jamie-rivera-portal",
    address: "123 Demo Street",
    city: "San Diego",
    state: "CA",
    zip: "92101",
  },
  {
    id: "patient-001",
    firstName: "James",
    lastName: "Wilson",
    email: "james.wilson@email.com",
    phone: "(619) 555-0101",
    portalSlug: "james-wilson-portal",
    address: "456 Oak Street",
    city: "San Diego",
    state: "CA",
    zip: "92102",
  },
  {
    id: "patient-002",
    firstName: "Emily",
    lastName: "Chen",
    email: "emily.chen@email.com",
    phone: "(619) 555-0102",
    portalSlug: "emily-chen-portal",
    address: "789 Palm Ave",
    city: "La Jolla",
    state: "CA",
    zip: "92037",
  },
  {
    id: "patient-003",
    firstName: "Robert",
    lastName: "Martinez",
    email: "robert.martinez@email.com",
    phone: "(619) 555-0103",
    portalSlug: "robert-martinez-portal",
    address: "321 Beach Blvd",
    city: "Coronado",
    state: "CA",
    zip: "92118",
  },
  {
    id: "patient-004",
    firstName: "Lisa",
    lastName: "Anderson",
    email: "lisa.anderson@email.com",
    phone: "(619) 555-0104",
    portalSlug: "lisa-anderson-portal",
    address: "567 Harbor Dr",
    city: "San Diego",
    state: "CA",
    zip: "92101",
  },
  {
    id: "patient-005",
    firstName: "David",
    lastName: "Kim",
    email: "david.kim@email.com",
    phone: "(619) 555-0105",
    portalSlug: "david-kim-portal",
    address: "890 Sunset Cliffs",
    city: "San Diego",
    state: "CA",
    zip: "92107",
  },
];

export const mockInventory = [
  {
    id: "inv-001",
    name: "BPC-157",
    sku: "BPC-157-5MG",
    lotNumber: "LOT-2025-001",
    expirationDate: new Date("2026-06-15"),
    quantity: 12,
    minStock: 5,
    unitPrice: 89.99,    // Retail price
    costPrice: 32.50,    // Cost to clinic
    supplier: "Peptide Sciences",
    category: "Peptide",
    storageTemp: "Refrigerated",
  },
  {
    id: "inv-002",
    name: "TB-500 (Thymosin Beta-4)",
    sku: "TB500-5MG",
    lotNumber: "LOT-2025-002",
    expirationDate: new Date("2026-08-20"),
    quantity: 8,
    minStock: 5,
    unitPrice: 79.99,    // Retail price
    costPrice: 28.00,    // Cost to clinic
    supplier: "Peptide Sciences",
    category: "Peptide",
    storageTemp: "Refrigerated",
  },
  {
    id: "inv-003",
    name: "Semaglutide",
    sku: "SEMA-2.4MG",
    lotNumber: "LOT-2025-003",
    expirationDate: new Date("2026-02-15"),  // Expiring soon (< 30 days)
    quantity: 4,
    minStock: 8,
    unitPrice: 299.99,   // Retail price
    costPrice: 125.00,   // Cost to clinic
    supplier: "Compounding Pharmacy",
    category: "GLP-1",
    storageTemp: "Refrigerated",
  },
  {
    id: "inv-004",
    name: "Tirzepatide",
    sku: "TIRZ-5MG",
    lotNumber: "LOT-2025-004",
    expirationDate: new Date("2026-07-25"),
    quantity: 6,
    minStock: 5,
    unitPrice: 349.99,   // Retail price
    costPrice: 145.00,   // Cost to clinic
    supplier: "Compounding Pharmacy",
    category: "GLP-1",
    storageTemp: "Refrigerated",
  },
  {
    id: "inv-005",
    name: "NAD+ IV Solution",
    sku: "NAD-500MG",
    lotNumber: "LOT-2025-005",
    expirationDate: new Date("2026-02-10"),  // Expiring soon (< 30 days)
    quantity: 2,
    minStock: 4,
    unitPrice: 199.99,   // Retail price
    costPrice: 85.00,    // Cost to clinic
    supplier: "IV Solutions Inc",
    category: "IV Therapy",
    storageTemp: "Refrigerated",
  },
  {
    id: "inv-006",
    name: "Epithalon",
    sku: "EPITH-10MG",
    lotNumber: "LOT-2025-006",
    expirationDate: new Date("2026-09-15"),
    quantity: 10,
    minStock: 3,
    unitPrice: 149.99,   // Retail price
    costPrice: 55.00,    // Cost to clinic
    supplier: "Peptide Sciences",
    category: "Peptide",
    storageTemp: "Refrigerated",
  },
  {
    id: "inv-007",
    name: "GHK-Cu",
    sku: "GHKCU-50MG",
    lotNumber: "LOT-2025-007",
    expirationDate: new Date("2026-05-30"),
    quantity: 15,
    minStock: 5,
    unitPrice: 69.99,    // Retail price
    costPrice: 24.00,    // Cost to clinic
    supplier: "Peptide Sciences",
    category: "Peptide",
    storageTemp: "Room Temperature",
  },
  {
    id: "inv-008",
    name: "Sermorelin",
    sku: "SERM-9MG",
    lotNumber: "LOT-2025-008",
    expirationDate: new Date("2026-10-01"),
    quantity: 9,
    minStock: 5,
    unitPrice: 189.99,   // Retail price
    costPrice: 72.00,    // Cost to clinic
    supplier: "Compounding Pharmacy",
    category: "Growth Hormone",
    storageTemp: "Refrigerated",
  },
  // IV Supplies
  {
    id: "inv-009",
    name: "Normal Saline 1000mL IV Bag",
    sku: "NS-1000ML",
    lotNumber: "LOT-2025-009",
    expirationDate: new Date("2027-03-15"),
    quantity: 48,
    minStock: 20,
    unitPrice: 12.00,
    costPrice: 3.50,
    supplier: "Baxter Healthcare",
    category: "IV Supplies",
    storageTemp: "Room Temperature",
  },
  {
    id: "inv-010",
    name: "Lactated Ringer's 1000mL IV Bag",
    sku: "LR-1000ML",
    lotNumber: "LOT-2025-010",
    expirationDate: new Date("2027-01-20"),
    quantity: 30,
    minStock: 15,
    unitPrice: 14.00,
    costPrice: 4.25,
    supplier: "Baxter Healthcare",
    category: "IV Supplies",
    storageTemp: "Room Temperature",
  },
  {
    id: "inv-011",
    name: "IV Administration Set (Tubing)",
    sku: "IV-TUBE-SET",
    lotNumber: "LOT-2025-011",
    expirationDate: new Date("2027-06-01"),
    quantity: 60,
    minStock: 25,
    unitPrice: 8.50,
    costPrice: 2.10,
    supplier: "Medline Industries",
    category: "IV Supplies",
    storageTemp: "Room Temperature",
  },
  {
    id: "inv-012",
    name: "IV Catheter 20G x 1.25\"",
    sku: "IV-CATH-20G",
    lotNumber: "LOT-2025-012",
    expirationDate: new Date("2027-04-10"),
    quantity: 100,
    minStock: 40,
    unitPrice: 4.50,
    costPrice: 1.20,
    supplier: "BD Medical",
    category: "IV Supplies",
    storageTemp: "Room Temperature",
  },
  {
    id: "inv-013",
    name: "IV Catheter 22G x 1\"",
    sku: "IV-CATH-22G",
    lotNumber: "LOT-2025-013",
    expirationDate: new Date("2027-04-10"),
    quantity: 80,
    minStock: 30,
    unitPrice: 4.50,
    costPrice: 1.20,
    supplier: "BD Medical",
    category: "IV Supplies",
    storageTemp: "Room Temperature",
  },
  // Nutrients & Vitamins (IV additives)
  {
    id: "inv-014",
    name: "Vitamin C (Ascorbic Acid) 500mg/mL",
    sku: "VITC-500",
    lotNumber: "LOT-2025-014",
    expirationDate: new Date("2026-08-15"),
    quantity: 20,
    minStock: 10,
    unitPrice: 45.00,
    costPrice: 12.00,
    supplier: "McGuff Compounding",
    category: "Nutrients",
    storageTemp: "Refrigerated",
  },
  {
    id: "inv-015",
    name: "Glutathione 200mg/mL",
    sku: "GLUT-200",
    lotNumber: "LOT-2025-015",
    expirationDate: new Date("2026-06-20"),
    quantity: 15,
    minStock: 8,
    unitPrice: 65.00,
    costPrice: 22.00,
    supplier: "McGuff Compounding",
    category: "Nutrients",
    storageTemp: "Refrigerated",
  },
  {
    id: "inv-016",
    name: "B-Complex Injection",
    sku: "BCOMP-INJ",
    lotNumber: "LOT-2025-016",
    expirationDate: new Date("2026-09-30"),
    quantity: 25,
    minStock: 10,
    unitPrice: 35.00,
    costPrice: 8.50,
    supplier: "McGuff Compounding",
    category: "Nutrients",
    storageTemp: "Refrigerated",
  },
  {
    id: "inv-017",
    name: "Magnesium Chloride 200mg/mL",
    sku: "MAG-200",
    lotNumber: "LOT-2025-017",
    expirationDate: new Date("2026-11-15"),
    quantity: 18,
    minStock: 8,
    unitPrice: 28.00,
    costPrice: 7.00,
    supplier: "McGuff Compounding",
    category: "Nutrients",
    storageTemp: "Room Temperature",
  },
  {
    id: "inv-018",
    name: "Zinc Sulfate 1mg/mL",
    sku: "ZINC-1",
    lotNumber: "LOT-2025-018",
    expirationDate: new Date("2026-10-01"),
    quantity: 12,
    minStock: 6,
    unitPrice: 22.00,
    costPrice: 5.50,
    supplier: "McGuff Compounding",
    category: "Nutrients",
    storageTemp: "Room Temperature",
  },
  // Miscellaneous Supplies
  {
    id: "inv-019",
    name: "Bacteriostatic Water 30mL",
    sku: "BAC-WATER-30",
    lotNumber: "LOT-2025-019",
    expirationDate: new Date("2026-12-01"),
    quantity: 35,
    minStock: 15,
    unitPrice: 12.00,
    costPrice: 3.00,
    supplier: "Hospira",
    category: "Supplies",
    storageTemp: "Room Temperature",
  },
  {
    id: "inv-020",
    name: "Insulin Syringes 1mL (30-pack)",
    sku: "SYR-1ML-30",
    lotNumber: "LOT-2025-020",
    expirationDate: new Date("2028-01-01"),
    quantity: 20,
    minStock: 10,
    unitPrice: 18.00,
    costPrice: 6.50,
    supplier: "BD Medical",
    category: "Supplies",
    storageTemp: "Room Temperature",
  },
];

// Generate fridge readings for the last 24 hours
export function generateFridgeReadings() {
  const readings = [];
  const now = new Date();

  for (let i = 0; i < 48; i++) {
    const recordedAt = new Date(now.getTime() - i * 30 * 60 * 1000);

    // Normal temp with one spike around 6 hours ago
    let temp = 4.5 + (Math.random() - 0.5) * 2;
    let alert = false;

    if (i >= 11 && i <= 13) {
      temp = 12.5 + Math.random() * 2;
      alert = true;
    }

    readings.push({
      id: `reading-${i}`,
      temperature: parseFloat(temp.toFixed(1)),
      humidity: parseFloat((45 + Math.random() * 10).toFixed(1)),
      alert,
      recordedAt,
    });
  }

  return readings.reverse();
}

export const mockFridge = {
  id: "fridge-001",
  name: "Main Peptide Fridge",
  location: "Storage Room A",
  minTemp: 2.0,
  maxTemp: 8.0,
  currentTemp: 4.2,
  readings: generateFridgeReadings(),
};

export const mockConsultations = [
  {
    id: "consult-michael",
    scheduledAt: new Date(new Date().setHours(9, 0, 0, 0)),
    status: "COMPLETED" as const,
    chiefComplaint: "Lab review - Comprehensive panel results",
    aiSummary:
      "Reviewed comprehensive lab panel from Quest Diagnostics. Excellent results across all markers. IGF-1 at 242 ng/mL showing strong response to Sermorelin protocol. Testosterone optimal at 800 ng/dL. HbA1c 4.5% indicates excellent metabolic health. Continue current protocol.",
    patient: mockPatients[0], // Jamie Rivera
  },
  {
    id: "consult-001",
    scheduledAt: new Date(new Date().setHours(10, 0, 0, 0)),
    status: "COMPLETED" as const,
    chiefComplaint: "Follow-up for BPC-157 protocol",
    aiSummary:
      "Patient reports significant improvement in knee pain after 4 weeks of BPC-157. Mobility increased by 40%. Recommend continuing protocol for 2 more weeks.",
    patient: mockPatients[1],
  },
  {
    id: "consult-002",
    scheduledAt: new Date(new Date().setHours(11, 0, 0, 0)),
    status: "IN_PROGRESS" as const,
    chiefComplaint: "Initial consultation - weight management",
    patient: mockPatients[2],
  },
  {
    id: "consult-003",
    scheduledAt: new Date(new Date().setHours(14, 0, 0, 0)),
    status: "SCHEDULED" as const,
    chiefComplaint: "NAD+ IV therapy session",
    patient: mockPatients[3],
  },
  {
    id: "consult-004",
    scheduledAt: new Date(new Date().setHours(15, 0, 0, 0)),
    status: "SCHEDULED" as const,
    chiefComplaint: "Longevity protocol review",
    patient: mockPatients[4],
  },
];

export const mockShipments = [
  {
    id: "ship-001",
    status: "SHIPPED" as const,
    trackingNumber: "1Z999AA10123456784",
    carrier: "UPS",
    patient: mockPatients[0],
    items: [
      { name: "BPC-157", quantity: 2, lotNumber: "LOT-2024-001" },
      { name: "TB-500", quantity: 1, lotNumber: "LOT-2024-002" },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "ship-002",
    status: "PENDING" as const,
    patient: mockPatients[1],
    items: [{ name: "Semaglutide", quantity: 4, lotNumber: "LOT-2024-003" }],
    createdAt: new Date(),
  },
];

// Mock Tasks for practitioners
export const mockTasks = [
  {
    id: "task-001",
    title: "Review Jamie Rivera's lab results",
    description: "New comprehensive panel uploaded - needs interpretation and follow-up plan",
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
    priority: "HIGH" as const,
    status: "PENDING" as const,
    patientId: "jamie-rivera",
    patientName: "Jamie Rivera",
    assignedToId: "user-001",
    assignedToName: "Dr. Jordan Hale",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "task-002",
    title: "Follow up with James Wilson",
    description: "Patient reported mild nausea with Semaglutide - check in on symptoms",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
    priority: "MEDIUM" as const,
    status: "PENDING" as const,
    patientId: "patient-001",
    patientName: "James Wilson",
    assignedToId: "user-001",
    assignedToName: "Dr. Jordan Hale",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "task-003",
    title: "Order Semaglutide restock",
    description: "Low stock alert - only 8 units remaining, below minimum of 15",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
    priority: "HIGH" as const,
    status: "IN_PROGRESS" as const,
    patientId: null,
    patientName: null,
    assignedToId: "user-001",
    assignedToName: "Dr. Jordan Hale",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    id: "task-004",
    title: "Schedule Emily Chen for follow-up",
    description: "3-month GLP-1 check-in due - weight loss progress review",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 1 week
    priority: "MEDIUM" as const,
    status: "PENDING" as const,
    patientId: "patient-002",
    patientName: "Emily Chen",
    assignedToId: "user-001",
    assignedToName: "Dr. Jordan Hale",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: "task-005",
    title: "Update clinic protocols document",
    description: "Add new Tirzepatide dosing guidelines based on latest research",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // In 2 weeks
    priority: "LOW" as const,
    status: "PENDING" as const,
    patientId: null,
    patientName: null,
    assignedToId: "user-001",
    assignedToName: "Dr. Jordan Hale",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "task-006",
    title: "Call Lisa Anderson - declining scores",
    description: "Energy score dropped 15% over past 2 weeks - needs check-in",
    dueDate: new Date(), // Today
    priority: "URGENT" as const,
    status: "PENDING" as const,
    patientId: "patient-004",
    patientName: "Lisa Anderson",
    assignedToId: "user-001",
    assignedToName: "Dr. Jordan Hale",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: "task-007",
    title: "Send Robert Martinez his peptide schedule",
    description: "Patient requested PDF of their injection schedule",
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    priority: "LOW" as const,
    status: "COMPLETED" as const,
    patientId: "patient-003",
    patientName: "Robert Martinez",
    assignedToId: "user-001",
    assignedToName: "Dr. Jordan Hale",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

// Mock Weight Goals for patients
export const mockWeightGoals: Record<string, { goalWeight: number; startWeight: number; startDate: Date; targetDate: Date }> = {
  "jamie-rivera": {
    goalWeight: 170,
    startWeight: 185,
    startDate: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000),
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
  },
  "patient-002": {
    goalWeight: 145,
    startWeight: 165,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
};

// Mock Vitals (Objective Data) for patients
export const mockVitals: Record<string, Array<{ id: string; type: string; value: number; value2?: number; unit: string; measuredAt: Date; source: string }>> = {
  "jamie-rivera": [
    // Weight tracking (last 8 weeks)
    { id: "vital-001", type: "WEIGHT", value: 185, unit: "lbs", measuredAt: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-002", type: "WEIGHT", value: 183, unit: "lbs", measuredAt: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-003", type: "WEIGHT", value: 181, unit: "lbs", measuredAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-004", type: "WEIGHT", value: 180, unit: "lbs", measuredAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-005", type: "WEIGHT", value: 178, unit: "lbs", measuredAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-006", type: "WEIGHT", value: 176, unit: "lbs", measuredAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-007", type: "WEIGHT", value: 175, unit: "lbs", measuredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-008", type: "WEIGHT", value: 174, unit: "lbs", measuredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-009", type: "WEIGHT", value: 173, unit: "lbs", measuredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    // Blood pressure (last 4 readings)
    { id: "vital-010", type: "BLOOD_PRESSURE", value: 128, value2: 82, unit: "mmHg", measuredAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-011", type: "BLOOD_PRESSURE", value: 125, value2: 80, unit: "mmHg", measuredAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-012", type: "BLOOD_PRESSURE", value: 122, value2: 78, unit: "mmHg", measuredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-013", type: "BLOOD_PRESSURE", value: 120, value2: 76, unit: "mmHg", measuredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    // Heart rate (last 4 readings)
    { id: "vital-014", type: "HEART_RATE", value: 72, unit: "bpm", measuredAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-015", type: "HEART_RATE", value: 68, unit: "bpm", measuredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-016", type: "HEART_RATE", value: 65, unit: "bpm", measuredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), source: "MANUAL" },
    { id: "vital-017", type: "HEART_RATE", value: 62, unit: "bpm", measuredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), source: "MANUAL" },
  ],
};

// Helper to calculate inventory financials
export function calculateInventoryFinancials() {
  const totalRetailValue = mockInventory.reduce(
    (acc, item) => acc + (item.unitPrice || 0) * item.quantity,
    0
  );
  const totalCostValue = mockInventory.reduce(
    (acc, item) => acc + (item.costPrice || 0) * item.quantity,
    0
  );
  const totalPotentialProfit = totalRetailValue - totalCostValue;
  const averageMargin = totalRetailValue > 0
    ? ((totalRetailValue - totalCostValue) / totalRetailValue) * 100
    : 0;

  return {
    totalRetailValue,
    totalCostValue,
    totalPotentialProfit,
    averageMargin,
  };
}

// ============================================================================
// CLINICAL DATA (Chart Notes System)
// ============================================================================

// Mock Allergies per patient
export const mockAllergies: Record<string, Array<{ id: string; allergen: string; reaction?: string; severity: string; status: string }>> = {
  "jamie-rivera": [
    { id: "allergy-001", allergen: "Penicillin", reaction: "Hives, itching", severity: "MODERATE", status: "ACTIVE" },
  ],
  "patient-001": [
    { id: "allergy-002", allergen: "Shellfish", reaction: "Anaphylaxis", severity: "SEVERE", status: "ACTIVE" },
    { id: "allergy-003", allergen: "Latex", reaction: "Contact dermatitis", severity: "MILD", status: "ACTIVE" },
  ],
  "patient-002": [],
  "patient-003": [
    { id: "allergy-004", allergen: "Sulfa drugs", reaction: "Rash", severity: "MODERATE", status: "ACTIVE" },
  ],
  "patient-004": [
    { id: "allergy-005", allergen: "Aspirin", reaction: "GI upset, tinnitus", severity: "MODERATE", status: "ACTIVE" },
  ],
  "patient-005": [],
};

// Mock Medications per patient
export const mockMedications: Record<string, Array<{ id: string; name: string; dosage?: string; frequency?: string; route?: string; status: string }>> = {
  "jamie-rivera": [
    { id: "med-001", name: "Metformin", dosage: "500mg", frequency: "BID", route: "Oral", status: "ACTIVE" },
  ],
  "patient-001": [
    { id: "med-002", name: "Lisinopril", dosage: "10mg", frequency: "Once daily", route: "Oral", status: "ACTIVE" },
    { id: "med-003", name: "Atorvastatin", dosage: "20mg", frequency: "At bedtime", route: "Oral", status: "ACTIVE" },
  ],
  "patient-002": [
    { id: "med-004", name: "Levothyroxine", dosage: "75mcg", frequency: "Once daily", route: "Oral", status: "ACTIVE" },
  ],
  "patient-003": [],
  "patient-004": [
    { id: "med-005", name: "Omeprazole", dosage: "20mg", frequency: "Once daily", route: "Oral", status: "ACTIVE" },
  ],
  "patient-005": [],
};

// Mock Diagnoses per patient
export const mockDiagnoses: Record<string, Array<{ id: string; icd10Code?: string; description: string; isPrimary: boolean; status: string }>> = {
  "jamie-rivera": [
    { id: "dx-001", icd10Code: "E11.9", description: "Type 2 diabetes mellitus without complications", isPrimary: true, status: "ACTIVE" },
    { id: "dx-002", icd10Code: "E66.9", description: "Obesity, unspecified", isPrimary: false, status: "ACTIVE" },
  ],
  "patient-001": [
    { id: "dx-003", icd10Code: "I10", description: "Essential hypertension", isPrimary: true, status: "ACTIVE" },
    { id: "dx-004", icd10Code: "E78.5", description: "Hyperlipidemia, unspecified", isPrimary: false, status: "ACTIVE" },
  ],
  "patient-002": [
    { id: "dx-005", icd10Code: "E03.9", description: "Hypothyroidism, unspecified", isPrimary: true, status: "ACTIVE" },
    { id: "dx-006", icd10Code: "R53.83", description: "Fatigue", isPrimary: false, status: "ACTIVE" },
  ],
  "patient-003": [
    { id: "dx-007", icd10Code: "M79.3", description: "Panniculitis, unspecified", isPrimary: true, status: "ACTIVE" },
  ],
  "patient-004": [
    { id: "dx-008", icd10Code: "K21.0", description: "GERD with esophagitis", isPrimary: true, status: "ACTIVE" },
    { id: "dx-009", icd10Code: "F41.1", description: "Generalized anxiety disorder", isPrimary: false, status: "ACTIVE" },
  ],
  "patient-005": [
    { id: "dx-010", icd10Code: "R53.83", description: "Fatigue", isPrimary: true, status: "ACTIVE" },
  ],
};

// Mock Supplements per patient
export const mockSupplements: Record<string, Array<{ id: string; name: string; dosage?: string; frequency?: string; brand?: string; status: string }>> = {
  "jamie-rivera": [
    { id: "supp-001", name: "Vitamin D3", dosage: "5000 IU", frequency: "Daily", brand: "Thorne", status: "ACTIVE" },
    { id: "supp-002", name: "Omega-3 Fish Oil", dosage: "2000mg", frequency: "Daily", brand: "Nordic Naturals", status: "ACTIVE" },
    { id: "supp-003", name: "Magnesium Glycinate", dosage: "400mg", frequency: "At bedtime", brand: "Pure Encapsulations", status: "ACTIVE" },
    { id: "supp-004", name: "Berberine", dosage: "500mg", frequency: "BID", brand: "Thorne", status: "ACTIVE" },
  ],
  "patient-001": [
    { id: "supp-005", name: "CoQ10", dosage: "200mg", frequency: "Daily", brand: "Jarrow", status: "ACTIVE" },
    { id: "supp-006", name: "Vitamin D3", dosage: "2000 IU", frequency: "Daily", status: "ACTIVE" },
  ],
  "patient-002": [
    { id: "supp-007", name: "Selenium", dosage: "200mcg", frequency: "Daily", status: "ACTIVE" },
    { id: "supp-008", name: "B-Complex", dosage: "1 cap", frequency: "Daily", brand: "Thorne", status: "ACTIVE" },
    { id: "supp-009", name: "Iron", dosage: "36mg", frequency: "Daily", status: "ACTIVE" },
  ],
  "patient-003": [
    { id: "supp-010", name: "Curcumin", dosage: "500mg", frequency: "BID", brand: "Meriva", status: "ACTIVE" },
  ],
  "patient-004": [
    { id: "supp-011", name: "Probiotics", dosage: "50B CFU", frequency: "Daily", brand: "Seed", status: "ACTIVE" },
    { id: "supp-012", name: "L-Glutamine", dosage: "5g", frequency: "Daily", status: "ACTIVE" },
  ],
  "patient-005": [
    { id: "supp-013", name: "Vitamin D3", dosage: "5000 IU", frequency: "Daily", status: "ACTIVE" },
    { id: "supp-014", name: "B12", dosage: "1000mcg", frequency: "Daily", status: "ACTIVE" },
  ],
};

// Mock Injections per patient (critical for peptide clinics)
export const mockInjections: Record<string, Array<{
  id: string;
  medication: string;
  dose: string;
  route: string;
  site?: string;
  lotNumber?: string;
  administeredAt: Date;
  administeredBy: string;
}>> = {
  "jamie-rivera": [
    { id: "inj-001", medication: "Sermorelin", dose: "300mcg", route: "SUBCUTANEOUS", site: "Abdomen", lotNumber: "LOT-2025-008", administeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), administeredBy: "Self" },
    { id: "inj-002", medication: "Sermorelin", dose: "300mcg", route: "SUBCUTANEOUS", site: "Abdomen", lotNumber: "LOT-2025-008", administeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), administeredBy: "Self" },
    { id: "inj-003", medication: "BPC-157", dose: "250mcg", route: "SUBCUTANEOUS", site: "Left knee area", lotNumber: "LOT-2025-001", administeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), administeredBy: "Clinic" },
  ],
  "patient-001": [
    { id: "inj-004", medication: "BPC-157", dose: "250mcg", route: "SUBCUTANEOUS", site: "Right shoulder", lotNumber: "LOT-2025-001", administeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), administeredBy: "Self" },
    { id: "inj-005", medication: "TB-500", dose: "2.5mg", route: "SUBCUTANEOUS", site: "Abdomen", lotNumber: "LOT-2025-002", administeredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), administeredBy: "Clinic" },
  ],
  "patient-002": [
    { id: "inj-006", medication: "Semaglutide", dose: "0.5mg", route: "SUBCUTANEOUS", site: "Abdomen", lotNumber: "LOT-2025-003", administeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), administeredBy: "Self" },
    { id: "inj-007", medication: "Semaglutide", dose: "0.25mg", route: "SUBCUTANEOUS", site: "Abdomen", lotNumber: "LOT-2025-003", administeredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), administeredBy: "Self" },
  ],
  "patient-003": [
    { id: "inj-008", medication: "NAD+", dose: "500mg", route: "INTRAVENOUS", lotNumber: "LOT-2025-005", administeredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), administeredBy: "Clinic" },
  ],
  "patient-004": [],
  "patient-005": [
    { id: "inj-009", medication: "Epithalon", dose: "10mg", route: "SUBCUTANEOUS", site: "Abdomen", lotNumber: "LOT-2025-006", administeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), administeredBy: "Clinic" },
  ],
};

// Mock Encounter Templates
export const mockEncounterTemplates = [
  {
    id: "template-001",
    name: "Quick Note",
    description: "Minimal documentation for simple follow-ups",
    chartType: "QUICK",
    isDefault: true,
  },
  {
    id: "template-002",
    name: "Brief Visit",
    description: "Standard one-page SOAP note",
    chartType: "BRIEF",
    isDefault: true,
  },
  {
    id: "template-003",
    name: "Comprehensive Visit",
    description: "Full SOAP with all sections expanded",
    chartType: "COMPREHENSIVE",
    isDefault: true,
  },
  {
    id: "template-004",
    name: "Peptide Follow-up",
    description: "Template for peptide therapy follow-up visits",
    encounterType: "FOLLOW_UP",
    chartType: "BRIEF",
    subjective: {
      chiefComplaint: "Peptide therapy follow-up",
    },
    objective: {
      physicalExam: "General: Well-appearing, no acute distress\nInjection sites: No erythema, induration, or signs of infection",
    },
    isDefault: false,
  },
  {
    id: "template-005",
    name: "IV Therapy Session",
    description: "Template for NAD+ and other IV therapy sessions",
    encounterType: "IV_THERAPY",
    chartType: "BRIEF",
    isDefault: false,
  },
  {
    id: "template-006",
    name: "New Patient - Weight Loss",
    description: "Comprehensive intake for new weight loss patients",
    encounterType: "NEW_PATIENT",
    chartType: "COMPREHENSIVE",
    isDefault: false,
  },
];

// Helper to get clinical summary for a patient
export function getPatientClinicalSummary(patientId: string) {
  return {
    allergies: mockAllergies[patientId] || [],
    medications: mockMedications[patientId] || [],
    diagnoses: mockDiagnoses[patientId] || [],
    supplements: mockSupplements[patientId] || [],
    vitals: mockVitals[patientId] || [],
    recentInjections: (mockInjections[patientId] || []).slice(0, 5).map(inj => ({
      ...inj,
      administeredAt: inj.administeredAt.toISOString(),
    })),
  };
}
