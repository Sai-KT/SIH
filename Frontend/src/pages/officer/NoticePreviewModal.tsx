// =============================================================================
// SIH26034 — Section 15/18 Legal Notice Preview Modal
// Generates an official Legal Metrology Notice / Seizure Memo
// with 1-click print/PDF export using the browser print dialog.
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { X, Printer, Shield, AlertTriangle } from 'lucide-react';
import type { Rule6CheckItem } from '../../types';
import './NoticePreviewModal.css';

interface NoticePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectorBadge: string;
  inspectorName: string;
  inspectorDistrict: string;
  vendorName: string;
  vendorId?: string;
  location: string;
  productName: string;
  brandName?: string;
  netQuantity?: string;
  batchNumber?: string;
  violations: Rule6CheckItem[];  // Only rows with status VIOLATION or REVIEW
  inspectionTimestamp: string;
  noticeNumber: string;
}

// Build legal citation for each violation
function buildCitation(item: Rule6CheckItem): string {
  const base = `Violation under ${item.rule_ref} of the Legal Metrology (Packaged Commodities) Rules, 2011`;
  if (item.violation_tag === 'DUAL_MRP') {
    return `${base} read with Section 18 of the Legal Metrology Act, 2009 — Maximum Retail Price (MRP) not correctly declared / dual stickering detected on the principal display panel.`;
  }
  if (item.violation_tag === 'SMUDGED_DATE') {
    return `${base} — Month and year of manufacture / packaging / import is smudged, missing, or illegible on the principal display panel.`;
  }
  if (item.violation_tag === 'NO_USP') {
    return `${base} — Unit Sale Price (USP) not declared as mandated for retail packages.`;
  }
  if (item.violation_tag === 'INCOMPLETE_ADDRESS') {
    return `${base} — Complete address of manufacturer / packer / importer including PIN code is absent or incomplete.`;
  }
  if (item.violation_tag === 'NON_STD_WEIGHT') {
    return `${base} — Net quantity declared in non-standard unit not permitted under Schedule II of the Legal Metrology Act, 2009.`;
  }
  if (item.violation_tag === 'MISSING_HELPLINE') {
    return `${base} — Consumer care name, address, and contact details (phone/email) not declared as required.`;
  }
  if (item.violation_tag === 'MISSING_ORIGIN') {
    return `${base} — Country of origin not declared on the package.`;
  }
  if (item.violation_tag === 'NO_FSSAI') {
    return `${base} read with the Food Safety and Standards (Labelling and Display) Regulations, 2020 — FSSAI License Number absent on the label.`;
  }
  return `${base} — ${item.description}`;
}

