import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginDemo, isAuthenticated, isOnboarded } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated and visiting /login, redirect cleanly
  useEffect(() => {
    if (isAuthenticated) {
      if (isOnboarded) {
        navigate('/', { replace: true });
      } else {
        navigate('/onboarding/business', { replace: true });
      }
    }
  }, [isAuthenticated, isOnboarded, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(cleanEmail, password);
      if (user.is_onboarded) {
        navigate('/');
      } else {
        navigate('/onboarding/business');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('401') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('invalid')) {
        setError('Email or password is incorrect.');
      } else if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        setError("We couldn't connect to ApexGrowth. Please check your connection and try again.");
      } else {
        setError(msg || 'Email or password is incorrect.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to load demo account.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-sm">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">ApexGrowth</h2>
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
          AI Growth Assistant
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Welcome back</h3>
            <p className="text-xs text-slate-500">
              Sign in to see where your next revenue opportunity is.
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
              <label className="text-xs font-semibold text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@yourbusiness.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Password reset link would be sent to your registered email.')}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              className="w-full justify-center mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* 1-Click Demo Sandbox for Judges / Reviewers */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="rounded-xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 border border-blue-200 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-blue-700 font-bold text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Explore Demo</span>
              </div>
              <p className="text-[11px] text-slate-600">
                See ApexGrowth in action with a ready-to-use sample business.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={ArrowRight}
                loading={demoLoading}
                onClick={handleDemoLogin}
                className="w-full justify-center bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
              >
                Explore Artisan Roasters Demo
              </Button>
            </div>
          </div>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Don't have an account? </span>
            <Link to="/register" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
