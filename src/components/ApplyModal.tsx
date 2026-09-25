import React, { useState } from 'react';
import { Vacancy } from '../types';
import { api } from '../api';
import { DocumentUploader } from './DocumentUploader';
import { Briefcase, Send, CheckCircle2, AlertCircle, FileText, Phone, Mail, User as UserIcon, MapPin, GraduationCap, Building2 } from 'lucide-react';

const DEPARTMENTS = [
  'Technology & IT',
  'Banking & Finance',
  'NGO & Development',
  'Marketing & Sales',
  'Engineering & Operations',
  'Healthcare & Medical',
  'Human Resources',
  'Accounting & Audit',
  'Legal & Compliance',
  'Supply Chain & Logistics',
  'Administration & Management',
  'Customer Support & Telecommunications',
  'Other Department',
];

interface ApplyModalProps {
  vacancy: Vacancy;
  applicantUser: { fullName: string; email: string };
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  vacancy,
  applicantUser,
  onClose,
  onSuccess,
}) => {
  const [applicantName, setApplicantName] = useState(applicantUser.fullName || '');
  const [applicantEmail, setApplicantEmail] = useState(applicantUser.email || '');
  const [applicantPhone, setApplicantPhone] = useState('+251 9');
  const [department, setDepartment] = useState(vacancy.department || 'Technology & IT');
  const [customDepartment, setCustomDepartment] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  const [experienceYears, setExperienceYears] = useState('2-4 years');
  const [educationLevel, setEducationLevel] = useState("Bachelor's Degree");
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [documents, setDocuments] = useState<Array<{
    documentType: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileData: string;
  }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Ensure resume is uploaded
    const hasResume = documents.some((d) => d.documentType.toLowerCase().includes('resume') || d.documentType.toLowerCase().includes('cv'));
    if (!hasResume && documents.length === 0) {
      setError('Please upload your Resume or CV to complete your application.');
      return;
    }

    const effectiveDepartment = department === 'Other Department' && customDepartment.trim()
      ? customDepartment.trim()
      : department;

    try {
      setLoading(true);
      
      const fullCoverLetter = `[Department: ${effectiveDepartment} | Location: ${city} | Experience: ${experienceYears} | Education: ${educationLevel}]\n\n${coverLetter}`;

      await api.submitApplication({
        vacancyId: vacancy.id,
        applicantName,
        applicantEmail,
        applicantPhone,
        department: effectiveDepartment,
        coverLetter: fullCoverLetter,
        portfolioUrl,
        linkedinUrl,
        documents: documents.length > 0 ? documents : [
          {
            documentType: 'Resume / CV',
            fileName: 'Applicant_CV.pdf',
            fileSize: 120000,
            mimeType: 'application/pdf',
            fileData: 'data:application/pdf;base64,',
          }
        ],
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs">
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-emerald-800 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-700/80 px-2 py-0.5 text-[11px] font-medium text-emerald-100">
                Job Application
              </span>
              <span className="text-xs text-emerald-200">{vacancy.location}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Apply for {vacancy.title}
            </h2>
            <p className="text-xs text-emerald-100">
              Salary: {vacancy.salaryRange || 'Competitive (ETB)'} • {vacancy.department}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-200 hover:bg-emerald-700 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name (ስም) *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Yobsan Bekele"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="candidate@gmail.com"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Department Selection Section */}
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Building2 className="h-4 w-4 text-emerald-700" />
                Target Department / የስራ ክፍል *
              </label>
              {vacancy.department && (
                <span className="rounded-md bg-emerald-100/90 border border-emerald-300/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                  Role Default: {vacancy.department}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none shadow-2xs"
                >
                  {vacancy.department && !DEPARTMENTS.includes(vacancy.department) && (
                    <option value={vacancy.department}>{vacancy.department} (Vacancy Specialization)</option>
                  )}
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} {dept === vacancy.department ? '• (Job Department)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Specify the department for candidate profile classification and recruiter review.
                </p>
              </div>

              {department === 'Other Department' ? (
                <div>
                  <input
                    type="text"
                    required
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    placeholder="Enter custom department or division..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none shadow-2xs"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Type your specific department or team name.
                  </p>
                </div>
              ) : (
                <div className="flex items-center rounded-lg bg-white/90 border border-emerald-200 px-3 py-2 text-xs text-slate-700">
                  <span className="text-[11px] leading-tight">
                    Application categorized under: <strong className="text-emerald-800 font-bold">{department}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ethiopian Phone (+251) *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="+251 91 123 4567"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current City in Ethiopia
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              >
                <option value="Addis Ababa">Addis Ababa</option>
                <option value="Hawassa">Hawassa</option>
                <option value="Bahir Dar">Bahir Dar</option>
                <option value="Dire Dawa">Dire Dawa</option>
                <option value="Adama / Nazret">Adama / Nazret</option>
                <option value="Bishoftu">Bishoftu</option>
                <option value="Mekelle">Mekelle</option>
                <option value="Jimma">Jimma</option>
                <option value="Other Ethiopia">Other City</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Education Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              >
                <option value="Bachelor's Degree">Bachelor's Degree (BSc/BA)</option>
                <option value="Master's Degree">Master's Degree (MSc/MA)</option>
                <option value="College Diploma">College Diploma / TVET</option>
                <option value="High School">High School Completed</option>
                <option value="PhD / Doctorate">Doctorate (PhD)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relevant Experience
              </label>
              <select
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              >
                <option value="Entry Level (0-1 year)">Entry Level / Fresh Graduate (0-1 year)</option>
                <option value="1-3 years">1 - 3 years</option>
                <option value="3-5 years">3 - 5 years</option>
                <option value="5-8 years">5 - 8 years</option>
                <option value="8+ years">8+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LinkedIn / Telegram / Portfolio (Optional)
              </label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/... or @telegram"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cover Note / Why are you a good fit?
            </label>
            <textarea
              rows={3}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Briefly state your skills, past projects or achievements relevant to this role..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Simple Resume Upload Area */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <DocumentUploader
              requiredDocumentNames={['Resume / CV']}
              documents={documents}
              onChange={setDocuments}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <p className="text-[11px] text-slate-500">
              Your application and CV will be stored securely in the database for the recruiter to review.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
