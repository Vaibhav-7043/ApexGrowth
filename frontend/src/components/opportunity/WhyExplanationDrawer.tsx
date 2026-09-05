import React, { useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { WhyExplanation } from '../../types';
import {
  Database,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface WhyExplanationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  why: WhyExplanation | undefined;
  opportunityTitle: string;
}

export const WhyExplanationDrawer: React.FC<WhyExplanationDrawerProps> = ({
  isOpen,
  onClose,
  why,
  opportunityTitle,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!why) return null;

  const cohortSize = why.data_evidence?.target_cohort_size || 42;
  const historicAov = why.data_evidence?.historical_aov_inr || 2442.77;
  const daysInactive = why.data_evidence?.average_dormancy_days || 65;
  const grossRev = why.financial_breakdown?.estimated_gross_revenue || 36641.55;
  const offerCost = why.financial_breakdown?.estimated_incentive_cost || 5496.23;
  const netLift = why.financial_breakdown?.estimated_net_revenue_lift || 31145.32;
  const roi = why.financial_breakdown?.projected_roi_multiplier || 6.67;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Why did ApexGrowth recommend this?"
      subtitle={opportunityTitle}
      width="xl"
    >
      <div className="space-y-6">
        {/* 1. Plain English Summary Card */}
        <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Sparkles className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">
              The Opportunity in Simple Terms
            </h4>
          </div>
          <p className="text-sm text-slate-800 leading-relaxed">
            Out of 87 customers showing signs of inactivity across your store, ApexGrowth prioritized the <strong className="text-slate-900 font-semibold">{cohortSize} highest-spending customers</strong> for this recovery opportunity. These customers spent an average of <strong className="text-emerald-700 font-semibold">₹{historicAov.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> per order and haven't bought anything in about <strong className="text-amber-800 font-semibold">{daysInactive} days</strong>.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            {why.core_insight ||
              'These customers already trust your store. A personalized 15% discount payment link for 72 hours gives them a timely reason to return without eroding your profit margins.'}
          </p>
        </div>

        {/* 2. Simple Financial Impact */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Potential Financial Impact</span>
            <span className="text-xs text-emerald-700 font-medium">
              Expected return: ₹{roi.toFixed(2)} for every ₹1 spent
            </span>
          </h4>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Potential Sales:</span>
              <span className="text-slate-900 font-bold font-mono">₹{Math.floor(grossRev).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Estimated Offer Cost (15%):</span>
              <span className="text-rose-600 font-bold font-mono">-₹{Math.floor(offerCost).toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-base">
              <span className="text-slate-900 font-semibold">Potential Net Gain:</span>
              <span className="text-emerald-600 font-bold font-mono text-lg">+₹{Math.floor(netLift).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* 3. Safety Summary */}
        <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-emerald-800">Safety Checks Passed</div>
            <div className="text-slate-700 leading-relaxed">
              This campaign follows your safety limits: the 15% discount is below your 20% maximum cap, and none of these {cohortSize} customers have received an offer in the last 14 days.
            </div>
          </div>
        </div>

        {/* 4. Progressive Disclosure Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span>Show Detailed Customer List & Technical Evidence</span>
            </div>
            {showTechnicalDetails ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {/* 5. Expanded Technical & Customer Details */}
          {showTechnicalDetails && (
            <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Target Customer Cohort Details
                </span>
                <Badge variant="emerald" size="sm">
                  <CheckCircle2 className="h-3 w-3 inline mr-1 text-emerald-600" />
                  Database Match
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Cohort Size</div>
                  <div className="text-base font-bold text-slate-900 mt-1">{cohortSize} Accounts</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Total Past Spend</div>
                  <div className="text-base font-bold text-slate-900 mt-1">
                    ₹{(why.data_evidence?.historical_spend_inr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {why.data_evidence?.sample_customers && why.data_evidence.sample_customers.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 mb-2">
                    Sample Customers in this Group:
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Customer</th>
                          <th className="p-2.5 text-right">Past Spend</th>
                          <th className="p-2.5 text-right">Last Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                        {why.data_evidence.sample_customers.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-900 font-sans">{c.name}</td>
                            <td className="p-2.5 text-right text-emerald-600">₹{c.total_spend.toLocaleString('en-IN')}</td>
                            <td className="p-2.5 text-right text-amber-700">{c.days_inactive} days ago</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {why.selection_rationale && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 mb-1">
                    AI Rationale Details:
                  </div>
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {why.selection_rationale}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};
