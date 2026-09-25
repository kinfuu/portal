import React, { useState } from 'react';
import { api, setAuthToken, setStoredUser } from '../api';
import { User, Vacancy } from '../types';
import { Lock, Mail, User as UserIcon, Briefcase, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp, Eye, EyeOff, Zap, Shield, Building2, UserCheck } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User, pendingVacancy?: Vacancy | null) => void;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  pendingVacancy?: Vacancy | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  onClose,
  initialMode = 'login',
  pendingVacancy,
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [showCredentialsHelper, setShowCredentialsHelper] = useState(true);

  const handleDirectLogin = async (loginEmail: string, loginPass: string) => {
    setEmail(loginEmail);
    setPassword(loginPass);
    setIsLogin(true);
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: loginEmail, password: loginPass });
      setAuthToken(res.token);
      setStoredUser(res.user);
      onSuccess(res.user, pendingVacancy);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      if (isLogin) {
        const res = await api.login({ email: cleanEmail, password: cleanPassword });
        setAuthToken(res.token);
        setStoredUser(res.user);
        onSuccess(res.user, pendingVacancy);
        onClose();
      } else {
        // Register applicant account
        await api.register({
          email: cleanEmail,
          password: cleanPassword,
          fullName: fullName.trim(),
        });

        // Switch directly to sign in mode with email preserved, password reset, and a clear prompt to sign in
        setSuccessNotice(
          pendingVacancy
            ? `Account created successfully! Please sign in with your password to complete your application for "${pendingVacancy.title}".`
            : 'Account created successfully! Please sign in with your email and password to proceed.'
        );
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials or use the quick login buttons below.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setIsLogin(true);
    setError(null);
    setSuccessNotice(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="bg-emerald-800 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-200">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {isLogin ? 'Sign In to Your Account' : 'Create Applicant Account'}
                </h3>
                <p className="text-xs text-emerald-100">
                  {pendingVacancy
                    ? `To apply for: ${pendingVacancy.title}`
                    : 'EthioJobs Online Recruitment System'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-emerald-200 hover:bg-emerald-700 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition ${
              isLogin
                ? 'border-b-2 border-emerald-700 bg-white font-bold text-emerald-800'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
              setSuccessNotice(null);
            }}
            className={`flex-1 py-3 text-center transition ${
              !isLogin
                ? 'border-b-2 border-emerald-700 bg-white font-bold text-emerald-800'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="p-6">
          {/* Target vacancy alert if applying */}
          {pendingVacancy && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
              <span className="font-bold">Applying for:</span> {pendingVacancy.title} ({pendingVacancy.location})
              <p className="mt-0.5 text-[11px] text-emerald-700">
                {isLogin
                  ? 'Sign in to review and submit your application.'
                  : 'Create your account first, sign in, and you will be taken directly to upload your CV.'}
              </p>
            </div>
          )}

          {/* Quick 1-Click Role Login Bar */}
          {isLogin && (
            <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-purple-950 mb-2">
                <Zap className="h-4 w-4 text-purple-700 fill-purple-600" />
                <span>Instant 1-Click Role Login (Ethiopian System)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDirectLogin('admin@ethiojobs.et', 'admin123')}
                  className="flex items-center justify-start gap-1.5 rounded-lg border border-purple-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-purple-900 shadow-2xs hover:bg-purple-100 transition text-left"
                >
                  <Shield className="h-3.5 w-3.5 text-purple-700 shrink-0" />
                  <span className="truncate">System Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectLogin('hr@ethiojobs.et', 'hr123')}
                  className="flex items-center justify-start gap-1.5 rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-blue-900 shadow-2xs hover:bg-blue-100 transition text-left"
                >
                  <Building2 className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                  <span className="truncate">HR Director</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectLogin('hrs@ethiojobs.et', 'hr123')}
                  className="flex items-center justify-start gap-1.5 rounded-lg border border-teal-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-teal-900 shadow-2xs hover:bg-teal-100 transition text-left"
                >
                  <UserCheck className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                  <span className="truncate">HR Officer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectLogin('yobsan@ethiojobs.et', 'yobsan123')}
                  className="flex items-center justify-start gap-1.5 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-900 shadow-2xs hover:bg-emerald-100 transition text-left"
                >
                  <UserIcon className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">Applicant</span>
                </button>
              </div>
            </div>
          )}

          {/* Success notice after registration */}
          {successNotice && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Registration Complete!</p>
                <p className="mt-0.5 text-emerald-700">{successNotice}</p>
              </div>
            </div>
          )}

          {/* Error notice */}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Clean Form without selection options */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {!isLogin && (
              <div>
                <label className="font-semibold text-slate-700">Full Name *</label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Yobsan Bekele"
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700">Email Address *</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ethiojobs.et"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Password *</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-10 text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-emerald-700 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-800 transition disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : isLogin
                ? 'Sign In to Account'
                : 'Create Account'}
            </button>
          </form>

          {/* Toggle between register and login */}
          <div className="mt-4 text-center text-xs text-slate-500">
            {isLogin ? (
              <span>
                Applying for the first time?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError(null);
                    setSuccessNotice(null);
                  }}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                  }}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Sign in here
                </button>
              </span>
            )}
          </div>

          {/* Role credentials reference for review */}
          <div className="mt-5 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowCredentialsHelper(!showCredentialsHelper)}
              className="flex w-full items-center justify-between text-[11px] font-medium text-slate-500 hover:text-slate-800"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Reference: 4 Roles System Accounts</span>
              </span>
              {showCredentialsHelper ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showCredentialsHelper && (
              <div className="mt-2.5 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-purple-900">System Admin:</span> admin@ethiojobs.et
                    <span className="text-slate-400 ml-1">(admin123)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fillQuickCredentials('admin@ethiojobs.et', 'admin123')}
                      className="text-[10px] text-slate-600 hover:underline"
                    >
                      Fill
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectLogin('admin@ethiojobs.et', 'admin123')}
                      className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 hover:bg-purple-200"
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-blue-900">HR Admin:</span> hr@ethiojobs.et
                    <span className="text-slate-400 ml-1">(hr123)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fillQuickCredentials('hr@ethiojobs.et', 'hr123')}
                      className="text-[10px] text-slate-600 hover:underline"
                    >
                      Fill
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectLogin('hr@ethiojobs.et', 'hr123')}
                      className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 hover:bg-blue-200"
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-teal-900">HR Employee:</span> hrs@ethiojobs.et
                    <span className="text-slate-400 ml-1">(hr123)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fillQuickCredentials('hrs@ethiojobs.et', 'hr123')}
                      className="text-[10px] text-slate-600 hover:underline"
                    >
                      Fill
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectLogin('hrs@ethiojobs.et', 'hr123')}
                      className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 hover:bg-teal-200"
                    >
                      Sign In
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <span className="font-bold text-emerald-900">Applicant:</span> yobsan@ethiojobs.et
                    <span className="text-slate-400 ml-1">(yobsan123)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fillQuickCredentials('yobsan@ethiojobs.et', 'yobsan123')}
                      className="text-[10px] text-slate-600 hover:underline"
                    >
                      Fill
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectLogin('yobsan@ethiojobs.et', 'yobsan123')}
                      className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-200"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
