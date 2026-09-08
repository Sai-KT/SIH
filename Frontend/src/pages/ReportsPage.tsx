// =============================================================================
// SIH26034 — Reports Page
// =============================================================================

import React, { useEffect, useState } from 'react';
import { Download, FileText, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { reportService } from '../services/api';
import type { Report } from '../types';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Badge';
import { formatDateTime } from '../utils/helpers';
import './ReportsPage.css';

function ReportStatusIcon({ status }: { status: Report['status'] }) {
  if (status === 'READY')      return <CheckCircle size={16} color="var(--color-compliant)" />;
  if (status === 'GENERATING') return <Clock size={16} color="var(--color-warning)" />;
  return <AlertCircle size={16} color="var(--color-non-compliant)" />;
}

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.list().then(setReports).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Compliance Reports</h1>
          <p className="page-subtitle">Download and manage inspection reports</p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={() => {
          setLoading(true);
          reportService.list().then(setReports).finally(() => setLoading(false));
        }}>
          Refresh
        </Button>
      </div>

      <div className="reports-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="report-card">
                <Skeleton height={20} width="60%" className="mb-2" />
                <Skeleton height={14} width="40%" className="mb-4" />
                <Skeleton height={36} />
              </div>
            ))
          : reports.length === 0
          ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <FileText size={48} className="empty-state-icon" />
                <p className="empty-state-title">No Reports Yet</p>
                <p>Complete an inspection to generate a compliance report.</p>
              </div>
            )
          : reports.map(report => (
              <div key={report.id} className="report-card">
                <div className="report-card-header">
                  <div className="report-file-icon">
                    <FileText size={24} />
                  </div>
                  <div className="report-card-status">
                    <ReportStatusIcon status={report.status} />
                    <span className={`report-status-label report-status--${report.status.toLowerCase()}`}>
                      {report.status}
                    </span>
                  </div>
                </div>
                <h3 className="report-product-name">{report.product_name || 'Inspection Report'}</h3>
                <p className="report-meta">
                  {report.location && <span>{report.location} · </span>}
                  {report.format} · {report.file_size_kb}KB
                </p>
                <p className="report-date">Generated {formatDateTime(report.generated_at)}</p>
                <p className="report-by">By {report.generated_by}</p>
                <div className="report-card-footer">
                  <Button
                    size="sm"
                    icon={<Download size={14} />}
                    disabled={report.status !== 'READY'}
                    fullWidth
                  >
                    Download PDF
                  </Button>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}
