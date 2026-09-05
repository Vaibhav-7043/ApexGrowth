import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuditEvent, AuditChainVerification } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [verification, setVerification] = useState<AuditChainVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [showCryptoDetails, setShowCryptoDetails] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'campaigns' | 'payments' | 'approvals' | 'system'>('all');

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [evts, ver] = await Promise.all([
        api.getAuditEvents(150),
        api.verifyAuditChain(),
      ]);
      setEvents(evts);
      setVerification(ver);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const handleReverify = async () => {
    setVerifying(true);
    try {
      const ver = await api.verifyAuditChain();
      setVerification(ver);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

  const filterTabs = [
    { key: 'all', label: 'All Activity' },
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'payments', label: 'Payments' },
    { key: 'approvals', label: 'Approvals & Safety' },
    { key: 'system', label: 'System' },
  ];

  const filteredEvents = events.filter((evt) => {
    if (selectedFilter === 'all') return true;
    const act = evt.action.toLowerCase();
    if (selectedFilter === 'campaigns') return act.includes('campaign') || act.includes('execute');
    if (selectedFilter === 'payments') return act.includes('payment') || act.includes('link');
    if (selectedFilter === 'approvals') return act.includes('approval') || act.includes('decision') || act.includes('policy');
    if (selectedFilter === 'system') return act.includes('opportunity') || act.includes('seed') || act.includes('system');
    return true;
  });

  const getEventTitle = (action: string): string => {
    const act = action.toUpperCase();
    if (act.includes('OPPORTUNITY_DETECTED') || act.includes('OPPORTUNITY_CREATED')) return 'A growth opportunity was found';
    if (act.includes('STRATEGY_PROPOSED')) return 'A new campaign was recommended';
    if (act.includes('STRATEGY_APPROVED') || act.includes('APPROVAL_DECIDED')) return 'Campaign approved';
    if (act.includes('STRATEGY_REJECTED')) return 'Campaign declined';
    if (act.includes('POLICY_VALIDATED')) return 'Safety checks completed';
    if (act.includes('POLICY_BLOCKED')) return 'Safety limit protected';
    if (act.includes('CAMPAIGN_EXECUTED')) return 'Campaign launched';
    if (act.includes('PAYMENT_LINK_CREATED')) return 'Payment link created';
    if (act.includes('PAYMENT_CAPTURED') || act.includes('PAYMENT_SUCCESS')) return 'Customer payment received';
    if (act.includes('PAYMENT_FAILED')) return 'Payment could not be completed';
    if (act.includes('PAYMENT_EXPIRED')) return 'Payment link expired';
    if (act.includes('REVENUE_ATTRIBUTED')) return 'Sales attributed to campaign';
    if (act.includes('CAMPAIGN_COMPLETED')) return 'Campaign completed';
    return action.replace(/_/g, ' ');
  };

  const getEventActorBadge = (actorType: string): { label: string; variant: 'blue' | 'purple' | 'amber' | 'emerald' | 'slate' } => {
    const map: Record<string, { label: string; variant: 'blue' | 'purple' | 'amber' | 'emerald' | 'slate' }> = {
      growth_agent: { label: 'AI Assistant', variant: 'purple' },
      policy_engine: { label: 'Safety Guard', variant: 'blue' },
      merchant_admin: { label: 'Merchant / You', variant: 'emerald' },
      merchant: { label: 'Merchant / You', variant: 'emerald' },
      razorpay_api: { label: 'Razorpay', variant: 'blue' },
      sandbox_simulator: { label: 'Demo Simulator', variant: 'amber' },
      system: { label: 'System', variant: 'slate' },
    };
    return map[actorType] || { label: actorType.replace(/_/g, ' '), variant: 'slate' };
  };

  const getEventStatusIcon = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('FAILED') || act.includes('BLOCKED') || act.includes('REJECTED')) {
      return <span className="text-rose-600 font-bold text-xs">✕ Failed</span>;
    }
    if (act.includes('PENDING') || act.includes('SENT') || act.includes('SIMULAT')) {
      return <span className="text-amber-700 font-bold text-xs">● In progress</span>;
    }
    return <span className="text-emerald-700 font-bold text-xs">✓ Completed</span>;
  };

  const extractFinancialAmount = (details: Record<string, any>): string | null => {
    if (!details) return null;
    if (details.amount) return `₹${Number(details.amount).toLocaleString('en-IN')}`;
    if (details.final_amount) return `+₹${Number(details.final_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (details.gross_revenue) return `₹${Number(details.gross_revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (details.net_lift) return `+₹${Number(details.net_lift).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    return null;
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity History</h1>
          <p className="text-sm text-slate-500 mt-1">
            See what ApexGrowth and your team have done, from recommendations to campaign results.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={verifying}
          onClick={handleReverify}
        >
          Check Log Integrity
        </Button>
      </div>

      {/* 2. Simple Audit Integrity Status Card */}
      {verification && (
        <div
          className={`rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
            verification.is_valid
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-rose-200 bg-rose-50/60'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                verification.is_valid
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              {verification.is_valid ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {verification.is_valid ? 'Audit Integrity' : 'Integrity Issue Detected'}
                </h3>
                <Badge variant={verification.is_valid ? 'emerald' : 'rose'} dot>
                  {verification.is_valid ? '✓ Verified' : '⚠ Warning'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {verification.is_valid
                  ? 'Your activity history has passed the security check and is verified as tamper-proof.'
                  : 'A discrepancy was detected in the activity history chain.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCryptoDetails(!showCryptoDetails)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            <span>{showCryptoDetails ? 'Hide security details' : 'View security details'}</span>
            {showCryptoDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}

      {showCryptoDetails && verification && (
        <div className="rounded-xl bg-white border border-slate-200 p-4 text-xs font-mono text-slate-600 space-y-1.5 shadow-xs">
          <div className="text-slate-900 font-sans font-bold text-xs pb-1 border-b border-slate-100">
            Cryptographic Hash Chain Specification
          </div>
          <div>Genesis Hash: <span className="text-slate-900">{verification.genesis_hash}</span></div>
          <div>Latest Hash: <span className="text-emerald-700 font-bold">{verification.latest_hash}</span></div>
          <div>Total Sequence Events: <span className="text-slate-900 font-bold">{verification.total_events}</span></div>
          <div>Algorithm: SHA-256 (Merkle Sequential Chain)</div>
        </div>
      )}

      {/* 3. Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedFilter === tab.key
                ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Simple Chronological Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            Activity Timeline
          </h3>
          <span className="text-xs text-slate-500">
            Showing {filteredEvents.length} recorded events
          </span>
        </div>

        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Clock className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-900">No activity yet</div>
            <p className="text-xs text-slate-500">Your ApexGrowth activity will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              const actor = getEventActorBadge(evt.actor_type);
              const title = getEventTitle(evt.action);
              const status = getEventStatusIcon(evt.action);
              const financialAmount = extractFinancialAmount(evt.details);
              const isExpanded = expandedEventId === evt.id;

              return (
                <div
                  key={evt.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-400">#{evt.sequence_number}</span>
                      <Badge variant={actor.variant} size="sm">
                        {actor.label}
                      </Badge>
                      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                      {financialAmount && (
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {financialAmount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {status}
                      <span className="text-[11px] text-slate-500">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{evt.summary}</p>

                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="text-slate-500 text-[11px]">
                      {new Date(evt.timestamp).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => toggleExpand(evt.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-xs flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide technical details' : 'View technical audit details'}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 rounded-lg bg-white p-4 text-[11px] font-mono text-slate-700 space-y-2 border border-slate-200 shadow-2xs">
                      <div className="flex justify-between text-slate-500 pb-1 border-b border-slate-100">
                        <span>Event ID: {evt.id}</span>
                        <span>Action: {evt.action}</span>
                      </div>
                      <div className="truncate text-slate-500">
                        SHA-256 Hash: <span className="text-slate-900 font-medium">{evt.current_hash}</span>
                      </div>
                      <div className="truncate text-slate-500">
                        Previous Hash: <span className="text-slate-900 font-medium">{evt.prev_hash}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-slate-500 font-sans font-semibold">Payload Data:</span>
                        <pre className="mt-1 p-2 rounded bg-slate-50 text-slate-800 overflow-x-auto text-[10px] border border-slate-200">
                          {JSON.stringify(evt.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
