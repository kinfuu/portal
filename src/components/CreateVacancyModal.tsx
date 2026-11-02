import React, { useState } from 'react';
import { Vacancy } from '../types';
import { api } from '../api';
import { PlusCircle, Briefcase, DollarSign, MapPin, Building, Calendar } from 'lucide-react';

interface CreateVacancyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateVacancyModal: React.FC<CreateVacancyModalProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Technology & IT');
  const [location, setLocation] = useState('Addis Ababa, Bole (Hybrid)');
  const [type, setType] = useState('Full-time');
  const [experienceLevel, setExperienceLevel] = useState('Mid-Level');
  const [minSalary, setMinSalary] = useState<string>('50000');
  const [maxSalary, setMaxSalary] = useState<string>('75000');
  const [currency, setCurrency] = useState('ETB');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [negotiationNotes, setNegotiationNotes] = useState('Open to negotiation based on experience');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState('Resume / CV');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed salary display string
  const computedSalary = minSalary && maxSalary
    ? `${Number(minSalary).toLocaleString()} - ${Number(maxSalary).toLocaleString()} ${currency} / month${isNegotiable ? ' (Negotiable)' : ''}`
    : 'Competitive ETB (Negotiable)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await api.createVacancy({
        title,
        department,
        location,
        type,
        experienceLevel,
        minSalary: minSalary ? parseInt(minSalary, 10) : undefined,
        maxSalary: maxSalary ? parseInt(maxSalary, 10) : undefined,
        currency,
        isNegotiable,
        negotiationNotes,
        salaryRange: computedSalary,
        description,
        requirements,
        requiredDocuments,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        status: 'Open',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create vacancy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-emerald-100">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Post New Ethiopian Vacancy</h2>
                <span className="rounded bg-emerald-900/80 border border-emerald-600/50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-200">
                  ID: Auto-sequenced (01, 02...)
                </span>
              </div>
              <p className="text-xs text-emerald-100">Publish job opening directly with sequential code, salary & negotiations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-200 hover:bg-emerald-700 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-slate-700">Job Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Developer or Financial Officer"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Department / Industry *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
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
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="font-semibold text-slate-700">Location in Ethiopia *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Addis Ababa (Bole) or Hawassa"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Employment Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Remote (Ethiopia)">Remote (Ethiopia)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                Application Deadline *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Salary & Negotiations Section */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <DollarSign className="h-4 w-4 text-emerald-700" />
                Salary & Negotiations / ደመወዝ እና ድርድር *
              </label>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                Preview: {computedSalary}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-slate-600 font-medium">Minimum Salary ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  placeholder="e.g. 50000"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Maximum Salary ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  placeholder="e.g. 75000"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                >
                  <option value="ETB">ETB (Ethiopian Birr)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-emerald-200/60">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <span>Salary is Negotiable (ደመወዝ በስምምነት ክፍት ነው)</span>
              </label>

              {isNegotiable && (
                <span className="text-[11px] text-emerald-700 font-medium">
                  ✓ Candidates will see this role allows compensation negotiation
                </span>
              )}
            </div>

            {isNegotiable && (
              <div>
                <label className="text-slate-600 font-medium">Negotiation Note / Remarks (Optional)</label>
                <input
                  type="text"
                  value={negotiationNotes}
                  onChange={(e) => setNegotiationNotes(e.target.value)}
                  placeholder="e.g. Open to higher compensation based on exceptional candidate experience"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold text-slate-700">Job Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline mission, key duties, and scope of responsibilities..."
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Candidate Requirements & Qualifications *</label>
            <textarea
              rows={3}
              required
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="• BSc/BA in relevant field&#10;• 3+ years experience&#10;• Strong communication skills in Amharic & English"
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-700 px-5 py-2 font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Job Opening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
