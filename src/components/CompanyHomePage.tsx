import React from 'react';
import { Building2, ShieldCheck, Target, Award, Users, CheckCircle, Globe2 } from 'lucide-react';

interface CompanyHomePageProps {
  onExploreVacancies?: () => void;
}

export const CompanyHomePage: React.FC<CompanyHomePageProps> = ({ onExploreVacancies }) => {
  return (
    <div className="space-y-8 py-2">
      {/* Company Hero Introduction */}
      <section className="rounded-3xl border border-emerald-100 bg-linear-to-b from-emerald-50/80 via-white to-white p-8 md:p-12 shadow-sm text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/70 px-4 py-1.5 text-xs font-bold text-emerald-800 mb-6">
          <Building2 className="h-4 w-4" />
          <span>About Vacancy</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
          Welcome to <span className="text-emerald-700">Vacancy</span>
        </h1>
        <p className="mt-4 text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Vacancy is a premier enterprise human resources and talent acquisition organization committed to connecting exceptional professionals with industry-leading institutions across technology, finance, engineering, and operations.
        </p>

        {onExploreVacancies && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={onExploreVacancies}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
            >
              <span>Explore Career Opportunities</span>
            </button>
          </div>
        )}
      </section>

      {/* Corporate Overview */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our mission at Vacancy is to modernize the recruitment ecosystem through standardized evaluation, verified credential assessments, and transparent career advancement pathways for professionals and partner organizations alike.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Award className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Our Vision</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To serve as the benchmark for organizational staffing, empowering enterprises with high-caliber talent while providing every candidate with a direct, credible, and equitable recruitment journey.
          </p>
        </div>
      </section>

      {/* Company Core Pillars */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Company Overview & Core Values</h2>
          <p className="text-xs text-slate-500 mt-1">
            Built on integrity, transparency, and professional excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Qualifications</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every applicant profile and document undergoes structured verification to maintain genuine compliance and industry readiness.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <Users className="h-4 w-4" />
              <span>People-First Culture</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We cultivate strong relationships between employers and candidates, ensuring sustained mutual growth and career satisfaction.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <Globe2 className="h-4 w-4" />
              <span>Nationwide Reach</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Operating across key economic hubs, providing talent acquisition coverage across regional and international sectors.
            </p>
          </div>
        </div>
      </section>

      {/* Why Vacancy Section */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 md:p-8">
        <h3 className="text-lg font-bold text-emerald-950 mb-4">What Sets Vacancy Apart</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>Dedicated talent acquisition specialists overseeing each specialized department.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>Structured application pipelines with clear milestones and timely updates.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>Secure document handling in accordance with enterprise data protection standards.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>Rigorous screening mechanisms connecting vetted applicants directly with decision-makers.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
