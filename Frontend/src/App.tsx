// =============================================================================
// SIH26034 — App Router
// =============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { OfficerShell } from './components/officer/OfficerShell';

// Pages
import { LoginPage }            from './pages/LoginPage';
import { DashboardPage }        from './pages/DashboardPage';
import { InspectionsPage }      from './pages/InspectionsPage';
import { InspectionDetailPage } from './pages/InspectionDetailPage';
import { NewInspectionPage }    from './pages/NewInspectionPage';
import { ReportsPage }          from './pages/ReportsPage';
import { AnalyticsPage }        from './pages/AnalyticsPage';
import { NotificationsPage }    from './pages/NotificationsPage';
import { UsersPage }            from './pages/admin/UsersPage';
import { AuditLogsPage }        from './pages/admin/AuditLogsPage';

// Officer Field Pages
import { OfficerOverviewPage } from './pages/officer/OfficerOverviewPage';
import { RapidInspectPage }    from './pages/officer/RapidInspectPage';
import { FieldHistoryPage }    from './pages/officer/FieldHistoryPage';

// ── Protected Route ───────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── Admin Route ───────────────────────────────────────────────────────────────

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ── App ───────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── Officer Field Panel ─────────────────────────────────────────── */}
      <Route
        path="/officer"
        element={
          <ProtectedRoute>
            <OfficerShell />
          </ProtectedRoute>
        }
      >
        <Route index           element={<OfficerOverviewPage />} />
        <Route path="rapid-inspect" element={<RapidInspectPage />} />
        <Route path="history"       element={<FieldHistoryPage />} />
      </Route>

      {/* Protected supervisor/admin shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"       element={<DashboardPage />} />
        <Route path="/inspections"     element={<InspectionsPage />} />
        <Route path="/inspections/:id" element={<InspectionDetailPage />} />
        <Route path="/new-inspection"  element={<NewInspectionPage />} />
        <Route path="/reports"         element={<ReportsPage />} />
        <Route path="/analytics"       element={<AnalyticsPage />} />
        <Route path="/notifications"   element={<NotificationsPage />} />

        {/* Admin only */}
        <Route path="/admin/users"      element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="/admin/audit-logs" element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
