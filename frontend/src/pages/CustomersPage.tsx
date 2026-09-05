import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Customer } from '../types';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Drawer } from '../components/ui/Drawer';
import {
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<keyof Customer>('total_spend');
  const [sortAsc, setSortAsc] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const seg = selectedSegment === 'all' ? undefined : selectedSegment;
      const data = await api.getCustomers(seg, 250);
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [selectedSegment]);

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredAndSortedCustomers = customers
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

  const segmentTabs = [
    { key: 'all', label: 'All Customers' },
    { key: 'at_risk_high_value', label: 'Needing Attention' },
    { key: 'champions', label: 'Top Regulars' },
    { key: 'loyal_coffee_lovers', label: 'Loyal Buyers' },
    { key: 'promising_new', label: 'New & Promising' },
    { key: 'slipping_occasional', label: 'Slipping Away' },
    { key: 'dormant_lost', label: 'Dormant' },
  ];

  const segmentLabels: Record<string, { label: string; variant: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate'; explanation: string }> = {
    at_risk_high_value: {
      label: 'Needing Attention',
      variant: 'amber',
      explanation: 'High-value customer who spent significantly above average in the past, but has been inactive for over 60 days.',
    },
    champions: {
      label: 'Top Regulars',
      variant: 'emerald',
      explanation: 'Frequent high-spending customer who purchases regularly and has ordered recently.',
    },
    loyal_coffee_lovers: {
      label: 'Loyal Buyers',
      variant: 'blue',
      explanation: 'Consistent repeat buyer with multiple completed orders over time.',
    },
    promising_new: {
      label: 'New & Promising',
      variant: 'purple',
      explanation: 'Recent first-time buyer with promising basket size who may become a regular.',
    },
    slipping_occasional: {
      label: 'Slipping Away',
      variant: 'slate',
      explanation: 'Occasional buyer whose purchase interval is starting to stretch longer than usual.',
    },
    dormant_lost: {
      label: 'Dormant',
      variant: 'rose',
      explanation: 'Customer who has not made a purchase in a very long time and may have stopped buying completely.',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            See your customer spending habits, purchase history, and who might need a gentle re-engagement offer.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          {segmentTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedSegment(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSegment === tab.key
                  ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredAndSortedCustomers.length} customer accounts</span>
          <span className="text-[11px] text-slate-400">Click any customer row to view their profile</span>
        </div>

        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Customer Group</th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('total_spend')}
                  >
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Total Spent</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('order_count')}
                  >
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Total Orders</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('average_order_value')}
                  >
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Average Order</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('days_since_last_order')}
                  >
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Last Purchase</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-center cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('churn_risk_score')}
                  >
                    <div className="inline-flex items-center gap-1 justify-center">
                      <span>Risk of Leaving</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAndSortedCustomers.map((c) => {
                  const segInfo = segmentLabels[c.rfm_segment] || {
                    label: c.rfm_segment.replace(/_/g, ' '),
                    variant: 'slate' as const,
                    explanation: 'Customer profile',
                  };

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.email}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant={segInfo.variant} size="sm">
                          {segInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                        ₹{c.total_spend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">{c.order_count}</td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        ₹{c.average_order_value.toFixed(0)}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-800">
                        {c.days_since_last_order} days ago
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-mono font-bold text-[11px] ${
                            c.churn_risk_score > 0.6
                              ? 'text-rose-600'
                              : c.churn_risk_score > 0.3
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {(c.churn_risk_score * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer with Progressive Disclosure */}
      {selectedCustomer && (
        <Drawer
          isOpen={!!selectedCustomer}
          onClose={() => {
            setSelectedCustomer(null);
            setShowTechnicalDetails(false);
          }}
          title={selectedCustomer.name}
          subtitle={selectedCustomer.email}
          width="lg"
        >
          <div className="space-y-6">
            {/* 1. Plain English Explanation Card: "Why is this customer here?" */}
            <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">
                    Why is this customer in this group?
                  </h4>
                </div>
                <Badge
                  variant={
                    segmentLabels[selectedCustomer.rfm_segment]?.variant || 'slate'
                  }
                  size="sm"
                >
                  {segmentLabels[selectedCustomer.rfm_segment]?.label || selectedCustomer.rfm_segment}
                </Badge>
              </div>

              <p className="text-sm text-slate-800 leading-relaxed">
                This customer has spent <strong className="text-emerald-700 font-semibold">₹{selectedCustomer.total_spend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> with your store across <strong className="text-slate-900 font-semibold">{selectedCustomer.order_count} orders</strong>, but hasn't made a purchase in <strong className="text-amber-800 font-semibold">{selectedCustomer.days_since_last_order} days</strong>.
              </p>

              <p className="text-xs text-slate-600 leading-relaxed">
                {segmentLabels[selectedCustomer.rfm_segment]?.explanation ||
                  'Customer profile synchronized from your store ledger.'}
              </p>
            </div>

            {/* 2. Customer Spending Snapshot Tiles */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Purchase Summary
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Total Spent</div>
                  <div className="text-base font-bold text-emerald-700 font-mono mt-1">
                    ₹{selectedCustomer.total_spend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Total Orders</div>
                  <div className="text-base font-bold text-slate-900 font-mono mt-1">
                    {selectedCustomer.order_count} orders
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Average Order</div>
                  <div className="text-base font-bold text-slate-900 font-mono mt-1">
                    ₹{selectedCustomer.average_order_value.toFixed(0)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Last Purchase</div>
                  <div className="text-base font-bold text-amber-800 font-mono mt-1">
                    {selectedCustomer.days_since_last_order} days ago
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Risk Status Banner */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Risk of Leaving:</span>
                <span
                  className={`font-mono font-bold ${
                    selectedCustomer.churn_risk_score > 0.6
                      ? 'text-rose-600'
                      : selectedCustomer.churn_risk_score > 0.3
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {(selectedCustomer.churn_risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {selectedCustomer.churn_risk_score > 0.6
                  ? 'High risk — Customer is significantly past their normal purchase cycle.'
                  : selectedCustomer.churn_risk_score > 0.3
                  ? 'Moderate risk — Customer order frequency is starting to slow down.'
                  : 'Low risk — Customer has ordered recently and is actively engaged.'}
              </p>
            </div>

            {/* 4. Progressive Disclosure: Technical Identifiers */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-all"
              >
                <span>{showTechnicalDetails ? 'Hide technical identifiers' : 'View technical identifiers & profile'}</span>
                {showTechnicalDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showTechnicalDetails && (
                <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span>Customer ID:</span>
                    <span className="text-slate-900">{selectedCustomer.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Internal Segment:</span>
                    <span className="text-slate-900">{selectedCustomer.rfm_segment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calculated Churn Score:</span>
                    <span className="text-slate-900">{selectedCustomer.churn_risk_score}</span>
                  </div>
                  {selectedCustomer.last_incentive_sent_at && (
                    <div className="flex justify-between">
                      <span>Last Offer Sent:</span>
                      <span className="text-slate-900">
                        {new Date(selectedCustomer.last_incentive_sent_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
