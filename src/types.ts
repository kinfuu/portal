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
  seqNumber?: number;
  jobCode?: string; // 'VAC-01', 'VAC-02'...
  seqId?: string;   // '01', '02', '03'...
  title: string;
  department: string;
  location: string;
  type: string;
  experienceLevel: string;
  salaryRange?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string;
  isNegotiable?: boolean;
  negotiationNotes?: string | null;
  description: string;
  requirements: string;
  status: 'Open' | 'Closed' | 'Draft';
  requiredDocuments: string;
  deadline?: string | null;
  createdAt: string;
  createdBy?: string | null;
  applicantCount?: number;
}

export function isVacancyClosed(vacancy: { status?: string; deadline?: string | null }): boolean {
  if (vacancy.status === 'Closed') return true;
  if (!vacancy.deadline) return false;
  try {
    const d = new Date(vacancy.deadline);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  } catch {
    return false;
  }
}

/**
 * Returns clean sequential display ID starting from '01' (e.g. 01, 02, 03... or VAC-01, APP-01)
 */
export function formatSequentialId(
  seqNumber?: number | null,
  fallbackId?: string,
  prefix?: string
): string {
  if (typeof seqNumber === 'number' && seqNumber > 0) {
    const padded = String(seqNumber).padStart(2, '0');
    return prefix ? `${prefix}-${padded}` : padded;
  }
  if (!fallbackId) return prefix ? `${prefix}-01` : '01';

  // If already matches something like VAC-01 or APP-01
  const codeMatch = fallbackId.match(/^(?:VAC|APP|USR|DOC)-(\d+)/i);
  if (codeMatch && codeMatch[1]) {
    const num = parseInt(codeMatch[1], 10);
    const padded = String(num).padStart(2, '0');
    return prefix ? `${prefix}-${padded}` : padded;
  }

  // If numeric or ends with number
  const numMatch = fallbackId.match(/(\d+)$/);
  if (numMatch && numMatch[1]) {
    const num = parseInt(numMatch[1], 10);
    if (!isNaN(num) && num > 0 && num < 1000) {
      const padded = String(num).padStart(2, '0');
      return prefix ? `${prefix}-${padded}` : padded;
    }
  }

  return prefix ? `${prefix}-01` : '01';
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
  seqNumber?: number;
  appCode?: string; // 'APP-01', 'APP-02'...
  seqId?: string;   // '01', '02', '03'...
  vacancyId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  department?: string;
  
  // Related fields & salary negotiations
  expectedSalary?: string | null;
  isSalaryNegotiable?: boolean;
  salaryNegotiationPreference?: string; // 'Negotiable' | 'Open to discussion' | 'Non-negotiable'
  currentSalary?: string | null;
  noticePeriod?: string; // 'Immediate' | '1 Week' | '2 Weeks' | '1 Month' | 'Negotiable'
  yearsOfExperience?: string;
  educationLevel?: string;
  employmentStatus?: string;

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
