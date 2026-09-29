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
import { ContactModal } from './components/ContactModal';
import { CompanyHomePage } from './components/CompanyHomePage';
import {
  Briefcase,
  LogOut,
  LogIn,
  Shield,
  UserCheck,
  Building2,
  UserPlus,
  Eye,
  LayoutDashboard,
  Home,
  Phone,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [activePage, setActivePage] = useState<'home' | 'vacancies' | 'console'>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [pendingVacancyToApply, setPendingVacancyToApply] = useState<Vacancy | null>(null);

  // Modals & Menu
  const [showContactModal, setShowContactModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setActivePage('home');
  };

  const handleOpenAuth = (pendingVacancy?: Vacancy, initialMode: 'login' | 'register' = 'login') => {
    setPendingVacancyToApply(pendingVacancy || null);
    setAuthInitialMode(initialMode);
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  const handleAuthSuccess = (user: User, vacancyToApply?: Vacancy | null) => {
    setCurrentUser(user);
    if (vacancyToApply) {
      setPendingVacancyToApply(vacancyToApply);
      setActivePage('vacancies');
    } else if (user.role === 'system_admin' || user.role === 'hr_admin' || user.role === 'hr_employee') {
      setActivePage('console');
    } else {
      setActivePage('vacancies');
    }
  };

  const handleGoHome = () => {
    setActivePage('home');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoVacancies = () => {
    setActivePage('vacancies');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isStaff =
    currentUser &&
    (currentUser.role === 'system_admin' ||
      currentUser.role === 'hr_admin' ||
      currentUser.role === 'hr_employee');

  // Helper for role badge display
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'system_admin':
        return (
          <span className="flex items-center gap-1 rounded-md bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold text-purple-200 border border-purple-400/30">
            <Shield className="h-3 w-3 text-purple-300" />
            System Administrator
          </span>
        );
      case 'hr_admin':
        return (
          <span className="flex items-center gap-1 rounded-md bg-blue-900/60 px-2 py-0.5 text-[10px] font-bold text-blue-200 border border-blue-400/30">
            <Building2 className="h-3 w-3 text-blue-300" />
            HR Admin (Director)
          </span>
        );
      case 'hr_employee':
        return (
          <span className="flex items-center gap-1 rounded-md bg-teal-900/60 px-2 py-0.5 text-[10px] font-bold text-teal-200 border border-teal-400/30">
            <UserCheck className="h-3 w-3 text-teal-300" />
            HR Employee (Officer)
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-md bg-emerald-800/80 px-2 py-0.5 text-[10px] font-bold text-emerald-100 border border-emerald-500/30">
            Job Applicant
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Top Header - Green Background */}
      <header className="sticky top-0 z-40 border-b border-emerald-800 bg-emerald-700 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Brand: Vacancy */}
          <div
            onClick={handleGoHome}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-md">
              <Briefcase className="h-6 w-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  Vacancy
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 hidden sm:block">
                Enterprise Talent Acquisition & Recruitment
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-semibold">
            <button
              onClick={handleGoHome}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${
                activePage === 'home'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-50 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </button>

            <button
              onClick={handleGoVacancies}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition ${
                activePage === 'vacancies'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-50 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Vacancies</span>
            </button>

            <button
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-emerald-50 hover:bg-emerald-600 hover:text-white transition"
            >
              <Phone className="h-4 w-4" />
              <span>Contact Us</span>
            </button>
          </nav>

          {/* User Status & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* If Staff user is on public pages, show Console button */}
            {isStaff && activePage !== 'console' && (
              <button
                onClick={() => setActivePage('console')}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-900/90 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-950 transition border border-emerald-600/50"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin Console</span>
                <span className="sm:hidden">Console</span>
              </button>
            )}

            {/* If Staff user is on Console, provide button to view Home or Vacancies */}
            {isStaff && activePage === 'console' && (
              <button
                onClick={handleGoVacancies}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25 transition border border-white/20"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View Public Portal</span>
                <span className="sm:hidden">Portal</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3 border-l border-emerald-600 pl-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white truncate max-w-[170px]">
                    {currentUser.fullName}
                  </div>
                  <div className="mt-0.5 flex justify-end">
                    {renderRoleBadge(currentUser.role)}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl p-2 text-emerald-200 hover:bg-emerald-600 hover:text-white transition"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAuth(undefined, 'register')}
                  className="hidden sm:flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/25 transition border border-white/20"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Create Account</span>
                </button>
                <button
                  onClick={() => handleOpenAuth(undefined, 'login')}
                  className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 transition"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-xl border border-emerald-600 p-2 text-white hover:bg-emerald-600"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-800 bg-emerald-800 px-4 py-3 space-y-2 text-xs font-semibold text-white">
            <button
              onClick={handleGoHome}
              className={`flex w-full items-center gap-2.5 rounded-lg p-2.5 transition ${
                activePage === 'home' ? 'bg-emerald-700' : 'hover:bg-emerald-700/60'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </button>

            <button
              onClick={handleGoVacancies}
              className={`flex w-full items-center gap-2.5 rounded-lg p-2.5 transition ${
                activePage === 'vacancies' ? 'bg-emerald-700' : 'hover:bg-emerald-700/60'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Vacancies</span>
            </button>

            <button
              onClick={() => {
                setShowContactModal(true);
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg p-2.5 hover:bg-emerald-700/60 transition"
            >
              <Phone className="h-4 w-4" />
              <span>Contact Us</span>
            </button>

            {isStaff && (
              <button
                onClick={() => {
                  setActivePage('console');
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg p-2.5 bg-emerald-900 font-bold"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Console</span>
              </button>
            )}

            {!currentUser && (
              <div className="pt-2 border-t border-emerald-700 flex flex-col gap-2">
                <button
                  onClick={() => handleOpenAuth(undefined, 'login')}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 font-bold text-emerald-800 shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => handleOpenAuth(undefined, 'register')}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/30 py-2.5 font-bold text-white hover:bg-emerald-700"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* 1. Home Page: ONLY describes the company */}
        {activePage === 'home' ? (
          <CompanyHomePage onExploreVacancies={handleGoVacancies} />
        ) : activePage === 'console' && isStaff ? (
          /* Staff Console */
          currentUser?.role === 'system_admin' ? (
            <SystemAdminDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              onPreviewPublicPortal={handleGoVacancies}
            />
          ) : (
            <RecruiterDashboard
              currentUser={currentUser!}
              onLogout={handleLogout}
              onPreviewPublicPortal={handleGoVacancies}
            />
          )
        ) : (
          /* 2. Vacancies / Public Portal */
          <CandidatePortal
            currentUser={currentUser}
            onOpenAuth={(vac, mode) => handleOpenAuth(vac, mode)}
            pendingVacancyToApply={pendingVacancyToApply}
            onClearPendingVacancy={() => setPendingVacancyToApply(null)}
          />
        )}
      </main>

      {/* Footer: Only "All right reserved and devloped by kinfu tura" */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-600">
        <div className="mx-auto max-w-7xl px-4">
          <p>All right reserved and devloped by kinfu tura</p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          initialMode={authInitialMode}
          pendingVacancy={pendingVacancyToApply}
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Contact Modal - Only email & phone number */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </div>
  );
}
