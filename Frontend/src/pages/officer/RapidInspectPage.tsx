// =============================================================================
// SIH26034 — Rapid Inspect Page
// Primary field workspace: single-screen split-layout rapid audit panel.
// Keyboard shortcuts: A/Space=accept all, V=violation toggle, N=next, Enter=finalize
// Sub-300ms reset after Save & Next.
// =============================================================================

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Camera, Search, X, ChevronRight, Zap, CheckCircle2,
  AlertTriangle, SkipForward, Package, RotateCcw, Keyboard,
  Upload, Tag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { officerService } from '../../services/api';
import {
  Rule6Checklist,
  DEFAULT_CHECKLIST,
  VIOLATION_TAGS,
} from '../../components/officer/Rule6Checklist';
import { NoticePreviewModal } from './NoticePreviewModal';
import type { Rule6CheckItem, Rule6Status, ViolationTag } from '../../types';
import './RapidInspectPage.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutletCtx {
  location: string;
  tally: { total: number; compliant: number; non_compliant: number } | null;
  refreshTally: () => void;
}

// ── Product database quick-lookup (mock) ──────────────────────────────────────

const QUICK_PRODUCTS: Array<{
  barcode: string;
  product_name: string;
  brand_name: string;
  net_quantity: string;
}> = [
  { barcode: '8901063152052', product_name: 'Britannia Good Day Butter Cookies', brand_name: 'Britannia Industries Ltd.', net_quantity: '200g' },
  { barcode: '8904109600012', product_name: 'Fortune Refined Sunflower Oil', brand_name: 'Adani Wilmar Ltd.', net_quantity: '1L' },
  { barcode: '8901042180004', product_name: 'Tata Salt Vacuum Iodised', brand_name: 'Tata Consumer Products', net_quantity: '1kg' },
  { barcode: '8901764501052', product_name: 'Amul Butter', brand_name: 'Gujarat Co-operative Milk Marketing Federation', net_quantity: '100g' },
  { barcode: '8901012027003', product_name: 'Maggi Masala 2-Minute Noodles', brand_name: 'Nestlé India Ltd.', net_quantity: '70g' },
  { barcode: '8901719102005', product_name: 'Parle-G Original Gluco Biscuits', brand_name: 'Parle Products Pvt. Ltd.', net_quantity: '200g' },
];

// ── Generate notice number ─────────────────────────────────────────────────────

