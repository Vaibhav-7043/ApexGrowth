import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CreditCard, ShoppingBag, Globe, Code2, ArrowRight } from 'lucide-react';

export const ConnectToolsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
          Step 3 of 5 • Connect
        </div>
        <h2 className="text-xl font-bold text-slate-900">Connect your business tools</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          ApexGrowth analyzes your store and payment data to find customers who may stop buying.
        </p>
      </div>

      <div className="space-y-3">
        {/* Razorpay (AVAILABLE / ACTIVE FOR BUILDATHON) */}
        <div className="rounded-xl border-2 border-blue-600 bg-blue-50/30 p-4.5 space-y-3 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Razorpay</h4>
                <div className="text-[11px] text-slate-500">Payment links & checkout recovery</div>
              </div>
            </div>
            <Badge variant="blue" dot>
              Available (Test Mode)
            </Badge>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Connect Razorpay to evaluate historical payments, generate personalized discount payment links, and track real-time revenue attribution.
          </p>

          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase">
              ● Safe Test Environment
            </span>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={ArrowRight}
              onClick={() => navigate('/onboarding/razorpay')}
            >
              Connect Razorpay
            </Button>
          </div>
        </div>

        {/* Shopify (COMING SOON) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex items-center justify-between opacity-80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Shopify</h4>
              <p className="text-[11px] text-slate-500">Store catalog & cart sync</p>
            </div>
          </div>
          <Badge variant="purple" size="sm">
            Coming Soon
          </Badge>
        </div>

        {/* WooCommerce (COMING SOON) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex items-center justify-between opacity-80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">WooCommerce</h4>
              <p className="text-[11px] text-slate-500">WordPress store connector</p>
            </div>
          </div>
          <Badge variant="purple" size="sm">
            Coming Soon
          </Badge>
        </div>

        {/* Custom Store (API READY) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex items-center justify-between opacity-80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Custom Store API</h4>
              <p className="text-[11px] text-slate-500">POST /api/v1/orders/ingest</p>
            </div>
          </div>
          <Badge variant="slate" size="sm">
            API Specs Ready
          </Badge>
        </div>
      </div>
    </div>
  );
};
