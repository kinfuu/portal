import { pgTable, text, timestamp, uuid, integer, boolean, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('applicant'), // 'applicant' | 'recruiter' | 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const vacancies = pgTable('vacancies', {
  id: uuid('id').defaultRandom().primaryKey(),
  seqNumber: integer('seq_number'), // 1, 2, 3...
  jobCode: varchar('job_code', { length: 50 }), // 'VAC-01', 'VAC-02'...
  title: varchar('title', { length: 255 }).notNull(),
  department: varchar('department', { length: 150 }).notNull(),
  location: varchar('location', { length: 150 }).notNull(),
  type: varchar('type', { length: 50 }).notNull().default('Full-time'), // 'Full-time' | 'Part-time' | 'Remote' | 'Contract'
  experienceLevel: varchar('experience_level', { length: 50 }).notNull().default('Mid-Level'),
  salaryRange: varchar('salary_range', { length: 100 }),
  minSalary: integer('min_salary'),
  maxSalary: integer('max_salary'),
  currency: varchar('currency', { length: 20 }).default('ETB'),
  isNegotiable: boolean('is_negotiable').default(true),
  negotiationNotes: text('negotiation_notes'),
  description: text('description').notNull(),
  requirements: text('requirements').notNull(), // JSON or newline separated text
  status: varchar('status', { length: 50 }).notNull().default('Open'), // 'Open' | 'Closed' | 'Draft'
  requiredDocuments: text('required_documents').notNull().default('Resume, ID Proof, Degree Certificate'),
  deadline: timestamp('deadline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
});

export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  seqNumber: integer('seq_number'), // 1, 2, 3...
  appCode: varchar('app_code', { length: 50 }), // 'APP-01', 'APP-02'...
  vacancyId: uuid('vacancy_id').references(() => vacancies.id).notNull(),
  applicantId: uuid('applicant_id').references(() => users.id).notNull(),
  applicantName: varchar('applicant_name', { length: 255 }).notNull(),
  applicantEmail: varchar('applicant_email', { length: 255 }).notNull(),
  applicantPhone: varchar('applicant_phone', { length: 50 }).notNull(),
  department: varchar('department', { length: 150 }),
  
  // Related application fields & salary negotiations
  expectedSalary: varchar('expected_salary', { length: 100 }),
  isSalaryNegotiable: boolean('is_salary_negotiable').default(true),
  salaryNegotiationPreference: varchar('salary_negotiation_preference', { length: 100 }).default('Negotiable'),
  currentSalary: varchar('current_salary', { length: 100 }),
  noticePeriod: varchar('notice_period', { length: 100 }).default('1 Month'),
  yearsOfExperience: varchar('years_of_experience', { length: 100 }),
  educationLevel: varchar('education_level', { length: 150 }),
  employmentStatus: varchar('employment_status', { length: 100 }),
  
  coverLetter: text('cover_letter'),
  portfolioUrl: varchar('portfolio_url', { length: 500 }),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  
  // Real-time tracking status: 'Submitted' | 'Under Review' | 'Verification Pending' | 'Verified' | 'Shortlisted' | 'Interview' | 'Accepted' | 'Rejected'
  status: varchar('status', { length: 50 }).notNull().default('Submitted'),
  verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('Pending'), // 'Pending' | 'In Progress' | 'Verified' | 'Flagged' | 'Rejected'
  verificationScore: integer('verification_score').default(0), // 0 to 100
  recruiterNotes: text('recruiter_notes'),
  recruiterRating: integer('recruiter_rating').default(0), // 1 to 5 stars
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  documentType: varchar('document_type', { length: 100 }).notNull(), // 'Resume' | 'ID Proof' | 'Degree Certificate' | 'Experience Letter' | 'Other'
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileData: text('file_data').notNull(), // Base64 encoded or data URL
  
  // Document Verification details
  status: varchar('status', { length: 50 }).notNull().default('Pending'), // 'Pending' | 'Verified' | 'Flagged' | 'Rejected'
  automatedCheckStatus: varchar('automated_check_status', { length: 50 }).default('Pending'), // 'Passed' | 'Warning' | 'Failed'
  automatedCheckDetails: text('automated_check_details'), // JSON string detailing validity, extracted fields, integrity
  verifiedBy: uuid('verified_by').references(() => users.id),
  verificationComment: text('verification_comment'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const applicationTimeline = pgTable('application_timeline', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').references(() => applications.id).notNull(),
  status: varchar('status', { length: 100 }).notNull(),
  actorName: varchar('actor_name', { length: 255 }).notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
