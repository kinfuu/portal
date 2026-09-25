import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Application, User, Vacancy } from '../types';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FileText,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  Download,
  Star,
  PlusCircle,
  UserPlus,
  Trash2,
  LogOut,
  ShieldCheck,
  Building
} from 'lucide-react';
import { ApplicationDetailModal } from './ApplicationDetailModal';
import { CreateVacancyModal } from './CreateVacancyModal';

interface RecruiterDashboardProps {
  currentUser: User;
  onLogout?: () => void;
  onPreviewPublicPortal?: () => void;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
  currentUser,
  onLogout,
  onPreviewPublicPortal,
}) => {
  const isHrAdmin = currentUser.role === 'hr_admin' || currentUser.role === 'system_admin';

  const [activeTab, setActiveTab] = useState<'pipeline' | 'vacancies' | 'team'>('pipeline');
  const [metrics, setMetrics] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showCreateVacancy, setShowCreateVacancy] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);

  // New team member state
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [metricsData, appsData, vacsData] = await Promise.all([
        api.getRecruiterMetrics(),
        api.getApplications({
          search: search || undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          department: deptFilter !== 'All' ? deptFilter : undefined,
        }),
        api.getVacancies(),
      ]);
      setMetrics(metricsData);
      setApplications(appsData);
      setVacancies(vacsData);

      if (isHrAdmin) {
        const usersData = await api.getUsers({ role: 'hr_employee' });
        setTeamMembers(usersData);
      }
    } catch (err: any) {
      console.error('Failed to load recruiter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [statusFilter, deptFilter, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDashboard();
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberLoading(true);
    setActionNotice(null);
    try {
      await api.createUser({
        email: newMemberEmail,
        fullName: newMemberName,
        password: newMemberPassword,
        role: 'hr_employee',
      });
      setActionNotice({ text: `HR Officer "${newMemberName}" added to team!`, type: 'success' });
      setShowAddTeamModal(false);
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberPassword('');
      loadDashboard();
    } catch (err: any) {
      setActionNotice({ text: err.message || 'Failed to add HR employee', type: 'error' });
    } finally {
      setMemberLoading(false);
    }
  };

  const handleDeleteVacancy = async (vac: Vacancy) => {
    if (!window.confirm(`Are you sure you want to delete vacancy "${vac.title}"?`)) return;
    try {
      await api.deleteVacancy(vac.id);
      setActionNotice({ text: `Vacancy "${vac.title}" deleted.`, type: 'success' });
      loadDashboard();
    } catch (err: any) {
      setActionNotice({ text: err.message || 'Failed to delete vacancy', type: 'error' });
    }
  };

  const statusColors: Record<string, string> = {
    Submitted: 'bg-slate-100 text-slate-700 border-slate-200',
    'Under Review': 'bg-blue-50 text-blue-700 border-blue-200',
    Shortlisted: 'bg-purple-50 text-purple-700 border-purple-200',
    Interview: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Hired: 'bg-teal-50 text-teal-800 border-teal-200',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-400/30">
              {currentUser.role === 'hr_admin'
                ? 'HR Admin (Recruitment Director)'
                : 'HR Employee (Recruitment Officer)'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live PostgreSQL Storage
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Applicant Tracking & Hiring Management</h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Logged in as <span className="font-bold text-white">{currentUser.fullName}</span> ({currentUser.email}).
            {currentUser.role === 'hr_admin'
              ? ' Full recruitment authority: create vacancies, manage pipeline decisions, and coordinate HR team.'
              : ' Review candidate profiles, examine resumes, and update application stages & interview notes.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onPreviewPublicPortal && (
            <button
              onClick={onPreviewPublicPortal}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              <Eye className="h-4 w-4" />
              Portal View
            </button>
          )}

          <button
            onClick={loadDashboard}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>

          {isHrAdmin && (
            <button
              onClick={() => setShowCreateVacancy(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
            >
              <PlusCircle className="h-4 w-4" />
              Post Ethiopian Vacancy
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600/80 px-3 py-2 text-xs font-bold text-white hover:bg-rose-600 transition"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Global Status Banner */}
      {actionNotice && (
        <div
          className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <span>{actionNotice.text}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Navigation sub-tabs for HR Admin vs HR Employee */}
      <div className="flex border-b border-slate-200 pb-3 gap-2">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'pipeline'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Candidate Applications ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vacancies')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'vacancies'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Job Postings ({vacancies.length})</span>
        </button>

        {isHrAdmin && (
          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'team'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>HR Team Management ({teamMembers.length})</span>
          </button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Vacancies</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {metrics?.stats?.totalVacancies ?? vacancies.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Postings across Ethiopia</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Applications</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {applications.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Stored in PostgreSQL</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Under Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {applications.filter((a) => a.status === 'Under Review' || a.status === 'Submitted').length}
          </div>
          <div className="mt-1 text-[11px] text-amber-700">Awaiting recruiter action</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Shortlisted / Interview</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600">
            {applications.filter((a) => a.status === 'Shortlisted' || a.status === 'Interview').length}
          </div>
          <div className="mt-1 text-[11px] text-purple-700">Qualified candidates</div>
        </div>
      </div>

      {/* Tab 1: Applications Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {/* Filter bar */}
          <div className="border-b border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidate name, email, or Ethiopian phone..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Department:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none"
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
                  <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                </select>

                <span className="text-slate-500 font-semibold ml-1">Stage:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-2xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="All">All Application Stages</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Accepted">Accepted / Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Candidate Info</th>
                  <th className="px-5 py-3.5 font-bold">Applied Vacancy</th>
                  <th className="px-5 py-3.5 font-bold">Resume / CV</th>
                  <th className="px-5 py-3.5 font-bold">Tracking Stage</th>
                  <th className="px-5 py-3.5 font-bold">HR Rating</th>
                  <th className="px-5 py-3.5 font-bold">Applied Date</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No applications found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{app.applicantName}</div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Mail className="h-3 w-3 text-slate-400" /> {app.applicantEmail}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3 text-slate-400" /> {app.applicantPhone}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{app.vacancyTitle}</div>
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                            {app.department || app.vacancyDepartment}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {app.documents && app.documents.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium text-slate-700 truncate max-w-[120px]">
                              {app.documents[0].fileName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No document</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold ${
                            statusColors[app.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= (app.recruiterRating || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-500 text-[11px]">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedAppId(app.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Review & Score</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Vacancies List */}
      {activeTab === 'vacancies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Vacancies Postings ({vacancies.length})
            </h3>
            {isHrAdmin && (
              <button
                onClick={() => setShowCreateVacancy(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Post Vacancy</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vacancies.map((v) => (
              <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        {v.department}
                      </span>
                      <h4 className="mt-1.5 text-base font-bold text-slate-900">{v.title}</h4>
                      <p className="text-xs text-slate-500">{v.location} • {v.type}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {v.status}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 line-clamp-3">{v.description}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="font-bold text-emerald-800">{v.salaryRange || 'Competitive ETB'}</span>
                    <span>{v.applicantCount || 0} Applicants</span>
                  </div>
                </div>

                {isHrAdmin && (
                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleDeleteVacancy(v)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Vacancy</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: HR Team Management (HR Admin only) */}
      {activeTab === 'team' && isHrAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">HR Recruitment Team Members</h3>
              <p className="text-xs text-slate-500">Officers assigned to screen applications and evaluate candidates</p>
            </div>
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add HR Officer</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-bold">Officer Name</th>
                  <th className="px-5 py-3 font-bold">Email</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold">Assigned Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      No HR Employees registered yet. Click "Add HR Officer" to register staff.
                    </td>
                  </tr>
                ) : (
                  teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{member.fullName}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">{member.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800 border border-teal-200">
                          HR Recruitment Officer
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Active'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Application Review & Scoring */}
      {selectedAppId && (
        <ApplicationDetailModal
          applicationId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
          onUpdate={() => loadDashboard()}
        />
      )}

      {/* Modal: Create Vacancy */}
      {showCreateVacancy && (
        <CreateVacancyModal
          onClose={() => setShowCreateVacancy(false)}
          onSuccess={() => {
            setShowCreateVacancy(false);
            loadDashboard();
          }}
        />
      )}

      {/* Modal: Add HR Employee */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-emerald-800 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Register HR Recruitment Officer</h3>
                <button onClick={() => setShowAddTeamModal(false)} className="text-emerald-200 hover:text-white">✕</button>
              </div>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Almaz Kebede"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Work Email *</label>
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="name@ethiojobs.et"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={memberLoading}
                  className="rounded-xl bg-emerald-800 px-5 py-2 font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                  {memberLoading ? 'Registering...' : 'Register HR Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
