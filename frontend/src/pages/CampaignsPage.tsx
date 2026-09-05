import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Opportunity, ApprovalRequest } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const opp = await api.getCurrentOpportunity();
        setOpportunity(opp);
        if (opp?.strategy?.id) {
          const appReq = await api.getApprovalRequest(opp.strategy.id).catch(() => null);
          setApproval(appReq);
        }
      } catch (err) {
        console.error('Failed to load campaigns info:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isApproved = approval?.status === 'approved';
  const isExecutingOrCompleted =
    approval?.status === 'executing' || approval?.status === 'completed';

  const grossSales = Math.floor(
    opportunity?.strategy?.estimated_gross_revenue ||
    opportunity?.estimated_recoverable_revenue ||
    36641
  );
  const targetCount = opportunity?.target_customer_count || 42;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
        <p className="text-sm text-slate-500 mt-1">
          Launch and track automated Razorpay payment campaigns to recover revenue from inactive customers.
        </p>
      </div>

      {/* 2. Ready to Launch or Live Campaign Banner */}
      {isApproved || isExecutingOrCompleted ? (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/70 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Badge variant="blue" dot>
                {isExecutingOrCompleted ? 'LIVE CAMPAIGN' : 'APPROVED & READY'}
              </Badge>
              <Badge variant="emerald">
                {isExecutingOrCompleted ? 'Actively Collecting Payments' : 'Ready to Launch'}
              </Badge>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Targeting {targetCount} high-value customers
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Win back {targetCount} valuable customers with a 15% discount link
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Potential gross sales of <strong>₹{grossSales.toLocaleString('en-IN')}</strong> across your selected customers.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={isExecutingOrCompleted ? ArrowRight : Zap}
              onClick={() => navigate('/')}
            >
              {isExecutingOrCompleted ? 'View Live Campaign Details' : 'Launch Campaign on Dashboard'}
            </Button>
          </div>
        </div>
      ) : (
        /* 3. Polished State when no campaign is currently running */
        <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Megaphone className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Your campaigns will appear here</h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                When you approve a growth recommendation, ApexGrowth creates individual Razorpay payment links for selected customers and tracks conversions in real time.
              </p>
            </div>
          </div>

          {/* 3 Step Explanation Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
              <div className="text-xs font-bold text-blue-700 uppercase">1. AI Opportunity</div>
              <div className="text-xs font-semibold text-slate-900">Review Recommendation</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ApexGrowth identifies inactive high-value buyers and suggests a personalized offer.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
              <div className="text-xs font-bold text-amber-700 uppercase">2. Your Signoff</div>
              <div className="text-xs font-semibold text-slate-900">1-Click Approval</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                You review expected revenue lift and discount caps before anything is sent.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
              <div className="text-xs font-bold text-emerald-700 uppercase">3. Real-Time Tracking</div>
              <div className="text-xs font-semibold text-slate-900">Automatic Attribution</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Track payments as customers click their links and measure your net profit gain.
              </p>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {opportunity ? (
                <span>
                  <strong>1 recommended opportunity</strong> found for your business (Potential sales: <strong>₹{grossSales.toLocaleString('en-IN')}</strong>).
                </span>
              ) : (
                <span>No active campaigns yet.</span>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              onClick={() => navigate('/')}
            >
              Review Recommended Opportunity
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