export function NoticePreviewModal({
  isOpen,
  onClose,
  inspectorBadge,
  inspectorName,
  inspectorDistrict,
  vendorName,
  vendorId,
  location,
  productName,
  brandName,
  netQuantity,
  batchNumber,
  violations,
  inspectionTimestamp,
  noticeNumber,
}: NoticePreviewModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Trap focus
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedDate = new Date(inspectionTimestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const handlePrint = () => {
    window.print();
  };

  const sectionRef = violations.some(v =>
    ['DUAL_MRP', 'NON_STD_WEIGHT'].includes(v.violation_tag || ''),
  ) ? '18' : '15';

  return (
    <div
      className="notice-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="notice-modal">
        {/* ── Modal header ──────────────────────────────────────────────── */}
        <div className="notice-modal-header no-print">
          <div className="notice-modal-title-row">
            <AlertTriangle size={18} className="notice-modal-title-icon" />
            <h2 id="notice-title" className="notice-modal-title">
              Notice Preview — Section {sectionRef} Legal Metrology Act, 2009
            </h2>
          </div>
          <div className="notice-modal-actions">
            <button
              className="notice-print-btn"
              onClick={handlePrint}
              type="button"
            >
              <Printer size={15} />
              Print / Export PDF
            </button>
            <button
              className="notice-close-btn"
              onClick={onClose}
              type="button"
              aria-label="Close notice preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Printable notice body ──────────────────────────────────────── */}
        <div className="notice-body" ref={printRef}>
          {/* Official letterhead */}
          <div className="notice-letterhead">
            <div className="notice-govt-logo">
              <Shield size={36} className="notice-shield-icon" />
              <div className="notice-govt-text">
                <span className="notice-dept-line1">Government of Maharashtra</span>
                <span className="notice-dept-line2">Legal Metrology Department</span>
                <span className="notice-dept-line3">Office of the Inspector of Legal Metrology</span>
              </div>
            </div>
            <div className="notice-letterhead-right">
              <div className="notice-ref-row">
                <span className="notice-ref-label">Notice No.:</span>
                <span className="notice-ref-value">{noticeNumber}</span>
              </div>
              <div className="notice-ref-row">
                <span className="notice-ref-label">Date & Time:</span>
                <span className="notice-ref-value">{formattedDate} IST</span>
              </div>
            </div>
          </div>

          <div className="notice-divider" />

          {/* Title */}
          <div className="notice-title-block">
            <h1 className="notice-h1">
              NOTICE UNDER SECTION {sectionRef} OF THE LEGAL METROLOGY ACT, 2009
            </h1>
            <p className="notice-subtitle">
              Read with Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011
            </p>
          </div>

          {/* To: Vendor */}
          <div className="notice-to-block">
            <p className="notice-to-label">To,</p>
            <p className="notice-to-name">{vendorName || '[Vendor Name]'}</p>
            {vendorId && <p className="notice-to-id">Shop/GST ID: {vendorId}</p>}
            <p className="notice-to-loc">{location}</p>
          </div>

          {/* Subject */}
          <div className="notice-subject-block">
            <p>
              <strong>Subject:</strong> Non-compliance with mandatory declaration requirements
              under the Legal Metrology (Packaged Commodities) Rules, 2011 in respect of
              packaged commodity <em>"{productName}"</em>.
            </p>
          </div>

          <p className="notice-body-para">
            Whereas, the undersigned Inspector of Legal Metrology, bearing Badge No.{' '}
            <strong>{inspectorBadge}</strong>, {inspectorName}, posted at{' '}
            {inspectorDistrict}, in exercise of powers conferred under Section{' '}
            {sectionRef} of the Legal Metrology Act, 2009, conducted a field inspection at
            the above-mentioned premises on {formattedDate} IST.
          </p>

          {/* Commodity Details */}
          <table className="notice-table">
            <thead>
              <tr>
                <th colSpan={2}>Particulars of the Packaged Commodity Inspected</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Name of Commodity</td>
                <td>{productName || '—'}</td>
              </tr>
              {brandName && (
                <tr>
                  <td>Brand / Manufacturer</td>
                  <td>{brandName}</td>
                </tr>
              )}
              {netQuantity && (
                <tr>
                  <td>Net Quantity</td>
                  <td>{netQuantity}</td>
                </tr>
              )}
              {batchNumber && (
                <tr>
                  <td>Batch / Lot Number</td>
                  <td>{batchNumber}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Violations */}
          <p className="notice-body-para">
            During the course of inspection, the following violations of mandatory
            declaration requirements were detected on the principal display panel of the
            aforesaid packaged commodity:
          </p>

          <ol className="notice-violations-list">
            {violations.map((v, i) => (
              <li key={v.id} className="notice-violation-item">
                <strong>({String.fromCharCode(97 + i)})</strong>&nbsp;
                {buildCitation(v)}
              </li>
            ))}
          </ol>

          {/* Direction */}
          <p className="notice-body-para">
            You are hereby directed to take immediate corrective action and ensure
            compliance with all applicable provisions of the Legal Metrology Act, 2009 and
            the Legal Metrology (Packaged Commodities) Rules, 2011 within <strong>7 (Seven)
            working days</strong> from the date of this notice. Failure to comply may result
            in prosecution and penalty as prescribed under the said Act.
          </p>

          <p className="notice-body-para">
            This notice is issued without prejudice to any other legal proceedings that may
            be initiated against you under the applicable provisions of law.
          </p>

          {/* Signature */}
          <div className="notice-signature">
            <div className="notice-sig-left">
              <div className="notice-sig-stamp">[Official Stamp]</div>
            </div>
            <div className="notice-sig-right">
              <div className="notice-sig-line">_______________________________</div>
              <div className="notice-sig-name">{inspectorName}</div>
              <div className="notice-sig-badge">Badge No.: {inspectorBadge}</div>
              <div className="notice-sig-title">
                Inspector of Legal Metrology<br />
                {inspectorDistrict}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="notice-footer">
            <p>
              This is a computer-generated field notice. Reference: SIH26034 / Legal Metrology
              Compliance Platform. Notice No.: {noticeNumber}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
