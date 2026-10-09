import { CreateVitalsDto, BackendVitals } from './vitals';

export interface PrescriptionItemInput {
  drugName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity?: number;
  instructions?: string;
}

export interface CreateConsultationDto {
  patientId: string;
  appointmentId?: string;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  diagnosis: string;
  icd10Code?: string;
  treatmentPlan?: string;
  prescriptions?: PrescriptionItemInput[];
  vitals?: CreateVitalsDto;
}

export interface BackendConsultation {
  id: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  diagnosis: string;
  icd10Code?: string;
  treatmentPlan?: string;
  createdAt: string;
  updatedAt: string;
  patient?: any;
  doctor?: { fullName: string };
  vitals?: BackendVitals;
  prescriptions?: any[];
  labOrders?: any[];
}

export interface QueryConsultationsDto {
  patientId?: string;
  doctorId?: string;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConsultationLabRequestDto {
  patientId: string;
  consultationId?: string;
  testNames: string[];
  urgency?: 'Routine' | 'Urgent' | 'Emergency' | string;
  notes?: string;
}

export interface CreateReferralDto {
  patientId: string;
  consultationId?: string;
  targetDepartmentId?: string;
  targetDoctorId?: string;
  reason: string;
  notes?: string;
}

export interface SendVitalsSmsDto {
  patientId: string;
  phone?: string;
  vitals_bp?: string;
  vitals_sugar?: string;
  vitals_weight?: string;
}

export interface DifferentialDiagnosisQueryDto {
  symptoms?: string[];
  age?: number;
  gender?: string;
  medicalHistory?: string;
  chiefComplaintAndHpi?: string;
  vitalsSummary?: string;
  patientDemographics?: string;
}

export interface DifferentialDiagnosisResponse {
  differentials?: Array<{
    condition: string;
    probability: 'High' | 'Moderate' | 'Low';
    icd10Code?: string;
    rationale: string;
    suggestedInvestigations: string[];
    redFlags?: string[];
  }>;
  response?: string;
  model?: string;
  source?: string;
  generatedAt?: string;
  [key: string]: any;
}

export interface DrugSafetyQueryDto {
  drugNames?: string[];
  patientAllergies?: string[];
  medicationList?: string[];
  knownAllergies?: string[];
  coMorbidities?: string;
}

export interface DrugSafetyResponse {
  isSafe?: boolean;
  interactions?: Array<{
    drugA: string;
    drugB: string;
    severity: 'Severe' | 'Moderate' | 'Minor';
    description: string;
  }>;
  allergyWarnings?: Array<{
    drugName: string;
    matchedAllergy: string;
    reaction: string;
  }>;
  response?: string;
  model?: string;
  source?: string;
  [key: string]: any;
}

