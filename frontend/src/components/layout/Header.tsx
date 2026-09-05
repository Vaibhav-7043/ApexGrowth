import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { HealthStatus } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, CheckCircle2, User as UserIcon, LogOut, Settings, ChevronDown, Store, Shield } from 'lucide-react';

interface HeaderProps {
  onResetDb?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetDb }) => {
  const { user, merchant, logout } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadInfo = async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadInfo();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = async () => {
    if (confirm('Reset and re-seed demo database with clean sample records?')) {
      setResetting(true);
      try {
        await api.resetAndSeedDb();
        await loadInfo();
        if (onResetDb) onResetDb();
        window.location.reload();
      } catch (err: any) {
        alert(err.message);
      } finally {
        setResetting(false);
      }
    }
  };

  const displayName = user?.full_name || 'Artisan Founder';
  const displayEmail = user?.email || 'merchant@artisanroasters.in';
  const displayStore = merchant?.name || 'Artisan Roasters Co.';
  const displayCategory = merchant?.category || merchant?.business_type || 'Retail';
  const isDemo = merchant?.is_demo || displayStore.includes('Artisan Roasters');

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <div>
          <div className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="h-4 w-4 text-blue-600" />
            <span>{displayStore}</span>
            <span className="text-slate-400 font-normal text-xs">• {displayCategory}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Environment Badge */}
        {health?.razorpay_mode === 'razorpay_test' || true ? (
          <Badge variant="blue" dot>
            Test Mode
          </Badge>
        ) : (
          <Badge variant="amber" dot>
            Sandbox
          </Badge>
        )}

        <Badge variant="emerald" className="hidden sm:inline-flex">
          <CheckCircle2 className="h-3 w-3 inline mr-1 text-emerald-600" />
          Synchronized
        </Badge>

        {isDemo && (
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={resetting}
            onClick={handleReset}
            className="text-xs hidden lg:inline-flex"
          >
            Reset Demo Data
          </Button>
        )}

        {/* Merchant Account Dropdown Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all text-xs text-slate-800 shadow-2xs group"
          >
            <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                {displayStore}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                {displayEmail}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-transform" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Account Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-900 truncate">{displayStore}</div>
                <div className="text-[11px] text-slate-500 truncate font-medium">{displayEmail}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="blue" size="sm" dot>
                    Razorpay Test Mode
                  </Badge>
                </div>
              </div>

              {/* Menu Links */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    alert(`Merchant Profile:\nStore: ${displayStore}\nOwner: ${displayName}\nEmail: ${displayEmail}\nCategory: ${displayCategory}\nStatus: Active (Razorpay Test Mode)`);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  <span>Account Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    alert('Settings & Guardrails: Safety guardrails and Razorpay webhook configurations can be managed under "Safety Rules" and "Connected Stores" in the sidebar.');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span>Safety & Guardrails</span>
                </button>
              </div>

              {/* Sign Out CTA */}
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold transition-colors"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
