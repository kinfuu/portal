import React, { useState, useEffect } from 'react';
import { User, Vacancy, Application, isVacancyClosed, formatSequentialId } from '../types';
import { api } from '../api';
import {
  Users,
  Shield,
  Briefcase,
  FileText,
  Trash2,
  Edit,
  Plus,
  Search,
  CheckCircle,
  Database,
  Building,
  RefreshCw,
  Eye,
  LogOut,
  UserPlus,
  AlertTriangle,
  Calendar,
  XCircle,
  CheckCircle2,
  Key,
  Lock,
  X,
  Building2,
  Download,
  Code,
  Check,
  FileCheck,
  Phone,
  Mail,
  Terminal,
  Play,
  Table,
  Copy,
  Server
} from 'lucide-react';
import { CreateVacancyModal } from './CreateVacancyModal';
import { ApplicationDetailModal } from './ApplicationDetailModal';

export function formatDeadline(deadlineStr?: string | null) {
  if (!deadlineStr) return 'Rolling / Open';
  try {
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return 'Rolling / Open';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'Rolling / Open';
  }
}

export function getDeadlineBadge(deadlineStr?: string | null) {
  if (!deadlineStr) return null;
  try {
    const d = new Date(deadlineStr);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
          Expired
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
          Closing in {diffDays}d
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
        {diffDays} days left
      </span>
    );
  } catch {
    return null;
  }
}

export const TABLE_QUERIES: Record<string, {
  name: string;
  description: string;
  schemaFile: string;
  serverFile: string;
  columns: { name: string; type: string; desc: string }[];
  queries: {
    id: string;
    title: string;
    type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    purpose: string;
    codeLocation: string;
    sql: string;
  }[];
}> = {
  users: {
    name: 'users',
    description: 'Stores system accounts, passwords (bcrypt hashed), full names, and RBAC roles.',
    schemaFile: 'src/db/schema.ts (lines 3-11)',
    serverFile: 'server.ts (lines 398-600)',
    columns: [
      { name: 'id', type: 'uuid (Primary Key)', desc: 'Unique identifier generated via defaultRandom()' },
      { name: 'email', type: 'varchar(255) UNIQUE', desc: 'Unique login email address' },
      { name: 'password_hash', type: 'text', desc: 'Salted bcrypt password hash (cost 10)' },
      { name: 'full_name', type: 'varchar(255)', desc: 'Full display name of user' },
      { name: 'role', type: 'varchar(50)', desc: "'system_admin' | 'hr_admin' | 'hr_employee' | 'applicant'" },
      { name: 'created_at', type: 'timestamp', desc: 'Creation timestamp' },
    ],
    queries: [
      {
        id: 'u-select-all',
        title: 'Fetch All Users (With Role & Search Filters)',
        type: 'SELECT',
        purpose: 'Retrieved by System Admin and HR Admin to manage users and staff credentials.',
        codeLocation: 'server.ts -> GET /api/users',
        sql: `SELECT id, email, full_name as "fullName", role, created_at as "createdAt"
FROM users
ORDER BY created_at DESC;`,
      },
      {
        id: 'u-select-login',
        title: 'Authentication & Lookup by Email',
        type: 'SELECT',
        purpose: 'Verifies email address and returns password_hash for bcrypt validation.',
        codeLocation: 'server.ts -> POST /api/auth/login',
        sql: `SELECT id, email, password_hash, full_name, role, created_at
FROM users
WHERE email = $1;`,
      },
      {
        id: 'u-insert',
        title: 'Create User / Register Candidate / Provision Staff',
        type: 'INSERT',
        purpose: 'Inserts new user record with hashed password and assigned system role.',
        codeLocation: 'server.ts -> POST /api/users',
        sql: `INSERT INTO users (email, password_hash, full_name, role)
VALUES ($1, $2, $3, $4)
RETURNING id, email, full_name as "fullName", role, created_at as "createdAt";`,
      },
      {
        id: 'u-update-details',
        title: 'Update User Profile & Role',
        type: 'UPDATE',
        purpose: 'System Admin edits user full name, email, or role.',
        codeLocation: 'server.ts -> PATCH /api/users/:id',
        sql: `UPDATE users
SET full_name = COALESCE($1, full_name),
    email = COALESCE($2, email),
    role = COALESCE($3, role),
    updated_at = NOW()
WHERE id = $4
RETURNING id, email, full_name as "fullName", role;`,
      },
      {
        id: 'u-update-password',
        title: 'Reset User Password',
        type: 'UPDATE',
        purpose: 'System Admin resets user password to a newly hashed password.',
        codeLocation: 'server.ts -> PATCH /api/users/:id/password',
        sql: `UPDATE users
SET password_hash = $1,
    updated_at = NOW()
WHERE id = $2
RETURNING id, email, full_name as "fullName", role;`,
      },
      {
        id: 'u-delete',
        title: 'Safely Delete User (With Cascade Cleanup)',
        type: 'DELETE',
        purpose: 'System Admin deletes user after detaching foreign keys in vacancies and applications.',
        codeLocation: 'server.ts -> DELETE /api/users/:id',
        sql: `DELETE FROM users
WHERE id = $1
RETURNING id;`,
      },
    ],
  },
  vacancies: {
    name: 'vacancies',
    description: 'Stores job openings, requirements, deadline dates, and status.',
    schemaFile: 'src/db/schema.ts (lines 13-28)',
    serverFile: 'server.ts (lines 620-830)',
    columns: [
      { name: 'id', type: 'uuid (Primary Key)', desc: 'Unique vacancy identifier' },
      { name: 'title', type: 'varchar(255)', desc: 'Job vacancy title' },
      { name: 'department', type: 'varchar(150)', desc: 'Department (IT, Banking, NGO, Sales)' },
      { name: 'location', type: 'varchar(150)', desc: 'Work location / city' },
      { name: 'type', type: 'varchar(50)', desc: "'Full-time' | 'Part-time' | 'Remote' | 'Contract'" },
      { name: 'deadline', type: 'timestamp', desc: 'Application deadline date and time' },
      { name: 'status', type: 'varchar(50)', desc: "'Open' | 'Closed' | 'Draft'" },
      { name: 'created_by', type: 'uuid (FK -> users.id)', desc: 'Authoring recruiter or admin ID' },
    ],
    queries: [
      {
        id: 'v-select-public',
        title: 'Fetch Public Active Vacancies (Deadline Enforced)',
        type: 'SELECT',
        purpose: 'Shown on Candidate Portal. Automatically filters out expired vacancies whose deadline is passed or status is Closed.',
        codeLocation: 'server.ts -> GET /api/vacancies',
        sql: `SELECT *
FROM vacancies
WHERE status = 'Open'
  AND (deadline IS NULL OR deadline >= NOW())
ORDER BY created_at DESC;`,
      },
      {
        id: 'v-select-admin-all',
        title: 'Fetch All Vacancies (Stored Admin Database)',
        type: 'SELECT',
        purpose: 'Retrieved by System Admin and HR Admin to view, edit, or reopen active and closed vacancies.',
        codeLocation: 'server.ts -> GET /api/vacancies?includeExpired=true',
        sql: `SELECT *
FROM vacancies
ORDER BY created_at DESC;`,
      },
      {
        id: 'v-select-closed',
        title: 'Query Closed / Expired Vacancies',
        type: 'SELECT',
        purpose: 'Isolates vacancies that are past their deadline or closed, safely archived in the database.',
        codeLocation: 'Admin Dashboard Visibility Filter',
        sql: `SELECT id, title, department, status, deadline
FROM vacancies
WHERE status = 'Closed'
   OR (deadline IS NOT NULL AND deadline < NOW())
ORDER BY deadline DESC;`,
      },
      {
        id: 'v-insert',
        title: 'Create New Vacancy',
        type: 'INSERT',
        purpose: 'Creates a new vacancy post with requirements, department, and deadline.',
        codeLocation: 'server.ts -> POST /api/vacancies',
        sql: `INSERT INTO vacancies (
  title, department, location, type, experience_level,
  salary_range, description, requirements, deadline, status, created_by
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;`,
      },
      {
        id: 'v-update',
        title: 'Update Vacancy Details, Deadline & Reopen',
        type: 'UPDATE',
        purpose: 'Edits job parameters, extends deadline, or reopens closed vacancies.',
        codeLocation: 'server.ts -> PATCH /api/vacancies/:id',
        sql: `UPDATE vacancies
SET title = COALESCE($1, title),
    department = COALESCE($2, department),
    deadline = $3,
    status = COALESCE($4, status),
    updated_at = NOW()
WHERE id = $5
RETURNING *;`,
      },
      {
        id: 'v-delete',
        title: 'Delete Vacancy',
        type: 'DELETE',
        purpose: 'Permanently removes a vacancy after detaching dependent applications.',
        codeLocation: 'server.ts -> DELETE /api/vacancies/:id',
        sql: `DELETE FROM vacancies
WHERE id = $1
RETURNING id;`,
      },
    ],
  },
  applications: {
    name: 'applications',
    description: 'Stores candidate applications, pipeline hiring stages, verification score, and recruiter evaluations.',
    schemaFile: 'src/db/schema.ts (lines 30-51)',
    serverFile: 'server.ts (lines 850-1100, 1360-1440)',
    columns: [
      { name: 'id', type: 'uuid (Primary Key)', desc: 'Application identifier' },
      { name: 'vacancy_id', type: 'uuid (FK -> vacancies.id)', desc: 'Applied position' },
      { name: 'applicant_id', type: 'uuid (FK -> users.id)', desc: 'Applicant user ID' },
      { name: 'applicant_name', type: 'varchar(255)', desc: 'Candidate full name' },
      { name: 'status', type: 'varchar(50)', desc: "'Submitted' | 'Under Review' | 'Shortlisted' | 'Interview' | 'Accepted' | 'Rejected'" },
      { name: 'verification_status', type: 'varchar(50)', desc: "'Pending' | 'In Progress' | 'Verified' | 'Flagged' | 'Rejected'" },
      { name: 'verification_score', type: 'integer', desc: 'Credential score from 0 to 100' },
      { name: 'recruiter_notes', type: 'text', desc: 'Internal notes and evaluation' },
    ],
    queries: [
      {
        id: 'a-select-joined',
        title: 'Fetch Applications with Vacancy Details',
        type: 'SELECT',
        purpose: 'Joins applications with vacancies to display full candidate information and position context.',
        codeLocation: 'server.ts -> GET /api/applications',
        sql: `SELECT a.*, v.title as vacancy_title, v.department as vacancy_department
FROM applications a
JOIN vacancies v ON a.vacancy_id = v.id
ORDER BY a.created_at DESC;`,
      },
      {
        id: 'a-insert',
        title: 'Submit Candidate Application',
        type: 'INSERT',
        purpose: 'Creates a candidate application linked to a vacancy.',
        codeLocation: 'server.ts -> POST /api/applications',
        sql: `INSERT INTO applications (
  vacancy_id, applicant_id, applicant_name, applicant_email, applicant_phone,
  department, cover_letter, portfolio_url, linkedin_url, status, verification_status
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Submitted', 'Pending')
RETURNING *;`,
      },
      {
        id: 'a-update-full',
        title: 'Update Application Stage & Evaluation',
        type: 'UPDATE',
        purpose: 'Full edit of candidate stage, verification status, score, notes, and rating.',
        codeLocation: 'server.ts -> PATCH /api/applications/:id',
        sql: `UPDATE applications
SET applicant_name = COALESCE($1, applicant_name),
    status = COALESCE($2, status),
    verification_status = COALESCE($3, verification_status),
    verification_score = COALESCE($4, verification_score),
    recruiter_notes = COALESCE($5, recruiter_notes),
    updated_at = NOW()
WHERE id = $6
RETURNING *;`,
      },
      {
        id: 'a-delete',
        title: 'Delete Application & Cleanup Files',
        type: 'DELETE',
        purpose: 'Removes application after clearing attached documents and timeline logs.',
        codeLocation: 'server.ts -> DELETE /api/applications/:id',
        sql: `DELETE FROM applications
WHERE id = $1
RETURNING id;`,
      },
    ],
  },
  documents: {
    name: 'documents',
    description: 'Stores applicant uploaded credentials (resumes, degree certificates, IDs) and verification results.',
    schemaFile: 'src/db/schema.ts (lines 53-70)',
    serverFile: 'server.ts (lines 1445-1730)',
    columns: [
      { name: 'id', type: 'uuid (Primary Key)', desc: 'Document record identifier' },
      { name: 'application_id', type: 'uuid (FK -> applications.id)', desc: 'Application document belongs to' },
      { name: 'document_type', type: 'varchar(100)', desc: "'Resume' | 'Degree Certificate' | 'ID Proof' | 'Other'" },
      { name: 'file_name', type: 'varchar(255)', desc: 'Name of uploaded file' },
      { name: 'file_size', type: 'integer', desc: 'File size in bytes' },
      { name: 'status', type: 'varchar(50)', desc: "'Pending' | 'Verified' | 'Flagged' | 'Rejected'" },
      { name: 'automated_check_status', type: 'varchar(50)', desc: "'Passed' | 'Warning' | 'Failed'" },
    ],
    queries: [
      {
        id: 'd-select-all',
        title: 'List All Documents in Registry',
        type: 'SELECT',
        purpose: 'System Admin & HR view all candidate files with applicant and position context.',
        codeLocation: 'server.ts -> GET /api/documents',
        sql: `SELECT d.*, a.applicant_name, a.applicant_email, v.title as vacancy_title
FROM documents d
JOIN applications a ON d.application_id = a.id
JOIN vacancies v ON a.vacancy_id = v.id
ORDER BY d.created_at DESC;`,
      },
      {
        id: 'd-update-verify',
        title: 'Verify or Flag Document',
        type: 'UPDATE',
        purpose: 'Updates verification status, notes, and reviewer ID.',
        codeLocation: 'server.ts -> POST /api/documents/:id/verify',
        sql: `UPDATE documents
SET status = $1,
    verification_comment = $2,
    verified_by = $3,
    verified_at = NOW()
WHERE id = $4
RETURNING *;`,
      },
      {
        id: 'd-delete',
        title: 'Delete Document',
        type: 'DELETE',
        purpose: 'Deletes document file from database registry.',
        codeLocation: 'server.ts -> DELETE /api/documents/:id',
        sql: `DELETE FROM documents
WHERE id = $1
RETURNING id;`,
      },
    ],
  },
  application_timeline: {
    name: 'application_timeline',
    description: 'Audit logs tracking stage transitions, evaluations, document verifications, and actors.',
    schemaFile: 'src/db/schema.ts (lines 72-79)',
    serverFile: 'server.ts (lines 1425-1433, 1612-1622, 1762-1770)',
    columns: [
      { name: 'id', type: 'uuid (Primary Key)', desc: 'Log identifier' },
      { name: 'application_id', type: 'uuid (FK -> applications.id)', desc: 'Application event belongs to' },
      { name: 'status', type: 'varchar(100)', desc: 'Event status or action' },
      { name: 'actor_name', type: 'varchar(255)', desc: 'User who performed the action' },
      { name: 'comment', type: 'text', desc: 'Audit notes' },
      { name: 'created_at', type: 'timestamp', desc: 'Event timestamp' },
    ],
    queries: [
      {
        id: 't-select-recent',
        title: 'Fetch Recent Audit Activity Timeline',
        type: 'SELECT',
        purpose: 'Fetches recent timeline events for candidate tracking and recruiter activity feed.',
        codeLocation: 'server.ts -> GET /api/recruiter/metrics',
        sql: `SELECT t.id, t.application_id, t.status, t.actor_name, t.comment, t.created_at,
       a.applicant_name, v.title as vacancy_title
FROM application_timeline t
JOIN applications a ON t.application_id = a.id
JOIN vacancies v ON a.vacancy_id = v.id
ORDER BY t.created_at DESC
LIMIT 15;`,
      },
      {
        id: 't-insert',
        title: 'Record Audit Log Event',
        type: 'INSERT',
        purpose: 'Appends a new timeline milestone whenever status changes.',
        codeLocation: 'server.ts -> helper queries',
        sql: `INSERT INTO application_timeline (application_id, status, actor_name, comment)
VALUES ($1, $2, $3, $4)
RETURNING *;`,
      },
    ],
  },
};

