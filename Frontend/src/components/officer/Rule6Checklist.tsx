// =============================================================================
// SIH26034 — Rule 6 Rapid Checklist
// Interactive compliance checklist for Rule 6 (Packaged Commodities) Rules, 2011
// Supports keyboard navigation: ↑↓ row select, V violation, Space accept, Esc clear
// =============================================================================

import React, { useCallback, useEffect, useRef } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, Circle, Tag,
} from 'lucide-react';
import type { Rule6CheckItem, Rule6Status, ViolationTag } from '../../types';
import './Rule6Checklist.css';

// ── Default Rule 6 / 7 / 9 checklist rows ────────────────────────────────────

export const DEFAULT_CHECKLIST: Rule6CheckItem[] = [
  {
    id: 'rule_6_1_a',
    rule_ref: 'Rule 6(1)(a)',
    label: 'Manufacturer / Packer / Importer Name & Address',
    description: 'Complete name and postal address of the manufacturer, packer, or importer (including PIN code).',
    status: 'UNCHECKED',
  },
  {
    id: 'rule_6_1_b',
    rule_ref: 'Rule 6(1)(b)',
    label: 'Generic / Common Name of Commodity',
    description: 'The common or generic name of the commodity as widely understood by consumers.',
    status: 'UNCHECKED',
  },
  {
    id: 'rule_6_1_c',
    rule_ref: 'Rule 6(1)(c)',
    label: 'Net Quantity (Standard Unit & Font Size)',
    description: 'Net quantity in standard unit (g, kg, ml, L). Font size must comply with Schedule III norms.',
    status: 'UNCHECKED',
  },
  {
    id: 'rule_6_1_d',
    rule_ref: 'Rule 6(1)(d)',
    label: 'Month & Year of Manufacture / Packaging / Import',
    description: 'Month and year of manufacture, packaging, or import — must be clear and legible (MM/YYYY or month name).',
    status: 'UNCHECKED',
  },
  {
    id: 'rule_6_1_e',
    rule_ref: 'Rule 6(1)(e)',
    label: 'Maximum Retail Price (MRP ₹ xx.xx incl. of all taxes)',
    description: 'MRP in Indian Rupees inclusive of all taxes on the principal display panel.',
    status: 'UNCHECKED',
  },
  {
    id: 'rule_6_1_f',
    rule_ref: 'Rule 6(1)(f)',
    label: 'Consumer Care Details (Phone, Email, Address)',
    description: 'Name, address, and at least one contact detail (phone or email) of the consumer grievance officer.',
    status: 'UNCHECKED',
  },
  {
    id: 'rule_6_1_g',
    rule_ref: 'Rule 6(1)(g)',
    label: 'Country of Origin',
    description: 'Country of origin required for imported commodities; "Made in India" for domestic products.',
    status: 'UNCHECKED',
  },
  {
    id: 'rule_7',
    rule_ref: 'Rule 7',
    label: 'Unit Sale Price (USP)',
    description: 'Unit sale price (e.g., ₹0.50/g or ₹2.00/ml) to enable consumer price comparison.',
    status: 'UNCHECKED',
  },
  {
    id: 'rule_9_food',
    rule_ref: 'Rule 9 / Food',
    label: 'FSSAI License & BIS/ISI Mark (if applicable)',
    description: 'FSSAI license number for food items; BIS/ISI mark for items covered under mandatory certification orders.',
    status: 'UNCHECKED',
  },
];

// ── One-touch violation tags ──────────────────────────────────────────────────

export const VIOLATION_TAGS: ViolationTag[] = [
  { key: 'SMUDGED_DATE',        label: 'Smudged/Missing Date',      rule_ref: 'Rule 6(1)(d)' },
  { key: 'NO_USP',              label: 'No Unit Sale Price',        rule_ref: 'Rule 7'       },
  { key: 'DUAL_MRP',            label: 'Dual MRP / Overstickered',  rule_ref: 'Rule 6(1)(e)' },
  { key: 'INCOMPLETE_ADDRESS',  label: 'Incomplete Address',        rule_ref: 'Rule 6(1)(a)' },
  { key: 'NON_STD_WEIGHT',      label: 'Non-standard Weight Unit',  rule_ref: 'Rule 6(1)(c)' },
  { key: 'MISSING_HELPLINE',    label: 'Missing Consumer Helpline', rule_ref: 'Rule 6(1)(f)' },
  { key: 'MISSING_ORIGIN',      label: 'Missing Country of Origin', rule_ref: 'Rule 6(1)(g)' },
  { key: 'NO_FSSAI',            label: 'No FSSAI License',          rule_ref: 'Rule 9 / Food' },
];

