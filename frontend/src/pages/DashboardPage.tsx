import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnalyticsOverview, Opportunity, Strategy, ApprovalRequest, Merchant } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { WhyExplanationDrawer } from '../components/opportunity/WhyExplanationDrawer';
import { StrategyReviewModal } from '../components/opportunity/StrategyReviewModal';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Store,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposing, setProposing] = useState(false);

  // Modals state
  const [isWhyDrawerOpen, setIsWhyDrawerOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | undefined>(undefined);
  const [currentApproval, setCurrentApproval] = useState<ApprovalRequest | undefined>(undefined);

  const loadDashboardData = async () => {
    try {
      const [m, a, opp] = await Promise.all([
        api.getMerchant(),
        api.getAnalyticsOverview(),
        api.getCurrentOpportunity(),
      ]);
      setMerchant(m);
      setAnalytics(a);
      setOpportunity(opp);

      if (opp.strategy) {
        setCurrentStrategy(opp.strategy);
        if (opp.strategy.approval_request) {
          setCurrentApproval(opp.strategy.approval_request);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleProposeOrReviewStrategy = async () => {
    if (!opportunity) return;

    if (currentStrategy && currentApproval) {
      setIsStrategyModalOpen(true);
      return;
    }

    setProposing(true);
    try {
      const res = await api.proposeStrategy(opportunity.id, 15.0);
      setCurrentStrategy(res.strategy);
      setCurrentApproval(res.approval_request);
      setIsStrategyModalOpen(true);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProposing(false);
    }
  };

  const handleOpenWhy = async () => {
    if (!currentStrategy && opportunity) {
      setProposing(true);
      try {
        const res = await api.proposeStrategy(opportunity.id, 15.0);
        setCurrentStrategy(res.strategy);
        setCurrentApproval(res.approval_request);
        setIsWhyDrawerOpen(true);
      } catch (err: any) {
        alert(err.message);
      } finally {
        setProposing(false);
      }
    } else {
      setIsWhyDrawerOpen(true);
    }
  };

  const handleApprovalUpdated = (updated: ApprovalRequest) => {
    setCurrentApproval(updated);
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isApproved = currentApproval?.status === 'approved';
  const isExecutingOrCompleted =
    currentApproval?.status === 'executing' || currentApproval?.status === 'completed';

  // Truthful growth statement from analytics
  const growthPct = analytics?.revenue_trend?.growth_percent ?? 0;
  const isGrowthPositive = growthPct >= 0;
  const absGrowthPct = Math.abs(growthPct).toFixed(1);
  const trendHeadline = isGrowthPositive
    ? `Sales are up ${absGrowthPct}% from the previous period`
    : `Sales are down ${absGrowthPct}% from the previous period`;
  const growthSubtext = isGrowthPositive
    ? `${absGrowthPct}% higher than the previous period`
    : `${absGrowthPct}% lower than the previous period`;

  // Total at-risk attention group (87) vs high-value target group (42)
  const totalNeedingAttention = analytics?.at_risk_customers_count || 87;
  const targetOpportunityCount = opportunity?.target_customer_count || 42;

  // Canonical financial impact figures from strategy / opportunity
  const grossSales = Math.floor(currentStrategy?.estimated_gross_revenue || opportunity?.estimated_recoverable_revenue || 36641);
  const offerCost = Math.floor(currentStrategy?.estimated_campaign_cost || 5496);
  const netGain = Math.floor(currentStrategy?.estimated_net_lift || 31145);
  const roiMultiplier = currentStrategy?.projected_roi || 6.67;

  const friendlySegmentLabels: Record<string, string> = {
    at_risk_high_value: 'Needing Attention',
    at_risk: 'Needing Attention',
    champions: 'Top Regulars',
    loyal_coffee_lovers: 'Loyal Buyers',
    loyal_customers: 'Loyal Buyers',
    loyal: 'Loyal Buyers',
    promising_new: 'New & Promising',
    promising: 'New & Promising',
    slipping_occasional: 'Slipping Away',
    slipping: 'Slipping Away',
    dormant_lost: 'Dormant',
    dormant: 'Dormant',
    inactive_dormant: 'Dormant',
  };

  return (
    <div className="space-y-8">
      {/* 1. Welcoming Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Good evening, {merchant?.name || 'Artisan Roasters'}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {trendHeadline}, and we found a high-value opportunity that could potentially recover{' '}
            <strong className="text-emerald-700 font-semibold">
              ₹{grossSales.toLocaleString('en-IN')}
            </strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Store}
            onClick={() => navigate('/integrations')}
          >
            Connected Store
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={isApproved ? Zap : Sparkles}
            loading={proposing}
            onClick={handleProposeOrReviewStrategy}
          >
            {isApproved
              ? 'Execute Approved Campaign'
              : isExecutingOrCompleted
              ? 'View Live Campaign'
              : 'Review Opportunity'}
          </Button>
        </div>
      </div>

      {/* 2. Top Business Health Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="30-Day Sales"
          value={`₹${(analytics?.total_revenue_30d || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          trend={growthPct}
          subtext={growthSubtext}
          variant="default"
        />
        <StatCard
          title="Customers"
          value={`${analytics?.total_customers || 220}`}
          subtext={`${analytics?.active_customers_30d || 178} ordered this month`}
          variant="highlight"
        />
        <StatCard
          title="Average Order"
          value={`₹${(analytics?.average_order_value || 0).toFixed(0)}`}
          subtext="Typical amount customers spend per order"
          variant="default"
        />
        <StatCard
          title="Customers Needing Attention"
          value={`${totalNeedingAttention}`}
          subtext="Showing signs they may stop buying"
          variant="danger"
        />
      </div>

      {/* 3. Primary Opportunity Hero: "Where can I make more money?" */}
      {opportunity ? (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/70 p-7 shadow-sm relative overflow-hidden">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Badge variant="blue" dot>
                  RECOMMENDED OPPORTUNITY
                </Badge>
                <Badge variant={isApproved ? 'emerald' : 'amber'}>
                  {isApproved ? 'Approved & Ready to Launch' : 'Priority: High'}
                </Badge>
                <span className="text-xs text-blue-700 font-medium">
                  {targetOpportunityCount} high-value customers selected from the {totalNeedingAttention} needing attention
                </span>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Found via your connected Razorpay store data
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Win back {targetOpportunityCount} valuable customers who stopped buying
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Out of {totalNeedingAttention} customers showing signs of inactivity across your store, ApexGrowth prioritized the {targetOpportunityCount} highest-spending customers for this recovery opportunity. We recommend offering them a 15% discount link valid for 72 hours.
                </p>

                {/* 4 Impact Tiles in Clean White/Light Styling */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Target Customers</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">{targetOpportunityCount} High-Value</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Potential Sales</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">
                      ₹{grossSales.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Potential Net Gain</div>
                    <div className="text-base font-bold text-emerald-600 mt-0.5">
                      +₹{netGain.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-2xs">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Expected Return</div>
                    <div className="text-base font-bold text-blue-600 mt-0.5">{roiMultiplier.toFixed(2)}x</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">₹{roiMultiplier.toFixed(2)} per ₹1 spent</div>
                  </div>
                </div>
              </div>

              {/* Action Column */}
              <div className="flex flex-col gap-3 justify-center lg:border-l lg:border-slate-200/80 lg:pl-6">
                <div className="text-xs text-slate-600 text-center lg:text-left">
                  Recommended: <strong>15% Discount Link (72h)</strong>
                </div>

                <Button
                  variant={isApproved ? 'success' : 'primary'}
                  size="md"
                  icon={isApproved ? Zap : Sparkles}
                  loading={proposing}
                  onClick={handleProposeOrReviewStrategy}
                  className="w-full justify-center"
                >
                  {isApproved
                    ? 'Execute Approved Campaign'
                    : isExecutingOrCompleted
                    ? 'View Live Campaign'
                    : 'Review Opportunity'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWhyDrawerOpen(true)}
                  className="w-full justify-center text-xs"
                >
                  Why this opportunity?
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-4 shadow-xs text-center">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Your business is connected</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Once customer payment and order activity starts flowing in via your connected Razorpay store, ApexGrowth will automatically identify high-value winback opportunities.
            </p>
          </div>
        </div>
      )}

      {/* 4. Customer Breakdown & Safety Rules Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Your Customer Groups
            </h3>
            <span className="text-xs text-slate-500 font-medium">Total: 220 Customers</span>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics?.segments?.map((seg) => (
              <div key={seg.segment} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">
                    {friendlySegmentLabels[seg.segment] || seg.segment.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {seg.customer_count} customers • Avg spend: ₹{seg.average_order_value.toFixed(0)} per order
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-semibold text-emerald-600">
                    ₹{seg.total_spend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[11px] text-amber-700 font-mono mt-0.5">
                    {seg.average_days_inactive.toFixed(0)} days inactive
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Rules Status Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Safety Rules & Guardrails
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              ApexGrowth never sends unapproved discounts or exceeds your limits.
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Maximum Discount Allowed:</span>
                <span className="text-emerald-600 font-bold font-mono">20%</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Maximum Audience:</span>
                <span className="text-slate-900 font-bold font-mono">500 People</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Campaign Budget Limit:</span>
                <span className="text-slate-900 font-bold font-mono">₹50,000</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="text-slate-500">Customer Cooldown:</span>
                <span className="text-blue-600 font-bold font-mono">14 Days</span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/policies')}
            className="w-full mt-4"
          >
            Adjust Safety Rules
          </Button>
        </div>
      </div>

      {/* Drawers & Modals */}
      <WhyExplanationDrawer
        isOpen={isWhyDrawerOpen}
        onClose={() => setIsWhyDrawerOpen(false)}
        why={currentStrategy?.why_explanation}
        opportunityTitle={opportunity?.title || 'Growth Opportunity'}
      />

      <StrategyReviewModal
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        strategy={currentStrategy}
        approvalRequest={currentApproval}
        onApprovalUpdated={handleApprovalUpdated}
      />
    </div>
  );
};
