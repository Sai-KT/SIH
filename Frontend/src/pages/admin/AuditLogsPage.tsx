// =============================================================================
// SIH26034 — Admin: Audit Logs Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { auditService } from '../../services/api';
import type { AuditLog } from '../../types';
import { Skeleton } from '../../components/ui/Badge';
import { formatDateTime, getInitials } from '../../utils/helpers';
import './AuditLogsPage.css';

const ACTION_COLOR: Record<string, string> = {
  CREATE_INSPECTION: 'var(--color-info)',
  UPLOAD_IMAGE: 'var(--color-purple)',
  APPROVE_INSPECTION: 'var(--color-compliant)',
  DEACTIVATE_USER: 'var(--color-non-compliant)',
};

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService.list().then(setLogs).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Immutable record of all system actions and user activity</p>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}><Skeleton height={14} width="80%" /></td>
                      ))}
                    </tr>
                  ))
                : logs.length === 0
                ? (
                    <tr><td colSpan={6}>
                      <div className="empty-state">
                        <BookOpen size={36} className="empty-state-icon" />
                        <p className="empty-state-title">No audit logs found</p>
                      </div>
                    </td></tr>
                  )
                : logs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div className="audit-user-cell">
                          <div className="audit-avatar">{getInitials(log.user_name)}</div>
                          <span className="text-sm font-medium">{log.user_name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="audit-action-badge"
                          style={{
                            color: ACTION_COLOR[log.action] ?? 'var(--color-text-secondary)',
                            background: (ACTION_COLOR[log.action] ?? 'var(--color-text-secondary)') + '15',
                          }}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="text-xs text-secondary">{log.resource_type}</div>
                        <div className="text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                          {log.resource_id.slice(0, 12)}…
                        </div>
                      </td>
                      <td className="text-sm text-secondary" style={{ maxWidth: 240 }}>
                        {log.details || '—'}
                      </td>
                      <td className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                        {log.ip_address || '—'}
                      </td>
                      <td className="text-xs text-secondary">
                        {formatDateTime(log.created_at)}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
