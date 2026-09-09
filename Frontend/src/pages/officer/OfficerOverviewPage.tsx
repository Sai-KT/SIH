// =============================================================================
// SIH26034 — Officer Overview Page (/officer)
// Today's shift summary, quick-action launch, and mission briefing.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Zap, CheckCircle2, AlertTriangle, Clock, ListChecks,
  ArrowRight, TrendingUp, ShieldAlert, Info,
} from 'lucide-react';
import { officerService } from '../../services/api';
import type { OfficerTally, FieldInspectionRecord } from '../../types';
import './OfficerOverviewPage.css';

interface OutletCtx {
  location: string;
  tally: OfficerTally | null;
  refreshTally: () => void;
}

export function OfficerOverviewPage() {
  const navigate    = useNavigate();
  const { location, tally } = useOutletContext<OutletCtx>();
  const [recentItems, setRecentItems] = useState<FieldInspectionRecord[]>([]);

  useEffect(() => {
    officerService.getFieldHistory().then(items => {
      setRecentItems(items.slice(0, 5));
    });
  }, []);

  const complianceRate = tally && tally.total > 0
    ? Math.round((tally.compliant / tally.total) * 100)
    : null;

  return (
    <div className="overview-page">
      {/* ── Welcome banner ────────────────────────────────────────────────── */}
      <div className="overview-banner">
        <div className="overview-banner-text">
          <h1 className="overview-h1">Field Inspection Shift Overview</h1>
          <p className="overview-sub">
            <Info size={13} /> Current area: <strong>{location}</strong>
          </p>
        </div>
        <button
          className="overview-launch-btn"
          onClick={() => navigate('/officer/rapid-inspect')}
          type="button"
        >
          <Zap size={18} />
          Start Rapid Inspection
          <ArrowRight size={15} />
        </button>
      </div>

      {/* ── Tally cards ───────────────────────────────────────────────────── */}
      <div className="overview-tally-grid">
        <div className="overview-tally-card overview-tally-total">
          <div className="overview-tally-icon"><Clock size={22} /></div>
          <div className="overview-tally-body">
            <span className="overview-tally-val">{tally?.total ?? '—'}</span>
            <span className="overview-tally-label">Total Today</span>
          </div>
        </div>
        <div className="overview-tally-card overview-tally-green">
          <div className="overview-tally-icon"><CheckCircle2 size={22} /></div>
          <div className="overview-tally-body">
            <span className="overview-tally-val">{tally?.compliant ?? '—'}</span>
            <span className="overview-tally-label">Compliant</span>
          </div>
        </div>
        <div className="overview-tally-card overview-tally-red">
          <div className="overview-tally-icon"><AlertTriangle size={22} /></div>
          <div className="overview-tally-body">
            <span className="overview-tally-val">{tally?.non_compliant ?? '—'}</span>
            <span className="overview-tally-label">Violations</span>
          </div>
        </div>
        <div className="overview-tally-card overview-tally-amber">
          <div className="overview-tally-icon"><ShieldAlert size={22} /></div>
          <div className="overview-tally-body">
            <span className="overview-tally-val">{tally?.requires_review ?? '—'}</span>
            <span className="overview-tally-label">Under Review</span>
          </div>
        </div>
        {complianceRate !== null && (
          <div className="overview-tally-card overview-tally-rate">
            <div className="overview-tally-icon"><TrendingUp size={22} /></div>
            <div className="overview-tally-body">
              <span className="overview-tally-val">{complianceRate}%</span>
              <span className="overview-tally-label">Compliance Rate</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick links ───────────────────────────────────────────────────── */}
      <div className="overview-actions">
        <button
          className="overview-action-card overview-action-inspect"
          onClick={() => navigate('/officer/rapid-inspect')}
          type="button"
        >
          <Zap size={20} />
          <span>Rapid Inspect</span>
          <span className="overview-action-hint">Rule 6 checklist + notice</span>
        </button>
        <button
          className="overview-action-card overview-action-history"
          onClick={() => navigate('/officer/history')}
          type="button"
        >
          <ListChecks size={20} />
          <span>Today's History</span>
          <span className="overview-action-hint">{tally?.total ?? 0} records</span>
        </button>
      </div>

      {/* ── Recent 5 inspections ──────────────────────────────────────────── */}
      {recentItems.length > 0 && (
        <div className="overview-recent">
          <div className="overview-section-header">
            <h2 className="overview-section-title">Recent Inspections</h2>
            <button
              className="overview-view-all"
              onClick={() => navigate('/officer/history')}
              type="button"
            >
              View All <ArrowRight size={13} />
            </button>
          </div>
          <div className="overview-recent-list">
            {recentItems.map(item => (
              <div key={item.id} className="overview-recent-item">
                <div className={`overview-recent-status overview-recent-status--${item.status.toLowerCase()}`} />
                <div className="overview-recent-info">
                  <span className="overview-recent-product">{item.product_name}</span>
                  <span className="overview-recent-vendor">{item.vendor_name} · {item.location}</span>
                </div>
                <div className="overview-recent-right">
                  <span
                    className={`overview-recent-badge overview-recent-badge--${item.status.toLowerCase()}`}
                  >
                    {item.status === 'COMPLIANT'       && <CheckCircle2 size={12} />}
                    {item.status === 'NON_COMPLIANT'   && <AlertTriangle size={12} />}
                    {item.status === 'REQUIRES_REVIEW' && <ShieldAlert size={12} />}
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className="overview-recent-time">
                    {new Date(item.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
