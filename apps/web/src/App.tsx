import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { LeaderDashboard } from './pages/LeaderDashboard';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { AttendanceDashboard } from './pages/AttendanceDashboard';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s cache
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<AppLayout />}>
                <Route index element={<LeaderDashboard />} />
                <Route path="finance" element={<FinanceDashboard />} />
                <Route path="protocol" element={<AttendanceDashboard />} />
                <Route path="services" element={<ServicesList />} />
                <Route path="attendance" element={<AttendanceList />} />
                <Route path="attendance/new" element={<AttendanceForm />} />
                <Route path="finance/entries" element={<FinancialEntriesList />} />
                <Route path="finance/entries/new" element={<FinancialEntryForm />} />
                <Route path="finance/expenses" element={<ExpensesList />} />
                <Route path="finance/expenses/new" element={<ExpenseForm />} />
                <Route path="finance/approvals" element={<ExpenseApprovals />} />
                <Route path="finance/treasury" element={<TreasuryDetail />} />
                <Route path="finance/transfers" element={<InternalTransfers />} />
                <Route path="finance/transactions" element={<GeneralLedger />} />
                <Route path="reports" element={<ReportsPage />} />
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