interface SystemAdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onPreviewPublicPortal: () => void;
}

export const SystemAdminDashboard: React.FC<SystemAdminDashboardProps> = ({
  currentUser,
  onLogout,
  onPreviewPublicPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'vacancies' | 'applications' | 'documents' | 'database'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appDeptFilter, setAppDeptFilter] = useState('All');
  const [vacSearch, setVacSearch] = useState('');
  const [vacDeptFilter, setVacDeptFilter] = useState('All');
  const [vacVisibilityFilter, setVacVisibilityFilter] = useState<'All' | 'active' | 'closed'>('All');
  const [docSearch, setDocSearch] = useState('');
  const [docStatusFilter, setDocStatusFilter] = useState('All');

  // Master Database Explorer table selector
  const [selectedDbTable, setSelectedDbTable] = useState<'users' | 'vacancies' | 'applications' | 'documents'>('users');
  const [rawRecordModal, setRawRecordModal] = useState<{ title: string; data: any } | null>(null);

  // SQL Query Runner, Schema & Supabase Migration states
  const [dbSubView, setDbSubView] = useState<'tables' | 'query_reference' | 'sql_console' | 'supabase_migration'>('tables');
  const [sqlConsoleInput, setSqlConsoleInput] = useState<string>('SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10;');
  const [sqlQueryResult, setSqlQueryResult] = useState<any | null>(null);
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);

  // Supabase Migration Hub states
  const [supabaseMigrationSql, setSupabaseMigrationSql] = useState<string>('');
  const [loadingMigrationSql, setLoadingMigrationSql] = useState(false);
  const [copiedMigrationSql, setCopiedMigrationSql] = useState(false);
  const [testConnectionString, setTestConnectionString] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<any | null>(null);
  const [connectionTestError, setConnectionTestError] = useState<string | null>(null);

  const loadSupabaseMigration = async () => {
    setLoadingMigrationSql(true);
    try {
      const res = await api.getSupabaseMigrationSql();
      if (res && res.sql) {
        setSupabaseMigrationSql(res.sql);
      }
    } catch (err) {
      console.warn('Failed to load migration SQL:', err);
    } finally {
      setLoadingMigrationSql(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testConnectionString.trim()) return;
    setTestingConnection(true);
    setConnectionTestError(null);
    setConnectionTestResult(null);
    try {
      const res = await api.testDatabaseConnection(testConnectionString);
      if (res && res.ok) {
        setConnectionTestResult(res);
      } else {
        setConnectionTestError(res?.error || 'Connection test failed');
      }
    } catch (err: any) {
      setConnectionTestError(err.message || 'Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleExecuteSql = async (queryToRun?: string) => {
    const sql = queryToRun || sqlConsoleInput;
    if (!sql.trim()) return;
    setSqlRunning(true);
    setSqlError(null);
    try {
      const res = await api.runSqlQuery(sql);
      if (res && res.error) {
        setSqlError(res.error);
        setSqlQueryResult(null);
      } else {
        setSqlQueryResult(res);
        setSqlError(null);
      }
    } catch (err: any) {
      setSqlError(err.message || 'Execution failed');
      setSqlQueryResult(null);
    } finally {
      setSqlRunning(false);
    }
  };

  // Modals & sub-modals
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showCreateVacancyModal, setShowCreateVacancyModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Edit User modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('applicant');
  const [editUserLoading, setEditUserLoading] = useState(false);

  // Reset Password modal state
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Vacancy modal state
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editType, setEditType] = useState('Full-time');
  const [editExpLevel, setEditExpLevel] = useState('Mid-Level');
  const [editSalary, setEditSalary] = useState('');
  const [editMinSalary, setEditMinSalary] = useState('');
  const [editMaxSalary, setEditMaxSalary] = useState('');
  const [editIsNegotiable, setEditIsNegotiable] = useState(true);
  const [editNegotiationNotes, setEditNegotiationNotes] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editStatus, setEditStatus] = useState<'Open' | 'Closed'>('Open');
  const [editDescription, setEditDescription] = useState('');
  const [editRequirements, setEditRequirements] = useState('');
  const [editVacLoading, setEditVacLoading] = useState(false);

  // Edit Application modal state
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [editAppName, setEditAppName] = useState('');
  const [editAppEmail, setEditAppEmail] = useState('');
  const [editAppPhone, setEditAppPhone] = useState('');
  const [editAppDept, setEditAppDept] = useState('');
  const [editExpectedSalary, setEditExpectedSalary] = useState('');
  const [editIsSalaryNegotiable, setEditIsSalaryNegotiable] = useState(true);
  const [editSalaryPref, setEditSalaryPref] = useState('Negotiable');
  const [editNoticePeriod, setEditNoticePeriod] = useState('1 Month');
  const [editEmploymentStatus, setEditEmploymentStatus] = useState('Active Candidate');
  const [editAppStatus, setEditAppStatus] = useState('Submitted');
  const [editAppVerifStatus, setEditAppVerifStatus] = useState('Pending');
  const [editAppVerifScore, setEditAppVerifScore] = useState(75);
  const [editAppRating, setEditAppRating] = useState(0);
  const [editAppNotes, setEditAppNotes] = useState('');
  const [editAppCoverLetter, setEditAppCoverLetter] = useState('');
  const [editAppLoading, setEditAppLoading] = useState(false);

  // Edit Document modal state
  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  const [editDocStatus, setEditDocStatus] = useState<'Verified' | 'Flagged' | 'Rejected' | 'Pending'>('Pending');
  const [editDocComment, setEditDocComment] = useState('');
  const [editDocType, setEditDocType] = useState('Resume');
  const [editDocLoading, setEditDocLoading] = useState(false);

  // In-app Confirmation Dialog state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // New staff form state
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'system_admin' | 'hr_admin' | 'hr_employee'>('hr_employee');
  const [staffActionLoading, setStaffActionLoading] = useState(false);

  const [syncLoading, setSyncLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, vacsData, appsData, docsData] = await Promise.all([
        api.getUsers({ role: roleFilter !== 'All' ? roleFilter : undefined, search: searchQuery || undefined }),
        api.getVacancies({ includeExpired: true }),
        api.getApplications(),
        api.getAllDocuments(),
      ]);
      setUsers(usersData);
      setVacancies(vacsData);
      setApplications(appsData);
      setDocuments(docsData);
    } catch (err: any) {
      console.error('Failed to load system admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, roleFilter]);

  // User Actions
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffActionLoading(true);
    setStatusMessage(null);
    try {
      await api.createUser({
        email: newStaffEmail,
        fullName: newStaffName,
        password: newStaffPassword,
        role: newStaffRole,
      });
      setStatusMessage({ text: `Staff user "${newStaffName}" created successfully!`, type: 'success' });
      setShowCreateStaffModal(false);
      setNewStaffEmail('');
      setNewStaffName('');
      setNewStaffPassword('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to create staff member', type: 'error' });
    } finally {
      setStaffActionLoading(false);
    }
  };

  const handleStartEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserName(u.fullName);
    setEditUserEmail(u.email);
    setEditUserRole(u.role);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserLoading(true);
    try {
      await api.updateUser(editingUser.id, {
        fullName: editUserName,
        email: editUserEmail,
        role: editUserRole,
      });
      setStatusMessage({ text: `User "${editUserName}" updated in database!`, type: 'success' });
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update user', type: 'error' });
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    setConfirmModal({
      title: 'Delete User Account',
      message: `Permanently delete user "${user.fullName}" (${user.email}) from database? This action cannot be undone.`,
      confirmLabel: 'Yes, Delete User',
      onConfirm: async () => {
        try {
          await api.deleteUser(user.id);
          setStatusMessage({ text: `User "${user.fullName}" removed from database.`, type: 'success' });
          loadData();
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Failed to delete user', type: 'error' });
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setResetLoading(true);
    try {
      await api.resetUserPassword(resettingUser.id, newPasswordVal);
      setStatusMessage({ text: `Password for "${resettingUser.fullName}" updated in database!`, type: 'success' });
      setResettingUser(null);
      setNewPasswordVal('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to reset password', type: 'error' });
    } finally {
      setResetLoading(false);
    }
  };

  // Vacancy Actions
  const handleToggleVacancyStatus = async (vac: Vacancy) => {
    const isClosedOrExpired = isVacancyClosed(vac);
    const nextStatus = isClosedOrExpired ? 'Open' : 'Closed';
    const updatePayload: any = { status: nextStatus };

    // If reopening a vacancy that was expired, renew deadline for 30 days so it appears on public portal
    if (nextStatus === 'Open' && vac.deadline && new Date(vac.deadline).getTime() < Date.now()) {
      const renewedDate = new Date();
      renewedDate.setDate(renewedDate.getDate() + 30);
      updatePayload.deadline = renewedDate.toISOString();
    }

    try {
      await api.updateVacancy(vac.id, updatePayload);
      setStatusMessage({
        text: nextStatus === 'Open'
          ? `Vacancy "${vac.title}" reopened and published to public portal (deadline extended 30 days).`
          : `Vacancy "${vac.title}" closed and safely archived to database.`,
        type: 'success',
      });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update vacancy status', type: 'error' });
    }
  };

  const handleStartEditVacancy = (vac: Vacancy) => {
    setEditingVacancy(vac);
    setEditTitle(vac.title);
    setEditDept(vac.department);
    setEditLocation(vac.location);
    setEditType(vac.type);
    setEditExpLevel(vac.experienceLevel);
    setEditSalary(vac.salaryRange || '');
    setEditMinSalary(vac.minSalary ? String(vac.minSalary) : '');
    setEditMaxSalary(vac.maxSalary ? String(vac.maxSalary) : '');
    setEditIsNegotiable(vac.isNegotiable !== false);
    setEditNegotiationNotes(vac.negotiationNotes || '');
    setEditDeadline(vac.deadline ? new Date(vac.deadline).toISOString().split('T')[0] : '');
    setEditStatus(vac.status === 'Closed' ? 'Closed' : 'Open');
    setEditDescription(vac.description);
    setEditRequirements(vac.requirements);
  };

  const handleSaveEditVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVacancy) return;
    setEditVacLoading(true);

    let finalSalaryRange = editSalary.trim();
    if (editMinSalary && editMaxSalary) {
      finalSalaryRange = `${Number(editMinSalary).toLocaleString()} - ${Number(editMaxSalary).toLocaleString()} ETB / month${editIsNegotiable ? ' (Negotiable)' : ''}`;
    } else if (editIsNegotiable && finalSalaryRange && !finalSalaryRange.toLowerCase().includes('negotiable')) {
      finalSalaryRange = `${finalSalaryRange} (Negotiable)`;
    }

    try {
      await api.updateVacancy(editingVacancy.id, {
        title: editTitle.trim(),
        department: editDept,
        location: editLocation.trim(),
        type: editType,
        experienceLevel: editExpLevel,
        salaryRange: finalSalaryRange || undefined,
        minSalary: editMinSalary ? parseInt(editMinSalary, 10) : undefined,
        maxSalary: editMaxSalary ? parseInt(editMaxSalary, 10) : undefined,
        isNegotiable: editIsNegotiable,
        negotiationNotes: editNegotiationNotes.trim() || undefined,
        deadline: editDeadline ? new Date(editDeadline).toISOString() : undefined,
        status: editStatus,
        description: editDescription.trim(),
        requirements: editRequirements.trim(),
      });
      setStatusMessage({ text: `Vacancy "${editTitle}" updated in database!`, type: 'success' });
      setEditingVacancy(null);
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update vacancy', type: 'error' });
    } finally {
      setEditVacLoading(false);
    }
  };

  const handleDeleteVacancy = (vac: Vacancy) => {
    setConfirmModal({
      title: 'Delete Vacancy',
      message: `Permanently delete vacancy "${vac.title}" from database? All submitted applications and records will be deleted.`,
      confirmLabel: 'Yes, Delete Vacancy',
      onConfirm: async () => {
        try {
          await api.deleteVacancy(vac.id);
          setStatusMessage({ text: `Vacancy "${vac.title}" deleted from database.`, type: 'success' });
          loadData();
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Failed to delete vacancy', type: 'error' });
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  // Application Actions (See & Edit All Application Data)
  const handleStartEditApplication = (app: Application) => {
    setEditingApplication(app);
    setEditAppName(app.applicantName);
    setEditAppEmail(app.applicantEmail);
    setEditAppPhone(app.applicantPhone);
    setEditAppDept(app.department || app.vacancyDepartment || 'Technology & IT');
    setEditExpectedSalary(app.expectedSalary || '');
    setEditIsSalaryNegotiable(app.isSalaryNegotiable !== false);
    setEditSalaryPref(app.salaryNegotiationPreference || 'Negotiable');
    setEditNoticePeriod(app.noticePeriod || '1 Month');
    setEditEmploymentStatus(app.employmentStatus || 'Active Candidate');
    setEditAppStatus(app.status);
    setEditAppVerifStatus(app.verificationStatus);
    setEditAppVerifScore(app.verificationScore ?? 75);
    setEditAppRating(app.recruiterRating ?? 0);
    setEditAppNotes(app.recruiterNotes || '');
    setEditAppCoverLetter(app.coverLetter || '');
  };

  const handleSaveEditApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApplication) return;
    setEditAppLoading(true);
    try {
      await api.updateApplication(editingApplication.id, {
        applicantName: editAppName.trim(),
        applicantEmail: editAppEmail.trim(),
        applicantPhone: editAppPhone.trim(),
        department: editAppDept,
        expectedSalary: editExpectedSalary.trim() || undefined,
        isSalaryNegotiable: editIsSalaryNegotiable,
        salaryNegotiationPreference: editSalaryPref,
        noticePeriod: editNoticePeriod,
        employmentStatus: editEmploymentStatus,
        status: editAppStatus as any,
        verificationStatus: editAppVerifStatus as any,
        verificationScore: Number(editAppVerifScore),
        recruiterRating: Number(editAppRating),
        recruiterNotes: editAppNotes.trim(),
        coverLetter: editAppCoverLetter.trim(),
      });
      setStatusMessage({ text: `Application for "${editAppName}" updated in database!`, type: 'success' });
      setEditingApplication(null);
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update application', type: 'error' });
    } finally {
      setEditAppLoading(false);
    }
  };

  const handleDeleteApplication = (app: Application) => {
    setConfirmModal({
      title: 'Delete Candidate Application',
      message: `Permanently delete application from "${app.applicantName}" for "${app.vacancyTitle}"?`,
      confirmLabel: 'Yes, Delete Application',
      onConfirm: async () => {
        try {
          await api.deleteApplication(app.id);
          setStatusMessage({ text: 'Application deleted from database.', type: 'success' });
          loadData();
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Failed to delete application', type: 'error' });
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  // Document Actions (See & Edit All Document Data)
  const handleStartEditDocument = (doc: any) => {
    setEditingDocument(doc);
    setEditDocStatus(doc.status || 'Pending');
    setEditDocComment(doc.verification_comment || doc.verificationComment || '');
    setEditDocType(doc.document_type || doc.documentType || 'Resume');
  };

  const handleSaveEditDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;
    setEditDocLoading(true);
    try {
      await api.updateDocument(editingDocument.id, {
        status: editDocStatus,
        verificationComment: editDocComment.trim(),
        documentType: editDocType,
      });
      setStatusMessage({ text: `Document "${editingDocument.file_name || editingDocument.fileName}" updated in database!`, type: 'success' });
      setEditingDocument(null);
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update document', type: 'error' });
    } finally {
      setEditDocLoading(false);
    }
  };

  const handleDeleteDocument = (doc: any) => {
    setConfirmModal({
      title: 'Delete Document Record',
      message: `Permanently delete file record "${doc.file_name || doc.fileName}" from database?`,
      confirmLabel: 'Yes, Delete Document',
      onConfirm: async () => {
        try {
          await api.deleteDocument(doc.id);
          setStatusMessage({ text: 'Document record deleted from database.', type: 'success' });
          loadData();
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Failed to delete document', type: 'error' });
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleSyncHealth = async () => {
    setSyncLoading(true);
    try {
      const res = await api.syncSystemHealth();
      setStatusMessage({ text: res.message, type: 'success' });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Database synchronization failed', type: 'error' });
    } finally {
      setSyncLoading(false);
    }
  };

  // Filtered queries
  const filteredApplications = applications.filter((app) => {
    if (appStatusFilter !== 'All' && app.status !== appStatusFilter) return false;
    if (appDeptFilter !== 'All' && (app.department || app.vacancyDepartment) !== appDeptFilter) return false;
    if (appSearch) {
      const q = appSearch.toLowerCase();
      const nameMatch = app.applicantName?.toLowerCase().includes(q);
      const emailMatch = app.applicantEmail?.toLowerCase().includes(q);
      const titleMatch = app.vacancyTitle?.toLowerCase().includes(q);
      const deptMatch = (app.department || app.vacancyDepartment)?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !titleMatch && !deptMatch) return false;
    }
    return true;
  });

  const filteredDocuments = documents.filter((doc) => {
    if (docStatusFilter !== 'All' && doc.status !== docStatusFilter) return false;
    if (docSearch) {
      const q = docSearch.toLowerCase();
      const name = (doc.file_name || doc.fileName || '').toLowerCase();
      const applicant = (doc.applicant_name || '').toLowerCase();
      const title = (doc.vacancy_title || '').toLowerCase();
      if (!name.includes(q) && !applicant.includes(q) && !title.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* System Admin Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-linear-to-r from-purple-950 via-slate-900 to-emerald-950 p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/30 shadow-inner">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black tracking-tight">System Admin Database Console</h2>
              <span className="rounded-full bg-purple-500/30 px-3 py-0.5 text-xs font-bold text-purple-200 border border-purple-400/30">
                Full Database Read & Write
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Welcome, {currentUser.fullName} • You have administrative privileges to view, inspect, and edit all database tables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onPreviewPublicPortal}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <Eye className="h-4 w-4" />
            <span>Public Portal View</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600/80 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Database KPI Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('users')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === 'users' ? 'border-purple-600 bg-purple-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Users in DB</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{users.length}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Admins, HR, Applicants</p>
        </div>

        <div
          onClick={() => setActiveTab('vacancies')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === 'vacancies' ? 'border-purple-600 bg-purple-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Vacancies in DB</span>
            <Briefcase className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{vacancies.length}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            <span className="text-emerald-700 font-semibold">{vacancies.filter((v) => !isVacancyClosed(v)).length} Active Public</span>
            {' • '}
            <span className="text-amber-700 font-semibold">{vacancies.filter((v) => isVacancyClosed(v)).length} Closed in DB</span>
          </p>
        </div>

        <div
          onClick={() => setActiveTab('applications')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === 'applications' ? 'border-purple-600 bg-purple-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Applications in DB</span>
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{applications.length}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Candidate Submissions</p>
        </div>

        <div
          onClick={() => setActiveTab('documents')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            activeTab === 'documents' ? 'border-purple-600 bg-purple-50/60 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Documents in DB</span>
            <FileCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{documents.length}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Uploaded Credentials & CVs</p>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
              activeTab === 'users' ? 'bg-purple-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Users Table ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vacancies')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
              activeTab === 'vacancies' ? 'bg-purple-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Vacancies Table ({vacancies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
              activeTab === 'applications' ? 'bg-purple-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Applications Table ({applications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
              activeTab === 'documents' ? 'bg-purple-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>Documents Registry ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
              activeTab === 'database' ? 'bg-purple-900 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Master Database Explorer</span>
          </button>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ---------------- Tab 1: Users Table ---------------- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="All">All Roles</option>
                <option value="system_admin">System Admin</option>
                <option value="hr_admin">HR Admin</option>
                <option value="hr_employee">HR Employee</option>
                <option value="applicant">Applicant</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateStaffModal(true)}
              className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-purple-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-950 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Staff / User</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-bold">User Name & ID</th>
                  <th className="px-4 py-3 font-bold">Email Address</th>
                  <th className="px-4 py-3 font-bold">System Role</th>
                  <th className="px-4 py-3 font-bold">Registration Date</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => {
                    const seqPadded = String(idx + 1).padStart(2, '0');
                    const code = `USR-${seqPadded}`;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-purple-100 text-purple-900 font-mono font-bold text-xs px-2 py-0.5">
                              #{seqPadded}
                            </span>
                            <span className="font-bold text-slate-900">{u.fullName}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                            <span className="text-purple-700 font-semibold">{code}</span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">{u.id}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(u.id);
                                setCopiedId(u.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="text-slate-400 hover:text-slate-700 transition p-0.5 rounded"
                              title={`Copy UUID: ${u.id}`}
                            >
                              {copiedId === u.id ? <Check className="h-3 w-3 text-emerald-600 inline" /> : <Copy className="h-3 w-3 inline" />}
                            </button>
                          </div>
                        </td>
                      <td className="px-4 py-3 font-mono text-slate-700">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                            u.role === 'system_admin'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : u.role === 'hr_admin'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : u.role === 'hr_employee'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStartEditUser(u)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-purple-700 transition"
                            title="Edit User Profile & Role"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setResettingUser(u);
                              setNewPasswordVal('');
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-700 transition"
                            title="Reset User Password"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRawRecordModal({ title: `Raw Database Record: User (${u.email})`, data: u });
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                            title="View Raw JSON"
                          >
                            <Code className="h-4 w-4" />
                          </button>
                          {currentUser.id !== u.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete User Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Tab 2: Vacancies Table ---------------- */}
      {activeTab === 'vacancies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Vacancies in Database ({vacancies.length} Total Records)</h3>
              <p className="text-xs text-slate-500">
                Vacancies with expired deadlines or closed status are removed from public candidate pages but stored permanently here in the admin database.
              </p>
            </div>
            <button
              onClick={() => setShowCreateVacancyModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-purple-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-950 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Vacancy</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-wrap items-center gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search job title, location or requirements..."
                value={vacSearch}
                onChange={(e) => setVacSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-slate-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Portal Visibility:</span>
              <select
                value={vacVisibilityFilter}
                onChange={(e) => setVacVisibilityFilter(e.target.value as any)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="All">All in Database ({vacancies.length})</option>
                <option value="active">Active Public Portal Only ({vacancies.filter((v) => !isVacancyClosed(v)).length})</option>
                <option value="closed">Deadline Closed / Stored in DB ({vacancies.filter((v) => isVacancyClosed(v)).length})</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Department:</span>
              <select
                value={vacDeptFilter}
                onChange={(e) => setVacDeptFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Technology & IT">Technology & IT</option>
                <option value="Banking & Finance">Banking & Finance</option>
                <option value="NGO & Development">NGO & Development</option>
                <option value="Marketing & Sales">Marketing & Sales</option>
                <option value="Engineering & Operations">Engineering & Operations</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vacancies
              .filter((v) => {
                if (vacVisibilityFilter === 'active' && isVacancyClosed(v)) return false;
                if (vacVisibilityFilter === 'closed' && !isVacancyClosed(v)) return false;
                if (vacDeptFilter !== 'All' && v.department !== vacDeptFilter) return false;
                if (vacSearch) {
                  const q = vacSearch.toLowerCase();
                  return (
                    v.title.toLowerCase().includes(q) ||
                    v.location.toLowerCase().includes(q) ||
                    v.description.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map((v, idx) => {
                const closed = isVacancyClosed(v);
                const seqPadded = v.seqId || String(idx + 1).padStart(2, '0');
                const code = v.jobCode || `VAC-${seqPadded}`;
                return (
                  <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-md bg-purple-900 px-2 py-0.5 text-[11px] font-mono font-bold text-white shadow-2xs">
                              #{seqPadded} ({code})
                            </span>
                            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                              {v.department}
                            </span>
                          </div>
                          <h4 className="mt-1.5 text-base font-bold text-slate-900">{v.title}</h4>
                          <p className="text-xs text-slate-500">{v.location} • {v.type}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                              v.status === 'Open'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {v.status}
                          </span>
                          {closed ? (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200">
                              Deadline Closed (Stored in DB)
                            </span>
                          ) : (
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-200">
                              Active Public Portal
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-600 line-clamp-3">{v.description}</p>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                        <div>
                          <span className="font-semibold text-emerald-800">{v.salaryRange || 'Competitive ETB'}</span>
                          <span className={`ml-2 inline-block rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            v.isNegotiable !== false
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {v.isNegotiable !== false ? '✓ Negotiable' : 'Fixed'}
                          </span>
                        </div>
                        <span>{v.applicantCount || 0} Applicants</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-purple-700 shrink-0" />
                          <span>Deadline: <strong className="text-slate-900 font-bold">{formatDeadline(v.deadline)}</strong></span>
                        </span>
                        {getDeadlineBadge(v.deadline)}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-3 text-xs">
                      <button
                        onClick={() => handleToggleVacancyStatus(v)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                          closed
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                        title={closed ? 'Reopen and extend deadline by 30 days to publish to public portal' : 'Close and archive in database'}
                      >
                        {closed ? 'Reopen / Extend (30d)' : 'Close'}
                      </button>

                      <button
                        onClick={() => handleStartEditVacancy(v)}
                        className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-800 hover:bg-purple-100 transition"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                    <button
                      onClick={() => setRawRecordModal({ title: `Raw Database Record: Vacancy (${v.title})`, data: v })}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                      title="View Raw JSON"
                    >
                      <Code className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteVacancy(v)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete Vacancy"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- Tab 3: Applications Table ---------------- */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Candidate Applications Master Records</h3>
            <p className="text-xs text-slate-500">
              System Admin full inspection and editing of candidate applications, stages, and evaluations.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-wrap items-center gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search candidate name, email, or position..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Stage:</span>
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="All">All Stages</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Department:</span>
              <select
                value={appDeptFilter}
                onChange={(e) => setAppDeptFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Technology & IT">Technology & IT</option>
                <option value="Banking & Finance">Banking & Finance</option>
                <option value="NGO & Development">NGO & Development</option>
                <option value="Marketing & Sales">Marketing & Sales</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-bold">Candidate</th>
                  <th className="px-4 py-3 font-bold">Applied Vacancy</th>
                  <th className="px-4 py-3 font-bold">Hiring Stage</th>
                  <th className="px-4 py-3 font-bold">Verification</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app, idx) => {
                    const seqPadded = app.seqId || String(idx + 1).padStart(2, '0');
                    const code = app.appCode || `APP-${seqPadded}`;
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-purple-100 text-purple-900 font-mono font-bold text-[11px] px-2 py-0.5 shadow-2xs">
                              #{seqPadded} ({code})
                            </span>
                            <span className="font-bold text-slate-900">{app.applicantName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">{app.applicantEmail} • {app.applicantPhone}</div>
                          {app.expectedSalary && (
                            <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                              <span className="font-bold text-emerald-800">Salary: {app.expectedSalary}</span>
                              <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                app.isSalaryNegotiable !== false
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {app.salaryNegotiationPreference || (app.isSalaryNegotiable !== false ? 'Negotiable' : 'Fixed')}
                              </span>
                              {app.noticePeriod && (
                                <span className="text-slate-400">• {app.noticePeriod}</span>
                              )}
                            </div>
                          )}
                        </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">{app.vacancyTitle}</div>
                        <div className="text-[11px] text-emerald-700 font-medium">{app.department || app.vacancyDepartment}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                            app.verificationStatus === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : app.verificationStatus === 'Flagged'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {app.verificationStatus} ({app.verificationScore ?? 75}%)
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEditApplication(app)}
                            className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-800 hover:bg-purple-100 transition"
                            title="Edit Application Data"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit Data</span>
                          </button>

                          <button
                            onClick={() => setSelectedAppId(app.id)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            title="Review Candidate CV"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Review</span>
                          </button>

                          <button
                            onClick={() => setRawRecordModal({ title: `Raw Database Record: Application (${app.applicantName})`, data: app })}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                            title="View Raw JSON"
                          >
                            <Code className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteApplication(app)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Application"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Tab 4: Documents Registry ---------------- */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">All Candidate Documents in Database</h3>
            <p className="text-xs text-slate-500">
              Direct access to see, verify, and edit uploaded candidate resumes, degree certificates, and identity files.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-wrap items-center gap-3 text-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search file name, candidate name or position..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Verification Status:</span>
              <select
                value={docStatusFilter}
                onChange={(e) => setDocStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Flagged">Flagged</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-bold">Document Name & Type</th>
                  <th className="px-4 py-3 font-bold">Applicant Candidate</th>
                  <th className="px-4 py-3 font-bold">Position</th>
                  <th className="px-4 py-3 font-bold">Verification Status</th>
                  <th className="px-4 py-3 font-bold">File Size</th>
                  <th className="px-4 py-3 font-bold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No documents found in registry.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{doc.file_name || doc.fileName}</div>
                        <div className="text-[11px] text-purple-700 font-semibold">{doc.document_type || doc.documentType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{doc.applicant_name}</div>
                        <div className="text-[10px] text-slate-500">{doc.applicant_email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        {doc.vacancy_title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold border ${
                            doc.status === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : doc.status === 'Flagged'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : doc.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {Math.round((doc.file_size || doc.fileSize || 0) / 1024)} KB
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEditDocument(doc)}
                            className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-800 hover:bg-purple-100 transition"
                            title="Edit Document Status"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit Status</span>
                          </button>

                          {(doc.file_data || doc.fileData) && (
                            <a
                              href={doc.file_data || doc.fileData}
                              download={doc.file_name || doc.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition"
                              title="Download File"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => setRawRecordModal({ title: `Raw Database Record: Document (${doc.file_name || doc.fileName})`, data: doc })}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                            title="View Raw JSON"
                          >
                            <Code className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Tab 5: Master Database Explorer & SQL Runner ---------------- */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Database System Architecture Banner */}
          <div className="rounded-3xl border border-purple-200 bg-linear-to-r from-purple-950 via-slate-900 to-emerald-950 p-6 md:p-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black tracking-tight">PostgreSQL Relational Database</h3>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30">
                      Cloud SQL Ready • Drizzle ORM
                    </span>
                    <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-bold text-purple-300 border border-purple-400/30">
                      Port 5432 • pg.Pool
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Primary relational database for <strong>Vacancy</strong>. Schemas defined in <code className="text-emerald-300">src/db/schema.ts</code>, queries managed in <code className="text-emerald-300">server.ts</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncHealth}
                  disabled={syncLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                  <span>{syncLoading ? 'Synchronizing...' : 'Run Database Sync & Repair'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-slate-400 font-semibold">Table: users</div>
                <div className="text-lg font-bold text-white mt-0.5">{users.length} accounts</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-slate-400 font-semibold">Table: vacancies</div>
                <div className="text-lg font-bold text-white mt-0.5">{vacancies.length} positions</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-slate-400 font-semibold">Table: applications</div>
                <div className="text-lg font-bold text-white mt-0.5">{applications.length} candidates</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-slate-400 font-semibold">Table: documents</div>
                <div className="text-lg font-bold text-white mt-0.5">{documents.length} files</div>
              </div>
            </div>
          </div>

          {/* Sub-Navigation Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDbSubView('tables')}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  dbSubView === 'tables'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Table className="h-4 w-4" />
                <span>Live Table Records</span>
              </button>

              <button
                onClick={() => setDbSubView('query_reference')}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  dbSubView === 'query_reference'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Code className="h-4 w-4" />
                <span>SQL Queries of Each Table</span>
              </button>

              <button
                onClick={() => setDbSubView('sql_console')}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  dbSubView === 'sql_console'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Terminal className="h-4 w-4" />
                <span>Interactive SQL Query Runner</span>
              </button>

              <button
                onClick={() => {
                  setDbSubView('supabase_migration');
                  loadSupabaseMigration();
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  dbSubView === 'supabase_migration'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Server className="h-4 w-4" />
                <span>⚡ Convert to Supabase</span>
              </button>
            </div>
          </div>

          {/* ---------------- Sub-View 1: Live Records Explorer ---------------- */}
          {dbSubView === 'tables' && (
            <div className="space-y-4">
              {/* Table Selector Bar */}
              <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setSelectedDbTable('users')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                selectedDbTable === 'users' ? 'bg-purple-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Table: users ({users.length} rows)</span>
            </button>

            <button
              onClick={() => setSelectedDbTable('vacancies')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                selectedDbTable === 'vacancies' ? 'bg-purple-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Table: vacancies ({vacancies.length} rows)</span>
            </button>

            <button
              onClick={() => setSelectedDbTable('applications')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                selectedDbTable === 'applications' ? 'bg-purple-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Table: applications ({applications.length} rows)</span>
            </button>

            <button
              onClick={() => setSelectedDbTable('documents')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                selectedDbTable === 'documents' ? 'bg-purple-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Table: documents ({documents.length} rows)</span>
            </button>
          </div>

          {/* Raw Records Table View */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono">
                {selectedDbTable === 'users' ? (
                  <tr>
                    <th className="px-4 py-3">id (seq 01, 02...)</th>
                    <th className="px-4 py-3">full_name</th>
                    <th className="px-4 py-3">email</th>
                    <th className="px-4 py-3">role</th>
                    <th className="px-4 py-3">created_at</th>
                    <th className="px-4 py-3 text-right">actions</th>
                  </tr>
                ) : selectedDbTable === 'vacancies' ? (
                  <tr>
                    <th className="px-4 py-3">id (seq 01, 02...)</th>
                    <th className="px-4 py-3">title</th>
                    <th className="px-4 py-3">department</th>
                    <th className="px-4 py-3">salary_budget & negotiations</th>
                    <th className="px-4 py-3">status</th>
                    <th className="px-4 py-3">deadline</th>
                    <th className="px-4 py-3">portal_visibility</th>
                    <th className="px-4 py-3 text-right">actions</th>
                  </tr>
                ) : selectedDbTable === 'applications' ? (
                  <tr>
                    <th className="px-4 py-3">id (seq 01, 02...)</th>
                    <th className="px-4 py-3">applicant_name</th>
                    <th className="px-4 py-3">vacancy_title</th>
                    <th className="px-4 py-3">expected_salary & negotiations</th>
                    <th className="px-4 py-3">status</th>
                    <th className="px-4 py-3">verification_score</th>
                    <th className="px-4 py-3 text-right">actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3">id (seq 01, 02...)</th>
                    <th className="px-4 py-3">file_name</th>
                    <th className="px-4 py-3">document_type</th>
                    <th className="px-4 py-3">status</th>
                    <th className="px-4 py-3">applicant</th>
                    <th className="px-4 py-3 text-right">actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {selectedDbTable === 'users' &&
                  users.map((row, idx) => {
                    const seqPadded = String(idx + 1).padStart(2, '0');
                    const code = `USR-${seqPadded}`;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="inline-flex items-center rounded-md bg-purple-100 text-purple-900 font-bold px-2 py-0.5 text-xs">
                              {seqPadded}
                            </span>
                            <span className="text-[10px] text-purple-700 font-semibold font-mono">({code})</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(row.id);
                                setCopiedId(row.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                              title={`Copy UUID: ${row.id}`}
                            >
                              {copiedId === row.id ? (
                                <Check className="h-3 w-3 text-emerald-600 inline" />
                              ) : (
                                <Copy className="h-3 w-3 inline" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans font-bold text-slate-900">{row.fullName}</td>
                        <td className="px-4 py-3 text-slate-700">{row.email}</td>
                        <td className="px-4 py-3 font-sans font-semibold text-purple-700">{row.role}</td>
                        <td className="px-4 py-3 text-slate-400">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditUser(row)}
                              className="rounded bg-purple-50 px-2 py-1 font-sans text-purple-700 hover:bg-purple-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setRawRecordModal({ title: `Record users [${row.id}]`, data: row })}
                              className="rounded bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
                            >
                              JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {selectedDbTable === 'vacancies' &&
                  vacancies.map((row, idx) => {
                    const closed = isVacancyClosed(row);
                    const seqPadded = row.seqId || String(idx + 1).padStart(2, '0');
                    const code = row.jobCode || `VAC-${seqPadded}`;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="inline-flex items-center rounded-md bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 text-xs">
                              {seqPadded}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold font-mono">({code})</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(row.id);
                                setCopiedId(row.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                              title={`Copy UUID: ${row.id}`}
                            >
                              {copiedId === row.id ? (
                                <Check className="h-3 w-3 text-emerald-600 inline" />
                              ) : (
                                <Copy className="h-3 w-3 inline" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans font-bold text-slate-900">{row.title}</td>
                        <td className="px-4 py-3 font-sans text-slate-700">{row.department}</td>
                        <td className="px-4 py-3 font-sans">
                          <div className="font-semibold text-emerald-900 text-[11px]">{row.salaryRange || 'Competitive ETB'}</div>
                          <span className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            row.isNegotiable !== false
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {row.isNegotiable !== false ? '✓ Negotiable' : 'Fixed Budget'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans font-bold text-slate-800">{row.status}</td>
                        <td className="px-4 py-3 text-slate-400">{formatDeadline(row.deadline)}</td>
                        <td className="px-4 py-3 font-sans">
                          {closed ? (
                            <span className="inline-block rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Deadline Closed (Stored in DB)
                            </span>
                          ) : (
                            <span className="inline-block rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Active Public Portal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditVacancy(row)}
                              className="rounded bg-purple-50 px-2 py-1 font-sans text-purple-700 hover:bg-purple-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setRawRecordModal({ title: `Record vacancies [${row.id}]`, data: row })}
                              className="rounded bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
                            >
                              JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {selectedDbTable === 'applications' &&
                  applications.map((row, idx) => {
                    const seqPadded = row.seqId || String(idx + 1).padStart(2, '0');
                    const code = row.appCode || `APP-${seqPadded}`;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-900 font-bold px-2 py-0.5 text-xs">
                              {seqPadded}
                            </span>
                            <span className="text-[10px] text-blue-700 font-semibold font-mono">({code})</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(row.id);
                                setCopiedId(row.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                              title={`Copy UUID: ${row.id}`}
                            >
                              {copiedId === row.id ? (
                                <Check className="h-3 w-3 text-emerald-600 inline" />
                              ) : (
                                <Copy className="h-3 w-3 inline" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans font-bold text-slate-900">{row.applicantName}</td>
                        <td className="px-4 py-3 font-sans text-slate-700">{row.vacancyTitle}</td>
                        <td className="px-4 py-3 font-sans">
                          <div className="font-bold text-emerald-900 text-[11px]">{row.expectedSalary || 'Negotiable (ETB)'}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                              row.isSalaryNegotiable !== false
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {row.salaryNegotiationPreference || (row.isSalaryNegotiable !== false ? 'Negotiable' : 'Fixed')}
                            </span>
                            {row.noticePeriod && (
                              <span className="text-[9px] text-slate-500 font-mono">• {row.noticePeriod}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans font-bold text-emerald-700">{row.status}</td>
                        <td className="px-4 py-3 text-slate-700">{row.verificationScore ?? 75}%</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditApplication(row)}
                              className="rounded bg-purple-50 px-2 py-1 font-sans text-purple-700 hover:bg-purple-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setRawRecordModal({ title: `Record applications [${row.id}]`, data: row })}
                              className="rounded bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
                            >
                              JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {selectedDbTable === 'documents' &&
                  documents.map((row, idx) => {
                    const seqPadded = String(idx + 1).padStart(2, '0');
                    const code = `DOC-${seqPadded}`;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="inline-flex items-center rounded-md bg-purple-100 text-purple-900 font-bold px-2 py-0.5 text-xs">
                              {seqPadded}
                            </span>
                            <span className="text-[10px] text-purple-700 font-semibold font-mono">({code})</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(row.id);
                                setCopiedId(row.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                              title={`Copy UUID: ${row.id}`}
                            >
                              {copiedId === row.id ? (
                                <Check className="h-3 w-3 text-emerald-600 inline" />
                              ) : (
                                <Copy className="h-3 w-3 inline" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans font-bold text-slate-900">{row.file_name || row.fileName}</td>
                        <td className="px-4 py-3 font-sans text-purple-700">{row.document_type || row.documentType}</td>
                        <td className="px-4 py-3 font-sans font-bold text-emerald-700">{row.status}</td>
                        <td className="px-4 py-3 font-sans text-slate-700">{row.applicant_name}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEditDocument(row)}
                              className="rounded bg-purple-50 px-2 py-1 font-sans text-purple-700 hover:bg-purple-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setRawRecordModal({ title: `Record documents [${row.id}]`, data: row })}
                              className="rounded bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
                            >
                              JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- Sub-View 2: SQL Queries by Table ---------------- */}
      {dbSubView === 'query_reference' && (
        <div className="space-y-6">
          {/* Table Selector */}
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {Object.keys(TABLE_QUERIES).map((tblKey) => (
              <button
                key={tblKey}
                onClick={() => setSelectedDbTable(tblKey as any)}
                className={`rounded-xl px-4 py-2 transition ${
                  selectedDbTable === tblKey
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Table: {tblKey} ({TABLE_QUERIES[tblKey].queries.length} queries)
              </button>
            ))}
          </div>

          {/* Table Schema Card */}
          {TABLE_QUERIES[selectedDbTable] && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Schema for table:</span>
                    <code className="rounded bg-purple-50 px-2 py-0.5 text-purple-900 font-mono text-sm">
                      {TABLE_QUERIES[selectedDbTable].name}
                    </code>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {TABLE_QUERIES[selectedDbTable].description}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono">
                  <div>Defined in: <span className="font-semibold text-slate-800">{TABLE_QUERIES[selectedDbTable].schemaFile}</span></div>
                  <div>Handlers in: <span className="font-semibold text-emerald-800">{TABLE_QUERIES[selectedDbTable].serverFile}</span></div>
                </div>
              </div>

              {/* Columns Definition */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Column Definitions</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {TABLE_QUERIES[selectedDbTable].columns.map((col, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-slate-900">{col.name}</span>
                        <span className="font-mono text-[10px] text-purple-700 font-semibold">{col.type}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">{col.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Queries in this Table */}
              <div className="pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Application Queries ({TABLE_QUERIES[selectedDbTable].queries.length})
                </h5>

                <div className="space-y-4">
                  {TABLE_QUERIES[selectedDbTable].queries.map((q) => (
                    <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-black uppercase font-mono ${
                              q.type === 'SELECT'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : q.type === 'INSERT'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : q.type === 'UPDATE'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {q.type}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{q.title}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-500">{q.codeLocation}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(q.sql);
                              setCopiedQueryId(q.id);
                              setTimeout(() => setCopiedQueryId(null), 2000);
                            }}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                            title="Copy SQL"
                          >
                            {copiedQueryId === q.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              setSqlConsoleInput(q.sql);
                              setDbSubView('sql_console');
                              handleExecuteSql(q.sql);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition shadow-xs"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>Run Live</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mb-2">{q.purpose}</p>

                      <div className="relative rounded-xl bg-slate-900 p-3 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{q.sql}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- Sub-View 3: Interactive SQL Query Runner ---------------- */}
      {dbSubView === 'sql_console' && (
        <div className="space-y-5">
          {/* Presets Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quick Query Presets (Click to Load & Run):
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => {
                  const q = 'SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 10;';
                  setSqlConsoleInput(q);
                  handleExecuteSql(q);
                }}
                className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1.5 font-mono text-[11px] text-purple-900 hover:bg-purple-100 transition"
              >
                SELECT * FROM users
              </button>

              <button
                onClick={() => {
                  const q = "SELECT id, title, department, deadline, status FROM vacancies WHERE status = 'Open' AND (deadline IS NULL OR deadline >= NOW()) ORDER BY created_at DESC;";
                  setSqlConsoleInput(q);
                  handleExecuteSql(q);
                }}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 font-mono text-[11px] text-emerald-900 hover:bg-emerald-100 transition"
              >
                Active Public Vacancies (Deadline &gt;= NOW)
              </button>

              <button
                onClick={() => {
                  const q = "SELECT id, title, department, deadline, status FROM vacancies WHERE status = 'Closed' OR (deadline IS NOT NULL AND deadline < NOW()) ORDER BY deadline DESC;";
                  setSqlConsoleInput(q);
                  handleExecuteSql(q);
                }}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-mono text-[11px] text-amber-900 hover:bg-amber-100 transition"
              >
                Closed / Expired Vacancies (Stored in DB)
              </button>

              <button
                onClick={() => {
                  const q = "SELECT a.applicant_name, a.applicant_email, a.status, a.verification_score, v.title FROM applications a JOIN vacancies v ON a.vacancy_id = v.id ORDER BY a.created_at DESC LIMIT 10;";
                  setSqlConsoleInput(q);
                  handleExecuteSql(q);
                }}
                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 font-mono text-[11px] text-blue-900 hover:bg-blue-100 transition"
              >
                Applications JOIN Vacancies
              </button>

              <button
                onClick={() => {
                  const q = "SELECT document_type, status, COUNT(*) as count FROM documents GROUP BY document_type, status;";
                  setSqlConsoleInput(q);
                  handleExecuteSql(q);
                }}
                className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-800 hover:bg-slate-200 transition"
              >
                Documents Summary by Status
              </button>

              <button
                onClick={() => {
                  const q = "SELECT id, status, actor_name, comment, created_at FROM application_timeline ORDER BY created_at DESC LIMIT 10;";
                  setSqlConsoleInput(q);
                  handleExecuteSql(q);
                }}
                className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-800 hover:bg-slate-200 transition"
              >
                Audit Timeline Events
              </button>
            </div>
          </div>

          {/* SQL Query Editor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-900">SQL Query Editor</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Target: PostgreSQL (pool.query)</span>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                value={sqlConsoleInput}
                onChange={(e) => setSqlConsoleInput(e.target.value)}
                placeholder="Enter valid SQL statement (e.g. SELECT * FROM vacancies;)"
                className="w-full rounded-xl border border-slate-300 bg-slate-950 p-3.5 font-mono text-xs text-emerald-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Press <strong>Execute SQL Query</strong> to run against live database.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSqlConsoleInput('');
                    setSqlQueryResult(null);
                    setSqlError(null);
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Clear
                </button>

                <button
                  onClick={() => handleExecuteSql()}
                  disabled={sqlRunning || !sqlConsoleInput.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  <Play className={`h-3.5 w-3.5 fill-current ${sqlRunning ? 'animate-spin' : ''}`} />
                  <span>{sqlRunning ? 'Executing...' : 'Execute SQL Query'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Query Error Alert */}
          {sqlError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>SQL Execution Error</span>
              </div>
              <pre className="font-mono text-[11px] whitespace-pre-wrap">{sqlError}</pre>
            </div>
          )}

          {/* Query Results Table */}
          {sqlQueryResult && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono font-bold text-emerald-800 border border-emerald-200 text-[11px]">
                    200 OK
                  </span>
                  <span className="font-bold text-slate-800">
                    {sqlQueryResult.rowCount ?? (sqlQueryResult.rows?.length || 0)} row(s) returned
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-mono">
                    Execution time: {sqlQueryResult.executionTimeMs ?? 5}ms
                  </span>
                </div>

                <button
                  onClick={() => setRawRecordModal({ title: 'Query Results JSON', data: sqlQueryResult.rows })}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Code className="h-3 w-3 text-slate-400" />
                  <span>Export JSON</span>
                </button>
              </div>

              {(!sqlQueryResult.rows || sqlQueryResult.rows.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Query executed successfully with 0 rows returned.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-100 text-slate-700 text-[11px]">
                      <tr>
                        {Object.keys(sqlQueryResult.rows[0]).map((headerKey) => (
                          <th key={headerKey} className="px-4 py-2.5 font-bold">
                            {headerKey}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {sqlQueryResult.rows.map((rowItem: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition">
                          {Object.keys(sqlQueryResult.rows[0]).map((headerKey) => {
                            const val = rowItem[headerKey];
                            const displayVal = typeof val === 'object' && val !== null
                              ? JSON.stringify(val)
                              : String(val ?? 'NULL');
                            return (
                              <td key={headerKey} className="px-4 py-2 text-slate-700 max-w-xs truncate" title={displayVal}>
                                {displayVal}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------- Sub-View 4: Convert / Migrate to Supabase ---------------- */}
      {dbSubView === 'supabase_migration' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-900 via-slate-900 to-purple-950 p-6 text-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-300 mb-2">
                  <Server className="h-3.5 w-3.5" />
                  <span>Supabase PostgreSQL Migration Engine</span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">
                  Convert Your Database into Supabase
                </h3>
                <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                  Transfer all tables, sequential IDs (<code className="text-emerald-400 font-mono">VAC-01</code>, <code className="text-emerald-400 font-mono">APP-01</code>), salary negotiation fields, demo accounts, and applicant verification pipelines into your free hosted Supabase PostgreSQL project.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([supabaseMigrationSql], { type: 'text/sql' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'supabase_migration.sql';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-bold text-white transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download .sql File</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (supabaseMigrationSql) {
                      navigator.clipboard.writeText(supabaseMigrationSql);
                      setCopiedMigrationSql(true);
                      setTimeout(() => setCopiedMigrationSql(false), 2000);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-sm transition"
                >
                  {copiedMigrationSql ? (
                    <>
                      <Check className="h-4 w-4 text-slate-950" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-950" />
                      <span>Copy Full SQL for Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="font-bold text-white">5 Core Tables</div>
                <div className="text-[11px] text-slate-400">users, vacancies, apps, docs, timeline</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="font-bold text-emerald-400">Sequential Triggers</div>
                <div className="text-[11px] text-slate-400">Auto VAC-01, APP-01 sequences</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="font-bold text-purple-300">Salary & Negotiation</div>
                <div className="text-[11px] text-slate-400">Ranges, currency & notice periods</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="font-bold text-amber-300">Instant Demo Accounts</div>
                <div className="text-[11px] text-slate-400">Admin, HR Director, Yobsan Bekele</div>
              </div>
            </div>
          </div>

          {/* 3 Step Visual Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-900 font-bold text-xs">1</span>
                <span>Create Supabase Project</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Log into <strong>supabase.com</strong>, click <strong>"New project"</strong>, choose a name (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">ethiojobs-db</code>), and set a secure database password.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">2</span>
                <span>Paste & Run SQL</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Open <strong>SQL Editor</strong> on Supabase left sidebar, click <strong>"New query"</strong>, paste the script below, and hit <strong>"Run"</strong>. All tables and data are created in 2 seconds.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-slate-900 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-900 font-bold text-xs">3</span>
                <span>Connect & Verify</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Copy your <strong>Connection URI</strong> from Supabase <strong>Project Settings → Database</strong>, test it in the tester below, or paste into <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">DATABASE_URL</code>.
              </p>
            </div>
          </div>

          {/* Interactive Connection Tester */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-slate-900">Test Live Supabase Connection URI</h4>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Pooler Port 6543 or Direct Port 5432</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={testConnectionString}
                onChange={(e) => setTestConnectionString(e.target.value)}
                placeholder="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !testConnectionString.trim()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                <span>{testingConnection ? 'Testing...' : 'Test Supabase Connection'}</span>
              </button>
            </div>

            {/* Connection Test Results */}
            {connectionTestResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{connectionTestResult.message}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                  <div>Database: <span className="font-mono font-bold">{connectionTestResult.database}</span></div>
                  <div>User: <span className="font-mono font-bold">{connectionTestResult.user}</span></div>
                  <div>Latency: <span className="font-mono font-bold text-emerald-700">{connectionTestResult.executionTimeMs}ms</span></div>
                  <div>Tables Found: <span className="font-mono font-bold text-emerald-700">{connectionTestResult.tables?.length || 0} tables</span></div>
                </div>
                {connectionTestResult.tables && connectionTestResult.tables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {connectionTestResult.tables.map((tbl: string) => (
                      <span key={tbl} className="rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 font-mono text-[10px] text-emerald-900 font-bold">
                        {tbl}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {connectionTestError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
                <div className="flex items-center gap-2 font-bold text-rose-700 mb-1">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>Connection Failed</span>
                </div>
                <div className="font-mono text-[11px]">{connectionTestError}</div>
                <div className="text-[11px] text-rose-700 mt-2">
                  Tip: Check that you replaced <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">[YOUR-PASSWORD]</code> with your actual Supabase database password, and that the pooler port is set to <strong>6543</strong>.
                </div>
              </div>
            )}
          </div>

          {/* Migration SQL Preview Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Complete Supabase SQL Script</span>
                  <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">supabase_migration.sql</code>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contains all 5 table DDLs, automatic sequence numbering triggers, sample demo data, and performance indexes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSupabaseMigration}
                  disabled={loadingMigrationSql}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 transition"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingMigrationSql ? 'animate-spin' : ''}`} />
                  <span>Reload Script</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(supabaseMigrationSql);
                    setCopiedMigrationSql(true);
                    setTimeout(() => setCopiedMigrationSql(false), 2000);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-purple-900 px-3 py-1 text-xs font-bold text-white hover:bg-purple-800 transition"
                >
                  {copiedMigrationSql ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="max-h-[500px] overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 leading-relaxed">
                {supabaseMigrationSql || '-- Loading Supabase migration script...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* ---------------- Modals ---------------- */}

      {/* Modal: Application Review */}
      {selectedAppId && (
        <ApplicationDetailModal
          applicationId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
          onUpdate={() => loadData()}
        />
      )}

      {/* Modal: Create Vacancy */}
      {showCreateVacancyModal && (
        <CreateVacancyModal
          onClose={() => setShowCreateVacancyModal(false)}
          onSuccess={() => loadData()}
        />
      )}

      {/* Modal: Add Staff Member */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-200 bg-purple-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-200" />
                <h3 className="font-bold">Add Staff or User</h3>
              </div>
              <button onClick={() => setShowCreateStaffModal(false)} className="text-purple-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Solomon Girma"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="e.g. solomon@company.et"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">System Role *</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                >
                  <option value="hr_employee">HR Employee (Talent Reviewer)</option>
                  <option value="hr_admin">HR Administrator (Department Director)</option>
                  <option value="system_admin">System Administrator (Full Database Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffActionLoading}
                  className="rounded-xl bg-purple-900 px-5 py-2 font-bold text-white hover:bg-purple-950 disabled:opacity-50"
                >
                  {staffActionLoading ? 'Creating...' : 'Save User to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User Profile & Role */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-200 bg-purple-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-purple-200" />
                <h3 className="font-bold">Edit User in Database</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-purple-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">System Role *</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                >
                  <option value="system_admin">System Administrator (Full Database Control)</option>
                  <option value="hr_admin">HR Administrator (Director)</option>
                  <option value="hr_employee">HR Employee (Recruitment Officer)</option>
                  <option value="applicant">Candidate / Job Applicant</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="rounded-xl bg-purple-900 px-5 py-2 font-bold text-white hover:bg-purple-950 disabled:opacity-50"
                >
                  {editUserLoading ? 'Saving...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset User Password */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-amber-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <h3 className="font-bold">Reset User Password in DB</h3>
              </div>
              <button onClick={() => setResettingUser(null)} className="text-amber-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4 text-xs">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-900 border border-amber-200">
                <p className="font-bold">Target User: {resettingUser.fullName}</p>
                <p className="text-[11px] text-amber-800">{resettingUser.email} • Role: {resettingUser.role}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700">New Password *</label>
                <input
                  type="text"
                  required
                  minLength={4}
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="e.g. admin123"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || !newPasswordVal}
                  className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {resetLoading ? 'Resetting...' : 'Update Password in DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Vacancy */}
      {editingVacancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-200 bg-purple-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-purple-200" />
                <h3 className="font-bold">Edit Vacancy in Database</h3>
              </div>
              <button onClick={() => setEditingVacancy(null)} className="text-purple-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditVacancy} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Department *</label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none font-semibold"
                  >
                    <option value="Technology & IT">Technology & IT</option>
                    <option value="Banking & Finance">Banking & Finance</option>
                    <option value="NGO & Development">NGO & Development</option>
                    <option value="Marketing & Sales">Marketing & Sales</option>
                    <option value="Engineering & Operations">Engineering & Operations</option>
                    <option value="Healthcare & Medical">Healthcare & Medical</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Location in Ethiopia *</label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Employment Type *</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none font-semibold"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Experience Level *</label>
                  <input
                    type="text"
                    required
                    value={editExpLevel}
                    onChange={(e) => setEditExpLevel(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 rounded-xl border border-purple-100 bg-purple-50/50 p-3 space-y-2">
                  <label className="font-bold text-slate-800 block text-xs">Salary & Budget Negotiations (ETB)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Minimum Monthly Salary</span>
                      <input
                        type="number"
                        value={editMinSalary}
                        onChange={(e) => setEditMinSalary(e.target.value)}
                        placeholder="e.g. 40000"
                        className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Maximum Monthly Salary</span>
                      <input
                        type="number"
                        value={editMaxSalary}
                        onChange={(e) => setEditMaxSalary(e.target.value)}
                        placeholder="e.g. 65000"
                        className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Custom Salary Display Text</span>
                    <input
                      type="text"
                      value={editSalary}
                      onChange={(e) => setEditSalary(e.target.value)}
                      placeholder="e.g. 40,000 - 65,000 ETB / month"
                      className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="editIsNegotiableBox"
                      checked={editIsNegotiable}
                      onChange={(e) => setEditIsNegotiable(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-700 focus:ring-purple-600"
                    />
                    <label htmlFor="editIsNegotiableBox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Salary is negotiable based on candidate qualifications
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Application Deadline</label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Vacancy Status in Database *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none font-semibold"
                  >
                    <option value="Open">Open (Active & Receiving Applications)</option>
                    <option value="Closed">Closed (Hidden from public applications)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Job Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Candidate Requirements & Qualifications *</label>
                <textarea
                  rows={3}
                  required
                  value={editRequirements}
                  onChange={(e) => setEditRequirements(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingVacancy(null)}
                  className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editVacLoading}
                  className="rounded-lg bg-purple-900 px-5 py-2 font-bold text-white shadow-xs hover:bg-purple-950 disabled:opacity-50"
                >
                  {editVacLoading ? 'Saving...' : 'Save Vacancy Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Application Data */}
      {editingApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-200 bg-purple-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-purple-200" />
                <h3 className="font-bold">Edit Candidate Application in Database</h3>
              </div>
              <button onClick={() => setEditingApplication(null)} className="text-purple-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditApplication} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700">Applicant Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editAppName}
                    onChange={(e) => setEditAppName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Applicant Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editAppEmail}
                    onChange={(e) => setEditAppEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Applicant Telephone *</label>
                  <input
                    type="text"
                    required
                    value={editAppPhone}
                    onChange={(e) => setEditAppPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={editAppDept}
                    onChange={(e) => setEditAppDept(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 rounded-xl border border-purple-100 bg-purple-50/50 p-3 space-y-2.5">
                  <span className="font-bold text-slate-800 block text-xs">Candidate Compensation & Availability</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-semibold text-slate-700 text-[11px]">Expected Monthly Salary (ETB)</label>
                      <input
                        type="text"
                        value={editExpectedSalary}
                        onChange={(e) => setEditExpectedSalary(e.target.value)}
                        placeholder="e.g. 55,000 ETB / month"
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-purple-600 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 text-[11px]">Salary Negotiation Preference</label>
                      <select
                        value={editSalaryPref}
                        onChange={(e) => setEditSalaryPref(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-purple-600 focus:outline-none text-xs"
                      >
                        <option value="Negotiable">Negotiable</option>
                        <option value="Open to discussion">Open to discussion</option>
                        <option value="Non-negotiable">Non-negotiable</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 text-[11px]">Notice Period / Earliest Start</label>
                      <select
                        value={editNoticePeriod}
                        onChange={(e) => setEditNoticePeriod(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-purple-600 focus:outline-none text-xs"
                      >
                        <option value="Immediate">Immediate</option>
                        <option value="1 Week">1 Week</option>
                        <option value="2 Weeks">2 Weeks</option>
                        <option value="1 Month">1 Month</option>
                        <option value="Negotiable">Negotiable</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 text-[11px]">Current Employment Status</label>
                      <select
                        value={editEmploymentStatus}
                        onChange={(e) => setEditEmploymentStatus(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-purple-600 focus:outline-none text-xs"
                      >
                        <option value="Active Candidate">Active Candidate</option>
                        <option value="Employed (Looking)">Employed (Looking)</option>
                        <option value="Immediately Available">Immediately Available</option>
                        <option value="Notice Period Active">Notice Period Active</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="editIsSalaryNegotiableBox"
                      checked={editIsSalaryNegotiable}
                      onChange={(e) => setEditIsSalaryNegotiable(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-700 focus:ring-purple-600"
                    />
                    <label htmlFor="editIsSalaryNegotiableBox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Candidate is open to salary negotiations
                    </label>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Hiring Stage Status *</label>
                  <select
                    value={editAppStatus}
                    onChange={(e) => setEditAppStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verification Pending">Verification Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interview">Interview</option>
                    <option value="Accepted">Accepted / Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Verification Status *</label>
                  <select
                    value={editAppVerifStatus}
                    onChange={(e) => setEditAppVerifStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Verified">Verified</option>
                    <option value="Flagged">Flagged</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Verification Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editAppVerifScore}
                    onChange={(e) => setEditAppVerifScore(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Recruiter Rating (1-5)</label>
                  <select
                    value={editAppRating}
                    onChange={(e) => setEditAppRating(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                  >
                    <option value={0}>No Rating</option>
                    <option value={1}>1 Star</option>
                    <option value={2}>2 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={5}>5 Stars</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Internal Evaluation Notes</label>
                <textarea
                  rows={2}
                  value={editAppNotes}
                  onChange={(e) => setEditAppNotes(e.target.value)}
                  placeholder="Internal administrator/recruiter notes..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Candidate Statement / Cover Letter</label>
                <textarea
                  rows={3}
                  value={editAppCoverLetter}
                  onChange={(e) => setEditAppCoverLetter(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingApplication(null)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editAppLoading}
                  className="rounded-xl bg-purple-900 px-5 py-2 font-bold text-white hover:bg-purple-950 disabled:opacity-50"
                >
                  {editAppLoading ? 'Saving...' : 'Save Application Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Document in Database */}
      {editingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-200 bg-purple-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-purple-200" />
                <h3 className="font-bold">Edit Document Record in DB</h3>
              </div>
              <button onClick={() => setEditingDocument(null)} className="text-purple-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditDocument} className="p-6 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 text-slate-700 border border-slate-200">
                <div className="font-bold text-slate-900">{editingDocument.file_name || editingDocument.fileName}</div>
                <div className="text-[11px] text-slate-500 font-mono">ID: {editingDocument.id}</div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Document Type *</label>
                <select
                  value={editDocType}
                  onChange={(e) => setEditDocType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                >
                  <option value="Resume">Resume / CV</option>
                  <option value="Degree Certificate">Degree Certificate</option>
                  <option value="Experience Letter">Experience Letter</option>
                  <option value="ID Proof">ID Proof / Passport</option>
                  <option value="Other">Other Certificate</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Verification Status in DB *</label>
                <select
                  value={editDocStatus}
                  onChange={(e) => setEditDocStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 font-semibold text-slate-900 focus:border-purple-600 focus:outline-none"
                >
                  <option value="Verified">Verified (Accredited)</option>
                  <option value="Pending">Pending (Awaiting Audit)</option>
                  <option value="Flagged">Flagged (Discrepancy Detected)</option>
                  <option value="Rejected">Rejected (Invalid Document)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Verification Audit Comment</label>
                <textarea
                  rows={2}
                  value={editDocComment}
                  onChange={(e) => setEditDocComment(e.target.value)}
                  placeholder="e.g. Verified official university stamp & transcripts..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDocument(null)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editDocLoading}
                  className="rounded-xl bg-purple-900 px-5 py-2 font-bold text-white hover:bg-purple-950 disabled:opacity-50"
                >
                  {editDocLoading ? 'Saving...' : 'Save Document Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Raw Database Record JSON */}
      {rawRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-slate-900 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-sm">{rawRecordModal.title}</h3>
              </div>
              <button onClick={() => setRawRecordModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
              <pre className="whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-emerald-400 border border-slate-800">
                {JSON.stringify(rawRecordModal.data, null, 2)}
              </pre>
            </div>

            <div className="border-t border-slate-800 px-6 py-3 flex justify-between items-center bg-slate-950">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(rawRecordModal.data, null, 2));
                  setStatusMessage({ text: 'Raw record JSON copied to clipboard!', type: 'success' });
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Copy JSON</span>
              </button>
              <button
                onClick={() => setRawRecordModal(null)}
                className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: In-App Confirmation Dialog (100% reliable on all browsers & iframes) */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-6 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
                <p className="text-xs text-rose-700">Permanent Action Warning</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmModal.message}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
                >
                  {confirmModal.confirmLabel || 'Yes, Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
