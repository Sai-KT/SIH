// =============================================================================
// SIH26034 — TopSearchBar.tsx
// Fully Functional Global Omnibar & Legal Metrology Search Engine
// =============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, FileCheck, Package, Scale, ArrowRight,
  PlusCircle, BarChart3, FileText, Bell, Users,
  ShieldCheck, MapPin, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { mockInspections } from '../../mock/data';
import type { Inspection } from '../../types';
import './TopSearchBar.css';

// ── Legal Metrology Rules Index ────────────────────────────────────────────────

interface LegalRule {
  id: string;
  ruleNumber: string;
  title: string;
  description: string;
  actReference: string;
  keywords: string[];
}

const STATUTORY_RULES: LegalRule[] = [
  {
    id: 'rule-6-1-a',
    ruleNumber: 'Rule 6(1)(a)',
    title: 'Manufacturer / Packer / Importer Details',
    description: 'Name and complete address of the manufacturer, packer or importer must be clearly declared.',
    actReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    keywords: ['manufacturer', 'packer', 'importer', 'address', 'company', 'premises'],
  },
  {
    id: 'rule-6-1-b',
    ruleNumber: 'Rule 6(1)(b)',
    title: 'Generic or Common Name',
    description: 'Generic or common name of the commodity contained in the package must be prominently stated.',
    actReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    keywords: ['generic', 'common name', 'product name', 'commodity'],
  },
  {
    id: 'rule-6-1-c',
    ruleNumber: 'Rule 6(1)(c)',
    title: 'Net Quantity Declaration',
    description: 'Net quantity in standard units of weight, measure or number (g, kg, ml, l).',
    actReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    keywords: ['net quantity', 'weight', 'volume', 'grams', 'kg', 'ml', 'litres', 'standard unit'],
  },
  {
    id: 'rule-6-1-d',
    ruleNumber: 'Rule 6(1)(d)',
    title: 'Date of Manufacture / Pre-packing',
    description: 'Month and year in which commodity is manufactured or pre-packed must be legible.',
    actReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    keywords: ['date', 'month', 'year', 'manufacture', 'expiry', 'best before', 'pre-pack'],
  },
  {
    id: 'rule-6-1-e',
    ruleNumber: 'Rule 6(1)(e)',
    title: 'Maximum Retail Price (MRP)',
    description: 'Retail sale price inclusive of all taxes in format "MRP ₹ xx.xx (incl. of all taxes)". Tampering or dual pricing prohibited.',
    actReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    keywords: ['mrp', 'price', 'retail price', 'taxes', 'overcharging', 'sticker', 'dual pricing'],
  },
  {
    id: 'rule-6-1-f',
    ruleNumber: 'Rule 6(1)(f)',
    title: 'Consumer Care Cell Details',
    description: 'Name, address, telephone number and email address of person/office to contact in case of consumer complaints.',
    actReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    keywords: ['consumer care', 'customer care', 'grievance', 'helpline', 'complaint', 'telephone', 'email'],
  },
  {
    id: 'rule-6-1-g',
    ruleNumber: 'Rule 6(1)(g)',
    title: 'Country of Origin',
    description: 'Country of origin or manufacture for imported packages must be prominently stated on principal display panel.',
    actReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    keywords: ['country of origin', 'import', 'imported', 'made in', 'foreign'],
  },
  {
    id: 'rule-7',
    ruleNumber: 'Rule 7',
    title: 'Unit Sale Price (USP)',
    description: 'Declaration of Unit Sale Price per gram, per kilogram, per millilitre, per litre or per item.',
    actReference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    keywords: ['unit sale price', 'usp', 'per gram', 'per kg', 'per ml'],
  },
  {
    id: 'sec-36',
    ruleNumber: 'Section 36',
    title: 'Penalty for Non-Standard Packages',
    description: 'Penalty for manufacturing, packing, or selling non-conforming packages: Fine up to ₹25,000 (1st offense), ₹50,000 (2nd), ₹1,00,000 or imprisonment.',
    actReference: 'Legal Metrology Act, 2009',
    keywords: ['penalty', 'fine', 'offense', 'imprisonment', 'violation', 'punishment', 'seizure'],
  },
];

