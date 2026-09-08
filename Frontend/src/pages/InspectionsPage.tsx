// =============================================================================
// SIH26034 — Inspections List Page
// =============================================================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, RefreshCw, ChevronDown } from 'lucide-react';
import { inspectionService } from '../services/api';
import type { Inspection, InspectionStatus, InspectionFilters } from '../types';
import { StatusBadge, Skeleton } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatDateTime, shortId, scoreColor } from '../utils/helpers';
import './InspectionsPage.css';

const STATUS_OPTIONS: { label: string; value: InspectionStatus | 'ALL' }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Uploaded',     value: 'UPLOADED' },
  { label: 'Analyzing',    value: 'ANALYZING' },
  { label: 'Extracted',    value: 'EXTRACTED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Compliant',    value: 'COMPLIANT' },
  { label: 'Non-Compliant',value: 'NON_COMPLIANT' },
  { label: 'Finalized',    value: 'FINALIZED' },
];

export function InspectionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InspectionFilters>({ status: 'ALL', search: urlSearch });

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setFilters(f => ({ ...f, search: q }));
    }
  }, [searchParams]);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await inspectionService.list(filters);
      setInspections(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInspections(); }, [filters]);

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Inspections</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${inspections.length} inspection${inspections.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={fetchInspections}>Refresh</Button>
          <Button icon={<Plus size={16} />} onClick={() => navigate('/new-inspection')}>New Inspection</Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="insp-filter-bar">
        {/* Search */}
        <div className="insp-search-wrap">
          <Search size={15} className="insp-search-icon" />
          <input
            type="text"
            placeholder="Search by product, location, ID..."
            className="insp-search-input"
            value={filters.search ?? ''}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>

        {/* Status filter */}
        <div className="insp-select-wrap">
          <select
            className="insp-select"
            value={filters.status ?? 'ALL'}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value as InspectionStatus | 'ALL' }))}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="insp-select-icon" />
        </div>

        {/* Location filter */}
        <input
          type="text"
          placeholder="Filter by location..."
          className="insp-input"
          value={filters.location ?? ''}
          onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Inspection ID</th>
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
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><Skeleton height={16} width="80%" /></td>
                      ))}
                    </tr>
                  ))
                : inspections.length === 0
                ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <p className="empty-state-title">No inspections found</p>
                          <p>Try adjusting your filters or start a new inspection.</p>
                        </div>
                      </td>
                    </tr>
                  )
                : inspections.map(insp => (
                    <tr
                      key={insp.id}
                      className="clickable-row"
                      onClick={() => navigate(`/inspections/${insp.id}`)}
                    >
                      <td>
                        <span className="insp-id-badge">#{shortId(insp.id)}</span>
                      </td>
                      <td>
                        <div>
                          <div className="text-sm font-medium truncate" style={{ maxWidth: 200 }}>
                            {insp.product_name || 'Unknown Product'}
                          </div>
                          {insp.brand_name && (
                            <div className="text-xs text-secondary">{insp.brand_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="text-sm" style={{ maxWidth: 160 }}>
                        <span className="truncate">{insp.location || '—'}</span>
                      </td>
                      <td className="text-sm">{insp.inspector_name || '—'}</td>
                      <td><StatusBadge status={insp.status} /></td>
                      <td>
                        {insp.compliance_score != null ? (
                          <span className="insp-score" style={{ color: scoreColor(insp.compliance_score) }}>
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
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
