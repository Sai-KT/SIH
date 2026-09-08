// =============================================================================
// SIH26034 — Admin: Users Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { UserCheck, UserX, Shield, Users } from 'lucide-react';
import { userService } from '../../services/api';
import type { User } from '../../types';
import { Skeleton } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate, getInitials } from '../../utils/helpers';
import './UsersPage.css';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'var(--color-non-compliant)',
  SUPERVISOR: 'var(--color-warning)',
  INSPECTOR: 'var(--color-primary)',
};

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.list().then(setUsers).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
        <Button icon={<Users size={16} />}>Invite User</Button>
      </div>

      <div className="users-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="user-card">
                <Skeleton height={52} width={52} borderRadius="50%" />
                <Skeleton height={18} width="60%" className="mt-3 mb-2" />
                <Skeleton height={14} width="80%" />
              </div>
            ))
          : users.map(user => (
              <div key={user.id} className={`user-card ${!user.is_active ? 'user-card--inactive' : ''}`}>
                <div className="user-card-header">
                  <div className="user-avatar">{getInitials(user.name)}</div>
                  <div
                    className="user-role-badge"
                    style={{ color: ROLE_COLORS[user.role], background: ROLE_COLORS[user.role] + '15' }}
                  >
                    <Shield size={10} />
                    {user.role}
                  </div>
                </div>
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                <div className="user-dept">{user.department}</div>
                {user.badge_number && (
                  <div className="user-badge-num">Badge: {user.badge_number}</div>
                )}
                <div className="user-card-footer">
                  <div className={`user-status ${user.is_active ? 'user-status--active' : 'user-status--inactive'}`}>
                    {user.is_active ? <UserCheck size={12} /> : <UserX size={12} />}
                    {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                  <span className="user-joined">Since {formatDate(user.created_at)}</span>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}
