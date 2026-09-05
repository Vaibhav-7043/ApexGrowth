import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  trend?: number;
  icon?: LucideIcon;
  variant?: 'default' | 'highlight' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  variant = 'default',
}) => {
  const borderStyles = {
    default: 'border-slate-200/90 bg-white shadow-xs hover:border-slate-300',
    highlight: 'border-blue-200 bg-blue-50/40 shadow-xs hover:border-blue-300',
    danger: 'border-rose-200 bg-rose-50/30 shadow-xs hover:border-rose-300',
  };

  return (
    <div className={`rounded-2xl border p-5 transition-all ${borderStyles[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
              trend >= 0
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                : 'text-rose-700 bg-rose-50 border border-rose-200'
            }`}
          >
            {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend >= 0 ? `+${trend}%` : `${trend}%`}
          </div>
        )}
      </div>
      {subtext && <div className="mt-1 text-xs text-slate-500">{subtext}</div>}
    </div>
  );
};
