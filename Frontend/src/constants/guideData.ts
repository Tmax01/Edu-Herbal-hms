export interface GuideStep {
  title: string;
  description: string;
  tip?: string;
}

export interface DepartmentGuideData {
  department: string;
  icon: string;
  overview: string;
  steps: GuideStep[];
}

export const guideData: Record<string, DepartmentGuideData> = {
  patients: {
    department: 'Patients',
    icon: '👥',
    overview: 'Manage patient records, registrations, medical histories, and NHIS status across branches.',
    steps: [
      { title: 'Search Patients', description: 'Use the top search bar to filter by name, phone, or MRN number.', tip: 'Searching works across both Accra and Mankessim branches.' },
      { title: 'Register New Patient', description: 'Click "New Patient" button to open registration modal and input demographics.', tip: 'Ensure NHIS ID is entered for insured patients.' },
      { title: 'View Patient Profile', description: 'Click any patient row to view full medical history, vitals, prescriptions, and lab results.' }
    ]
  },
  appointments: {
    department: 'Appointments',
    icon: '📅',
    overview: 'Schedule consultations, manage triage queue, and record patient vitals.',
    steps: [
      { title: 'View Schedule', description: 'Filter appointments by date, doctor, or status (Scheduled, Checked-in, In Progress, Completed).' },
      { title: 'Book Appointment', description: 'Click "New Appointment" to link a registered patient with a doctor slot.' },
      { title: 'Record Triage Vitals', description: 'Click "Vitals" on a checked-in patient to log BP, pulse, temp, and weight before consultation.' }
    ]
  },
  consultation: {
    department: 'Consultation',
    icon: '🩺',
    overview: 'Conduct SOAP encounters, issue e-prescriptions, and order diagnostic lab tests.',
    steps: [
      { title: 'Select Queue Patient', description: 'Pick a checked-in patient from the active consultation queue.' },
      { title: 'Fill SOAP Notes', description: 'Record Subjective complaint, Objective findings, Assessment, and Plan.' },
      { title: 'AI Assistant Support', description: 'Use AI Suggestions to quickly auto-populate SOAP notes and treatment options.' }
    ]
  },
  pharmacy: {
    department: 'Pharmacy',
    icon: '💊',
    overview: 'Manage FEFO medication dispensing, prescription queue, and branch stock levels.',
    steps: [
      { title: 'Review Prescriptions', description: 'Select pending prescriptions from the conventional or herbal queue.' },
      { title: 'FEFO Dispense', description: 'Dispense items checking batch numbers and earliest expiration dates.' }
    ]
  },
  inventory: {
    department: 'Inventory & Stores',
    icon: '📦',
    overview: 'Track drug stock, raw botanical materials, reorder levels, and branch transfers.',
    steps: [
      { title: 'Monitor Low Stock', description: 'Check red-flagged items below reorder thresholds.' },
      { title: 'Stock Transfer', description: 'Transfer items between Accra Main and Mankessim Herbal Centre.' }
    ]
  },
  suppliers: {
    department: 'Suppliers',
    icon: '🏢',
    overview: 'Manage vendors for pharmaceutical and raw botanical materials.',
    steps: [
      { title: 'View Supplier Directory', description: 'Filter suppliers by type (Drug, Herbal, Consumables, Equipment).' },
      { title: 'Add New Supplier', description: 'Register new vendor details, payment terms, and contact info.' }
    ]
  },
  production: {
    department: 'Herbal Production',
    icon: '🌿',
    overview: 'Track herbal manufacturing lots, mixing, processing, QC approvals, and packaging.',
    steps: [
      { title: 'Create Batch', description: 'Initiate new herbal medicine production lot at Mankessim centre.' },
      { title: 'Advance Stage', description: 'Move batches sequentially from Mixing → Processing → QC → Packaging → Completed.' }
    ]
  },
  lab: {
    department: 'Laboratory',
    icon: '🔬',
    overview: 'Process diagnostic test orders, input test values, and issue approved results.',
    steps: [
      { title: 'View Lab Queue', description: 'Filter lab orders by status (Pending, In Progress, Awaiting Approval, Completed).' },
      { title: 'Enter Test Results', description: 'Input test parameters, findings, and submit for doctor review.' }
    ]
  },
  ward: {
    department: 'Wards & Admissions',
    icon: '🛏️',
    overview: 'Manage bed occupancy, inpatient admissions, and ward discharges.',
    steps: [
      { title: 'Bed Grid View', description: 'Monitor available, occupied, and maintenance beds across wards.' },
      { title: 'Admit Patient', description: 'Assign an outpatient to an available ward bed.' }
    ]
  },
  nursing: {
    department: 'Nursing Care',
    icon: '💉',
    overview: 'Record routine vitals, medication administration, and nursing shift notes.',
    steps: [
      { title: 'Select Bed Patient', description: 'Choose an admitted inpatient to view nursing care log.' },
      { title: 'Add Nursing Note', description: 'Log vitals, medication dosage times, and shift observations.' }
    ]
  },
  billing: {
    department: 'Billing & Invoicing',
    icon: '💳',
    overview: 'Generate patient invoices, collect payments, and record NHIS claims.',
    steps: [
      { title: 'Generate Invoice', description: 'Create line-item bills for consultation, drugs, and lab tests.' },
      { title: 'Record Payment', description: 'Accept Cash, Mobile Money, or POS payments and mark invoice paid.' }
    ]
  },
  reports: {
    department: 'Reports & Analytics',
    icon: '📊',
    overview: 'Consolidated hospital performance reports and financial summaries.',
    steps: [
      { title: 'Select Report Category', description: 'Choose Revenue, Patient Statistics, Appointments, or Inventory.' },
      { title: 'Export PDF', description: 'Generate formatted exportable report documents.' }
    ]
  }
};