function generateNoticeNumber(badge: string): string {
  const now = new Date();
  const dd   = String(now.getDate()).padStart(2, '0');
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const yy   = String(now.getFullYear()).slice(-2);
  const seq  = Math.floor(Math.random() * 900 + 100);
  return `LMD/${badge}/${dd}${mm}${yy}/${seq}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RapidInspectPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { location: stickyLocation, refreshTally } = useOutletContext<OutletCtx>();

  // ── Core state
  const [checklist, setChecklist]       = useState<Rule6CheckItem[]>(() =>
    DEFAULT_CHECKLIST.map(item => ({ ...item })),
  );
  const [selectedRow, setSelectedRow]   = useState(0);
  const [productName, setProductName]   = useState('');
  const [brandName, setBrandName]       = useState('');
  const [netQty, setNetQty]             = useState('');
  const [batchNum, setBatchNum]         = useState('');
  const [vendorName, setVendorName]     = useState('');
  const [vendorId, setVendorId]         = useState('');
  const [barcode, setBarcode]           = useState('');
  const [barcodeResults, setBarcodeResults] = useState<typeof QUICK_PRODUCTS>([]);
  const [dragActive, setDragActive]     = useState(false);
  const [images, setImages]             = useState<string[]>([]);
  const [isSaving, setIsSaving]         = useState(false);
  const [lastSaved, setLastSaved]       = useState<string | null>(null);
  const [showNotice, setShowNotice]     = useState(false);
  const [noticeNumber, setNoticeNumber] = useState('');
  const [savedTimestamp, setSavedTimestamp] = useState(new Date().toISOString());
  const [showKbHelp, setShowKbHelp]     = useState(false);

  const barcodeRef    = useRef<HTMLInputElement>(null);
  const productRef    = useRef<HTMLInputElement>(null);
  const dropZoneRef   = useRef<HTMLDivElement>(null);

  // ── Derived
  const violationItems = checklist.filter(
    i => i.status === 'VIOLATION' || i.status === 'REVIEW',
  );
  const isCompliant   = violationItems.length === 0;
  const checkedCount  = checklist.filter(i => i.status !== 'UNCHECKED').length;
  const compliantCount = checklist.filter(i => i.status === 'COMPLIANT').length;

  const officerBadge    = user?.badge_number || 'LMO-MH-042';
  const officerName     = user?.name || 'Field Officer';
  const officerDistrict = user?.department?.split(',').pop()?.trim() || 'Mumbai';

  // ── Barcode quick lookup
  const handleBarcodeChange = (val: string) => {
    setBarcode(val);
    if (val.length >= 3) {
      const results = QUICK_PRODUCTS.filter(p =>
        p.barcode.includes(val) ||
        p.product_name.toLowerCase().includes(val.toLowerCase()) ||
        p.brand_name.toLowerCase().includes(val.toLowerCase()),
      );
      setBarcodeResults(results);
    } else {
      setBarcodeResults([]);
    }
  };

  const applyProduct = (p: typeof QUICK_PRODUCTS[0]) => {
    setProductName(p.product_name);
    setBrandName(p.brand_name);
    setNetQty(p.net_quantity);
    setBarcode(p.barcode);
    setBarcodeResults([]);
    productRef.current?.focus();
  };

  // ── Checklist mutation helpers
  const setRowStatus = useCallback((idx: number, status: Rule6Status, tag?: string) => {
    setChecklist(prev => prev.map((item, i) =>
      i === idx
        ? { ...item, status, violation_tag: tag ?? (status === 'VIOLATION' ? item.violation_tag : undefined) }
        : item,
    ));
  }, []);

  const setViolationTag = useCallback((idx: number, tag: ViolationTag) => {
    setChecklist(prev => prev.map((item, i) =>
      i === idx
        ? { ...item, violation_tag: tag.key, status: 'VIOLATION' as const }
        : item,
    ));
  }, []);

  // ── Accept all (mark all COMPLIANT)
  const acceptAll = useCallback(() => {
    setChecklist(prev => prev.map(item => ({ ...item, status: 'COMPLIANT' as const, violation_tag: undefined })));
  }, []);

  // ── Toggle violation on selected row
  const toggleViolationOnSelected = useCallback(() => {
    setChecklist(prev => prev.map((item, i) => {
      if (i !== selectedRow) return item;
      const next: Rule6Status = item.status === 'VIOLATION' ? 'UNCHECKED' : 'VIOLATION';
      return { ...item, status: next, violation_tag: next === 'UNCHECKED' ? undefined : item.violation_tag };
    }));
  }, [selectedRow]);

  // ── Sub-300ms reset for next item (same vendor)
  const resetForNext = useCallback(() => {
    setChecklist(DEFAULT_CHECKLIST.map(item => ({ ...item })));
    setSelectedRow(0);
    setProductName('');
    setBrandName('');
    setNetQty('');
    setBatchNum('');
    setBarcode('');
    setBarcodeResults([]);
    setImages([]);
    setSavedTimestamp(new Date().toISOString());
    // Vendor/location persist — don't reset them
    requestAnimationFrame(() => barcodeRef.current?.focus());
  }, []);

  // ── Reset vendor too (Next Shop)
  const resetVendor = useCallback(() => {
    setVendorName('');
    setVendorId('');
    resetForNext();
  }, [resetForNext]);

  // ── Save & finalize
  const handleSaveCompliant = useCallback(async () => {
    setIsSaving(true);
    try {
      await officerService.rapidCreate({
        location: stickyLocation,
        vendor_name: vendorName || 'Unknown Vendor',
        vendor_id: vendorId || undefined,
        product_name: productName,
        brand_name: brandName || undefined,
        net_quantity: netQty || undefined,
        batch_number: batchNum || undefined,
        inspector_id: user?.id,
        inspector_badge: officerBadge,
        violations: [],
        status: 'COMPLIANT',
        compliance_score: 100,
      });
      setLastSaved(productName || 'Item');
      refreshTally();
      resetForNext();
    } finally {
      setIsSaving(false);
    }
  }, [
    stickyLocation, vendorName, vendorId, productName, brandName,
    netQty, batchNum, user?.id, officerBadge, refreshTally, resetForNext,
  ]);

  const handleIssueNotice = useCallback(async () => {
    const violations = violationItems.map(v => ({
      rule_ref: v.rule_ref,
      description: v.description,
      tag: v.violation_tag,
    }));
    const score = Math.max(0, Math.round(
      (compliantCount / checklist.length) * 100,
    ));
    setIsSaving(true);
    try {
      await officerService.rapidCreate({
        location: stickyLocation,
        vendor_name: vendorName || 'Unknown Vendor',
        vendor_id: vendorId || undefined,
        product_name: productName,
        brand_name: brandName || undefined,
        net_quantity: netQty || undefined,
        batch_number: batchNum || undefined,
        inspector_id: user?.id,
        inspector_badge: officerBadge,
        violations,
        status: 'NON_COMPLIANT',
        compliance_score: score,
      });
      refreshTally();
    } finally {
      setIsSaving(false);
    }
    setNoticeNumber(generateNoticeNumber(officerBadge));
    setShowNotice(true);
  }, [
    violationItems, compliantCount, checklist.length, stickyLocation,
    vendorName, vendorId, productName, brandName, netQty, batchNum,
    user?.id, officerBadge, refreshTally,
  ]);

  // ── Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key) {
        case 'a':
        case 'A':
        case ' ':
          e.preventDefault();
          acceptAll();
          break;
        case 'v':
        case 'V':
          e.preventDefault();
          toggleViolationOnSelected();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          resetForNext();
          break;
        case 'Enter':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (isCompliant) handleSaveCompliant();
            else handleIssueNotice();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedRow(r => Math.min(r + 1, checklist.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedRow(r => Math.max(r - 1, 0));
          break;
        case '?':
          setShowKbHelp(h => !h);
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [acceptAll, toggleViolationOnSelected, resetForNext, handleSaveCompliant, handleIssueNotice, isCompliant, checklist.length]);

  // ── Drag & drop image handling
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, url]);
    });
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, url]);
    });
  }, []);

  return (
    <div className="rapid-page">
      {/* ── Progress indicator ────────────────────────────────────────────── */}
      <div className="rapid-progress-bar">
        <div
          className="rapid-progress-fill"
          style={{ width: `${(checkedCount / checklist.length) * 100}%` }}
        />
      </div>

      {/* ── Main split layout ─────────────────────────────────────────────── */}
      <div className="rapid-layout">

        {/* ── LEFT / TOP: Ingest panel ──────────────────────────────────── */}
        <aside className="rapid-ingest">

          {/* Toast: last saved */}
          {lastSaved && (
            <div className="rapid-toast">
              <CheckCircle2 size={14} />
              <span>Saved: <strong>{lastSaved}</strong></span>
              <button onClick={() => setLastSaved(null)} className="rapid-toast-close">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Image drop zone */}
          <div
            ref={dropZoneRef}
            className={`rapid-dropzone ${dragActive ? 'drag-active' : ''} ${images.length > 0 ? 'has-images' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            aria-label="Drop packaging label images here"
          >
            {images.length === 0 ? (
              <label className="rapid-dropzone-label" htmlFor="rapid-file-input">
                <Upload size={28} className="rapid-dropzone-icon" />
                <span className="rapid-dropzone-text">Drop label images here</span>
                <span className="rapid-dropzone-sub">or tap to capture</span>
                <span className="rapid-dropzone-hint">.JPG .PNG .WEBP</span>
              </label>
            ) : (
              <div className="rapid-images-grid">
                {images.map((src, i) => (
                  <div key={i} className="rapid-image-thumb">
                    <img src={src} alt={`Label ${i + 1}`} />
                    <button
                      className="rapid-image-remove"
                      onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      aria-label={`Remove image ${i + 1}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <label className="rapid-image-add" htmlFor="rapid-file-input" title="Add image">
                  <Camera size={16} />
                </label>
              </div>
            )}
            <input
              id="rapid-file-input"
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              hidden
              onChange={handleFileInput}
            />
          </div>

          {/* Barcode / product search */}
          <div className="rapid-search-section">
            <label className="rapid-field-label" htmlFor="barcode-input">
              <Tag size={13} />
              Barcode / Product Search
            </label>
            <div className="rapid-search-row">
              <Search size={14} className="rapid-search-icon" />
              <input
                id="barcode-input"
                ref={barcodeRef}
                className="rapid-search-input"
                type="text"
                placeholder="Scan barcode or type product…"
                value={barcode}
                onChange={e => handleBarcodeChange(e.target.value)}
                autoComplete="off"
              />
              {barcode && (
                <button
                  className="rapid-search-clear"
                  onClick={() => { setBarcode(''); setBarcodeResults([]); barcodeRef.current?.focus(); }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {barcodeResults.length > 0 && (
              <div className="rapid-barcode-results">
                {barcodeResults.map(p => (
                  <button
                    key={p.barcode}
                    className="rapid-barcode-result"
                    onClick={() => applyProduct(p)}
                    type="button"
                  >
                    <Package size={13} className="rapid-result-icon" />
                    <div className="rapid-result-text">
                      <span className="rapid-result-name">{p.product_name}</span>
                      <span className="rapid-result-brand">{p.brand_name} · {p.net_quantity}</span>
                    </div>
                    <ChevronRight size={12} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product fields */}
          <div className="rapid-fields">
            <div className="rapid-field-group">
              <label className="rapid-field-label" htmlFor="product-name-input">
                <Package size={13} />
                Product Name
              </label>
              <input
                id="product-name-input"
                ref={productRef}
                className="rapid-field-input"
                type="text"
                placeholder="e.g. Britannia Good Day 200g"
                value={productName}
                onChange={e => setProductName(e.target.value)}
              />
            </div>
            <div className="rapid-field-row">
              <div className="rapid-field-group">
                <label className="rapid-field-label" htmlFor="brand-input">Brand</label>
                <input
                  id="brand-input"
                  className="rapid-field-input"
                  type="text"
                  placeholder="Brand / Manufacturer"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                />
              </div>
              <div className="rapid-field-group">
                <label className="rapid-field-label" htmlFor="qty-input">Net Qty</label>
                <input
                  id="qty-input"
                  className="rapid-field-input"
                  type="text"
                  placeholder="200g / 1L"
                  value={netQty}
                  onChange={e => setNetQty(e.target.value)}
                />
              </div>
            </div>
            <div className="rapid-field-row">
              <div className="rapid-field-group">
                <label className="rapid-field-label" htmlFor="batch-input">Batch No.</label>
                <input
                  id="batch-input"
                  className="rapid-field-input"
                  type="text"
                  placeholder="Optional"
                  value={batchNum}
                  onChange={e => setBatchNum(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Vendor section */}
          <div className="rapid-vendor-section">
            <div className="rapid-vendor-header">
              <span className="rapid-field-label">Vendor / Shop</span>
              <button className="rapid-next-shop-btn" onClick={resetVendor} type="button">
                <RotateCcw size={12} />
                Next Shop
              </button>
            </div>
            <input
              className="rapid-field-input"
              type="text"
              placeholder="Vendor name…"
              value={vendorName}
              onChange={e => setVendorName(e.target.value)}
              id="vendor-name-input"
            />
            <input
              className="rapid-field-input rapid-field-input--sm"
              type="text"
              placeholder="Shop / GST ID (optional)"
              value={vendorId}
              onChange={e => setVendorId(e.target.value)}
              id="vendor-id-input"
            />
          </div>

          {/* Keyboard shortcut hint */}
          <button
            className="rapid-kb-hint"
            onClick={() => setShowKbHelp(h => !h)}
            type="button"
          >
            <Keyboard size={12} />
            Keyboard Shortcuts
          </button>
          {showKbHelp && (
            <div className="rapid-kb-table">
              {[
                ['A / Space', 'Accept all — mark all Compliant'],
                ['V', 'Toggle Violation on selected row'],
                ['↑ / ↓', 'Select checklist row'],
                ['N', 'Next item (same vendor)'],
                ['Ctrl + Enter', 'Finalize & save / issue notice'],
                ['?', 'Toggle this shortcut panel'],
              ].map(([key, desc]) => (
                <div key={key} className="rapid-kb-row">
                  <kbd className="rapid-kbd">{key}</kbd>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── RIGHT / BOTTOM: Checklist + actions ──────────────────────── */}
        <section className="rapid-audit">

          {/* Checklist header */}
          <div className="rapid-audit-header">
            <div className="rapid-audit-title">
              <Zap size={16} className="rapid-audit-title-icon" />
              <h2>Rule 6 Rapid Audit</h2>
            </div>
            <div className="rapid-audit-stats">
              <span className="rapid-stat rapid-stat--compliant">
                <CheckCircle2 size={13} />
                {compliantCount}/{checklist.length} OK
              </span>
              {violationItems.length > 0 && (
                <span className="rapid-stat rapid-stat--violation">
                  <AlertTriangle size={13} />
                  {violationItems.length} Violation{violationItems.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* The checklist */}
          <div className="rapid-checklist-wrap">
            <Rule6Checklist
              items={checklist}
              selectedIndex={selectedRow}
              onSelectRow={setSelectedRow}
              onSetStatus={setRowStatus}
              onSetViolationTag={setViolationTag}
            />
          </div>

          {/* Action bar */}
          <div className="rapid-actions">
            {/* Skip / Next */}
            <button
              className="rapid-action-btn rapid-action-skip"
              onClick={resetForNext}
              type="button"
              title="Skip and clear for next item (N)"
              disabled={isSaving}
            >
              <SkipForward size={16} />
              Skip / Next
            </button>

            {/* Issue Notice */}
            <button
              className={`rapid-action-btn rapid-action-notice ${isCompliant ? 'rapid-action-btn--disabled' : ''}`}
              onClick={handleIssueNotice}
              type="button"
              title="Issue Section 15/18 Notice (Ctrl+Enter)"
              disabled={isSaving || isCompliant}
            >
              {isSaving ? (
                <span className="rapid-spinner" />
              ) : (
                <AlertTriangle size={16} />
              )}
              Issue Section 15/18 Notice
              {violationItems.length > 0 && (
                <span className="rapid-action-badge">{violationItems.length}</span>
              )}
            </button>

            {/* Mark Compliant */}
            <button
              className="rapid-action-btn rapid-action-compliant"
              onClick={handleSaveCompliant}
              type="button"
              title="Mark compliant and proceed to next (Ctrl+Enter)"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="rapid-spinner" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              ✓ Mark Compliant & Next
            </button>
          </div>
        </section>
      </div>

      {/* ── Legal Notice Modal ────────────────────────────────────────────── */}
      <NoticePreviewModal
        isOpen={showNotice}
        onClose={() => { setShowNotice(false); resetForNext(); }}
        inspectorBadge={officerBadge}
        inspectorName={officerName}
        inspectorDistrict={officerDistrict}
        vendorName={vendorName}
        vendorId={vendorId}
        location={stickyLocation}
        productName={productName}
        brandName={brandName}
        netQuantity={netQty}
        batchNumber={batchNum}
        violations={violationItems}
        inspectionTimestamp={savedTimestamp}
        noticeNumber={noticeNumber}
      />
    </div>
  );
}
