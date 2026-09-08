// =============================================================================
// SIH26034 — UI Primitives: Badge, StatusBadge, Spinner, Skeleton, ProgressBar
// =============================================================================

import React from 'react';
import type { InspectionStatus } from '../../types';
import { statusLabel, statusColor, statusBg, scoreColor } from '../../utils/helpers';
import './Badge.css';

// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', dot = false, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: InspectionStatus;
  showDot?: boolean;
}

export function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const isAnimated = status === 'ANALYZING';
  return (
    <span
      className={`status-badge ${isAnimated ? 'status-badge--animated' : ''}`}
      style={{
        color: statusColor(status),
        background: statusBg(status),
        borderColor: statusColor(status) + '40',
      }}
    >
      {showDot && (
        <span
          className={`status-dot ${isAnimated ? 'animate-pulse' : ''}`}
          style={{ background: statusColor(status) }}
        />
      )}
      {statusLabel(status)}
    </span>
  );
}

// ── Score Badge ───────────────────────────────────────────────────────────────

export function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <span
      className="score-badge"
      style={{ color, borderColor: color + '40', background: color + '12' }}
    >
      {score}%
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 20, color = 'var(--color-primary)' }: SpinnerProps) {
  return (
    <div
      className="spinner"
      style={{
        width: size, height: size,
        borderColor: color + '30',
        borderTopColor: color,
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({
  width = '100%', height = 16, borderRadius = 'var(--radius-sm)', className = ''
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  animated?: boolean;
}

export function ProgressBar({
  value, color = 'var(--color-primary)', height = 8, showLabel = false, animated = false,
}: ProgressBarProps) {
  return (
    <div className="progress-bar-wrapper">
      <div
        className="progress-bar-track"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress-bar-fill ${animated ? 'progress-bar-fill--animated' : ''}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, height }}
        />
      </div>
      {showLabel && (
        <span className="progress-bar-label" style={{ color }}>{value}%</span>
      )}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="divider" />;
  return (
    <div className="divider-labeled">
      <span className="divider-label">{label}</span>
    </div>
  );
}
