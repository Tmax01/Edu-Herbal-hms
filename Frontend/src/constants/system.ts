import { Role, Branch, Module } from '../types';

export const defaultModulesByRole: Record<Role, Module[]> = {
  cto: ['dashboard', 'patients', 'appointments', 'consultation', 'pharmacy', 'lab', 'billing', 'ward', 'nursing', 'callcentre', 'followups', 'production', 'inventory', 'suppliers', 'reports', 'accounting', 'hr', 'meetings', 'chat', 'daily_reports', 'telemedicine', 'analytics', 'ai_assistant', 'user_management', 'access_control', 'audit_log'],
  admin: ['dashboard', 'patients', 'appointments', 'consultation', 'pharmacy', 'lab', 'billing', 'ward', 'nursing', 'callcentre', 'followups', 'production', 'inventory', 'suppliers', 'reports', 'accounting', 'hr', 'meetings', 'chat', 'daily_reports', 'telemedicine', 'analytics', 'ai_assistant', 'user_management', 'access_control', 'audit_log'],
  doctor: ['dashboard', 'patients', 'appointments', 'consultation', 'pharmacy', 'lab', 'ward', 'nursing', 'followups', 'meetings', 'chat', 'daily_reports', 'telemedicine', 'ai_assistant', 'analytics'],
  nurse: ['dashboard', 'patients', 'appointments', 'ward', 'nursing', 'followups', 'meetings', 'chat', 'daily_reports', 'telemedicine'],
  pharmacist: ['dashboard', 'pharmacy', 'production', 'inventory', 'suppliers', 'reports', 'meetings', 'chat', 'daily_reports', 'telemedicine'],
  lab_tech: ['dashboard', 'lab', 'patients', 'reports', 'meetings', 'chat', 'daily_reports', 'telemedicine'],
  receptionist: ['dashboard', 'patients', 'appointments', 'billing', 'reports', 'meetings', 'chat', 'daily_reports', 'telemedicine'],
  accountant: ['dashboard', 'billing', 'accounting', 'reports', 'meetings', 'chat', 'daily_reports', 'telemedicine', 'analytics'],
  call_centre: ['dashboard', 'patients', 'appointments', 'callcentre', 'followups', 'meetings', 'chat', 'daily_reports', 'telemedicine'],
  store_officer: ['dashboard', 'inventory', 'suppliers', 'production', 'reports', 'meetings', 'chat', 'daily_reports', 'telemedicine'],
  hr: ['dashboard', 'hr', 'user_management', 'reports', 'meetings', 'chat', 'daily_reports', 'telemedicine'],
};


export const roleLabels: Record<Role, string> = {
  cto: 'Chief Technology Officer',
  admin: 'Administrator',
  doctor: 'Doctor / Consultant',
  nurse: 'Nurse',
  pharmacist: 'Pharmacist',
  lab_tech: 'Lab Technician',
  receptionist: 'Receptionist',
  accountant: 'Accountant',
  call_centre: 'Call Centre Agent',
  store_officer: 'Store Officer',
  hr: 'Human Resources',
};

export const chatChannels = [
  { id: 'general', name: 'general', description: 'Hospital-wide announcements and general discussion', icon: '📢', branches: ['All', 'Accra', 'Mankessim'] as Branch[] },
  { id: 'clinical', name: 'clinical-team', description: 'Clinical staff coordination', icon: '🩺', branches: ['All', 'Accra', 'Mankessim'] as Branch[] },
  { id: 'accra', name: 'accra-branch', description: 'Accra branch staff', icon: '🏥', branches: ['Accra'] as Branch[] },
  { id: 'mankessim', name: 'mankessim-branch', description: 'Mankessim herbal centre staff', icon: '🌿', branches: ['Mankessim'] as Branch[] },
  { id: 'pharmacy', name: 'pharmacy', description: 'Pharmacy and stock coordination', icon: '💊', branches: ['All', 'Accra'] as Branch[] },
  { id: 'lab', name: 'laboratory', description: 'Lab team and result notifications', icon: '🔬', branches: ['All', 'Accra'] as Branch[] },
  { id: 'admin', name: 'administration', description: 'Administrative coordination', icon: '📋', branches: ['All', 'Accra', 'Mankessim'] as Branch[] },
];

