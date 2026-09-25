import React, { useState, useEffect } from 'react';
import { Vacancy, Application, User } from '../types';
import { api } from '../api';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Search,
  CheckCircle,
  FileText,
  Building,
  Send,
  Trash2,
  Phone,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { ApplyModal } from './ApplyModal';
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
          Closed / Expired
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
          Closing in {diffDays} {diffDays === 1 ? 'day' : 'days'}
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

interface CandidatePortalProps {
  currentUser: User | null;
  onOpenAuth: (pendingVacancy?: Vacancy, initialMode?: 'login' | 'register') => void;
  pendingVacancyToApply?: Vacancy | null;
  onClearPendingVacancy?: () => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  currentUser,
  onOpenAuth,
  pendingVacancyToApply,
  onClearPendingVacancy,
}) => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [applyingVacancy, setApplyingVacancy] = useState<Vacancy | null>(null);
  const [viewingAppId, setViewingAppId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'openings' | 'my-applications'>('openings');
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');

  // Trigger apply modal if pending vacancy was remembered across register/sign-in
  useEffect(() => {
    if (pendingVacancyToApply && currentUser) {
      setApplyingVacancy(pendingVacancyToApply);
      if (onClearPendingVacancy) {
        onClearPendingVacancy();
      }
    }
  }, [pendingVacancyToApply, currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vacs, apps] = await Promise.all([
        api.getVacancies({
          search: search || undefined,
          department: selectedDept !== 'All' ? selectedDept : undefined,
          status: 'Open',
        }),
        currentUser?.role === 'applicant' ? api.getApplications() : Promise.resolve([]),
      ]);

      let filtered = vacs;
      if (selectedCity !== 'All') {
        filtered = vacs.filter((v) =>
          v.location.toLowerCase().includes(selectedCity.toLowerCase())
        );
      }

      setVacancies(filtered);
      setMyApplications(apps);
      if (filtered.length > 0 && !selectedVacancy) {
        setSelectedVacancy(filtered[0]);
      }
    } catch (err: any) {
      console.error('Error fetching portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, selectedCity, currentUser]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const departments = ['All', 'Technology & IT', 'Banking & Finance', 'NGO & Development', 'Marketing & Sales'];
  const cities = ['All', 'Addis Ababa', 'Hawassa', 'Dire Dawa', 'Bahir Dar'];

  const getApplicationForVacancy = (vacId: string) => {
    return myApplications.find((a) => a.vacancyId === vacId);
  };

  const handleWithdrawApplication = async (appId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await api.deleteApplication(appId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw application');
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Job Openings & Career Opportunities
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Explore active professional vacancies, review qualifications & deadlines, and apply online.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800">
            {vacancies.length} Active Positions
          </span>
        </div>
      </div>

      {/* Tabs Switcher for Applicants */}
      {currentUser && currentUser.role === 'applicant' && (
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('openings')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'openings'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Browse Job Openings ({vacancies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my-applications')}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition ${
              activeTab === 'my-applications'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>My Applications ({myApplications.length})</span>
          </button>
        </div>
      )}

      {/* View 1: Job Openings Browser */}
      {activeTab === 'openings' ? (
        <div className="space-y-6">
          {/* Search & Location Filter Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Job title, skills (e.g. React, Accounting, Project Lead)..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* City Filter */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:outline-none"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c === 'All' ? 'All Ethiopian Locations' : c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-700 shrink-0" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d === 'All' ? 'All Sectors' : d}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
              >
                Find Jobs
              </button>
            </form>
          </div>

          {/* Two-Column Job Directory: Left list, Right detail */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Vacancy Card List */}
            <div className="space-y-3 lg:col-span-5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Available Positions ({vacancies.length})
                </span>
                <span className="text-xs text-slate-400">Click a job to view details</span>
              </div>

              {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping"></span>
                    <span>Loading Ethiopian vacancies from database...</span>
                  </div>
                </div>
              ) : vacancies.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                  No vacancies found matching your search. Try changing city or sector filters.
                </div>
              ) : (
                vacancies.map((v) => {
                  const applied = getApplicationForVacancy(v.id);
                  const isSelected = selectedVacancy?.id === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVacancy(v)}
                      className={`cursor-pointer rounded-xl border p-4 transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {v.department}
                          </span>
                          <h3 className="mt-1 text-sm font-bold text-slate-900">{v.title}</h3>
                        </div>
                        {applied && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1 shrink-0">
                            <CheckCircle className="h-3 w-3" /> Applied
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-y-1 gap-x-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          {v.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {v.type}
                        </span>
                        {v.salaryRange && (
                          <span className="flex items-center gap-1 font-bold text-emerald-700">
                            <DollarSign className="h-3.5 w-3.5" />
                            {v.salaryRange}
                          </span>
                        )}
                      </div>

                      {/* Job Deadline on Card */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-600 text-[11px] font-medium">
                          <Calendar className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          <span>Deadline: <strong className="text-slate-900 font-bold">{formatDeadline(v.deadline)}</strong></span>
                        </span>
                        {getDeadlineBadge(v.deadline)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Vacancy Detail Pane */}
            <div className="lg:col-span-7">
              {selectedVacancy ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          {selectedVacancy.department}
                        </span>
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          {selectedVacancy.location}
                        </span>
                      </div>
                      <h2 className="mt-1.5 text-xl font-bold text-slate-900">
                        {selectedVacancy.title}
                      </h2>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-600">
                        <span>{selectedVacancy.type}</span>
                        <span>•</span>
                        <span>Level: {selectedVacancy.experienceLevel}</span>
                        {selectedVacancy.salaryRange && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-emerald-700">
                              {selectedVacancy.salaryRange}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Deadline Highlight Bar */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-900 font-medium">
                          <Calendar className="h-4 w-4 text-emerald-700 shrink-0" />
                          <span>Application Deadline: <strong className="font-bold text-emerald-950">{formatDeadline(selectedVacancy.deadline)}</strong></span>
                        </div>
                        {getDeadlineBadge(selectedVacancy.deadline)}
                      </div>
                    </div>

                    <div>
                      {currentUser ? (
                        getApplicationForVacancy(selectedVacancy.id) ? (
                          <button
                            onClick={() =>
                              setViewingAppId(getApplicationForVacancy(selectedVacancy.id)!.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Track My Application
                          </button>
                        ) : (
                          <button
                            onClick={() => setApplyingVacancy(selectedVacancy)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Apply for this Vacancy
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => onOpenAuth(selectedVacancy, 'register')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition"
                        >
                          <span>Apply Now</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      About the Job Role
                    </h4>
                    <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                      {selectedVacancy.description}
                    </p>
                  </div>

                  {/* Requirements */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Qualifications & Candidate Requirements
                    </h4>
                    <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 border border-slate-200">
                      {selectedVacancy.requirements}
                    </div>
                  </div>

                  {/* Submission note */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs">
                    <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-700" />
                      Required for Application: Resume / CV
                    </h4>
                    <p className="mt-1 text-emerald-800">
                      Please attach your updated CV (PDF or DOCX). Your contact details and resume will be securely saved in the database for the recruiter to review and contact you.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
                  Select any job posting on the left to see full requirements and apply.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Candidate's My Applications View */
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">My Submitted Applications</h3>
            <p className="text-xs text-slate-500 mb-4">
              Track the live progress and review status of your applications directly from PostgreSQL.
            </p>

            {myApplications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                You have not submitted any applications yet. Browse open jobs to apply!
              </div>
            ) : (
              <div className="space-y-3">
                {myApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{app.vacancyTitle}</h4>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                          {app.department || app.vacancyDepartment}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Contact: {app.applicantPhone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Status</div>
                        <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                          {app.status}
                        </span>
                      </div>

                      <button
                        onClick={() => setViewingAppId(app.id)}
                        className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => handleWithdrawApplication(app.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Withdraw Application"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyingVacancy && currentUser && (
        <ApplyModal
          vacancy={applyingVacancy}
          applicantUser={currentUser}
          onClose={() => setApplyingVacancy(null)}
          onSuccess={() => {
            loadData();
            setActiveTab('my-applications');
          }}
        />
      )}

      {/* View Application Detail */}
      {viewingAppId && (
        <ApplicationDetailModal
          applicationId={viewingAppId}
          isRecruiter={false}
          onClose={() => setViewingAppId(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};
