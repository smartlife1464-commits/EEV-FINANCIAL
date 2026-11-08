import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { LeaderDashboard } from './pages/LeaderDashboard';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { ProtocolDashboard } from './pages/ProtocolDashboard';
import { ServicesList } from './pages/ServicesList';
import { AttendanceList } from './pages/AttendanceList';
import { AttendanceForm } from './pages/AttendanceForm';
import { FinancialEntriesList } from './pages/FinancialEntriesList';
import { FinancialEntryForm } from './pages/FinancialEntryForm';
import { ExpensesList } from './pages/ExpensesList';
import { ExpenseForm } from './pages/ExpenseForm';
import { ExpenseApprovals } from './pages/ExpenseApprovals';
import { TreasuryDetail } from './pages/TreasuryDetail';
import { InternalTransfers } from './pages/InternalTransfers';
import { GeneralLedger } from './pages/GeneralLedger';
import { ReportsPage } from './pages/ReportsPage';
import { UsersManagement } from './pages/UsersManagement';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AnalyticsOverview } from './pages/analytics/AnalyticsOverview';
import { AttendanceAnalytics } from './pages/analytics/AttendanceAnalytics';
import { FinancialAnalytics } from './pages/analytics/FinancialAnalytics';
import { CashClosingReconciliation } from './pages/CashClosingReconciliation';
import { FinancialRouteGuard } from './components/common/FinancialRouteGuard';
import { UserRole } from '@eev/shared-types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s cache
      refetchOnWindowFocus: false,
    },
  },
});

// Routeur dynamique selon le rôle de l'utilisateur connecté
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  // Le responsable protocole et les agents protocole ont leur propre tableau de bord dédié
  if (user?.role === UserRole.PROTOCOL_LEAD || user?.role === UserRole.PROTOCOL_AGENT) {
    return <ProtocolDashboard />;
  }

  // Le caissier atterrit directement sur le tableau de bord de caisse
  if (user?.role === UserRole.CASHIER) {
    return <FinanceDashboard />;
  }

  // Le pasteur principal, l'admin et l'auditeur ont la vue d'ensemble exécutive
  return <LeaderDashboard />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<AppLayout />}>
                {/* Tableau de bord dédié selon le rôle */}
                <Route index element={<DashboardRouter />} />
                <Route path="protocol" element={<ProtocolDashboard />} />

                {/* Module Fréquentation & Protocole (Accessible à tous les rôles autorisés) */}
                <Route path="services" element={<ServicesList />} />
                <Route path="attendance" element={<AttendanceList />} />
                <Route path="attendance/new" element={<AttendanceForm />} />
                <Route path="analytics/attendance" element={<AttendanceAnalytics />} />

                {/* Module Finances (STRICTEMENT INTERDIT aux rôles Protocole) */}
                <Route
                  path="finance"
                  element={
                    <FinancialRouteGuard>
                      <FinanceDashboard />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="finance/entries"
                  element={
                    <FinancialRouteGuard>
                      <FinancialEntriesList />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="finance/entries/new"
                  element={
                    <FinancialRouteGuard>
                      <FinancialEntryForm />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="finance/expenses"
                  element={
                    <FinancialRouteGuard>
                      <ExpensesList />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="finance/expenses/new"
                  element={
                    <FinancialRouteGuard>
                      <ExpenseForm />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="finance/approvals"
                  element={
                    <FinancialRouteGuard>
                      <ExpenseApprovals />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="finance/treasury"
                  element={
                    <FinancialRouteGuard>
                      <TreasuryDetail />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="finance/cash-closing"
                  element={
                    <FinancialRouteGuard>
                      <CashClosingReconciliation />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="finance/transfers"
                  element={
                    <FinancialRouteGuard>
                      <InternalTransfers />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="finance/transactions"
                  element={
                    <FinancialRouteGuard>
                      <GeneralLedger />
                    </FinancialRouteGuard>
                  }
                />
                <Route
                  path="analytics/finance"
                  element={
                    <FinancialRouteGuard>
                      <FinancialAnalytics />
                    </FinancialRouteGuard>
                  }
                />

                {/* Statistiques et Rapports avec filtrage selon le rôle */}
                <Route path="analytics" element={<AnalyticsOverview />} />
                <Route path="reports" element={<ReportsPage />} />

                {/* Administration */}
                <Route path="admin/users" element={<UsersManagement />} />
                <Route path="admin/audit" element={<AuditLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
