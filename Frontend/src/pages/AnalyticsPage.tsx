// =============================================================================
// SIH26034 — Analytics Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { dashboardService } from '../services/api';
import type { DashboardStats } from '../types';
import { Skeleton } from '../components/ui/Badge';

export function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Compliance trends and performance insights across all inspections</p>
      </div>

      {/* KPI Row */}
      <div className="grid-4 mb-6">
        {[
          { label: 'Total Inspections', value: stats?.total_inspections },
          { label: 'Avg Compliance Score', value: stats ? `${stats.avg_score}%` : undefined },
          { label: 'Compliance Rate', value: stats ? `${stats.compliance_rate}%` : undefined },
          { label: 'Critical Today', value: stats?.critical_violations_today },
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ padding: 'var(--space-5)' }}>
            {loading ? (
              <><Skeleton height={32} width="50%" className="mb-2" /><Skeleton height={14} width="70%" /></>
            ) : (
              <>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {kpi.value ?? '—'}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                  {kpi.label}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Line chart - 7-day trend */}
      <div className="card mb-6">
        <div className="card-header">
          <span className="card-title">7-Day Inspection Volume</span>
        </div>
        <div className="card-body" style={{ padding: '16px 24px 24px' }}>
          {loading ? <Skeleton height={240} /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats?.trend_weekly ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} name="Total" dot={false} />
                <Line type="monotone" dataKey="compliant" stroke="var(--color-compliant)" strokeWidth={2} name="Compliant" dot={false} />
                <Line type="monotone" dataKey="non_compliant" stroke="var(--color-non-compliant)" strokeWidth={2} name="Non-Compliant" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category performance */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Compliance by Category</span>
          </div>
          <div className="card-body" style={{ padding: '16px 24px 24px' }}>
            {loading ? <Skeleton height={240} /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats?.category_breakdown ?? []} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Compliance Rate']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="compliance_rate" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {(stats?.category_breakdown ?? []).map((e, i) => (
                      <Cell key={i} fill={e.compliance_rate >= 80 ? 'var(--color-compliant)' : e.compliance_rate >= 60 ? 'var(--color-warning)' : 'var(--color-non-compliant)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Inspection Count by Category</span>
          </div>
          <div className="card-body" style={{ padding: '16px 24px 24px' }}>
            {loading ? <Skeleton height={240} /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats?.category_breakdown ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)', angle: -30, textAnchor: 'end' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="var(--color-primary-400)" radius={[4, 4, 0, 0]} maxBarSize={40} name="Inspections" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
