import { StatusType } from "@/components/StatusChip";

export interface DemoEvidenceItem {
  id: string;
  name: string;
  category: string;
  status: StatusType;
  lastReceived: string | null;
  nextDue: string | null;
  retention: string;
  documents: number;
  description: string;
}

export interface DemoTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  daysUntilDue: number;
  isRecurring: boolean;
  recurrenceDays?: number;
  status: "pending" | "overdue" | "completed";
  relatedEvidence: string;
  completedAt?: string;
  completionNotes?: string;
}

export interface DemoDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  status: "processed" | "needs_review";
  classification: string;
  confidence: number;
  extractedFields: Record<string, string>;
}

export const demoEvidenceItems: DemoEvidenceItem[] = [
  { 
    id: "1", 
    name: "Hazardous Waste Manifest", 
    category: "Environmental", 
    status: "ok", 
    lastReceived: "Dec 15, 2024", 
    nextDue: "Mar 15, 2025", 
    retention: "3 years", 
    documents: 3,
    description: "EPA manifest for hazardous waste shipments (solvents, paint waste, oily absorbents)"
  },
  { 
    id: "2", 
    name: "Paint Booth Inspection", 
    category: "Environmental", 
    status: "due_soon", 
    lastReceived: "Jan 20, 2024", 
    nextDue: "Jan 27, 2025", 
    retention: "1 year", 
    documents: 2,
    description: "Annual inspection of spray booth filters, ventilation, and fire suppression"
  },
  { 
    id: "3", 
    name: "Air Compressor Inspection", 
    category: "Safety", 
    status: "overdue", 
    lastReceived: "Jan 10, 2024", 
    nextDue: "Jan 10, 2025", 
    retention: "1 year", 
    documents: 1,
    description: "Pressure vessel safety inspection as required by state regulations"
  },
  { 
    id: "4", 
    name: "Lift Equipment Certification", 
    category: "Safety", 
    status: "ok", 
    lastReceived: "Nov 5, 2024", 
    nextDue: "Nov 5, 2025", 
    retention: "1 year", 
    documents: 2,
    description: "Annual inspection of automotive lifts by certified inspector"
  },
  { 
    id: "5", 
    name: "Fire Suppression Inspection", 
    category: "Safety", 
    status: "needs_review", 
    lastReceived: "Jan 18, 2025", 
    nextDue: "Jan 18, 2026", 
    retention: "1 year", 
    documents: 1,
    description: "Fire suppression system and sprinkler inspection"
  },
  { 
    id: "6", 
    name: "Business License", 
    category: "Administrative", 
    status: "ok", 
    lastReceived: "Jul 1, 2024", 
    nextDue: "Jul 1, 2025", 
    retention: "1 year", 
    documents: 1,
    description: "Current business operating license from city/county"
  },
  { 
    id: "7", 
    name: "Workers Comp Insurance", 
    category: "Administrative", 
    status: "ok", 
    lastReceived: "Oct 1, 2024", 
    nextDue: "Oct 1, 2025", 
    retention: "1 year", 
    documents: 1,
    description: "Workers compensation insurance certificate"
  },
  { 
    id: "8", 
    name: "SDS Binder", 
    category: "Safety", 
    status: "missing", 
    lastReceived: null, 
    nextDue: null, 
    retention: "1 year", 
    documents: 0,
    description: "Safety Data Sheets for all chemicals stored on-site"
  },
  { 
    id: "9", 
    name: "Employee Training Records", 
    category: "Safety", 
    status: "ok", 
    lastReceived: "Dec 20, 2024", 
    nextDue: "Dec 20, 2025", 
    retention: "3 years", 
    documents: 5,
    description: "Documentation of required safety training (HazCom, PPE, etc.)"
  },
  { 
    id: "10", 
    name: "First Aid Kit Inspection", 
    category: "Safety", 
    status: "due_soon", 
    lastReceived: "Dec 22, 2024", 
    nextDue: "Jan 22, 2025", 
    retention: "1 year", 
    documents: 12,
    description: "Monthly inspection of first aid kit contents and expiration dates"
  },
  {
    id: "11",
    name: "Used Oil Storage Log",
    category: "Environmental",
    status: "ok",
    lastReceived: "Jan 15, 2025",
    nextDue: "Feb 15, 2025",
    retention: "3 years",
    documents: 2,
    description: "Monthly log of used oil generation and pickup"
  },
  {
    id: "12",
    name: "Eye Wash Station Test",
    category: "Safety",
    status: "overdue",
    lastReceived: "Dec 15, 2024",
    nextDue: "Jan 15, 2025",
    retention: "1 year",
    documents: 0,
    description: "Weekly flushing and inspection of emergency eye wash stations"
  },
];

