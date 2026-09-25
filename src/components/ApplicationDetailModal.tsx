import React, { useState } from 'react';
import { Application } from '../types';
import { api } from '../api';
import {
  FileText,
  Clock,
  CheckCircle,
  ExternalLink,
  Star,
  User,
  Briefcase,
  Phone,
  Mail,
  Download,
  Eye,
  Calendar,
  ChevronRight,
} from 'lucide-react';

interface ApplicationDetailModalProps {
  applicationId: string;
  isRecruiter?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onUpdate?: () => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  applicationId,
  isRecruiter = true,
  onClose,
  onRefresh,
  onUpdate,
}) => {
  const triggerRefresh = onRefresh || onUpdate || (() => {});
  const [app, setApp] = React.useState<Application | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(false);

  // Recruiter control state
  const [status, setStatus] = useState<string>('Submitted');
  const [recruiterRating, setRecruiterRating] = useState<number>(0);
  const [recruiterNotes, setRecruiterNotes] = useState<string>('');
  const [timelineComment, setTimelineComment] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getApplication(applicationId);
      setApp(data);
      setStatus(data.status);
      setRecruiterRating(data.recruiterRating || 0);
      setRecruiterNotes(data.recruiterNotes || '');
    } catch (err: any) {
      alert(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [applicationId]);

  const handleUpdateStatus = async () => {
    if (!app) return;
    try {
      setUpdating(true);
      await api.updateApplicationStatus(app.id, {
        status,
        recruiterRating,
        recruiterNotes,
        comment: timelineComment || `HR updated candidate stage to ${status}`,
      });
      setTimelineComment('');
      await loadData();
      triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update application');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !app) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
        <div className="rounded-2xl bg-white p-8 shadow-xl flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span className="text-sm font-semibold text-slate-700">Loading Candidate Profile...</span>
        </div>
      </div>
    );
  }

  const pipelineStages = [
    'Submitted',
    'Under Review',
    'Shortlisted',
    'Interview',
    'Accepted',
    'Rejected',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{app.applicantName}</h2>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                {app.vacancyTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
              <span>Department: <strong className="text-slate-700 font-semibold">{app.department || app.vacancyDepartment}</strong></span>
              <span>•</span>
              <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Pipeline Progress */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Hiring Stage Progression
            </h4>
            <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2">
              {pipelineStages.map((stage, idx) => {
                const isCurrent = app.status === stage;
                const stageIndex = pipelineStages.indexOf(app.status);
                const isPassed = stageIndex >= idx && app.status !== 'Rejected';
                const isRejected = app.status === 'Rejected' && stage === 'Rejected';

                return (
                  <div key={stage} className="flex items-center gap-2 shrink-0">
                    <div
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        isRejected
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isCurrent
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : isPassed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed && <CheckCircle className="h-3.5 w-3.5" />}
                      {stage}
                    </div>
                    {idx < pipelineStages.length - 1 && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Left 2 Cols: Details & Documents */}
            <div className="md:col-span-2 space-y-5">
              {/* Contact Information Box */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Applicant Contact & Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Phone:{' '}
                      <a href={`tel:${app.applicantPhone}`} className="font-bold text-emerald-800 hover:underline">
                        {app.applicantPhone}
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Email:{' '}
                      <a href={`mailto:${app.applicantEmail}`} className="font-bold text-emerald-800 hover:underline">
                        {app.applicantEmail}
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
                    <Briefcase className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Application Department: <strong className="font-bold text-slate-900">{app.department || app.vacancyDepartment}</strong>
                    </span>
                  </div>
                </div>

                {(app.portfolioUrl || app.linkedinUrl) && (
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 text-xs">
                    {app.portfolioUrl && (
                      <a
                        href={app.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Portfolio: {app.portfolioUrl}
                      </a>
                    )}
                    {app.linkedinUrl && (
                      <a
                        href={app.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Profile / Links
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Cover Letter / Statement */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Candidate Statement & Qualifications
                </h4>
                {app.coverLetter ? (
                  <p className="whitespace-pre-wrap text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {app.coverLetter}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No statement provided.</p>
                )}
              </div>

              {/* Uploaded CV & Documents - Direct View/Download */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Attached Resume / CV Documents ({app.documents?.length || 0})
                </h4>

                <div className="space-y-2">
                  {app.documents && app.documents.length > 0 ? (
                    app.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {doc.documentType}
                              </span>
                              <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                Ready to View
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{doc.fileName}</p>
                          </div>
                        </div>

                        {doc.fileData && (
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.fileData}
                              download={doc.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 transition"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download CV
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic py-2">
                      No document files attached.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Recruiter Controls / Timeline */}
            <div className="space-y-5">
              {/* Recruiter Controls */}
              {isRecruiter && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    HR Hiring Actions
                  </h4>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Update Hiring Stage:</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
                    >
                      {pipelineStages.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Candidate Score:</label>
                    <div className="mt-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRecruiterRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              star <= recruiterRating ? 'fill-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-slate-500 ml-1">{recruiterRating}/5</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Internal Evaluation Notes:</label>
                    <textarea
                      rows={2}
                      value={recruiterNotes}
                      onChange={(e) => setRecruiterNotes(e.target.value)}
                      placeholder="e.g. Strong Ethiopian fintech background, good communication..."
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Add Timeline Activity Note:</label>
                    <input
                      type="text"
                      value={timelineComment}
                      onChange={(e) => setTimelineComment(e.target.value)}
                      placeholder="e.g. Scheduled technical phone interview..."
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={handleUpdateStatus}
                    className="w-full rounded-lg bg-emerald-700 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Application Updates'}
                  </button>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-700" />
                  Application Activity Log
                </h4>

                <div className="space-y-3">
                  {app.timeline && app.timeline.length > 0 ? (
                    app.timeline.map((item) => (
                      <div key={item.id} className="relative pl-3.5 border-l-2 border-emerald-300 text-xs">
                        <div className="font-semibold text-slate-800">{item.status}</div>
                        <div className="text-[11px] text-slate-400">
                          {item.actorName} • {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                        {item.comment && (
                          <p className="mt-1 text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                            {item.comment}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">Application submitted to database.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
