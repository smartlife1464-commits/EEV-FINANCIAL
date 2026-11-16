import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PeriodProvider } from './context/PeriodContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { FinancialRouteGuard } from './components/common/FinancialRouteGuard';
import { UserRole } from '@eev/shared-types';
import { Toaster } from 'sonner';
import { RoleGuard } from './components/common/RoleGuard';

// Pages chargées à la demande (bundle initial allégé, important sur réseau mobile)
const LeaderDashboard = lazy(() => import('./pages/LeaderDashboard').then((m) => ({ default: m.LeaderDashboard })));
const FinanceDashboard = lazy(() => import('./pages/FinanceDashboard').then((m) => ({ default: m.FinanceDashboard })));
const ProtocolDashboard = lazy(() => import('./pages/ProtocolDashboard').then((m) => ({ default: m.ProtocolDashboard })));
const ServicesList = lazy(() => import('./pages/ServicesList').then((m) => ({ default: m.ServicesList })));
const AttendanceList = lazy(() => import('./pages/AttendanceList').then((m) => ({ default: m.AttendanceList })));
const AttendanceForm = lazy(() => import('./pages/AttendanceForm').then((m) => ({ default: m.AttendanceForm })));
const FinancialEntriesList = lazy(() => import('./pages/FinancialEntriesList').then((m) => ({ default: m.FinancialEntriesList })));
const FinancialEntryForm = lazy(() => import('./pages/FinancialEntryForm').then((m) => ({ default: m.FinancialEntryForm })));
const ExpensesList = lazy(() => import('./pages/ExpensesList').then((m) => ({ default: m.ExpensesList })));
const ExpenseForm = lazy(() => import('./pages/ExpenseForm').then((m) => ({ default: m.ExpenseForm })));
const ExpenseApprovals = lazy(() => import('./pages/ExpenseApprovals').then((m) => ({ default: m.ExpenseApprovals })));
const TreasuryDetail = lazy(() => import('./pages/TreasuryDetail').then((m) => ({ default: m.TreasuryDetail })));
const InternalTransfers = lazy(() => import('./pages/InternalTransfers').then((m) => ({ default: m.InternalTransfers })));
const GeneralLedger = lazy(() => import('./pages/GeneralLedger').then((m) => ({ default: m.GeneralLedger })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const UsersManagement = lazy(() => import('./pages/UsersManagement').then((m) => ({ default: m.UsersManagement })));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const AnalyticsOverview = lazy(() => import('./pages/analytics/AnalyticsOverview').then((m) => ({ default: m.AnalyticsOverview })));
const AttendanceAnalytics = lazy(() => import('./pages/analytics/AttendanceAnalytics').then((m) => ({ default: m.AttendanceAnalytics })));
const FinancialAnalytics = lazy(() => import('./pages/analytics/FinancialAnalytics').then((m) => ({ default: m.FinancialAnalytics })));
const CashClosingReconciliation = lazy(() => import('./pages/CashClosingReconciliation').then((m) => ({ default: m.CashClosingReconciliation })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s cache
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

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
          <PeriodProvider>
            <Toaster position="top-right" richColors closeButton duration={5000} />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Authentification : Connexion uniquement, inscription publique strictement fermée */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Navigate to="/login" replace />} />
                <Route path="/signup" element={<Navigate to="/login" replace />} />
                <Route path="/auth/register" element={<Navigate to="/login" replace />} />

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
                      <RoleGuard roles={[UserRole.ADMIN, UserRole.LEAD_PASTOR, UserRole.AUDITOR]}>
                        <ExpenseApprovals />
                      </RoleGuard>
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
                  <Route
                    path="analytics"
                    element={
                      <RoleGuard roles={[UserRole.ADMIN, UserRole.LEAD_PASTOR, UserRole.FINANCE_LEAD, UserRole.PROTOCOL_LEAD, UserRole.AUDITOR]}>
                        <AnalyticsOverview />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="reports"
                    element={
                      <RoleGuard roles={[UserRole.ADMIN, UserRole.LEAD_PASTOR, UserRole.FINANCE_LEAD, UserRole.PROTOCOL_LEAD, UserRole.AUDITOR]}>
                        <ReportsPage />
                      </RoleGuard>
                    }
                  />

                  {/* Administration */}
                  <Route
                    path="admin/users"
                    element={
                      <RoleGuard roles={[UserRole.ADMIN, UserRole.LEAD_PASTOR]}>
                        <UsersManagement />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="admin/audit"
                    element={
                      <RoleGuard roles={[UserRole.ADMIN, UserRole.LEAD_PASTOR, UserRole.AUDITOR]}>
                        <AuditLogsPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <RoleGuard roles={[UserRole.ADMIN, UserRole.LEAD_PASTOR]}>
                        <SettingsPage />
                      </RoleGuard>
                    }
                  />
                  <Route path="notifications" element={<NotificationsPage />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
              </Suspense>
            </BrowserRouter>
          </PeriodProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
