// =============================================================================
// SIH26034 — Dashboard Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import {
  TrendingUp, ClipboardCheck, AlertTriangle, Clock,
  Plus, ArrowRight, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { dashboardService, inspectionService } from '../services/api';
import type { DashboardStats, Inspection } from '../types';
import { StatusBadge, Skeleton } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, scoreColor, shortId } from '../utils/helpers';
import './DashboardPage.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

function StatCard({ label, value, icon, iconBg, iconColor, trend, trendUp, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="stat-card">
        <Skeleton height={20} width="60%" className="mb-2" />
        <Skeleton height={36} width="40%" className="mb-2" />
        <Skeleton height={14} width="50%" />
      </div>
    );
  }
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        {trend && (
          <span className={`stat-trend ${trendUp ? 'stat-trend--up' : 'stat-trend--down'}`}>
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const CHART_COLORS = {
  compliant:     '#1A7F4B',
  non_compliant: '#C0392B',
  pending:       '#D97706',
  primary:       '#2D5AA0',
};

const PIE_COLORS = ['#1A7F4B', '#C0392B', '#D97706', '#2563EB', '#7C3AED'];

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, inspResp] = await Promise.all([
        dashboardService.getStats(),
        inspectionService.list(),
      ]);
      setStats(s);
      setRecentInspections(inspResp.data.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="page-container dashboard-page animate-fade-in">
      {/* ── Header ── */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">
            Good morning, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">
            Here's what's happening with inspections today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={fetchData}>
            Refresh
          </Button>
          <Button icon={<Plus size={16} />} onClick={() => navigate('/new-inspection')}>
            New Inspection
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4 mb-6">
        <StatCard
          loading={loading}
          label="Total Inspections"
          value={stats?.total_inspections ?? '—'}
          icon={<ClipboardCheck size={20} />}
          iconBg="var(--color-primary-50)"
          iconColor="var(--color-primary)"
          trend="+8% this week"
          trendUp
        />
        <StatCard
          loading={loading}
          label="Compliance Rate"
          value={stats ? `${stats.compliance_rate}%` : '—'}
          icon={<TrendingUp size={20} />}
          iconBg="var(--color-compliant-bg)"
          iconColor="var(--color-compliant)"
          trend="+2.3% vs last week"
          trendUp
        />
        <StatCard
          loading={loading}
          label="Non-Compliant"
          value={stats?.non_compliant ?? '—'}
          icon={<AlertTriangle size={20} />}
          iconBg="var(--color-non-compliant-bg)"
          iconColor="var(--color-non-compliant)"
          trend="5 critical today"
          trendUp={false}
        />
        <StatCard
          loading={loading}
          label="Pending Review"
          value={stats?.pending_review ?? '—'}
          icon={<Clock size={20} />}
          iconBg="var(--color-warning-bg)"
          iconColor="var(--color-warning)"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="dashboard-charts">
        {/* Area Chart - Weekly Trend */}
        <div className="card dashboard-chart-card">
          <div className="card-header">
            <span className="card-title">Inspection Trend (7 days)</span>
            <span className="text-xs text-secondary">{stats?.inspections_today ?? 0} today</span>
          </div>
          <div className="card-body" style={{ padding: '16px 24px 24px' }}>
            {loading ? (
              <Skeleton height={220} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats?.trend_weekly ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCompliant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.compliant} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={CHART_COLORS.compliant} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradNonCompliant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.non_compliant} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={CHART_COLORS.non_compliant} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12, borderRadius: 8, border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  />
                  <Area type="monotone" dataKey="compliant" stroke={CHART_COLORS.compliant} fill="url(#gradCompliant)" strokeWidth={2} name="Compliant" />
                  <Area type="monotone" dataKey="non_compliant" stroke={CHART_COLORS.non_compliant} fill="url(#gradNonCompliant)" strokeWidth={2} name="Non-Compliant" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart - Category breakdown */}
        <div className="card dashboard-chart-card dashboard-chart-card--sm">
          <div className="card-header">
            <span className="card-title">By Category</span>
          </div>
          <div className="card-body" style={{ padding: '16px 24px 24px' }}>
            {loading ? (
              <Skeleton height={220} />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats?.category_breakdown ?? []}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {(stats?.category_breakdown ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [`${v} inspections`, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Inspections ── */}
      <div className="card mt-6">
        <div className="card-header">
          <span className="card-title">Recent Inspections</span>
          <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />} onClick={() => navigate('/inspections')}>
            View all
          </Button>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Location</th>
                <th>Inspector</th>
                <th>Status</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><Skeleton height={16} width="80%" /></td>
                      ))}
                    </tr>
                  ))
                : recentInspections.map(insp => (
                    <tr
                      key={insp.id}
                      className="clickable-row"
                      onClick={() => navigate(`/inspections/${insp.id}`)}
                    >
                      <td>
                        <span className="inspection-id">#{shortId(insp.id)}</span>
                      </td>
                      <td>
                        <div>
                          <div className="text-sm font-medium">{insp.product_name || 'Unknown'}</div>
                          <div className="text-xs text-secondary">{insp.brand_name}</div>
                        </div>
                      </td>
                      <td className="text-sm">{insp.location || '—'}</td>
                      <td className="text-sm">{insp.inspector_name || '—'}</td>
                      <td><StatusBadge status={insp.status} /></td>
                      <td>
                        {insp.compliance_score != null ? (
                          <span
                            className="score-pill"
                            style={{ color: scoreColor(insp.compliance_score) }}
                          >
                            {insp.compliance_score}%
                          </span>
                        ) : (
                          <span className="text-xs text-secondary">—</span>
                        )}
                      </td>
                      <td className="text-xs text-secondary">
                        {formatDateTime(insp.inspection_date)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Category Bar Chart ── */}
      <div className="card mt-6">
        <div className="card-header">
          <span className="card-title">Compliance Rate by Category</span>
        </div>
        <div className="card-body" style={{ padding: '16px 24px 24px' }}>
          {loading ? (
            <Skeleton height={200} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.category_breakdown ?? []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Compliance Rate']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="compliance_rate" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {(stats?.category_breakdown ?? []).map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.compliance_rate >= 80 ? CHART_COLORS.compliant : entry.compliance_rate >= 60 ? CHART_COLORS.pending : CHART_COLORS.non_compliant}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
