import React, { useState, useEffect } from 'react';
import { User, Vacancy, Application } from '../types';
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
  Mail
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
  const [docSearch, setDocSearch] = useState('');
  const [docStatusFilter, setDocStatusFilter] = useState('All');

  // Master Database Explorer table selector
  const [selectedDbTable, setSelectedDbTable] = useState<'users' | 'vacancies' | 'applications' | 'documents'>('users');
  const [rawRecordModal, setRawRecordModal] = useState<{ title: string; data: any } | null>(null);

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

  // Edit Vacancy modal state
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editType, setEditType] = useState('Full-time');
  const [editExpLevel, setEditExpLevel] = useState('Mid-Level');
  const [editSalary, setEditSalary] = useState('');
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
        api.getVacancies(),
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
    const nextStatus = vac.status === 'Open' ? 'Closed' : 'Open';
    try {
      await api.updateVacancy(vac.id, { status: nextStatus });
      setStatusMessage({ text: `Vacancy "${vac.title}" is now marked as ${nextStatus}.`, type: 'success' });
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
    setEditDeadline(vac.deadline ? new Date(vac.deadline).toISOString().split('T')[0] : '');
    setEditStatus(vac.status === 'Closed' ? 'Closed' : 'Open');
    setEditDescription(vac.description);
    setEditRequirements(vac.requirements);
  };

  const handleSaveEditVacancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVacancy) return;
    setEditVacLoading(true);
    try {
      await api.updateVacancy(editingVacancy.id, {
        title: editTitle.trim(),
        department: editDept,
        location: editLocation.trim(),
        type: editType,
        experienceLevel: editExpLevel,
        salaryRange: editSalary ? editSalary.trim() : undefined,
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
          <p className="text-[10px] text-slate-500 mt-0.5">Published Job Postings</p>
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
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.id}</div>
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
                  ))
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
              <h3 className="text-sm font-bold text-slate-900">Live Vacancies in Database</h3>
              <p className="text-xs text-slate-500">
                Create, inspect, modify salaries, requirements, deadlines, or open/close positions.
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
              .map((v) => (
                <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                          {v.department}
                        </span>
                        <h4 className="mt-1.5 text-base font-bold text-slate-900">{v.title}</h4>
                        <p className="text-xs text-slate-500">{v.location} • {v.type}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          v.status === 'Open'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-600 line-clamp-3">{v.description}</p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className="font-semibold text-emerald-800">{v.salaryRange || 'Competitive ETB'}</span>
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
                        v.status === 'Open'
                          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {v.status === 'Open' ? 'Close' : 'Reopen'}
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
              ))}
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
                  filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{app.applicantName}</div>
                        <div className="text-[11px] text-slate-500">{app.applicantEmail} • {app.applicantPhone}</div>
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
                  ))
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

      {/* ---------------- Tab 5: Master Database Explorer ---------------- */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Direct Master Database Explorer</h3>
              <p className="text-xs text-slate-500">
                Inspect raw database records across all tables and execute database synchronization.
              </p>
            </div>

            <button
              onClick={handleSyncHealth}
              disabled={syncLoading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
              <span>{syncLoading ? 'Synchronizing...' : 'Run Database Sync & Repair'}</span>
            </button>
          </div>

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
                    <th className="px-4 py-3">id</th>
                    <th className="px-4 py-3">full_name</th>
                    <th className="px-4 py-3">email</th>
                    <th className="px-4 py-3">role</th>
                    <th className="px-4 py-3">created_at</th>
                    <th className="px-4 py-3 text-right">actions</th>
                  </tr>
                ) : selectedDbTable === 'vacancies' ? (
                  <tr>
                    <th className="px-4 py-3">id</th>
                    <th className="px-4 py-3">title</th>
                    <th className="px-4 py-3">department</th>
                    <th className="px-4 py-3">status</th>
                    <th className="px-4 py-3">deadline</th>
                    <th className="px-4 py-3 text-right">actions</th>
                  </tr>
                ) : selectedDbTable === 'applications' ? (
                  <tr>
                    <th className="px-4 py-3">id</th>
                    <th className="px-4 py-3">applicant_name</th>
                    <th className="px-4 py-3">vacancy_title</th>
                    <th className="px-4 py-3">status</th>
                    <th className="px-4 py-3">verification_score</th>
                    <th className="px-4 py-3 text-right">actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-3">id</th>
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
                  users.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-slate-400 font-bold">{row.id}</td>
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
                  ))}

                {selectedDbTable === 'vacancies' &&
                  vacancies.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-slate-400 font-bold">{row.id}</td>
                      <td className="px-4 py-3 font-sans font-bold text-slate-900">{row.title}</td>
                      <td className="px-4 py-3 font-sans text-slate-700">{row.department}</td>
                      <td className="px-4 py-3 font-sans font-bold text-emerald-700">{row.status}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDeadline(row.deadline)}</td>
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
                  ))}

                {selectedDbTable === 'applications' &&
                  applications.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-slate-400 font-bold">{row.id}</td>
                      <td className="px-4 py-3 font-sans font-bold text-slate-900">{row.applicantName}</td>
                      <td className="px-4 py-3 font-sans text-slate-700">{row.vacancyTitle}</td>
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
                  ))}

                {selectedDbTable === 'documents' &&
                  documents.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-slate-400 font-bold">{row.id}</td>
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
                  ))}
              </tbody>
            </table>
          </div>
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

                <div>
                  <label className="font-semibold text-slate-700">Monthly Salary Range</label>
                  <input
                    type="text"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    placeholder="e.g. 40,000 - 65,000 ETB"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
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
