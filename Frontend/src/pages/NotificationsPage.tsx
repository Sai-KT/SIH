// =============================================================================
// SIH26034 — Notifications Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/api';
import type { Notification, NotificationType } from '../types';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Badge';
import { timeAgo } from '../utils/helpers';
import './NotificationsPage.css';

function NotifIcon({ type }: { type: NotificationType }) {
  const props = { size: 18 };
  if (type === 'SUCCESS') return <CheckCircle {...props} color="var(--color-compliant)" />;
  if (type === 'WARNING') return <AlertTriangle {...props} color="var(--color-warning)" />;
  if (type === 'ERROR')   return <AlertCircle {...props} color="var(--color-non-compliant)" />;
  return <Info {...props} color="var(--color-info)" />;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService.list().then(setNotifications).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await notificationService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Alerts &amp; Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="notif-list">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="notif-item">
                <Skeleton height={20} width={20} borderRadius="50%" />
                <div style={{ flex: 1 }}>
                  <Skeleton height={14} width="40%" className="mb-2" />
                  <Skeleton height={12} width="70%" />
                </div>
              </div>
            ))
          : notifications.length === 0
          ? (
              <div className="empty-state">
                <Bell size={48} className="empty-state-icon" />
                <p className="empty-state-title">No Notifications</p>
              </div>
            )
          : notifications.map(notif => (
              <div
                key={notif.id}
                className={`notif-item ${!notif.read ? 'notif-item--unread' : ''}`}
                onClick={() => {
                  markRead(notif.id);
                  if (notif.inspection_id) navigate(`/inspections/${notif.inspection_id}`);
                }}
              >
                <div className={`notif-icon-wrap notif-icon--${notif.type.toLowerCase()}`}>
                  <NotifIcon type={notif.type} />
                </div>
                <div className="notif-body">
                  <div className="notif-title">{notif.title}</div>
                  <div className="notif-message">{notif.message}</div>
                  <div className="notif-time">{timeAgo(notif.created_at)}</div>
                </div>
                {!notif.read && <div className="notif-unread-dot" />}
              </div>
            ))
        }
      </div>
    </div>
  );
}
