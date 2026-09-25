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
  Check,
  AlertTriangle,
  Calendar,
  XCircle,
  CheckCircle2,
  Key,
  Lock,
  X,
  Sparkles,
  Building2,
  Wrench,
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
  const [activeTab, setActiveTab] = useState<'users' | 'vacancies' | 'applications' | 'system'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Application filters
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appDeptFilter, setAppDeptFilter] = useState('All');

  // Vacancy filters
  const [vacSearch, setVacSearch] = useState('');
  const [vacDeptFilter, setVacDeptFilter] = useState('All');

  // Modals & actions
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showCreateVacancyModal, setShowCreateVacancyModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<{ id: string; role: string } | null>(null);

  // User Password Reset modal state
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

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

  // New staff form state
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'system_admin' | 'hr_admin' | 'hr_employee'>('hr_employee');
  const [staffActionLoading, setStaffActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, vacsData, appsData] = await Promise.all([
        api.getUsers({ role: roleFilter !== 'All' ? roleFilter : undefined, search: searchQuery || undefined }),
        api.getVacancies(),
        api.getApplications(),
      ]);
      setUsers(usersData);
      setVacancies(vacsData);
      setApplications(appsData);
    } catch (err: any) {
      console.error('Failed to load system admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, roleFilter]);

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

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      setEditingUserRole(null);
      setStatusMessage({ text: 'User role updated successfully', type: 'success' });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update user role', type: 'error' });
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.fullName}" (${user.email})?`)) {
      return;
    }
    try {
      await api.deleteUser(user.id);
      setStatusMessage({ text: `User "${user.fullName}" removed from system.`, type: 'success' });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to delete user', type: 'error' });
    }
  };

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
        title: editTitle,
        department: editDept,
        location: editLocation,
        type: editType,
        experienceLevel: editExpLevel,
        salaryRange: editSalary,
        deadline: editDeadline ? new Date(editDeadline).toISOString() : undefined,
        status: editStatus,
        description: editDescription,
        requirements: editRequirements,
      });
      setStatusMessage({ text: `Vacancy "${editTitle}" updated successfully!`, type: 'success' });
      setEditingVacancy(null);
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to update vacancy', type: 'error' });
    } finally {
      setEditVacLoading(false);
    }
  };

  const handleDeleteVacancy = async (vac: Vacancy) => {
    if (!window.confirm(`Are you sure you want to permanently delete vacancy "${vac.title}" and its applications?`)) {
      return;
    }
    try {
      await api.deleteVacancy(vac.id);
      setStatusMessage({ text: `Vacancy "${vac.title}" deleted.`, type: 'success' });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to delete vacancy', type: 'error' });
    }
  };

  const handleDeleteApplication = async (app: Application) => {
    if (!window.confirm(`Are you sure you want to delete application from ${app.applicantName}?`)) {
      return;
    }
    try {
      await api.deleteApplication(app.id);
      setStatusMessage({ text: 'Application deleted successfully.', type: 'success' });
      loadData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to delete application', type: 'error' });
    }
  };

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

  return (
    <div className="space-y-6">
      {/* System Admin Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">System Administration Console</h2>
              <span className="rounded-full bg-purple-500/30 px-2.5 py-0.5 text-xs font-bold text-purple-200 border border-purple-400/30">
                Full Control
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Welcome, {currentUser.fullName} • Manage System Users, HR Roles, Vacancies, and Applications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onPreviewPublicPortal}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <Eye className="h-4 w-4" />
            <span>Public Portal View</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600/80 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold ${
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

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'users'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>User Management ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vacancies')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'vacancies'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Vacancies Control ({vacancies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'applications'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Applications Hub ({applications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'system'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>System Analytics & Health</span>
          </button>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab 1: User Management */}
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
              className="flex items-center gap-1.5 rounded-xl bg-purple-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-900 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register New Staff</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-bold">User Name</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Assigned Role</th>
                  <th className="px-4 py-3 font-bold">Applications</th>
                  <th className="px-4 py-3 font-bold">Registered Date</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {u.fullName}
                      {u.id === currentUser.id && (
                        <span className="ml-2 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="px-4 py-3.5">
                      {editingUserRole?.id === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className="rounded-lg border border-purple-400 bg-white p-1 text-xs"
                          >
                            <option value="system_admin">system_admin</option>
                            <option value="hr_admin">hr_admin</option>
                            <option value="hr_employee">hr_employee</option>
                            <option value="applicant">applicant</option>
                          </select>
                          <button
                            onClick={() => setEditingUserRole(null)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${
                            u.role === 'system_admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'hr_admin'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : u.role === 'hr_employee'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {u.role === 'applicant' ? `${u.applicationCount || 0} applied` : 'Staff'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingUserRole({ id: u.id, role: u.role })}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-purple-700"
                          title="Change Role"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Vacancies Control */}
      {activeTab === 'vacancies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Active Vacancies Control ({vacancies.length} Postings)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full administrative control: create, edit, change deadlines, open/close status, or delete positions.
              </p>
            </div>
            <button
              onClick={() => setShowCreateVacancyModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-purple-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-900 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Post New Vacancy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vacancies.map((v) => (
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

                  {/* Deadline on Vacancy Card */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-purple-700 shrink-0" />
                      <span>Deadline: <strong className="text-slate-900 font-bold">{formatDeadline(v.deadline)}</strong></span>
                    </span>
                    {getDeadlineBadge(v.deadline)}
                  </div>
                </div>

                {/* System Admin Full Control Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-3 text-xs">
                  <button
                    onClick={() => handleToggleVacancyStatus(v)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                      v.status === 'Open'
                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                    title={v.status === 'Open' ? 'Close Position to applicants' : 'Reopen Position'}
                  >
                    {v.status === 'Open' ? (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Close Vacancy</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Reopen Vacancy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleStartEditVacancy(v)}
                    className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-800 hover:bg-purple-100 transition"
                    title="Edit vacancy details"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteVacancy(v)}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                    title="Permanently remove vacancy"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Applications Hub */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Applications Central Hub ({filteredApplications.length} of {applications.length} Submissions)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full review, evaluation scoring, status overrides, and document audit.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex flex-wrap items-center gap-3">
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

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-600">Stage:</span>
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
                >
                  <option value="All">All Stages</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Accepted">Accepted / Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-600">Department:</span>
                <select
                  value={appDeptFilter}
                  onChange={(e) => setAppDeptFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-purple-600 focus:outline-none"
                >
                  <option value="All">All Departments</option>
                  <option value="Technology & IT">Technology & IT</option>
                  <option value="Banking & Finance">Banking & Finance</option>
                  <option value="NGO & Development">NGO & Development</option>
                  <option value="Marketing & Sales">Marketing & Sales</option>
                  <option value="Engineering & Operations">Engineering & Operations</option>
                  <option value="Healthcare & Medical">Healthcare & Medical</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Accounting & Audit">Accounting & Audit</option>
                  <option value="Legal & Compliance">Legal & Compliance</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-bold">Candidate</th>
                  <th className="px-4 py-3 font-bold">Applied Vacancy</th>
                  <th className="px-4 py-3 font-bold">Current Stage</th>
                  <th className="px-4 py-3 font-bold">Resume Document</th>
                  <th className="px-4 py-3 font-bold">Submission Date</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      No applications match the selected criteria.
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
                        <div className="text-[11px] text-slate-500 font-medium text-emerald-700">
                          {app.department || app.vacancyDepartment}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {app.documents && app.documents.length > 0 ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ {app.documents[0].fileName}
                          </span>
                        ) : (
                          <span className="text-slate-400">No file</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAppId(app.id)}
                            className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-800 hover:bg-purple-100 transition"
                            title="Full application review and status control"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Review</span>
                          </button>
                          <button
                            onClick={() => handleDeleteApplication(app)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Purge Application from database"
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

      {/* Tab 4: System Analytics & Database Health */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-5">
              <span className="text-xs font-bold text-purple-700">Total System Users</span>
              <div className="mt-2 text-3xl font-black text-purple-950">{users.length}</div>
              <p className="mt-1 text-[11px] text-purple-800">
                Admins, HR Staff & Registered Applicants
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
              <span className="text-xs font-bold text-blue-700">Total Vacancies</span>
              <div className="mt-2 text-3xl font-black text-blue-950">{vacancies.length}</div>
              <p className="mt-1 text-[11px] text-blue-800">
                Published Job Postings in Ethiopia
              </p>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">
              <span className="text-xs font-bold text-teal-700">Applications Recorded</span>
              <div className="mt-2 text-3xl font-black text-teal-950">{applications.length}</div>
              <p className="mt-1 text-[11px] text-teal-800">
                Submitted with Resumes & Tracking
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
              <span className="text-xs font-bold text-emerald-700">Database Engine</span>
              <div className="mt-2 text-lg font-black text-emerald-950">Cloud SQL PostgreSQL</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active & Healthy</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Role Distribution & Permissions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="font-bold text-purple-900 mb-1">1. System Admin (system_admin)</div>
                <p className="text-slate-600">
                  Full control over database records, user creation, role promotions, and system monitoring.
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="font-bold text-blue-900 mb-1">2. HR Admin (hr_admin)</div>
                <p className="text-slate-600">
                  Complete recruitment control: post and edit vacancies, review all applications, hire/reject candidates, and manage HR employees.
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="font-bold text-teal-900 mb-1">3. HR Employee (hr_employee)</div>
                <p className="text-slate-600">
                  Operational recruiter role: inspect candidate profiles, read uploaded CVs, leave interview notes, rate candidates, and update pipeline status.
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="font-bold text-emerald-900 mb-1">4. Applicant (applicant)</div>
                <p className="text-slate-600">
                  Candidate portal: browse open jobs in Ethiopia, register and sign in to submit applications with resume upload, and monitor live application status.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register New Staff */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-purple-900 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Register New Staff User</h3>
                <button onClick={() => setShowCreateStaffModal(false)} className="text-purple-200 hover:text-white">✕</button>
              </div>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Solomon Hailu"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="name@ethiojobs.et"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Password *</label>
                <input
                  type="password"
                  required
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="Set initial password"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Assign System Role *</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-semibold text-slate-800 focus:border-purple-600 focus:outline-none"
                >
                  <option value="hr_employee">HR Employee (Recruitment Officer)</option>
                  <option value="hr_admin">HR Admin (Recruitment Director)</option>
                  <option value="system_admin">System Admin (Full System Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
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
                  className="rounded-xl bg-purple-800 px-5 py-2 font-bold text-white hover:bg-purple-900 disabled:opacity-50"
                >
                  {staffActionLoading ? 'Creating...' : 'Create Staff User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Vacancy */}
      {showCreateVacancyModal && (
        <CreateVacancyModal
          onClose={() => setShowCreateVacancyModal(false)}
          onSuccess={() => {
            setShowCreateVacancyModal(false);
            loadData();
          }}
        />
      )}

      {/* Modal: Application Review */}
      {selectedAppId && (
        <ApplicationDetailModal
          applicationId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
          onUpdate={() => loadData()}
        />
      )}
    </div>
  );
};
