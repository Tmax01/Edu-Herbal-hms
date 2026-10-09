export type NursingNoteType = 'Routine' | 'Medication' | 'Observation' | 'Incident';

export interface NursingVitals {
  bp: string;
  pulse: string;
  temp: string;
  spo2: string;
}

export interface NursingNote {
  id: string;
  patientId?: string;
  patientName: string;
  bedId: string;
  bedNumber?: string;
  nurseId?: string;
  nurseName: string;
  timestamp: string;
  vitals: NursingVitals;
  note: string;
  type: NursingNoteType;
  createdAt?: string;
}

export interface CreateNursingNoteDto {
  patientId?: string;
  bedId: string;
  noteType: NursingNoteType;
  content: string;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  temperature?: number;
  spo2?: number;
  notes?: string;
}

export interface InpatientOverview {
  admissionId: string;
  patientId: string;
  patientName: string;
  bedId: string;
  bedNumber: string;
  wardName: string;
  admittedAt: string;
  admitReason: string;
  latestVitals?: NursingVitals;
  latestNoteAt?: string;
}
