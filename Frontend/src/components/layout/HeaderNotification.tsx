// =============================================================================
// SIH26034 — HeaderNotification.tsx
// Interactive Notification Bell with Live Unread Counter & Dropdown Drawer
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, AlertTriangle, AlertCircle, CheckCircle2,
  Info, ArrowRight, Check, CheckCheck,
} from 'lucide-react';
import { mockNotifications } from '../../mock/data';
import { notificationService } from '../../services/api';
import type { Notification } from '../../types';
import './HeaderNotification.css';

export function HeaderNotification() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load latest notifications
  useEffect(() => {
    notificationService.list().then(data => {
      if (data && data.length > 0) {
        setNotifications(data);
      }
    }).catch(() => {});
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleItemClick = (item: Notification) => {
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
    );
    notificationService.markRead(item.id);
    setIsOpen(false);

    if (item.inspection_id) {
      navigate(`/inspections/${item.inspection_id}`);
    } else {
      navigate('/notifications');
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ERROR':
        return (
          <div className="header-notif-item-icon" style={{ background: 'var(--color-non-compliant-50)', color: 'var(--color-non-compliant)' }}>
            <AlertTriangle size={14} />
          </div>
        );
      case 'WARNING':
        return (
          <div className="header-notif-item-icon" style={{ background: 'var(--color-warning-50)', color: 'var(--color-warning-dark)' }}>
            <AlertCircle size={14} />
          </div>
        );
      case 'SUCCESS':
        return (
          <div className="header-notif-item-icon" style={{ background: 'var(--color-compliant-50)', color: 'var(--color-compliant)' }}>
            <CheckCircle2 size={14} />
          </div>
        );
      default:
        return (
          <div className="header-notif-item-icon" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary)' }}>
            <Info size={14} />
          </div>
        );
    }
  };

  return (
    <div className="header-notif-container" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        className={`header-notif-btn ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Alerts & Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'Notifications'}
      >
        <Bell size={18} className="header-notif-icon" />

        {unreadCount > 0 && (
          <>
            <span className="header-notif-pulse" />
            <span className="header-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div className="header-notif-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="header-notif-dropdown">
          {/* Header */}
          <div className="header-notif-dropdown-header">
            <div className="header-notif-dropdown-title">
              <span>Alerts & Notifications</span>
              {unreadCount > 0 && (
                <span className="header-notif-unread-tag">{unreadCount} new</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="header-notif-mark-read-btn"
                onClick={handleMarkAllRead}
                title="Mark all as read"
              >
                <CheckCheck size={13} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="header-notif-list">
            {notifications.length === 0 ? (
              <div className="header-notif-empty">
                <Check size={28} />
                <div className="header-notif-empty-title">All caught up!</div>
                <div className="header-notif-empty-desc">No active notifications or inspection alerts.</div>
              </div>
            ) : (
              notifications.slice(0, 5).map(item => (
                <div
                  key={item.id}
                  className={`header-notif-item ${!item.read ? 'is-unread' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  {getIcon(item.type)}
                  <div className="header-notif-item-content">
                    <div className="header-notif-item-title">
                      <span>{item.title}</span>
                      {!item.read && <span className="header-notif-dot-unread" />}
                    </div>
                    <div className="header-notif-item-msg">{item.message}</div>
                    <div className="header-notif-item-time">{formatRelativeTime(item.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="header-notif-dropdown-footer">
            <button
              type="button"
              className="header-notif-view-all"
              onClick={handleViewAll}
            >
              <span>View all notifications</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
