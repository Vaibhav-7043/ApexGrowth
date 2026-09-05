import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';
import { CampaignAction } from '../../types';
import { Play, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';

interface DemoPaymentControlsProps {
  actions: CampaignAction[];
  onActionSimulated: () => void;
}

export const DemoPaymentControls: React.FC<DemoPaymentControlsProps> = ({
  actions,
  onActionSimulated,
}) => {
  const [selectedActionId, setSelectedActionId] = useState<string>(actions[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [simulating, setSimulating] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const pendingActions = actions.filter((a) => a.status !== 'paid' && a.status !== 'failed');
  const currentAction = actions.find((a) => a.id === selectedActionId) || pendingActions[0] || actions[0];

  const handleSimulate = async (eventType: 'SUCCESS' | 'FAILURE' | 'EXPIRED') => {
    if (!currentAction) return;
    setSimulating(true);
    setLastMessage(null);
    try {
      const res = await api.simulatePayment(
        currentAction.id,
        eventType,
        paymentMethod,
        eventType === 'FAILURE' ? 'Customer bank server unavailable' : undefined
      );
      setLastMessage(res.message);
      onActionSimulated();
    } catch (err: any) {
      setLastMessage(`Error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-amber-200 pb-3">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-amber-700" />
          <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
            Demo & Testing Simulator
          </h3>
        </div>
        <Badge variant="amber" size="sm">
          Interactive Testing Tool
        </Badge>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed">
        Test how ApexGrowth works in real-time. Click below to simulate a customer opening their Razorpay payment link and completing their purchase.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1.5">
            Select Customer Payment Link
          </label>
          <select
            value={currentAction?.id || ''}
            onChange={(e) => setSelectedActionId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
          >
            {actions.map((act, i) => (
              <option key={act.id} value={act.id}>
                Customer #{i + 1} • Link: {act.razorpay_payment_link_id} (₹{act.final_amount.toFixed(0)}) — {act.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1.5">
            Simulated Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['upi', 'card', 'netbanking'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase border transition-all ${
                  paymentMethod === method
                    ? 'border-amber-400 bg-amber-100 text-amber-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          variant="success"
          size="sm"
          icon={CheckCircle2}
          loading={simulating}
          onClick={() => handleSimulate('SUCCESS')}
        >
          Simulate Customer Payment (Capture ₹{currentAction?.final_amount.toFixed(0) || '0'})
        </Button>

        <Button
          variant="danger"
          size="sm"
          icon={AlertOctagon}
          loading={simulating}
          onClick={() => handleSimulate('FAILURE')}
        >
          Simulate Payment Failure
        </Button>

        <Button
          variant="outline"
          size="sm"
          icon={Clock}
          loading={simulating}
          onClick={() => handleSimulate('EXPIRED')}
        >
          Simulate Link Expiration
        </Button>
      </div>

      {lastMessage && (
        <div className="rounded-xl bg-white border border-emerald-200 p-3 text-xs font-mono text-emerald-700 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
          <span>{lastMessage}</span>
        </div>
      )}
    </div>
  );
};
