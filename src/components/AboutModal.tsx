import React from 'react';
import { Briefcase, Building, ShieldCheck, CheckCircle2, MapPin, Users, Database, X } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-emerald-800 bg-emerald-800 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-emerald-100">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">About EthioJobs</h3>
              <p className="text-xs text-emerald-100">Ethiopia's Leading Online Recruitment & Career Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-200 hover:bg-emerald-700 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong className="text-slate-900 font-bold">EthioJobs</strong> is a professional recruitment and candidate tracking platform built specifically for the Ethiopian job market. Connecting talented professionals with leading banking, NGO, IT, manufacturing, and enterprise organizations across Addis Ababa, Hawassa, Dire Dawa, Bahir Dar, and remote locations.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Verified Local Salaries</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Transparent salary packages indicated in Ethiopian Birr (ETB).
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>Document Verification</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Direct resume & credential review by certified HR recruitment officers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span>4 Standard System Roles</span>
              </div>
              <p className="text-[11px] text-slate-500">
                System Admin, HR Director, HR Officer, and Candidate applicant portal.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                <Database className="h-4 w-4 text-teal-600" />
                <span>PostgreSQL Powered</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Secure real-time relational database storage for applications & tracking.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-[11px] text-emerald-950">
            <p className="font-bold mb-0.5">Headquarters:</p>
            <p className="text-emerald-800">
              Bole Sub-City, Mega Building 5th Floor, Addis Ababa, Ethiopia • Support: support@ethiojobs.et
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="rounded-xl bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
