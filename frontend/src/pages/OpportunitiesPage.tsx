import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Opportunity, Strategy, ApprovalRequest } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { WhyExplanationDrawer } from '../components/opportunity/WhyExplanationDrawer';
import { StrategyReviewModal } from '../components/opportunity/StrategyReviewModal';
import { Sparkles, HelpCircle, Zap } from 'lucide-react';

export const OpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposingId, setProposingId] = useState<string | null>(null);

  // Modals state
  const [isWhyDrawerOpen, setIsWhyDrawerOpen] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | undefined>(undefined);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | undefined>(undefined);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const loadOpportunities = async () => {
    try {
      const opps = await api.listOpportunities();
      setOpportunities(opps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const handleProposeOrReview = async (opp: Opportunity) => {
    setSelectedOpportunity(opp);

    if (opp.strategy && opp.strategy.approval_request) {
      setSelectedStrategy(opp.strategy);
      setSelectedApproval(opp.strategy.approval_request);
      setIsStrategyModalOpen(true);
      return;
    }

    setProposingId(opp.id);
    try {
      const res = await api.proposeStrategy(opp.id, 15.0);
      setSelectedStrategy(res.strategy);
      setSelectedApproval(res.approval_request);
      setIsStrategyModalOpen(true);
      await loadOpportunities();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProposingId(null);
    }
  };

  const handleInspectWhy = async (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    if (!opp.strategy) {
      setProposingId(opp.id);
      try {
        const res = await api.proposeStrategy(opp.id, 15.0);
        setSelectedStrategy(res.strategy);
        setSelectedApproval(res.approval_request);
        setIsWhyDrawerOpen(true);
        await loadOpportunities();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setProposingId(null);
      }
    } else {
      setSelectedStrategy(opp.strategy);
      setIsWhyDrawerOpen(true);
    }
  };

  const handleApprovalUpdated = (updated: ApprovalRequest) => {
    setSelectedApproval(updated);
    loadOpportunities();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Revenue Opportunities</h1>
          <p className="text-sm text-slate-500 mt-1">
            ApexGrowth monitors your customer activity and alerts you when action can recover or grow your sales.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const isApproved = opp.strategy?.approval_request?.status === 'approved';
            const grossSales = Math.floor(opp.strategy?.estimated_gross_revenue || opp.estimated_recoverable_revenue || 36641);
            const netGain = Math.floor(opp.strategy?.estimated_net_lift || 31145);

            return (
              <div
                key={opp.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="blue" dot>
                      OPPORTUNITY
                    </Badge>
                    <Badge variant={isApproved ? 'emerald' : opp.urgency === 'HIGH' ? 'amber' : 'slate'}>
                      {isApproved ? 'Approved by You' : `Priority: ${opp.urgency}`}
                    </Badge>
                    <span className="text-xs text-blue-700 font-medium">
                      {opp.target_customer_count} high-value customers selected from 87 needing attention
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Recommended: 15% discount for 72 hours
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Win back {opp.target_customer_count} valuable customers who stopped buying
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Out of 87 customers showing signs of inactivity across your store, ApexGrowth prioritized the {opp.target_customer_count} highest-spending customers for this recovery opportunity.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Target Customers</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">{opp.target_customer_count} High-Value</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Past Spend</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">₹{opp.total_historical_spend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Potential Sales</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">₹{grossSales.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <div className="text-[10px] text-slate-500 uppercase font-medium">Potential Net Gain</div>
                    <div className="text-base font-bold text-emerald-600 mt-0.5">+₹{netGain.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={HelpCircle}
                    onClick={() => handleInspectWhy(opp)}
                  >
                    See Why
                  </Button>
                  <Button
                    variant={isApproved ? 'success' : 'primary'}
                    size="sm"
                    icon={isApproved ? Zap : Sparkles}
                    loading={proposingId === opp.id}
                    onClick={() => handleProposeOrReview(opp)}
                  >
                    {isApproved
                      ? 'Execute Campaign'
                      : opp.strategy
                      ? 'Review Opportunity'
                      : 'Review Opportunity'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawers & Modals */}
      <WhyExplanationDrawer
        isOpen={isWhyDrawerOpen}
        onClose={() => setIsWhyDrawerOpen(false)}
        why={selectedStrategy?.why_explanation}
        opportunityTitle={selectedOpportunity?.title || 'Growth Opportunity'}
      />

      <StrategyReviewModal
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        strategy={selectedStrategy}
        approvalRequest={selectedApproval}
        onApprovalUpdated={handleApprovalUpdated}
      />
    </div>
  );
};
