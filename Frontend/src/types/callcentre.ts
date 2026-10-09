export type CallOutcome = 'Resolved' | 'Follow-up Scheduled' | 'Escalated' | 'No Answer' | 'Complaint';
export type FollowUpStatus = 'Due' | 'Completed' | 'Overdue' | 'Cancelled';


export interface CallLog {
  id: string;
  patientName: string;
  patientId?: string;
  agentName: string;
  reason: string;
  notes: string;
  outcome: CallOutcome;
  timestamp?: string;
  callDate?: string;
  followUpDate?: string;
  branch?: string;
}

export interface PatientFollowUp {
  id: string;
  patientName: string;
  patientId?: string;
  doctorName: string;
  doctorId?: string;
  scheduledDate?: string;
  dueDate?: string;
  nextDate?: string;
  lastVisit?: string;
  condition?: string;
  reason?: string;
  type?: string;

  status: FollowUpStatus;
  notes?: string;
  reviewNotes?: string;
  effectiveness?: string;
  effectivenessRating?: string;
  branch?: string;
}

export interface CreateCallLogDto {
  patientId?: string;
  patientName?: string;
  callType?: 'Inbound' | 'Outbound';
  purpose?: string;
  reason?: string;
  notes: string;
  outcome?: CallOutcome;
}

export interface CreatePatientFollowUpDto {
  patientId: string;
  scheduledDate: string;
  reason: string;
  type?: string;
  notes?: string;
}
