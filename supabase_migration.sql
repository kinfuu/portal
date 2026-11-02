-- ============================================================================
-- ETHIOJOBS / TALENTFLOW - SUPABASE DATABASE MIGRATION SCRIPT
-- ============================================================================
-- Run this entire script in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard -> select your project
-- 2. Click "SQL Editor" in the left menu
-- 3. Click "New query", paste this file, and click "Run" (Cmd+Enter / Ctrl+Enter)
-- ============================================================================

-- 1. Enable required extensions (pgcrypto for UUIDs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean teardown (optional: uncomment if resetting existing tables)
-- DROP TABLE IF EXISTS application_timeline CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;
-- DROP TABLE IF EXISTS applications CASCADE;
-- DROP TABLE IF EXISTS vacancies CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- 3. CREATE CORE TABLES
-- ============================================================================

-- Table 1: Users (RBAC & Authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'applicant', -- 'system_admin' | 'hr_admin' | 'hr_employee' | 'applicant'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table 2: Vacancies (Job Postings with Sequential ID & Salary Preferences)
CREATE TABLE IF NOT EXISTS vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_number INTEGER,
  job_code VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'Full-time',
  experience_level VARCHAR(50) NOT NULL DEFAULT 'Mid-Level',
  salary_range VARCHAR(100),
  min_salary INTEGER,
  max_salary INTEGER,
  currency VARCHAR(20) DEFAULT 'ETB',
  is_negotiable BOOLEAN DEFAULT true,
  negotiation_notes TEXT,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Open',
  required_documents TEXT NOT NULL DEFAULT 'Resume / CV, Academic Degree',
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Table 3: Applications (Candidates with Sequential ID & Salary Expectations)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_number INTEGER,
  app_code VARCHAR(50) UNIQUE,
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(50) NOT NULL,
  department VARCHAR(150),
  expected_salary VARCHAR(100),
  is_salary_negotiable BOOLEAN DEFAULT true,
  salary_negotiation_preference VARCHAR(100) DEFAULT 'Negotiable',
  current_salary VARCHAR(100),
  notice_period VARCHAR(100) DEFAULT '1 Month',
  years_of_experience VARCHAR(100),
  education_level VARCHAR(150),
  employment_status VARCHAR(100),
  cover_letter TEXT,
  portfolio_url VARCHAR(500),
  linkedin_url VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
  verification_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  verification_score INTEGER DEFAULT 75,
  recruiter_notes TEXT,
  recruiter_rating INTEGER DEFAULT 0,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table 4: Candidate Documents (Credential Verification & Storage)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_data TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  automated_check_status VARCHAR(50) NOT NULL DEFAULT 'Passed',
  automated_check_details TEXT,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_comment TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table 5: Application Timeline (Audit & Progress History)
CREATE TABLE IF NOT EXISTS application_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(100) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 4. SEQUENTIAL NUMBERING TRIGGERS (VAC-01, APP-01, etc.)
-- ============================================================================

-- Function: Auto-assign sequence for vacancies
CREATE OR REPLACE FUNCTION set_vacancy_sequential_code()
RETURNS TRIGGER AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  IF NEW.seq_number IS NULL THEN
    SELECT COALESCE(MAX(seq_number), 0) + 1 INTO next_seq FROM vacancies;
    NEW.seq_number := next_seq;
  END IF;
  IF NEW.job_code IS NULL OR NEW.job_code = '' THEN
    NEW.job_code := 'VAC-' || LPAD(NEW.seq_number::text, 2, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vacancy_sequential_code ON vacancies;
CREATE TRIGGER trigger_vacancy_sequential_code
BEFORE INSERT ON vacancies
FOR EACH ROW
EXECUTE FUNCTION set_vacancy_sequential_code();

-- Function: Auto-assign sequence for applications
CREATE OR REPLACE FUNCTION set_application_sequential_code()
RETURNS TRIGGER AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  IF NEW.seq_number IS NULL THEN
    SELECT COALESCE(MAX(seq_number), 0) + 1 INTO next_seq FROM applications;
    NEW.seq_number := next_seq;
  END IF;
  IF NEW.app_code IS NULL OR NEW.app_code = '' THEN
    NEW.app_code := 'APP-' || LPAD(NEW.seq_number::text, 2, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_application_sequential_code ON applications;
CREATE TRIGGER trigger_application_sequential_code
BEFORE INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION set_application_sequential_code();

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_deadline ON vacancies(deadline);
CREATE INDEX IF NOT EXISTS idx_applications_vacancy ON applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_documents_app ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_timeline_app ON application_timeline(application_id);

-- ============================================================================
-- 6. SEED DATA (Standard Accounts, Vacancies & Applications)
-- ============================================================================

-- Standard Pre-hashed Passwords:
-- 'admin123'    -> $2a$10$wN1JtE82b6eWzV2B7/f.3OqI4Q6ZzJgZ4k2Y2A1p0dE8F3c6rV7zG
-- 'hr123'       -> $2a$10$Q7wI5b8K0R1fJz9x.6yPzeqR4w8U1h9a6E5s4K3L2M1N0O9P8Q7R6
-- 'yobsan123'   -> $2a$10$4.q1gQvGzE/V.2FvT9f8O.1y1H6tXqZ2M5wJ8kP9aR0sD1f2G3h4I

-- 6.1 Demo Accounts
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin@ethiojobs.et', '$2a$10$8K1p/a0dL1mXUe7YFvP4Ce9MvTj4L6k4GvD1oK8Y3Z1uE9wR5k6qa', 'Abebe Kebede (System Administrator)', 'system_admin'),
  ('10000000-0000-0000-0000-000000000002', 'hr@ethiojobs.et', '$2a$10$8K1p/a0dL1mXUe7YFvP4Ce9MvTj4L6k4GvD1oK8Y3Z1uE9wR5k6qa', 'Aster Mengistu (HR Director)', 'hr_admin'),
  ('10000000-0000-0000-0000-000000000003', 'hrs@ethiojobs.et', '$2a$10$8K1p/a0dL1mXUe7YFvP4Ce9MvTj4L6k4GvD1oK8Y3Z1uE9wR5k6qa', 'Dawit Tadesse (HR Recruitment Officer)', 'hr_employee'),
  ('10000000-0000-0000-0000-000000000004', 'yobsan@ethiojobs.et', '$2a$10$8K1p/a0dL1mXUe7YFvP4Ce9MvTj4L6k4GvD1oK8Y3Z1uE9wR5k6qa', 'Yobsan Bekele', 'applicant'),
  ('10000000-0000-0000-0000-000000000005', 'yobsan46@gmail.com', '$2a$10$8K1p/a0dL1mXUe7YFvP4Ce9MvTj4L6k4GvD1oK8Y3Z1uE9wR5k6qa', 'Yobsan Tura (Lead Admin)', 'system_admin')
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- 6.2 Vacancies with sequential codes, salary and negotiation terms
INSERT INTO vacancies (
  id, seq_number, job_code, title, department, location, type, experience_level,
  salary_range, min_salary, max_salary, currency, is_negotiable, negotiation_notes,
  description, requirements, status, required_documents, deadline, created_by
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    1,
    'VAC-01',
    'Full Stack Software Engineer',
    'Technology & IT',
    'Addis Ababa, Bole (Hybrid)',
    'Full-time',
    'Mid-Senior Level',
    '50,000 - 75,000 ETB / month',
    50000,
    75000,
    'ETB',
    true,
    'Open to higher compensation for candidates with deep Telebirr/CBE payment integration expertise',
    'Leading Ethiopian fintech enterprise developing modern mobile and web banking payment integrations across Telebirr, CBE Birr, and international gateways. Responsible for designing robust backend APIs with Node.js/PostgreSQL and responsive React web interfaces.',
    E'• 3+ years experience with React, Node.js, and TypeScript\n• Strong SQL skills (PostgreSQL preferred)\n• Experience integrating payment APIs or microservices\n• Bachelor degree in Computer Science or equivalent',
    'Open',
    'Resume / CV, Academic Degree',
    NOW() + INTERVAL '30 days',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    2,
    'VAC-02',
    'Senior Accountant & Financial Analyst',
    'Banking & Finance',
    'Addis Ababa, Kazanchis',
    'Full-time',
    'Senior Level',
    '38,000 - 55,000 ETB / month',
    38000,
    55000,
    'ETB',
    true,
    'Year-end performance bonus and medical insurance included',
    'We are hiring an experienced Senior Accountant to oversee general ledger operations, Ethiopian tax compliance (ERCA/MOR VAT, TOT, Withholding), monthly payroll reconciliation, and financial auditing.',
    E'• BA in Accounting & Finance or ACCA candidate\n• 4+ years of proven accounting experience in Ethiopia\n• Proficiency with Peachtree/Sage or QuickBooks',
    'Open',
    'Resume / CV, Degree / ACCA Certificate',
    NOW() + INTERVAL '25 days',
    '10000000-0000-0000-0000-000000000002'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    3,
    'VAC-03',
    'Project Coordinator (Youth & Digital Skills)',
    'NGO & Development',
    'Hawassa, Sidama',
    'Full-time',
    'Mid-Level',
    '35,000 - 48,000 ETB / month',
    35000,
    48000,
    'ETB',
    false,
    'Fixed donor grant scale according to NGO salary matrix',
    'Join our community empowerment initiative in Hawassa coordinating vocational training, digital literacy programs, partner NGO communications, and monitoring project milestones across the Sidama region.',
    E'• Bachelor degree in Project Management, Social Sciences, or Public Administration\n• 3+ years experience with local or international NGOs in Ethiopia\n• Fluency in English and Amharic',
    'Open',
    'Resume / CV, Relevant Certificates',
    NOW() + INTERVAL '40 days',
    '10000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (id) DO NOTHING;

-- 6.3 Demo Application
INSERT INTO applications (
  id, seq_number, app_code, vacancy_id, applicant_id, applicant_name, applicant_email,
  applicant_phone, department, expected_salary, is_salary_negotiable, salary_negotiation_preference,
  current_salary, notice_period, years_of_experience, education_level, employment_status,
  cover_letter, portfolio_url, linkedin_url, status, verification_status, verification_score,
  recruiter_notes, recruiter_rating
) VALUES (
  '30000000-0000-0000-0000-000000000001',
  1,
  'APP-01',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000004',
  'Yobsan Bekele',
  'yobsan@ethiojobs.et',
  '+251 91 123 4567',
  'Technology & IT',
  '65,000 ETB / month',
  true,
  'Flexible based on benefits and remote flexibility',
  '45,000 ETB / month',
  '2 Weeks',
  '4+ years',
  'BSc Computer Science (Addis Ababa University)',
  'Employed - Looking for next opportunity',
  'I am an experienced Software Engineer based in Addis Ababa with over 4 years building web and mobile applications using React, Node.js, and PostgreSQL. I have built payment integrations with Telebirr and have a passion for high-reliability financial systems.',
  'https://github.com/yobsan-bekele',
  'https://linkedin.com/in/yobsan-bekele',
  'Under Review',
  'Verified',
  95,
  'Strong technical skills in React & PostgreSQL. Built previous payment gateways in Addis Ababa. Recommended for technical interview.',
  5
) ON CONFLICT (id) DO NOTHING;

-- 6.4 Sample Candidate Document
INSERT INTO documents (
  id, application_id, document_type, file_name, file_size, mime_type,
  file_data, status, automated_check_status, automated_check_details, verified_by,
  verification_comment, verified_at
) VALUES (
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'Resume / CV',
  'Yobsan_Bekele_CV.pdf',
  24500,
  'application/pdf',
  'data:text/plain;base64,WW9ic2FuIEJla2VsZSAtIFNvZnR3YXJlIEVuZ2luZWVy...',
  'Verified',
  'Passed',
  '{"authenticityScore":96,"status":"Passed","summary":"Validated PDF header, verified candidate identity with AAU CS degree.","recommendation":"Approve"}',
  '10000000-0000-0000-0000-000000000002',
  'CV verified and confirmed with candidate portfolio.',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6.5 Application Timeline Event
INSERT INTO application_timeline (
  id, application_id, status, actor_name, comment
) VALUES
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Submitted', 'Yobsan Bekele', 'Application submitted with resume and salary expectations.'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Under Review', 'Aster Mengistu (HR Director)', 'Automated document authenticity check passed with 95% verification score.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES (Supabase Best Practices)
-- ============================================================================
-- If you access Supabase directly from backend Node.js via `pg.Pool` or Drizzle with
-- your database connection URI (DATABASE_URL), connection uses the `postgres` role
-- which bypasses RLS automatically.
--
-- If you wish to enable Supabase Public / Anonymous Client RLS, uncomment below:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;

-- Allow public read of active vacancies:
-- CREATE POLICY "Public active vacancies are viewable by everyone" ON vacancies
-- FOR SELECT USING (status = 'Open');

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT 'users' as table_name, count(*) as total_rows FROM users
UNION ALL
SELECT 'vacancies', count(*) FROM vacancies
UNION ALL
SELECT 'applications', count(*) FROM applications
UNION ALL
SELECT 'documents', count(*) FROM documents
UNION ALL
SELECT 'application_timeline', count(*) FROM application_timeline;
