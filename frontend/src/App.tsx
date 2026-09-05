import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { OnboardingRoute } from './components/auth/OnboardingRoute';
import { AppLayout } from './components/layout/AppLayout';
import { OnboardingLayout } from './components/layout/OnboardingLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BusinessSetupPage } from './pages/onboarding/BusinessSetupPage';
import { ConnectToolsPage } from './pages/onboarding/ConnectToolsPage';
import { RazorpayConnectPage } from './pages/onboarding/RazorpayConnectPage';
import { DataSyncPage } from './pages/onboarding/DataSyncPage';
import { OnboardingCompletePage } from './pages/onboarding/OnboardingCompletePage';

import { DashboardPage } from './pages/DashboardPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { CustomersPage } from './pages/CustomersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { AuditPage } from './pages/AuditPage';
import { PoliciesPage } from './pages/PoliciesPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Onboarding Wizard Routes (Protected for authenticated users completing onboarding) */}
          <Route element={<OnboardingRoute />}>
            <Route path="/onboarding" element={<OnboardingLayout />}>
              <Route index element={<Navigate to="/onboarding/business" replace />} />
              <Route path="business" element={<BusinessSetupPage />} />
              <Route path="connect" element={<ConnectToolsPage />} />
              <Route path="razorpay" element={<RazorpayConnectPage />} />
              <Route path="sync" element={<DataSyncPage />} />
              <Route path="complete" element={<OnboardingCompletePage />} />
            </Route>
          </Route>

          {/* Protected Application Routes (Protected for authenticated and onboarded users) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="policies" element={<PoliciesPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