export const demoTasks: DemoTask[] = [
  {
    id: "1",
    title: "Monthly First Aid Kit Inspection",
    description: "Check all first aid kits in bays 1-4 for expired items",
    dueDate: "Jan 22, 2025",
    daysUntilDue: 0,
    isRecurring: true,
    recurrenceDays: 30,
    status: "pending",
    relatedEvidence: "First Aid Kit Inspection",
  },
  {
    id: "2",
    title: "Weekly Eye Wash Station Test",
    description: "Flush all eye wash stations for 3 minutes, log results",
    dueDate: "Jan 24, 2025",
    daysUntilDue: 2,
    isRecurring: true,
    recurrenceDays: 7,
    status: "pending",
    relatedEvidence: "Eye Wash Station Test",
  },
  {
    id: "3",
    title: "Submit Hazardous Waste Manifest",
    description: "Complete and submit Q4 2024 hazardous waste manifest to EPA",
    dueDate: "Jan 15, 2025",
    daysUntilDue: -7,
    isRecurring: true,
    recurrenceDays: 90,
    status: "overdue",
    relatedEvidence: "Hazardous Waste Manifest",
  },
  {
    id: "4",
    title: "Schedule Lift Inspection",
    description: "Contact SafetyFirst Inc. to schedule annual lift inspection",
    dueDate: "Jan 28, 2025",
    daysUntilDue: 6,
    isRecurring: false,
    status: "pending",
    relatedEvidence: "Lift Equipment Certification",
  },
  {
    id: "5",
    title: "Update SDS Binder",
    description: "Add new chemical SDSs received this month",
    dueDate: "Jan 31, 2025",
    daysUntilDue: 9,
    isRecurring: true,
    recurrenceDays: 30,
    status: "pending",
    relatedEvidence: "SDS Binder",
  },
  {
    id: "6",
    title: "Air Compressor Pressure Test",
    description: "Overdue! Schedule inspection immediately",
    dueDate: "Jan 10, 2025",
    daysUntilDue: -12,
    isRecurring: true,
    recurrenceDays: 365,
    status: "overdue",
    relatedEvidence: "Air Compressor Inspection",
  },
  {
    id: "7",
    title: "Paint Booth Filter Change",
    description: "Replace intake and exhaust filters",
    dueDate: "Jan 27, 2025",
    daysUntilDue: 5,
    isRecurring: true,
    recurrenceDays: 30,
    status: "pending",
    relatedEvidence: "Paint Booth Inspection",
  },
  {
    id: "8",
    title: "Monthly Fire Extinguisher Inspection",
    description: "All extinguishers checked, Bay 3 extinguisher needs recharge next month",
    dueDate: "Jan 18, 2025",
    daysUntilDue: -4,
    isRecurring: true,
    recurrenceDays: 30,
    status: "completed",
    relatedEvidence: "Fire Suppression Inspection",
    completedAt: "Jan 18, 2025",
    completionNotes: "All extinguishers checked, Bay 3 extinguisher needs recharge next month",
  },
  {
    id: "9",
    title: "Weekly Eye Wash Station Test",
    description: "All stations flushed, no issues",
    dueDate: "Jan 17, 2025",
    daysUntilDue: -5,
    isRecurring: true,
    recurrenceDays: 7,
    status: "completed",
    relatedEvidence: "Eye Wash Station Test",
    completedAt: "Jan 17, 2025",
    completionNotes: "All stations flushed, no issues",
  },
  {
    id: "10",
    title: "Review Used Oil Pickup Schedule",
    description: "Confirm next pickup with waste hauler",
    dueDate: "Feb 1, 2025",
    daysUntilDue: 10,
    isRecurring: false,
    status: "pending",
    relatedEvidence: "Used Oil Storage Log",
  },
];

