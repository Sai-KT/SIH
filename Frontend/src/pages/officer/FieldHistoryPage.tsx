// =============================================================================
// SIH26034 — Field History Page (/officer/history)
// Today's complete inspection records with filter and detail slide-in.
// =============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2, AlertTriangle, ShieldAlert, ChevronDown,
  Search, X, Tag, ArrowUpRight,
} from 'lucide-react';
import { officerService } from '../../services/api';
import type { FieldInspectionRecord } from '../../types';
import './FieldHistoryPage.css';

type StatusFilter = 'ALL' | 'COMPLIANT' | 'NON_COMPLIANT' | 'REQUIRES_REVIEW';

function StatusBadge({ status }: { status: FieldInspectionRecord['status'] }) {
  const map = {
    COMPLIANT:       { icon: <CheckCircle2 size={12} />, label: 'Compliant',      cls: 'badge--green'  },
    NON_COMPLIANT:   { icon: <AlertTriangle size={12} />, label: 'Violation',     cls: 'badge--red'    },
    REQUIRES_REVIEW: { icon: <ShieldAlert size={12} />,   label: 'Under Review',  cls: 'badge--amber'  },
  } as const;
  const { icon, label, cls } = map[status];
  return (
    <span className={`fh-badge ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

export function FieldHistoryPage() {
  const [items, setItems]           = useState<FieldInspectionRecord[]>([]);
  const [filter, setFilter]         = useState<StatusFilter>('ALL');
  const [search, setSearch]         = useState('');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await officerService.getFieldHistory();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(item => {
    if (filter !== 'ALL' && item.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.product_name.toLowerCase().includes(q) ||
        item.vendor_name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.brand_name?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const totalToday    = items.length;
  const violations    = items.filter(i => i.status === 'NON_COMPLIANT').length;
  const noticeIssued  = items.filter(i => i.notice_issued).length;
  const complianceRate = totalToday > 0
    ? Math.round((items.filter(i => i.status === 'COMPLIANT').length / totalToday) * 100)
    : 0;

  return (
    <div className="fh-page">
      {/* ── Summary strip ────────────────────────────────────────────────── */}
      <div className="fh-summary">
        <div className="fh-summary-item">
          <span className="fh-summary-val">{totalToday}</span>
          <span className="fh-summary-label">Inspections</span>
        </div>
        <div className="fh-summary-item fh-summary-rate">
          <span className="fh-summary-val">{complianceRate}%</span>
          <span className="fh-summary-label">Compliance</span>
        </div>
        <div className="fh-summary-item fh-summary-violations">
          <span className="fh-summary-val">{violations}</span>
          <span className="fh-summary-label">Violations</span>
        </div>
        <div className="fh-summary-item fh-summary-notices">
          <span className="fh-summary-val">{noticeIssued}</span>
          <span className="fh-summary-label">Notices Issued</span>
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="fh-controls">
        {/* Search */}
        <div className="fh-search">
          <Search size={14} className="fh-search-icon" />
          <input
            className="fh-search-input"
            type="text"
            placeholder="Search product, vendor, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="fh-search-clear" onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="fh-filter-pills" role="group" aria-label="Filter by status">
          {(['ALL', 'COMPLIANT', 'NON_COMPLIANT', 'REQUIRES_REVIEW'] as StatusFilter[]).map(f => (
            <button
              key={f}
              className={`fh-filter-pill ${filter === f ? 'active' : ''} fh-pill--${f.toLowerCase()}`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Records list ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="fh-loading">
          <span className="fh-loading-dot" /><span className="fh-loading-dot" /><span className="fh-loading-dot" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="fh-empty">
          <Search size={32} className="fh-empty-icon" />
          <p>No records match your filter.</p>
        </div>
      ) : (
        <div className="fh-list">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`fh-card fh-card--${item.status.toLowerCase()} ${expanded === item.id ? 'fh-card--open' : ''}`}
            >
              {/* Card header */}
              <button
                className="fh-card-header"
                onClick={() => setExpanded(e => e === item.id ? null : item.id)}
                type="button"
                aria-expanded={expanded === item.id}
              >
                {/* Score ring */}
                <div
                  className="fh-score-ring"
                  title={`Compliance score: ${item.compliance_score}%`}
                  style={{ '--score': item.compliance_score } as React.CSSProperties}
                >
                  <svg viewBox="0 0 36 36" className="fh-score-svg">
                    <circle cx="18" cy="18" r="15.9" />
                    <circle
                      cx="18" cy="18" r="15.9"
                      className="fh-score-arc"
                      style={{
                        strokeDasharray: `${item.compliance_score} 100`,
                        stroke: item.compliance_score >= 80 ? 'var(--officer-compliant)'
                               : item.compliance_score >= 50 ? 'var(--officer-review)'
                               : 'var(--officer-violation)',
                      }}
                    />
                  </svg>
                  <span className="fh-score-val">{item.compliance_score}</span>
                </div>

                {/* Main info */}
                <div className="fh-card-info">
                  <span className="fh-card-product">{item.product_name}</span>
                  <span className="fh-card-vendor">
                    {item.vendor_name} · {item.location}
                  </span>
                </div>

                {/* Right side */}
                <div className="fh-card-right">
                  <StatusBadge status={item.status} />
                  {item.notice_issued && (
                    <span className="fh-notice-chip">
                      <ArrowUpRight size={10} />
                      Notice
                    </span>
                  )}
                  <span className="fh-card-time">
                    {new Date(item.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`fh-card-caret ${expanded === item.id ? 'open' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded violation detail */}
              {expanded === item.id && (
                <div className="fh-card-body">
                  {item.brand_name && (
                    <div className="fh-detail-row">
                      <span className="fh-detail-label">Brand</span>
                      <span className="fh-detail-val">{item.brand_name}</span>
                    </div>
                  )}
                  <div className="fh-detail-row">
                    <span className="fh-detail-label">Compliance Score</span>
                    <span className="fh-detail-val">{item.compliance_score}/100</span>
                  </div>
                  {item.violations.length > 0 ? (
                    <div className="fh-violations-list">
                      <span className="fh-violations-title">
                        <AlertTriangle size={12} />
                        Violations Detected ({item.violations.length})
                      </span>
                      {item.violations.map((v, i) => (
                        <div key={i} className="fh-violation">
                          <span className="fh-violation-ref">{v.rule_ref}</span>
                          <span className="fh-violation-desc">{v.description}</span>
                          {v.tag && (
                            <span className="fh-violation-tag">
                              <Tag size={10} />
                              {v.tag}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="fh-no-violations">
                      <CheckCircle2 size={14} />
                      All Rule 6 declarations verified — No violations detected
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
