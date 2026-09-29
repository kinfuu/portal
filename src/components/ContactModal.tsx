import React from 'react';
import { Mail, Phone, X } from 'lucide-react';

interface ContactModalProps {
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800 bg-emerald-700 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Contact Us</h3>
              <p className="text-xs text-emerald-100">Vacancy Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-100 hover:bg-emerald-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content with only email and phone number */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Mail className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-500">Email Address</div>
              <a
                href="mailto:yobsan46@gmail.com"
                className="text-sm font-bold text-emerald-800 hover:underline break-all"
              >
                yobsan46@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Phone Number</div>
              <a
                href="tel:0712833888"
                className="text-sm font-bold text-emerald-800 hover:underline"
              >
                0712833888
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
