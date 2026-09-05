import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const OnboardingCompletePage: React.FC = () => {
  const navigate = useNavigate();
  const { merchant, refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await api.completeOnboarding();
      await refreshUser();
      navigate('/');
    } catch (e) {
      console.error(e);
      navigate('/');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
          Step 5 of 5 • Ready
        </div>
        <h2 className="text-xl font-bold text-slate-900">You're all set!</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          ApexGrowth is now watching your customer activity and looking for ways to recover revenue.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2.5 text-left text-xs">
        <div className="flex items-center justify-between text-slate-700 font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Store Workspace</span>
          </span>
          <span className="font-semibold text-slate-900">{merchant?.name || 'Your Store'}</span>
        </div>

        <div className="flex items-center justify-between text-slate-700 font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Razorpay Connection</span>
          </span>
          <span className="text-amber-800 font-semibold">Test Mode Active</span>
        </div>

        <div className="flex items-center justify-between text-slate-700 font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Safety Guardrails</span>
          </span>
          <span className="text-emerald-700 font-semibold">7 Rule Checks Active</span>
        </div>

        <div className="flex items-center justify-between text-slate-700 font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Revenue Recovery AI</span>
          </span>
          <span className="text-blue-700 font-semibold">Watching Inactivity</span>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          icon={ArrowRight}
          loading={submitting}
          onClick={handleFinish}
          className="w-full justify-center shadow-xs"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};
