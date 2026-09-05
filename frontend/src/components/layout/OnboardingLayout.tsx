import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OnboardingLayout: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const steps = [
    { id: 1, name: 'Account', path: '/register' },
    { id: 2, name: 'Business', path: '/onboarding/business' },
    { id: 3, name: 'Connect', path: '/onboarding/connect' },
    { id: 4, name: 'Sync', path: '/onboarding/sync' },
    { id: 5, name: 'Ready', path: '/onboarding/complete' },
  ];

  const getCurrentStep = () => {
    const p = location.pathname;
    if (p.includes('/business')) return 2;
    if (p.includes('/connect') || p.includes('/razorpay')) return 3;
    if (p.includes('/sync')) return 4;
    if (p.includes('/complete')) return 5;
    return 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight">ApexGrowth</span>
              <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-wider">
                AI Growth Assistant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {user && (
              <span className="text-slate-500 hidden sm:inline">
                Signed in as <strong className="text-slate-900">{user.email}</strong>
              </span>
            )}
            <button
              onClick={logout}
              className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="max-w-xl mx-auto w-full px-6 pt-8 pb-4">
        <div className="flex items-center justify-between relative">
          {/* Connector Line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 w-full z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-500 z-0"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-medium ${
                    isCurrent ? 'text-blue-700 font-semibold' : isDone ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Card Container */}
      <main className="max-w-xl mx-auto w-full px-4 py-4 flex-1 flex items-center justify-center">
        <div className="w-full">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400">
        ApexGrowth © 2026 • Powered by Razorpay Payment Rail
      </footer>
    </div>
  );
};
