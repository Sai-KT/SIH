// =============================================================================
// SIH26034 — Inspection Detail Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, User, Hash, Download,
  CheckCircle, AlertCircle, AlertTriangle, FileText,
  RefreshCw, Package,
} from 'lucide-react';
import { inspectionService, reportService } from '../services/api';
import type { Inspection, ExtractedField } from '../types';
import { StatusBadge, Skeleton } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  formatDateTime, scoreColor, 
  confidenceLabel, confidenceColor, shortId,
} from '../utils/helpers';
import './InspectionDetailPage.css';

function FieldRow({ field }: { field: ExtractedField }) {
  const isOk = field.is_compliant === true;
  const isFail = field.is_compliant === false;

  return (
    <div className={`detail-field ${isFail ? 'detail-field--fail' : ''}`}>
      <div className="detail-field-header">
        <div className="detail-field-name">
          {isOk && <CheckCircle size={14} color="var(--color-compliant)" />}
          {isFail && <AlertCircle size={14} color="var(--color-non-compliant)" />}
          {field.is_compliant === null && <AlertTriangle size={14} color="var(--color-warning)" />}
          <span>{field.field_name}</span>
        </div>
        <div className="detail-field-meta">
          <span style={{ fontSize: 11, color: confidenceColor(field.confidence), fontWeight: 500 }}>
            {confidenceLabel(field.confidence)} confidence ({field.confidence}%)
          </span>
        </div>
      </div>
      <div className="detail-field-value">
        {field.reviewer_override ?? field.extracted_value ?? (
          <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Not found</span>
        )}
      </div>
      {field.violation_detail && (
        <div className="detail-field-violation">
          <AlertTriangle size={12} />
          {field.violation_detail}
        </div>
      )}
    </div>
  );
}

export function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    inspectionService.getById(id)
      .then(setInspection)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerateReport = async () => {
    if (!inspection) return;
    setGeneratingReport(true);
    await reportService.generate(inspection.id);
    setGeneratingReport(false);
  };

  if (loading) {
    return (
      <div className="page-container">
        <Skeleton height={32} width="30%" className="mb-4" />
        <div className="grid-2 mb-6">
          {[1,2,3,4].map(i => <Skeleton key={i} height={100} />)}
        </div>
        <Skeleton height={400} />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <AlertCircle size={48} className="empty-state-icon" />
          <p className="empty-state-title">{error || 'Inspection not found'}</p>
          <Button onClick={() => navigate('/inspections')} icon={<ArrowLeft size={16} />} variant="secondary">
            Back to Inspections
          </Button>
        </div>
      </div>
    );
  }

  const result = inspection.compliance_result;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-center gap-4">
        <button className="detail-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">Inspection #{shortId(inspection.id)}</h1>
            <StatusBadge status={inspection.status} />
          </div>
          <p className="page-subtitle">{inspection.product_name || 'Unknown Product'}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<FileText size={14} />}
            loading={generatingReport}
            onClick={handleGenerateReport}
          >
            Generate Report
          </Button>
          {inspection.report_url && (
            <Button size="sm" icon={<Download size={14} />}>
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {/* Meta cards */}
      <div className="detail-meta-grid">
        <div className="detail-meta-card">
          <Package size={16} className="detail-meta-icon" />
          <div>
            <div className="detail-meta-label">Product</div>
            <div className="detail-meta-value">{inspection.product_name || '—'}</div>
            {inspection.brand_name && (
              <div className="detail-meta-sub">{inspection.brand_name}</div>
            )}
          </div>
        </div>
        <div className="detail-meta-card">
          <MapPin size={16} className="detail-meta-icon" />
          <div>
            <div className="detail-meta-label">Location</div>
            <div className="detail-meta-value">{inspection.location || '—'}</div>
          </div>
        </div>
        <div className="detail-meta-card">
          <User size={16} className="detail-meta-icon" />
          <div>
            <div className="detail-meta-label">Inspector</div>
            <div className="detail-meta-value">{inspection.inspector_name || '—'}</div>
          </div>
        </div>
        <div className="detail-meta-card">
          <Calendar size={16} className="detail-meta-icon" />
          <div>
            <div className="detail-meta-label">Inspection Date</div>
            <div className="detail-meta-value">{formatDateTime(inspection.inspection_date)}</div>
          </div>
        </div>
        {inspection.batch_number && (
          <div className="detail-meta-card">
            <Hash size={16} className="detail-meta-icon" />
            <div>
              <div className="detail-meta-label">Batch Number</div>
              <div className="detail-meta-value">{inspection.batch_number}</div>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Result */}
      {result && (
        <div className="detail-result-section">
          {/* Score hero */}
          <div className="detail-score-card" style={{ borderColor: scoreColor(result.overall_score) + '40' }}>
            <div className="detail-score-left">
              <div
                className="detail-score-circle"
                style={{ borderColor: scoreColor(result.overall_score) }}
              >
                <span className="detail-score-num" style={{ color: scoreColor(result.overall_score) }}>
                  {result.overall_score}
                </span>
                <span className="detail-score-pct">%</span>
              </div>
              <div>
                <div
                  className="detail-score-verdict"
                  style={{ color: scoreColor(result.overall_score) }}
                >
                  {result.overall_score >= 80 ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
                </div>
                <div className="detail-score-sub">
                  {result.compliant_fields}/{result.total_fields_checked} fields compliant
                </div>
              </div>
            </div>
            <div className="detail-score-right">
              <div className="detail-score-stat">
                <span className="detail-score-stat-val" style={{ color: 'var(--color-non-compliant)' }}>
                  {result.critical_violations}
                </span>
                <span>Critical Violations</span>
              </div>
              <div className="detail-score-stat">
                <span className="detail-score-stat-val" style={{ color: 'var(--color-warning)' }}>
                  {result.minor_violations}
                </span>
                <span>Minor Violations</span>
              </div>
              <div className="detail-score-stat">
                <span className="detail-score-stat-val">{result.ai_confidence}%</span>
                <span>AI Confidence</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card mb-6">
            <div className="card-header">
              <span className="card-title">AI Analysis Summary</span>
            </div>
            <div className="card-body">
              <p className="text-sm" style={{ lineHeight: 1.7 }}>{result.summary}</p>
            </div>
          </div>

          {/* Extracted Fields */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Extracted Fields</span>
              <span className="text-xs text-secondary">
                {result.extracted_fields.length} fields checked
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="detail-fields-list">
                {result.extracted_fields.map(field => (
                  <FieldRow key={field.field_name} field={field} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="card">
          <div className="empty-state">
            <RefreshCw size={36} className="empty-state-icon" />
            <p className="empty-state-title">Analysis Not Available</p>
            <p>This inspection has not been analyzed yet. Status: <strong>{inspection.status}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}
