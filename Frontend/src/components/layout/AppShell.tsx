// =============================================================================
// SIH26034 — App Shell (Header + Sidebar + Main Content)
// =============================================================================

import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopSearchBar } from './TopSearchBar';
import { HeaderNotification } from './HeaderNotification';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import './AppShell.css';

const breadcrumbMap: Record<string, string> = {
  dashboard:      'Dashboard',
  inspections:    'Inspections',
  'new-inspection': 'New Inspection',
  reports:        'Reports',
  analytics:      'Analytics',
  notifications:  'Alerts & Notifications',
  admin:          'Administration',
  users:          'User Management',
  'audit-logs':   'Audit Logs',
};

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((part, i) => ({
    label: breadcrumbMap[part] || part,
    path: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }));
}

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />

      <div className="app-main">
        {/* Header */}
        <header className="app-header">
          <div className="app-header-left">
            {/* Breadcrumbs */}
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <span
                className="breadcrumb-item breadcrumb-item--link"
                onClick={() => navigate('/dashboard')}
              >
                Home
              </span>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.path}>
                  <ChevronRight size={14} className="breadcrumb-sep" />
                  <span
                    className={`breadcrumb-item ${crumb.isLast ? 'breadcrumb-item--current' : 'breadcrumb-item--link'}`}
                    onClick={!crumb.isLast ? () => navigate(crumb.path) : undefined}
                  >
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Search bar + Notification Bell aligned side-by-side */}
          <div className="app-header-center">
            <TopSearchBar />
            <HeaderNotification />
          </div>

          <div className="app-header-right">
            {/* User Profile */}
            {user && (
              <div
                className="header-user-profile"
                title={`${user.name} (${user.role})`}
                onClick={() => navigate('/admin/users')}
              >
                <div className="header-avatar">
                  {getInitials(user.name)}
                </div>
                <div className="header-user-info">
                  <span className="header-user-name">{user.name.split(' ')[0]}</span>
                  <span className="header-user-role">{user.role}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
