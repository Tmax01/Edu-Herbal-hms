export interface CreateVitalsDto {
  patientId: string;
  systolicBp?: number;
  diastolicBp?: number;
  bp?: string;
  pulseRate?: number;
  temperature?: number;
  weightKg?: number;
  heightCm?: number;
  respiratoryRate?: number;
  spo2?: number;
  bloodSugar?: number | string;
  notes?: string;
}

export interface BackendVitals {
  id: string;
  patientId: string;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  temperature?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  respiratoryRate?: number;
  spo2?: number;
  notes?: string;
  recordedById?: string;
  recordedBy?: { fullName: string };
  createdAt: string;
}
