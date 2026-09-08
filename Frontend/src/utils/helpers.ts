// =============================================================================
// SIH26034 — Utility Helpers
// =============================================================================

import type { InspectionStatus } from '../types';

// ── Date Formatting ───────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ── Status Helpers ────────────────────────────────────────────────────────────

export function statusLabel(status: InspectionStatus): string {
  const map: Record<InspectionStatus, string> = {
    UPLOADED:        'Uploaded',
    ANALYZING:       'Analyzing',
    EXTRACTED:       'Extracted',
    UNDER_REVIEW:    'Under Review',
    COMPLIANT:       'Compliant',
    NON_COMPLIANT:   'Non-Compliant',
    REQUIRES_REVIEW: 'Requires Review',
    FINALIZED:       'Finalized',
  };
  return map[status] ?? status;
}

export function statusColor(status: InspectionStatus): string {
  const map: Record<InspectionStatus, string> = {
    UPLOADED:        'var(--status-uploaded)',
    ANALYZING:       'var(--status-analyzing)',
    EXTRACTED:       'var(--status-extracted)',
    UNDER_REVIEW:    'var(--status-under-review)',
    COMPLIANT:       'var(--status-compliant)',
    NON_COMPLIANT:   'var(--status-non-compliant)',
    REQUIRES_REVIEW: 'var(--status-under-review)',
    FINALIZED:       'var(--status-finalized)',
  };
  return map[status] ?? '#6B7280';
}

export function statusBg(status: InspectionStatus): string {
  const map: Record<InspectionStatus, string> = {
    UPLOADED:        'var(--status-uploaded-bg)',
    ANALYZING:       'var(--status-analyzing-bg)',
    EXTRACTED:       'var(--status-extracted-bg)',
    UNDER_REVIEW:    'var(--status-under-review-bg)',
    COMPLIANT:       'var(--status-compliant-bg)',
    NON_COMPLIANT:   'var(--status-non-compliant-bg)',
    REQUIRES_REVIEW: 'var(--status-under-review-bg)',
    FINALIZED:       'var(--status-finalized-bg)',
  };
  return map[status] ?? '#f9fafb';
}

// ── Compliance Score ──────────────────────────────────────────────────────────

export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--color-compliant)';
  if (score >= 60) return 'var(--color-warning)';
  return 'var(--color-non-compliant)';
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Compliant';
  if (score >= 60) return 'Marginal';
  return 'Non-Compliant';
}

export function confidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'High';
  if (confidence >= 70) return 'Medium';
  return 'Low';
}

export function confidenceColor(confidence: number): string {
  if (confidence >= 90) return 'var(--color-compliant)';
  if (confidence >= 70) return 'var(--color-warning)';
  return 'var(--color-non-compliant)';
}

// ── File Size ─────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Initials ──────────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── UUID short ────────────────────────────────────────────────────────────────

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