// ── Quick Actions ─────────────────────────────────────────────────────────────

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  icon: React.ReactNode;
  keywords: string[];
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'act-new-insp',
    title: 'Create New Inspection',
    subtitle: 'Upload commodity package & run AI compliance engine',
    path: '/new-inspection',
    icon: <PlusCircle size={16} />,
    keywords: ['create', 'new', 'inspection', 'upload', 'scan', 'camera', 'add'],
  },
  {
    id: 'act-inspections',
    title: 'Inspections Register',
    subtitle: 'View, filter and export all field inspection records',
    path: '/inspections',
    icon: <FileCheck size={16} />,
    keywords: ['all', 'inspections', 'list', 'register', 'history', 'records'],
  },
  {
    id: 'act-reports',
    title: 'Statutory Reports & Notices',
    subtitle: 'Generate Notice of Non-Compliance & inspection reports',
    path: '/reports',
    icon: <FileText size={16} />,
    keywords: ['report', 'notice', 'statutory', 'pdf', 'export', 'seizure', 'challan'],
  },
  {
    id: 'act-analytics',
    title: 'Enforcement Analytics',
    subtitle: 'View Rule 6 violation breakdown, charts and compliance trends',
    path: '/analytics',
    icon: <BarChart3 size={16} />,
    keywords: ['analytics', 'charts', 'trends', 'violations', 'statistics', 'graph'],
  },
  {
    id: 'act-notifications',
    title: 'Alerts & Notifications',
    subtitle: 'View operational alerts, pending reviews & compliance warnings',
    path: '/notifications',
    icon: <Bell size={16} />,
    keywords: ['notifications', 'alerts', 'warnings', 'bell'],
  },
  {
    id: 'act-users',
    title: 'Officers & User Directory',
    subtitle: 'Manage inspectors, supervisors and enforcement credentials',
    path: '/admin/users',
    icon: <Users size={16} />,
    keywords: ['users', 'officers', 'inspectors', 'admin', 'directory', 'staff'],
  },
  {
    id: 'act-audit',
    title: 'Tamper-Evident Audit Trail',
    subtitle: 'Inspect immutable system event logs & action records',
    path: '/admin/audit-logs',
    icon: <ShieldCheck size={16} />,
    keywords: ['audit', 'logs', 'security', 'trail', 'history', 'events'],
  },
];

// ── Search Result Item Type ───────────────────────────────────────────────────

type SearchResultItem =
  | { type: 'inspection'; data: Inspection }
  | { type: 'rule'; data: LegalRule }
  | { type: 'action'; data: QuickAction };

