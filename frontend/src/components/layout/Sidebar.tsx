import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Megaphone,
  Users,
  BarChart3,
  ShieldCheck,
  History,
  Store,
  Flame,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/opportunities', label: 'Opportunities', icon: Sparkles, badge: '1 Found' },
    { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/integrations', label: 'Connected Stores', icon: Store, badge: 'Razorpay' },
    { to: '/audit', label: 'Activity History', icon: History },
    { to: '/policies', label: 'Safety Rules', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between h-screen sticky top-0 shadow-xs z-20">
      <div>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base text-slate-900 tracking-tight leading-none">ApexGrowth</div>
            <div className="text-[10px] text-blue-600 font-semibold tracking-wide uppercase mt-1">AI Growth Assistant</div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-xs font-semibold text-slate-800">Status: Watching Sales</div>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 leading-relaxed">
            Continuously analyzing orders to find new revenue for your business.
          </div>
        </div>
      </div>
    </aside>
  );
};
