/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Vacancy } from './types';
import { getStoredUser, setAuthToken, setStoredUser, api } from './api';
import { CandidatePortal } from './components/CandidatePortal';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { SystemAdminDashboard } from './components/SystemAdminDashboard';
import { AuthModal } from './components/AuthModal';
import {
  Briefcase,
  LogOut,
  LogIn,
  Shield,
  UserCheck,
  Building2,
  Sparkles,
  UserPlus,
  Eye,
  LayoutDashboard
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [pendingVacancyToApply, setPendingVacancyToApply] = useState<Vacancy | null>(null);
  const [previewPublicPortal, setPreviewPublicPortal] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (currentUser) {
          const res = await api.getMe();
          setCurrentUser(res.user);
          setStoredUser(res.user);
        }
      } catch {
        setAuthToken(null);
        setStoredUser(null);
        setCurrentUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setCurrentUser(null);
    setPendingVacancyToApply(null);
    setPreviewPublicPortal(false);
  };

  const handleOpenAuth = (pendingVacancy?: Vacancy, initialMode: 'login' | 'register' = 'login') => {
    setPendingVacancyToApply(pendingVacancy || null);
    setAuthInitialMode(initialMode);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user: User, vacancyToApply?: Vacancy | null) => {
    setCurrentUser(user);
    if (vacancyToApply) {
      setPendingVacancyToApply(vacancyToApply);
    }
  };

  // Helper for role badge display
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'system_admin':
        return (
          <span className="flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900 border border-purple-200">
            <Shield className="h-3 w-3 text-purple-700" />
            System Administrator
          </span>
        );
      case 'hr_admin':
        return (
          <span className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900 border border-blue-200">
            <Building2 className="h-3 w-3 text-blue-700" />
            HR Admin (Director)
          </span>
        );
      case 'hr_employee':
        return (
          <span className="flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-900 border border-teal-200">
            <UserCheck className="h-3 w-3 text-teal-700" />
            HR Employee (Officer)
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-200">
            Job Applicant
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900">
                  EthioJobs
                </span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  Ethiopia
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Online Vacancy & Recruiter Management Portal
              </p>
            </div>
          </div>

          {/* Navigation & User Status */}
          <div className="flex items-center gap-3">
            {/* If Staff user is previewing public portal, show button to return to Dashboard */}
            {currentUser && (currentUser.role === 'system_admin' || currentUser.role === 'hr_admin') && previewPublicPortal && (
              <button
                onClick={() => setPreviewPublicPortal(false)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-950 transition"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Return to Admin Console</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                    {currentUser.fullName}
                  </div>
                  <div className="mt-0.5 flex justify-end">
                    {renderRoleBadge(currentUser.role)}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAuth(undefined, 'register')}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <UserPlus className="h-3.5 w-3.5 text-slate-500" />
                  <span>Create Account</span>
                </button>
                <button
                  onClick={() => handleOpenAuth(undefined, 'login')}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area based on User Role */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* If user clicked to preview public portal */}
        {previewPublicPortal ? (
          <CandidatePortal
            currentUser={currentUser}
            onOpenAuth={(vac, mode) => handleOpenAuth(vac, mode)}
            pendingVacancyToApply={pendingVacancyToApply}
            onClearPendingVacancy={() => setPendingVacancyToApply(null)}
          />
        ) : !currentUser || currentUser.role === 'applicant' ? (
          /* Public / Applicant Portal */
          <CandidatePortal
            currentUser={currentUser}
            onOpenAuth={(vac, mode) => handleOpenAuth(vac, mode)}
            pendingVacancyToApply={pendingVacancyToApply}
            onClearPendingVacancy={() => setPendingVacancyToApply(null)}
          />
        ) : currentUser.role === 'system_admin' ? (
          /* 1. System Admin Console (Full Control) */
          <SystemAdminDashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            onPreviewPublicPortal={() => setPreviewPublicPortal(true)}
          />
        ) : currentUser.role === 'hr_admin' || currentUser.role === 'hr_employee' ? (
          /* 2. HR Admin / 3. HR Employee Recruiter Dashboard */
          <RecruiterDashboard
            currentUser={currentUser}
            onLogout={handleLogout}
            onPreviewPublicPortal={() => setPreviewPublicPortal(true)}
          />
        ) : (
          <CandidatePortal
            currentUser={currentUser}
            onOpenAuth={(vac, mode) => handleOpenAuth(vac, mode)}
            pendingVacancyToApply={pendingVacancyToApply}
            onClearPendingVacancy={() => setPendingVacancyToApply(null)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-between gap-2">
          <span>EthioJobs • Ethiopian Online Recruitment System (System Admin • HR Admin • HR Employee • Applicants)</span>
          <span className="text-slate-400">PostgreSQL Powered • Addis Ababa, Ethiopia</span>
        </div>
      </footer>

      {/* Auth Modal with clean inputs and auto-apply pipeline */}
      {showAuthModal && (
        <AuthModal
          initialMode={authInitialMode}
          pendingVacancy={pendingVacancyToApply}
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