// ── Status icon helper ────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: Rule6Status }) {
  switch (status) {
    case 'COMPLIANT':  return <CheckCircle2 size={16} className="r6-status-icon r6-status-compliant" />;
    case 'VIOLATION':  return <XCircle      size={16} className="r6-status-icon r6-status-violation" />;
    case 'REVIEW':     return <AlertCircle  size={16} className="r6-status-icon r6-status-review"    />;
    default:           return <Circle       size={16} className="r6-status-icon r6-status-unchecked" />;
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Rule6ChecklistProps {
  items: Rule6CheckItem[];
  selectedIndex: number;
  onSelectRow: (index: number) => void;
  onSetStatus: (index: number, status: Rule6Status, tag?: string) => void;
  onSetViolationTag: (index: number, tag: ViolationTag) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Rule6Checklist({
  items,
  selectedIndex,
  onSelectRow,
  onSetStatus,
  onSetViolationTag,
}: Rule6ChecklistProps) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll selected row into view
  useEffect(() => {
    rowRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  const handleRowClick = useCallback((idx: number) => {
    onSelectRow(idx);
  }, [onSelectRow]);

  const cycleStatus = useCallback((idx: number) => {
    const order: Rule6Status[] = ['UNCHECKED', 'COMPLIANT', 'VIOLATION', 'REVIEW'];
    const cur = items[idx].status;
    const next = order[(order.indexOf(cur) + 1) % order.length];
    onSetStatus(idx, next);
  }, [items, onSetStatus]);

  return (
    <div className="r6-checklist" role="grid" aria-label="Rule 6 Compliance Checklist">
      {/* Header */}
      <div className="r6-header" role="row">
        <div className="r6-col-rule"  role="columnheader">Rule</div>
        <div className="r6-col-label" role="columnheader">Declaration Required</div>
        <div className="r6-col-status"role="columnheader">Status</div>
        <div className="r6-col-tags"  role="columnheader">Quick Violation Tags</div>
      </div>

      {/* Rows */}
      <div className="r6-body">
        {items.map((item, idx) => (
          <div
            key={item.id}
            ref={el => { rowRefs.current[idx] = el; }}
            className={`r6-row r6-row--${item.status.toLowerCase()} ${idx === selectedIndex ? 'r6-row--selected' : ''}`}
            role="row"
            aria-selected={idx === selectedIndex}
            tabIndex={idx === selectedIndex ? 0 : -1}
            onClick={() => handleRowClick(idx)}
            onKeyDown={e => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                cycleStatus(idx);
              }
            }}
          >
            {/* Rule ref */}
            <div className="r6-col-rule" role="gridcell">
              <span className="r6-rule-ref">{item.rule_ref}</span>
            </div>

            {/* Label + description */}
            <div className="r6-col-label" role="gridcell">
              <span className="r6-label">{item.label}</span>
              <span className="r6-desc">{item.description}</span>
              {item.violation_tag && (
                <span className="r6-tag-badge">
                  <Tag size={10} />
                  {VIOLATION_TAGS.find(t => t.key === item.violation_tag)?.label || item.violation_tag}
                </span>
              )}
            </div>

            {/* Status badge — click to cycle */}
            <div className="r6-col-status" role="gridcell">
              <button
                className={`r6-status-btn r6-status-btn--${item.status.toLowerCase()}`}
                onClick={e => { e.stopPropagation(); onSetStatus(idx, item.status === 'COMPLIANT' ? 'VIOLATION' : 'COMPLIANT'); }}
                title={`Status: ${item.status} — click to toggle`}
                type="button"
                aria-label={`Toggle compliance status for ${item.rule_ref}`}
              >
                <StatusIcon status={item.status} />
                <span>{item.status}</span>
              </button>
            </div>

            {/* One-touch violation tags */}
            <div className="r6-col-tags" role="gridcell">
              {item.status === 'VIOLATION' || item.status === 'REVIEW' ? (
                <div className="r6-tags-row">
                  {VIOLATION_TAGS.map(tag => (
                    <button
                      key={tag.key}
                      className={`r6-violation-tag ${item.violation_tag === tag.key ? 'active' : ''}`}
                      onClick={e => { e.stopPropagation(); onSetViolationTag(idx, tag); }}
                      title={`${tag.label} (${tag.rule_ref})`}
                      type="button"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="r6-tags-placeholder">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
