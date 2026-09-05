import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Store, Globe, Tag, ArrowRight, AlertCircle } from 'lucide-react';

export const BusinessSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { merchant, updateMerchant } = useAuth();

  const [businessName, setBusinessName] = useState(merchant?.name || '');
  const [category, setCategory] = useState(merchant?.category || 'D2C Brand');
  const [website, setWebsite] = useState(merchant?.website || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'D2C Brand',
    'Retail',
    'Food & Beverage',
    'Fashion & Apparel',
    'Electronics & Gadgets',
    'Health & Wellness',
    'Beauty & Cosmetics',
    'Services & Digital',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setError('Please enter your business or store name.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const updated = await api.setupBusiness(businessName.trim(), category, website.trim() || undefined);
      updateMerchant(updated);
      navigate('/onboarding/connect');
    } catch (err: any) {
      setError(err.message || 'Failed to save business details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
          Step 2 of 5 • Business
        </div>
        <h2 className="text-xl font-bold text-slate-900">Tell us about your business</h2>
        <p className="text-xs text-slate-500">
          ApexGrowth customizes revenue recovery recommendations for your store type.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Store / Brand Name</label>
          <div className="relative">
            <Store className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. Bombay Roasters Co."
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Business Category</label>
          <div className="relative">
            <Tag className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Store Website <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Globe className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="url"
              placeholder="https://yourstore.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Takes less than 1 minute</span>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={ArrowRight}
            loading={submitting}
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};
