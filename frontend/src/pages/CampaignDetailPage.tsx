import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Campaign, CampaignAction, CampaignMetrics } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ProjectedVsActualCard } from '../components/campaigns/ProjectedVsActualCard';
import { DemoPaymentControls } from '../components/campaigns/DemoPaymentControls';
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [actions, setActions] = useState<CampaignAction[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async (isManualRefresh = false) => {
    if (!id) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [camp, acts, mets] = await Promise.all([
        api.getCampaign(id),
        api.getCampaignActions(id, undefined, 100),
        api.getCampaignMetrics(id),
      ]);
      setCampaign(camp);
      setActions(acts);
      setMetrics(mets);
    } catch (err) {
      console.error('Failed to load campaign data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const copyToClipboard = (text: string, actionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(actionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!campaign || !metrics) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-xs">
        <div className="text-base font-bold text-slate-900">Campaign not found</div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/campaigns')}>
          Return to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/campaigns')}
            className="text-slate-500 hover:text-slate-900"
          >
            Campaigns
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{campaign.name}</h1>
              <Badge variant="emerald" dot>
                RUNNING
              </Badge>
              <Badge variant={campaign.execution_mode === 'razorpay_test' ? 'blue' : 'amber'}>
                {campaign.execution_mode === 'razorpay_test' ? 'Razorpay Test Mode' : 'Sandbox Simulator'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeting <strong>{campaign.target_count} customers</strong> • Started {new Date(campaign.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadData(true)}
          >
            Refresh Results
          </Button>
        </div>
      </div>

      {/* 1. Results Comparison: Expected vs Actual */}
      <ProjectedVsActualCard metrics={metrics} />

      {/* 2. Interactive Demo Simulator (Clearly Labeled) */}
      <DemoPaymentControls
        actions={actions}
        onActionSimulated={() => loadData(true)}
      />

      {/* 3. Customer Links List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Customer Payment Links
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each customer received a unique 15% discount link that deposits payments straight into your Razorpay account.
            </p>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            {metrics.conversions_count} of {actions.length} customers purchased
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Customer Link ID</th>
                <th className="p-3 text-right">Normal Price</th>
                <th className="p-3 text-right">15% Discount</th>
                <th className="p-3 text-right">Offer Price</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {actions.map((act, idx) => {
                const statusStyles: Record<string, 'emerald' | 'amber' | 'rose' | 'slate' | 'blue'> = {
                  paid: 'emerald',
                  sent: 'blue',
                  clicked: 'amber',
                  failed: 'rose',
                  expired: 'slate',
                  pending: 'slate',
                };

                const statusLabels: Record<string, string> = {
                  paid: 'Paid ✓',
                  sent: 'Sent',
                  clicked: 'Opened',
                  failed: 'Failed',
                  expired: 'Expired',
                  pending: 'Ready',
                };

                return (
                  <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-mono font-medium text-slate-900">{act.razorpay_payment_link_id}</td>
                    <td className="p-3 text-right font-mono text-slate-500">₹{act.original_amount.toFixed(0)}</td>
                    <td className="p-3 text-right font-mono text-rose-600">-₹{act.discount_amount.toFixed(0)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">
                      ₹{act.final_amount.toFixed(0)}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={statusStyles[act.status] || 'slate'} size="sm">
                        {statusLabels[act.status] || act.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyToClipboard(act.razorpay_short_url, act.id)}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Copy Link"
                        >
                          {copiedId === act.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <a
                          href={act.razorpay_short_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
