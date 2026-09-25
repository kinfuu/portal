export type UserRole = 'system_admin' | 'hr_admin' | 'hr_employee' | 'applicant';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
  applicationCount?: number;
}

export interface Vacancy {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experienceLevel: string;
  salaryRange?: string | null;
  description: string;
  requirements: string;
  status: 'Open' | 'Closed' | 'Draft';
  requiredDocuments: string;
  deadline?: string | null;
  createdAt: string;
  createdBy?: string | null;
  applicantCount?: number;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  documentType: 'Resume' | 'ID Proof' | 'Degree Certificate' | 'Experience Letter' | 'Other';
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileData?: string;
  status: 'Pending' | 'Verified' | 'Flagged' | 'Rejected';
  automatedCheckStatus?: 'Passed' | 'Warning' | 'Failed' | 'Pending';
  automatedCheckDetails?: string; // JSON with checks
  verifiedBy?: string | null;
  verificationComment?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface ApplicationTimelineItem {
  id: string;
  applicationId: string;
  status: string;
  actorName: string;
  comment?: string | null;
  createdAt: string;
}

export interface Application {
  id: string;
  vacancyId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  department?: string;
  coverLetter?: string | null;
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  status: 'Submitted' | 'Under Review' | 'Verification Pending' | 'Verified' | 'Shortlisted' | 'Interview' | 'Accepted' | 'Rejected';
  verificationStatus: 'Pending' | 'In Progress' | 'Verified' | 'Flagged' | 'Rejected';
  verificationScore?: number;
  recruiterNotes?: string | null;
  recruiterRating?: number;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  vacancyTitle?: string;
  vacancyDepartment?: string;
  documents?: ApplicationDocument[];
  timeline?: ApplicationTimelineItem[];
}

export interface AuthResponse {
  user: User;
  token: string;
}
