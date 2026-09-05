import React, { useState } from 'react';
import { CampaignMetrics } from '../../types';
import { HelpCircle, Scale } from 'lucide-react';

interface ProjectedVsActualCardProps {
  metrics: CampaignMetrics;
}

export const ProjectedVsActualCard: React.FC<ProjectedVsActualCardProps> = ({ metrics }) => {
  const comparisonItems = [
    {
      title: 'Sales Generated',
      projected: metrics.projected_gross_revenue,
      actual: metrics.actual_gross_revenue,
      formatter: (val: number) => `₹${Math.floor(val).toLocaleString('en-IN')}`,
      description: 'Total revenue captured through campaign payment links',
    },
    {
      title: 'Offer Cost',
      projected: metrics.projected_campaign_cost,
      actual: metrics.actual_campaign_cost,
      formatter: (val: number) => `₹${Math.floor(val).toLocaleString('en-IN')}`,
      description: 'Total discount amount deducted on completed orders',
    },
    {
      title: 'Net Profit Gain',
      projected: metrics.projected_net_lift,
      actual: metrics.actual_net_lift,
      formatter: (val: number) => `₹${Math.floor(val).toLocaleString('en-IN')}`,
      description: 'Sales generated minus the discount given',
      highlight: true,
    },
    {
      title: 'Return on Spend',
      projected: metrics.projected_roi,
      actual: metrics.actual_roi,
      formatter: (val: number) => `${val.toFixed(2)}x`,
      description: '₹ earned for every ₹1 in discount given',
      isMultiplier: true,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <Scale className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Campaign Results: What We Expected vs What Actually Happened
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time measurement of customer purchases against the initial prediction.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            <span className="text-slate-600">Expected (Prediction)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-emerald-700">Actual Realized</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparisonItems.map((item, idx) => {
          const maxVal = Math.max(item.projected, item.actual, 1);
          const projPct = Math.min((item.projected / maxVal) * 100, 100);
          const actPct = Math.min((item.actual / maxVal) * 100, 100);

          return (
            <div
              key={idx}
              className={`rounded-xl border p-4 flex flex-col justify-between ${
                item.highlight
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {item.title}
                </div>
                <div className="mt-3 space-y-2.5">
                  <div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Expected:</span>
                      <span className="font-mono font-bold text-slate-700">{item.formatter(item.projected)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${projPct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-emerald-700 flex justify-between font-medium">
                      <span>Actual:</span>
                      <span className="font-mono font-bold text-emerald-700">{item.formatter(item.actual)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${actPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                {item.description}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong className="text-slate-800">How this is calculated:</strong> Actual Net Profit Gain is your Total Recovered Sales minus the discounts applied.
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Updates automatically on every payment</span>
      </div>
    </div>
  );
};
