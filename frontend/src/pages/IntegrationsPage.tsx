import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { HealthStatus, Merchant } from '../types';
import { Badge } from '../components/ui/Badge';
import {
  Layers,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Globe,
  Code2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Database,
} from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [h, m] = await Promise.all([api.getHealth(), api.getMerchant()]);
        setHealth(h);
        setMerchant(m);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const isRazorpayTest = health?.razorpay_mode === 'razorpay_test';

  const dataPoints = [
    {
      title: 'Customer Purchases',
      desc: 'Total lifetime spend and order history across your store.',
    },
    {
      title: 'Order History',
      desc: 'Order dates, amounts, and frequency to spot purchasing patterns.',
    },
    {
      title: 'Payment Activity',
      desc: 'Successful payment links and real-time webhook confirmations.',
    },
    {
      title: 'Average Order Value',
      desc: 'Typical basket sizes to set profitable, safe discount thresholds.',
    },
    {
      title: 'Recent Activity',
      desc: 'Days since last purchase to detect customers who may stop buying.',
    },
    {
      title: 'Campaign Responses',
      desc: 'Which customers opened and paid through past re-engagement links.',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* 1. Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Connected Stores & Payments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect the tools you already use to help ApexGrowth understand your business.
        </p>
      </div>

      {/* 2. Connection Status Summary Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Your Business Connections
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-slate-900">Razorpay</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Connected (Test Mode)</div>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px] text-slate-400">
              ○
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700">Shopify</div>
              <div className="text-[10px] text-slate-500">Coming Soon</div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px] text-slate-400">
              ○
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700">WooCommerce</div>
              <div className="text-[10px] text-slate-500">Coming Soon</div>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border border-slate-400 flex items-center justify-center text-[10px] text-slate-400">
              ○
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700">Custom Store</div>
              <div className="text-[10px] text-slate-500">API Connection</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Simple Visual Data Flow */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-blue-700">
            <Layers className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              How Your Store Data Becomes Sales
            </h3>
          </div>
          <span className="text-xs text-emerald-700 font-semibold">Automatic 5-Step Process</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-blue-700 uppercase">1. Your Tools</div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Store & Payments</div>
              <p className="text-[10px] text-slate-500 mt-1">Razorpay, Shopify, or WooCommerce</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 self-end mt-2 hidden md:block" />
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-blue-700 uppercase">2. Order Analysis</div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Customer History</div>
              <p className="text-[10px] text-slate-500 mt-1">Identifies buyers who stopped ordering</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 self-end mt-2 hidden md:block" />
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-purple-700 uppercase">3. Smart Opportunity</div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Action Proposal</div>
              <p className="text-[10px] text-slate-500 mt-1">Suggests targeted 15% discount link</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 self-end mt-2 hidden md:block" />
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-amber-700 uppercase">4. Safety & Signoff</div>
              <div className="text-xs font-semibold text-slate-900 mt-1">Your 1-Click Approval</div>
              <p className="text-[10px] text-slate-500 mt-1">Verified against your safety rules</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 self-end mt-2 hidden md:block" />
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase">5. Recovered Sales</div>
              <div className="text-xs font-semibold text-emerald-800 mt-1">Direct Deposits</div>
              <p className="text-[10px] text-slate-600 mt-1">Customers pay via personalized links</p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 self-end mt-2" />
          </div>
        </div>
      </div>

      {/* 4. Connectors Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4">
          Store & Payment Connectors
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Razorpay (ACTIVE / TEST MODE) */}
          <div className="rounded-2xl border border-blue-200 bg-white p-6 space-y-4 relative shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Razorpay</h3>
                  <div className="text-xs text-slate-500">Payment links & checkout attribution</div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <Badge variant={isRazorpayTest ? 'blue' : 'amber'} dot>
                  {isRazorpayTest ? 'CONNECTED' : 'CONNECTED'}
                </Badge>
                <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">
                  TEST MODE
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Used by ApexGrowth for the current buildathon demonstration to securely generate personalized payment links and track customer payments.
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Merchant Store:</span>
                <span className="text-slate-900 font-semibold">{merchant?.name || 'Artisan Roasters Co.'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Environment:</span>
                <span className="text-emerald-700 font-semibold">Test Mode (Safe Demo)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
              <span>Ready for campaign dispatches</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Fully Active
              </span>
            </div>
          </div>

          {/* Shopify (COMING SOON) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 opacity-90 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Shopify</h3>
                  <div className="text-xs text-slate-500">Store catalog & cart recovery</div>
                </div>
              </div>

              <Badge variant="purple">
                COMING SOON
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connect your Shopify store to bring your store catalog, customer purchase history, and cart abandonment data into ApexGrowth.
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Connection Type:</span>
                <span>Shopify App Store OAuth 2.0</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-purple-700 font-medium">Planned for Production</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
              <span>1-Click App Installation</span>
              <span>Available in Future Release</span>
            </div>
          </div>

          {/* WooCommerce (COMING SOON) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 opacity-90 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">WooCommerce</h3>
                  <div className="text-xs text-slate-500">WordPress store sync</div>
                </div>
              </div>

              <Badge variant="purple">
                COMING SOON
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connect your WooCommerce store to bring your customer order history and purchase frequency into ApexGrowth.
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Connection Type:</span>
                <span>WordPress Plugin & REST API</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-purple-700 font-medium">Planned for Production</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
              <span>WordPress Plugin Connector</span>
              <span>Available in Future Release</span>
            </div>
          </div>

          {/* Custom Store (API CONNECTION) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 opacity-90 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Custom Store</h3>
                  <div className="text-xs text-slate-500">API connection for custom stores</div>
                </div>
              </div>

              <Badge variant="slate">
                API SPECS READY
              </Badge>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connect your own website or commerce system using the ApexGrowth API for custom Next.js, Laravel, or Headless stores.
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Endpoint:</span>
                <span className="font-mono text-slate-800">POST /api/v1/orders/ingest</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
              <span>Bespoke & Headless Stores</span>
              <span>Developer Documentation Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. What Data Does ApexGrowth Use? */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">What does ApexGrowth look at?</h3>
        <p className="text-xs text-slate-500">
          ApexGrowth only analyzes historical order and payment data from your connected Razorpay store to identify growth opportunities.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {dataPoints.map((item) => (
            <div
              key={item.title}
              className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1"
            >
              <div className="text-xs font-semibold text-slate-900">{item.title}</div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Buildathon Demo Transparency */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 flex items-start gap-4 shadow-xs">
        <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
            Buildathon Demo Transparency
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            This demonstration uses a deterministic merchant dataset for <strong>Artisan Roasters Co.</strong> (220 customer profiles and transaction records) and <strong>Razorpay Test Mode</strong> to safely demonstrate the complete ApexGrowth workflow without using real money.
          </p>
        </div>
      </div>

      {/* 7. Advanced Technical Details (Progressive Disclosure) */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-all"
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            <span>{showTechnicalDetails ? 'Hide technical integration architecture' : 'How integrations work & technical details'}</span>
          </div>
          {showTechnicalDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-6 space-y-4 text-xs font-mono text-slate-600 shadow-xs">
            <div className="border-b border-slate-100 pb-2 flex justify-between text-slate-900 font-sans font-bold">
              <span>Technical Connector Specifications</span>
              <span>Architecture Layer: Data Ingestion</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="text-slate-900 font-semibold font-sans">Active Razorpay Rail:</div>
                <div>Mode: <span className="text-blue-700 font-bold">Razorpay Test API v1 & Local Simulator</span></div>
                <div>Webhook Receiver: <span className="text-emerald-700 font-bold">/api/webhooks/razorpay</span></div>
                <div>Idempotency: <span className="text-emerald-700 font-bold">SHA-256 Ledger Lock</span></div>
              </div>

              <div className="space-y-1.5">
                <div className="text-slate-900 font-semibold font-sans">Roadmap Connectors:</div>
                <div>Shopify Admin: <span className="text-slate-700">GraphQL v2024-04 (Orders & Carts)</span></div>
                <div>WooCommerce: <span className="text-slate-700">REST API v3 Webhooks</span></div>
                <div>Custom Store: <span className="text-slate-700">REST Ingestion Schema (/api/v1/orders/ingest)</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
