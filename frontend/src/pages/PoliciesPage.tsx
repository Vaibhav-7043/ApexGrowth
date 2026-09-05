import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PolicyConfig } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Save, CheckCircle2, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export const PoliciesPage: React.FC = () => {
  const [policy, setPolicy] = useState<PolicyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Form fields
  const [maxDiscount, setMaxDiscount] = useState(20.0);
  const [maxAudience, setMaxAudience] = useState(500);
  const [maxBudget, setMaxBudget] = useState(50000.0);
  const [cooldownDays, setCooldownDays] = useState(14);
  const [manualThreshold, setManualThreshold] = useState(5000.0);

  const loadPolicy = async () => {
    setLoading(true);
    try {
      const p = await api.getPolicy();
      setPolicy(p);
      setMaxDiscount(p.max_discount_percent);
      setMaxAudience(p.max_campaign_audience);
      setMaxBudget(p.max_budget_inr);
      setCooldownDays(p.cooldown_days_per_customer);
      setManualThreshold(p.require_manual_approval_above_inr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicy();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updatePolicy({
        max_discount_percent: Number(maxDiscount),
        max_campaign_audience: Number(maxAudience),
        max_budget_inr: Number(maxBudget),
        cooldown_days_per_customer: Number(cooldownDays),
        require_manual_approval_above_inr: Number(manualThreshold),
      });
      setPolicy(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Safety Rules & Spending Limits</h1>
          <p className="text-sm text-slate-500 mt-1">
            Set the maximum discount, audience size, and budget limits that ApexGrowth must never exceed.
          </p>
        </div>

        <Badge variant="emerald" dot>
          Safety Active
        </Badge>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Guardrails for AI Recommendations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ApexGrowth is mathematically restricted to these boundaries. Any campaign exceeding these limits will be blocked.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Max Discount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Maximum Discount Allowed (%)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500">The highest discount the AI can ever propose (default: 20%)</p>
            </div>

            {/* Max Audience */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Maximum Customer Audience per Campaign
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={maxAudience}
                onChange={(e) => setMaxAudience(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500">Limit on how many customers can be contacted at once</p>
            </div>

            {/* Max Budget INR */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Maximum Total Campaign Budget (INR)
              </label>
              <input
                type="number"
                min="500"
                step="500"
                value={maxBudget}
                onChange={(e) => setMaxBudget(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500">Maximum discount value across all generated payment links</p>
            </div>

            {/* Customer Cooldown Days */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Customer Rest Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={cooldownDays}
                onChange={(e) => setCooldownDays(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500">Minimum days to wait before sending another offer to the same person</p>
            </div>

            {/* Manual Approval Threshold */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Always Require My Approval Above (INR)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={manualThreshold}
                onChange={(e) => setManualThreshold(parseFloat(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500">Any campaign above this amount requires your manual signoff</p>
            </div>
          </div>

          {/* Progressive disclosure for technical policy rules */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              <span>{showTechnicalDetails ? 'Hide technical rule engine' : 'View technical rule engine details'}</span>
              {showTechnicalDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="text-slate-900 font-semibold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-blue-600" />
                  Deterministic Pre-Execution Verification
                </div>
                <p className="leading-relaxed">
                  Every strategy proposed by the LLM is intercepted by the Python Policy Engine service. All parameters are validated prior to generating human approval requests. Pre-execution checks re-verify all 7 constraints immediately before generating Razorpay links.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Safety limits saved successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-500">Changes take effect immediately on all new recommendations</span>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              loading={saving}
            >
              Save Safety Rules
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
