import { Role } from './auth';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  targetRoles?: string[];
  branchId?: string;
  branch?: string;
  isUrgent?: boolean;
  createdAt: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  channel: string;
  senderId: string;
  senderName: string;
  senderRole?: Role | string;
  content: string;
  type?: 'text' | 'system' | 'file' | string;
  attachmentUrl?: string;
  timestamp: string;
}


export interface Meeting {
  id: string;
  title: string;
  scheduledAt?: string;
  durationMinutes?: number;
  date?: string;
  time?: string;
  duration?: string;
  type?: string;
  location?: string;
  organizerName?: string;
  organizer?: string;
  organizerId?: string;
  targetBranch?: string;
  agenda?: string;
  attendees?: string[];
  scope: 'Individual' | 'Branch' | 'Hospital-wide';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Upcoming';
  minutes?: string;
  branch?: string;
}

export interface DailyReport {
  id: string;
  staffId: string;
  staffName: string;
  role?: string;
  department: string;
  branch: string;
  date: string;
  summary?: string;
  keyActivities?: string;
  activities?: string;
  patientsHandled?: number;
  challenges?: string;
  recommendations?: string;
  status: 'Submitted' | 'Reviewed' | 'Approved' | 'Noted';
  reviewedBy?: string;
  reviewNotes?: string;
  submittedAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  targetRoles?: string[];
  branchId?: string;
  isUrgent?: boolean;
}

export interface SendMessageDto {
  channel: string;
  content: string;
  recipientId?: string;
  attachmentUrl?: string;
}

export interface CreateMeetingDto {
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  scope?: 'Individual' | 'Branch' | 'Hospital-wide';
  branchId?: string;
}

export interface CreateDailyReportDto {
  departmentId?: string;
  department?: string;
  summary: string;
  keyActivities?: string;
  challenges?: string;
  reportDate?: string;
}

export interface ReviewDailyReportDto {
  status: 'Reviewed' | 'Approved' | 'Noted';
  reviewNotes?: string;
}
