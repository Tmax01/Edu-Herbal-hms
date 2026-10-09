import { Branch } from './auth';

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodGroup: string;
  allergies: string[];
  nhisId: string;
  branch: Branch;
  registeredDate?: string;
  notes?: string;
  photo?: string;
  vitalsHistory?: any[];
  medicalHistory?: any[];
  prescriptionHistory?: any[];
  labHistory?: any[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Checked-in' | 'In Progress' | 'Completed' | 'No-show';
  notes: string;
  branch: Branch;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  tests: string[];
  status: 'Pending' | 'In Progress' | 'Awaiting Approval' | 'Completed';
  orderedDate: string;
  branch: Branch;
  results?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName: string;
  items: { drug: string; dosage: string; frequency: string; duration: string; qty: number }[];
  status: 'Pending' | 'Dispensed' | 'Partial';
  date: string;
  branch: Branch;
  type: 'Conventional' | 'Herbal';
}

export interface StockItem {
  id: string;
  name: string;
  category: 'Drug' | 'Herbal' | 'Raw Material' | 'Consumable';
  branch: Branch;
  quantity: number;
  unit: string;
  reorderLevel: number;
  expiryDate: string;
  batchNo: string;
  supplier: string;
}
