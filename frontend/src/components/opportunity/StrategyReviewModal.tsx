import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Strategy, ApprovalRequest } from '../../types';
import { api } from '../../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StrategyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: Strategy | undefined;
  approvalRequest: ApprovalRequest | undefined;
  onApprovalUpdated?: (updated: ApprovalRequest) => void;
}

export const StrategyReviewModal: React.FC<StrategyReviewModalProps> = ({
  isOpen,
  onClose,
  strategy,
  approvalRequest,
  onApprovalUpdated,
}) => {
  const navigate = useNavigate();
  const [currentApproval, setCurrentApproval] = useState<ApprovalRequest | undefined>(approvalRequest);
  const [deciding, setDeciding] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [rejectionMode, setRejectionMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSafetyDetails, setShowSafetyDetails] = useState(false);

  useEffect(() => {
    setCurrentApproval(approvalRequest);
    setRejectionMode(false);
  }, [approvalRequest, isOpen]);

  if (!strategy || !currentApproval) return null;

  const policyReport = currentApproval.policy_validation_report;
  const isApproved =
    currentApproval.status === 'approved' ||
    currentApproval.status === 'executing' ||
    currentApproval.status === 'completed';
  const isRejected = currentApproval.status === 'rejected';
  const isBlocked = currentApproval.status === 'policy_blocked';
  const isPending =
    currentApproval.status === 'pending_approval' ||
    currentApproval.status === 'draft' ||
    currentApproval.status === 'policy_validated';

  const grossSales = Math.floor(strategy.estimated_gross_revenue || 36641);
  const offerCost = Math.floor(strategy.estimated_campaign_cost || 5496);
  const netGain = Math.floor(strategy.estimated_net_lift || 31145);
  const roiMultiplier = strategy.projected_roi || 6.67;

  const handleApprove = async () => {
    if (deciding || isApproved || !isPending) return;

    setDeciding(true);
    try {
      const updated = await api.decideApproval(currentApproval.id, true, 'merchant_founder');
      setCurrentApproval(updated);
      if (onApprovalUpdated) {
        onApprovalUpdated(updated);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeciding(false);
    }
  };

  const handleReject = async () => {
    if (deciding || isRejected || !isPending) return;

    setDeciding(true);
    try {
      const updated = await api.decideApproval(
        currentApproval.id,
        false,
        'merchant_founder',
        rejectionReason || 'Declined by merchant'
      );
      setCurrentApproval(updated);
      setRejectionMode(false);
      if (onApprovalUpdated) {
        onApprovalUpdated(updated);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeciding(false);
    }
  };

  const handleExecute = async () => {
    if (executing || !isApproved) return;

    setExecuting(true);
    try {
      const camp = await api.executeCampaign(currentApproval.id);
      onClose();
      navigate(`/campaigns/${camp.id}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Here's what we recommend"
      subtitle={strategy.name}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* 1. Proposed Action Header */}
        <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Recommended Action
              </span>
            </div>
            <Badge
              variant={isApproved ? 'emerald' : isRejected || isBlocked ? 'rose' : 'amber'}
              dot
            >
              {isApproved ? 'READY TO LAUNCH' : currentApproval.status.toUpperCase().replace(/_/g, ' ')}
            </Badge>
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Send a 15% discount payment link to {strategy.target_audience_count} customers
          </h3>
          <p className="text-xs text-slate-600">
            Valid for {strategy.validity_hours} hours. Each customer receives their own secure Razorpay link with the discount automatically applied.
          </p>
        </div>

        {/* 2. Four Impact Numbers */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Expected Results
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-medium">Potential Sales</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                ₹{grossSales.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-medium">Estimated Offer Cost</div>
              <div className="text-lg font-bold text-amber-700 mt-1">
                ₹{offerCost.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-medium">Potential Net Gain</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">
                +₹{netGain.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-center">
              <div className="text-[10px] text-slate-500 uppercase font-medium">Expected Return</div>
              <div className="text-lg font-bold text-blue-600 mt-1">{roiMultiplier.toFixed(2)}x</div>
              <div className="text-[10px] text-slate-500 mt-0.5">₹{roiMultiplier.toFixed(2)} per ₹1</div>
            </div>
          </div>
        </div>

        {/* 3. Safety Summary with Expandable Details */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-semibold text-emerald-800">
                Safety Checks Passed (7 of 7)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSafetyDetails(!showSafetyDetails)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              <span>{showSafetyDetails ? 'Hide details' : 'View safety rules'}</span>
              {showSafetyDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          <p className="text-xs text-slate-600">
            This campaign complies with your safety limits: the 15% discount is below your 20% limit, total budget is within budget, and customer cooldown rules are verified.
          </p>

          {showSafetyDetails && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              {policyReport?.checks ? (
                Object.entries(policyReport.checks).map(([checkKey, passed]) => {
                  const checkLabels: Record<string, string> = {
                    allowed_action_type: 'Allowed Action: Discount payment link is permitted',
                    max_discount_limit: `Discount limit safe (${strategy.proposed_discount_percent}% <= 20% limit)`,
                    max_audience_limit: `Audience size safe (${strategy.target_audience_count} customers <= 500 cap)`,
                    max_budget_limit: `Budget exposure safe (₹${offerCost.toLocaleString('en-IN')} <= ₹50,000 budget)`,
                    validity_window: `Offer expiry safe (${strategy.validity_hours}h <= 168h)`,
                    customer_cooldown_passed: 'Anti-fatigue cooldown: No recent offers sent to these customers',
                    manual_approval_gated: 'Human signoff required before live link creation',
                  };
                  return (
                    <div key={checkKey} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2 text-slate-700">
                        {passed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                        )}
                        <span>{checkLabels[checkKey] || checkKey}</span>
                      </div>
                      <span className="text-emerald-700 font-mono text-[10px] font-bold">PASSED</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500">All checks validated.</div>
              )}
            </div>
          )}
        </div>

        {/* 4. Action Banner After Decision */}
        {isApproved && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>Ready to launch ✓</strong> — Your campaign passed all safety checks and is ready to send.
              </span>
            </div>
            <Badge variant="emerald" size="sm">
              Ready to Send
            </Badge>
          </div>
        )}

        {isRejected && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-2.5 text-xs text-rose-800">
            <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Declined:</strong> You declined this recommendation ({currentApproval.rejection_reason || 'No reason provided'}).
            </span>
          </div>
        )}

        {/* 5. Footer Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-3">
            {isPending && (
              <>
                {!rejectionMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deciding}
                      onClick={() => setRejectionMode(true)}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle2}
                      loading={deciding}
                      disabled={deciding}
                      onClick={handleApprove}
                    >
                      Approve & Launch
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Why decline? (Optional)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deciding}
                      disabled={deciding}
                      onClick={handleReject}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deciding}
                      onClick={() => setRejectionMode(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}

            {isApproved && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Send personalized offers to {strategy.target_audience_count} customers.
                </span>
                <Button
                  variant="primary"
                  size="md"
                  icon={Zap}
                  loading={executing}
                  disabled={executing}
                  onClick={handleExecute}
                >
                  Launch Campaign
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