export function TopSearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default / initial helpful items
      return {
        inspections: mockInspections.slice(0, 3),
        rules: STATUTORY_RULES.slice(0, 2),
        actions: QUICK_ACTIONS.slice(0, 3),
        totalCount: 8,
      };
    }

    // Filter Inspections
    const matchedInspections = mockInspections.filter(i => {
      const matchName = i.product_name?.toLowerCase().includes(q);
      const matchBrand = i.brand_name?.toLowerCase().includes(q);
      const matchCategory = i.product_category?.toLowerCase().includes(q);
      const matchBatch = i.batch_number?.toLowerCase().includes(q);
      const matchLoc = i.location?.toLowerCase().includes(q);
      const matchStatus = i.status.toLowerCase().replace('_', ' ').includes(q);
      const matchId = i.id.toLowerCase().includes(q);
      const matchInspector = i.inspector_name?.toLowerCase().includes(q);
      return (
        matchName || matchBrand || matchCategory || matchBatch ||
        matchLoc || matchStatus || matchId || matchInspector
      );
    }).slice(0, 5);

    // Filter Legal Rules
    const matchedRules = STATUTORY_RULES.filter(r => {
      const matchNum = r.ruleNumber.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchKw = r.keywords.some(k => k.toLowerCase().includes(q));
      return matchNum || matchTitle || matchDesc || matchKw;
    }).slice(0, 4);

    // Filter Actions
    const matchedActions = QUICK_ACTIONS.filter(a => {
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchSub = a.subtitle.toLowerCase().includes(q);
      const matchKw = a.keywords.some(k => k.toLowerCase().includes(q));
      return matchTitle || matchSub || matchKw;
    }).slice(0, 3);

    const totalCount = matchedInspections.length + matchedRules.length + matchedActions.length;

    return {
      inspections: matchedInspections,
      rules: matchedRules,
      actions: matchedActions,
      totalCount,
    };
  }, [query]);

  // Flattened array for keyboard navigation
  const flatItems = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];
    results.actions.forEach(a => items.push({ type: 'action', data: a }));
    results.inspections.forEach(i => items.push({ type: 'inspection', data: i }));
    results.rules.forEach(r => items.push({ type: 'rule', data: r }));
    return items;
  }, [results]);

  // Handle keyboard selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        handleSelectItem(flatItems[selectedIndex]);
      } else if (query.trim()) {
        // Fallback: View all in Inspections
        navigate(`/inspections?search=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    if (item.type === 'action') {
      navigate(item.data.path);
    } else if (item.type === 'inspection') {
      navigate(`/inspections/${item.data.id}`);
    } else if (item.type === 'rule') {
      navigate(`/analytics?rule=${encodeURIComponent(item.data.ruleNumber)}`);
    }
  };

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const viewAllInInspections = () => {
    navigate(`/inspections?search=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
  };

  // Track running item index for highlights
  let runningIndex = -1;

  return (
    <div className="top-search-container" ref={containerRef}>
      {/* Search Input */}
      <div className={`top-search-bar ${isOpen ? 'is-active' : ''}`}>
        <Search size={16} className="top-search-icon" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="top-search-dropdown-list"
          placeholder="Search inspections, commodities, locations, rules (Ctrl+K)..."
          className="top-search-input"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {query && (
          <button
            type="button"
            className="top-search-clear-btn"
            onClick={clearQuery}
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}

        <kbd className="top-search-kbd">
          {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div className="top-search-backdrop" onClick={() => setIsOpen(false)} />
      )}

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="top-search-dropdown" id="top-search-dropdown-list">
          <div className="top-search-results-scroll">
            {/* When there are no results */}
            {results.totalCount === 0 && (
              <div className="top-search-empty">
                <Search size={28} className="top-search-empty-icon" />
                <div className="top-search-empty-title">No matching records found</div>
                <div className="top-search-empty-text">
                  We couldn't find any inspections, commodities or statutory rules matching "{query}".
                </div>
                <div className="top-search-suggestions">
                  <span className="top-search-chip" onClick={() => handleChipClick('Tata Salt')}>
                    Tata Salt
                  </span>
                  <span className="top-search-chip" onClick={() => handleChipClick('Rule 6(1)(e)')}>
                    Rule 6(1)(e) MRP
                  </span>
                  <span className="top-search-chip" onClick={() => handleChipClick('Nashik')}>
                    Nashik Market
                  </span>
                  <span className="top-search-chip" onClick={() => handleChipClick('Non-Compliant')}>
                    Non-Compliant
                  </span>
                </div>
              </div>
            )}

            {/* Quick Actions Group */}
            {results.actions.length > 0 && (
              <div className="top-search-group">
                <div className="top-search-group-title">
                  <span>Quick Navigation</span>
                  <span className="top-search-group-badge">{results.actions.length}</span>
                </div>
                {results.actions.map(action => {
                  runningIndex++;
                  const isSelected = selectedIndex === runningIndex;
                  return (
                    <div
                      key={action.id}
                      className={`top-search-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectItem({ type: 'action', data: action })}
                      onMouseEnter={() => setSelectedIndex(runningIndex)}
                    >
                      <div className="top-search-item-left">
                        <div className="top-search-item-icon">
                          {action.icon}
                        </div>
                        <div className="top-search-item-content">
                          <div className="top-search-item-title">{action.title}</div>
                          <div className="top-search-item-subtitle">{action.subtitle}</div>
                        </div>
                      </div>
                      <div className="top-search-item-right">
                        <span className="top-search-tag">Action</span>
                        <ArrowRight size={13} color="var(--color-text-tertiary)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inspections Group */}
            {results.inspections.length > 0 && (
              <div className="top-search-group">
                <div className="top-search-group-title">
                  <span>Inspections & Commodities</span>
                  <span className="top-search-group-badge">{results.inspections.length}</span>
                </div>
                {results.inspections.map(insp => {
                  runningIndex++;
                  const isSelected = selectedIndex === runningIndex;
                  const isCompliant = insp.status === 'COMPLIANT';
                  return (
                    <div
                      key={insp.id}
                      className={`top-search-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectItem({ type: 'inspection', data: insp })}
                      onMouseEnter={() => setSelectedIndex(runningIndex)}
                    >
                      <div className="top-search-item-left">
                        <div className="top-search-item-icon">
                          <Package size={16} />
                        </div>
                        <div className="top-search-item-content">
                          <div className="top-search-item-title">
                            <span>{insp.product_name || 'Packaged Commodity'}</span>
                            {insp.batch_number && (
                              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 'normal' }}>
                                ({insp.batch_number})
                              </span>
                            )}
                          </div>
                          <div className="top-search-item-subtitle">
                            <MapPin size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                            {insp.location || 'Location Not Specified'} • {new Date(insp.inspection_date || insp.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="top-search-item-right">
                        <span
                          className="top-search-tag"
                          style={{
                            color: isCompliant ? 'var(--color-compliant)' : 'var(--color-non-compliant)',
                            background: isCompliant ? 'var(--color-compliant-50)' : 'var(--color-non-compliant-50)',
                            borderColor: isCompliant ? 'var(--color-compliant-200)' : 'var(--color-non-compliant-200)',
                          }}
                        >
                          {isCompliant ? (
                            <><CheckCircle size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />PASS</>
                          ) : (
                            <><AlertTriangle size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />VIOLATION</>
                          )}
                        </span>
                        <ArrowRight size={13} color="var(--color-text-tertiary)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legal Metrology Rules Group */}
            {results.rules.length > 0 && (
              <div className="top-search-group">
                <div className="top-search-group-title">
                  <span>Statutory Rules & Provisions</span>
                  <span className="top-search-group-badge">{results.rules.length}</span>
                </div>
                {results.rules.map(rule => {
                  runningIndex++;
                  const isSelected = selectedIndex === runningIndex;
                  return (
                    <div
                      key={rule.id}
                      className={`top-search-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelectItem({ type: 'rule', data: rule })}
                      onMouseEnter={() => setSelectedIndex(runningIndex)}
                    >
                      <div className="top-search-item-left">
                        <div className="top-search-item-icon" style={{ color: 'var(--color-gold-text)' }}>
                          <Scale size={16} />
                        </div>
                        <div className="top-search-item-content">
                          <div className="top-search-item-title">
                            <strong>{rule.ruleNumber}:</strong> {rule.title}
                          </div>
                          <div className="top-search-item-subtitle">{rule.description}</div>
                        </div>
                      </div>
                      <div className="top-search-item-right">
                        <span className="top-search-tag">Legal Rule</span>
                        <ArrowRight size={13} color="var(--color-text-tertiary)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="top-search-footer">
            <div className="top-search-footer-hints">
              <span className="top-search-footer-hint">
                <kbd className="top-search-kbd">↑</kbd>
                <kbd className="top-search-kbd">↓</kbd> navigate
              </span>
              <span className="top-search-footer-hint">
                <kbd className="top-search-kbd">↵</kbd> select
              </span>
              <span className="top-search-footer-hint">
                <kbd className="top-search-kbd">esc</kbd> close
              </span>
            </div>

            <button
              type="button"
              className="top-search-footer-action"
              onClick={viewAllInInspections}
            >
              <span>View all in Inspections</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
