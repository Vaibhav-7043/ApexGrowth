import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CreditCard, ShieldCheck, Zap, ArrowRight, AlertCircle } from 'lucide-react';

export const RazorpayConnectPage: React.FC = () => {
  const navigate = useNavigate();
  const { updateMerchant } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      const updated = await api.connectRazorpay(undefined, undefined, 'test');
      updateMerchant(updated);
      navigate('/onboarding/sync');
    } catch (err: any) {
      setError(err.message || 'Failed to connect Razorpay test mode.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
          Step 3 of 5 • Razorpay Setup
        </div>
        <h2 className="text-xl font-bold text-slate-900">Connect Razorpay</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Razorpay provides the payment activity ApexGrowth uses to identify revenue opportunities and track campaign results.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Razorpay Test Rail</h3>
              <div className="text-[11px] text-blue-700 font-medium">Safe Demo Sandbox</div>
            </div>
          </div>
          <Badge variant="amber" dot>
            Test Mode
          </Badge>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          Safe for buildathon demonstrations — personalized payment links and webhooks operate in test mode so no real customer money is ever charged.
        </p>

        <div className="rounded-xl bg-white border border-blue-100 p-3.5 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Pre-configured 1-click test mode connection</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span>Automatic webhook listener for real-time payment capture</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/onboarding/connect')}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium"
        >
          ← Back
        </button>
        <Button
          type="button"
          variant="primary"
          size="md"
          icon={ArrowRight}
          loading={connecting}
          onClick={handleConnect}
        >
          Connect Razorpay
        </Button>
      </div>
    </div>
  );
};
