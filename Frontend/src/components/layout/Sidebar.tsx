// =============================================================================
// SIH26034 — Sidebar Navigation
// =============================================================================

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, PlusCircle, FileText,
  BarChart3, Bell, Users, ShieldCheck, LogOut, ChevronLeft,
  ChevronRight, BookOpen, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import './Sidebar.css';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: ('INSPECTOR' | 'SUPERVISOR' | 'ADMIN')[];
  badge?: number;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard',    icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/inspections',  icon: <ClipboardList size={18} />,   label: 'Inspections' },
  { to: '/new-inspection', icon: <PlusCircle size={18} />,    label: 'New Inspection' },
  { to: '/reports',      icon: <FileText size={18} />,        label: 'Reports' },
  { to: '/analytics',    icon: <BarChart3 size={18} />,       label: 'Analytics', roles: ['SUPERVISOR', 'ADMIN'] },
  { to: '/notifications', icon: <Bell size={18} />,           label: 'Alerts' },
  { to: '/officer',      icon: <Zap size={18} />,             label: 'Field Mode', highlight: true },
];

const adminItems: NavItem[] = [
  { to: '/admin/users',     icon: <Users size={18} />,       label: 'User Management' },
  { to: '/admin/audit-logs', icon: <BookOpen size={18} />,   label: 'Audit Logs' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const filteredNav = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role as 'SUPERVISOR' | 'ADMIN');
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldCheck size={22} />
        </div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">LM Inspect</span>
            <span className="sidebar-logo-sub">Legal Metrology</span>
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Main Nav */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">{!collapsed && 'WORKSPACE'}</span>
        {filteredNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item--active' : ''} ${item.highlight ? 'sidebar-item--highlight' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
            {!collapsed && item.badge && (
              <span className="sidebar-item-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin Nav */}
      {isAdmin && (
        <>
          <div className="sidebar-divider" />
          <nav className="sidebar-nav">
            <span className="sidebar-section-label">{!collapsed && 'ADMINISTRATION'}</span>
            {adminItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-item ${isActive ? 'sidebar-item--active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      <div className="sidebar-footer">
        {/* Collapse toggle aligned to right corner */}
        <div className="sidebar-toggle-row">
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="sidebar-divider" />

        {/* User info */}
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials(user.name)}</div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-role">{user.role}</span>
              </div>
            )}
            {!collapsed && (
              <button
                className="sidebar-logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
