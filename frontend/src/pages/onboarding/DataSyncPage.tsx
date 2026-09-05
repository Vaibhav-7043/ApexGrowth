import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const DataSyncPage: React.FC = () => {
  const navigate = useNavigate();
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [allDone, setAllDone] = useState(false);

  const syncSteps = [
    'Connecting Razorpay payment ledger',
    'Analyzing customer purchasing intervals',
    'Identifying customer groups and inactive buyers',
    'Calculating revenue recovery opportunities',
  ];

  useEffect(() => {
    const runSync = async () => {
      try {
        await api.syncOnboardingData();
      } catch (e) {
        console.error(e);
      }

      // Fast animated progression
      const timers = [
        setTimeout(() => setCompletedItems((prev) => [...prev, 0]), 400),
        setTimeout(() => setCompletedItems((prev) => [...prev, 1]), 900),
        setTimeout(() => setCompletedItems((prev) => [...prev, 2]), 1400),
        setTimeout(() => {
          setCompletedItems((prev) => [...prev, 3]);
          setAllDone(true);
        }, 1900),
      ];

      return () => timers.forEach(clearTimeout);
    };

    runSync();
  }, []);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-center">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
          Step 4 of 5 • Synchronization
        </div>
        <h2 className="text-xl font-bold text-slate-900">Understanding your business...</h2>
        <p className="text-xs text-slate-500">
          ApexGrowth AI is inspecting your store data to identify high-value winback opportunities.
        </p>
      </div>

      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3.5 text-left">
        {syncSteps.map((stepText, idx) => {
          const isDone = completedItems.includes(idx);
          const isCurrent = completedItems.length === idx;

          return (
            <div key={stepText} className="flex items-center gap-3 text-xs">
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : isCurrent ? (
                  <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-slate-300 bg-white" />
                )}
              </div>
              <span
                className={`font-medium ${
                  isDone ? 'text-slate-900' : isCurrent ? 'text-blue-700 font-semibold' : 'text-slate-400'
                }`}
              >
                {stepText}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          icon={ArrowRight}
          disabled={!allDone}
          onClick={() => navigate('/onboarding/complete')}
          className="w-full justify-center"
        >
          {allDone ? 'Continue to Final Step' : 'Analyzing Store Data...'}
        </Button>
      </div>
    </div>
  );
};