export const demoDocuments: DemoDocument[] = [
  {
    id: "1",
    name: "insurance_cert_2024.pdf",
    type: "application/pdf",
    size: 245000,
    uploadedAt: "2 hours ago",
    status: "needs_review",
    classification: "General Liability Insurance",
    confidence: 85,
    extractedFields: {
      "Policy Number": "GL-2024-78432",
      "Effective Date": "Jan 1, 2024",
      "Expiration Date": "Jan 1, 2025",
      "Coverage Amount": "$1,000,000",
    },
  },
  {
    id: "2",
    name: "training_records.xlsx",
    type: "application/xlsx",
    size: 128000,
    uploadedAt: "Yesterday",
    status: "needs_review",
    classification: "Employee Training Records",
    confidence: 72,
    extractedFields: {
      "Training Type": "Safety Training",
      "Date": "Dec 15, 2024",
      "Employees": "12",
    },
  },
  {
    id: "3",
    name: "lift_inspection_jan.pdf",
    type: "application/pdf",
    size: 512000,
    uploadedAt: "3 days ago",
    status: "processed",
    classification: "Lift Equipment Certification",
    confidence: 95,
    extractedFields: {
      "Inspector": "SafetyFirst Inc.",
      "Inspection Date": "Jan 15, 2025",
      "Next Due": "Jan 15, 2026",
      "Result": "Pass",
    },
  },
  {
    id: "4",
    name: "fire_extinguisher_log.jpg",
    type: "image/jpeg",
    size: 1200000,
    uploadedAt: "5 days ago",
    status: "processed",
    classification: "Fire Extinguisher Inspection",
    confidence: 88,
    extractedFields: {
      "Location": "Bay 1",
      "Inspection Date": "Jan 10, 2025",
      "Inspector": "John Smith",
    },
  },
  {
    id: "5",
    name: "hazwaste_manifest_q4.pdf",
    type: "application/pdf",
    size: 345000,
    uploadedAt: "1 week ago",
    status: "processed",
    classification: "Hazardous Waste Manifest",
    confidence: 97,
    extractedFields: {
      "Manifest ID": "HW-2024-Q4-001",
      "Waste Type": "Used Solvents",
      "Quantity": "55 gallons",
      "Pickup Date": "Dec 15, 2024",
    },
  },
  {
    id: "6",
    name: "business_license_2024.pdf",
    type: "application/pdf",
    size: 156000,
    uploadedAt: "6 months ago",
    status: "processed",
    classification: "Business License",
    confidence: 99,
    extractedFields: {
      "License Number": "BL-2024-12345",
      "Issue Date": "Jul 1, 2024",
      "Expiration": "Jul 1, 2025",
    },
  },
];

// Calculate summary stats from demo data
export function getDemoStats() {
  const missingEvidence = demoEvidenceItems.filter(e => e.status === "missing" || e.status === "overdue");
  const needsReview = demoEvidenceItems.filter(e => e.status === "needs_review");
  const dueSoon = demoEvidenceItems.filter(e => e.status === "due_soon");
  const okItems = demoEvidenceItems.filter(e => e.status === "ok");
  
  const totalItems = demoEvidenceItems.length;
  const compliantItems = okItems.length + dueSoon.length;
  const readinessScore = Math.round((compliantItems / totalItems) * 100);

  const overdueTasks = demoTasks.filter(t => t.status === "overdue");
  const pendingTasks = demoTasks.filter(t => t.status === "pending");
  const dueSoonTasks = pendingTasks.filter(t => t.daysUntilDue <= 7);

  return {
    readinessScore,
    missingEvidence,
    needsReview,
    dueSoon,
    overdueTasks,
    pendingTasks,
    dueSoonTasks,
    totalItems,
    compliantItems,
  };
}
