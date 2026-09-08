// =============================================================================
// SIH26034 — New Inspection: Multi-Step Wizard
// Steps: create → upload → analyze → review → result → report
// =============================================================================

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Upload, Cpu, CheckSquare, BarChart2, FileText,
  Check, ChevronRight, X, AlertCircle, AlertTriangle,
  CheckCircle, Edit2, Download, ArrowLeft,
  Image as ImageIcon, Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge, ProgressBar, Spinner } from '../components/ui/Badge';
import { inspectionService, reportService } from '../services/api';
import type { Inspection, WizardStep, FileUploadProgress } from '../types';
import { confidenceLabel, confidenceColor } from '../utils/helpers';
import './NewInspectionPage.css';

// ── Step Config ───────────────────────────────────────────────────────────────

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'create',  label: 'Create',  icon: <MapPin size={16} /> },
  { id: 'upload',  label: 'Upload',  icon: <Upload size={16} /> },
  { id: 'analyze', label: 'Analyze', icon: <Cpu size={16} /> },
  { id: 'review',  label: 'Review',  icon: <CheckSquare size={16} /> },
  { id: 'result',  label: 'Result',  icon: <BarChart2 size={16} /> },
  { id: 'report',  label: 'Report',  icon: <FileText size={16} /> },
];

const STEP_INDEX: Record<WizardStep, number> = {
  create: 0, upload: 1, analyze: 2, review: 3, result: 4, report: 5,
};

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEP_INDEX[current];
  return (
    <div className="wizard-steps">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={step.id}>
            <div className={`wizard-step ${done ? 'wizard-step--done' : active ? 'wizard-step--active' : ''}`}>
              <div className="wizard-step-circle">
                {done ? <Check size={14} /> : step.icon}
              </div>
              <span className="wizard-step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`wizard-step-connector ${done ? 'wizard-step-connector--done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Step 1: Create ────────────────────────────────────────────────────────────

function StepCreate({ onNext }: { onNext: (insp: Inspection) => void }) {
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const insp = await inspectionService.create({ location: location || undefined });
      onNext(insp);
    } catch (err: any) {
      setError(err.message || 'Failed to create inspection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-step-content animate-fade-in">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Start New Inspection</h2>
        <p className="wizard-step-desc">
          Provide the inspection location. The system will generate a unique inspection record.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="wizard-form">
        <div className="wizard-field">
          <label htmlFor="location" className="wizard-label">
            Inspection Location <span className="optional">(optional)</span>
          </label>
          <div className="wizard-input-wrap">
            <MapPin size={16} className="wizard-input-icon" />
            <input
              id="location"
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Nashik Market, Maharashtra"
              className="wizard-input"
              autoFocus
            />
          </div>
          <span className="wizard-hint">
            Enter the market, district, or area where the inspection is being conducted.
          </span>
        </div>

        {error && (
          <div className="wizard-error">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="wizard-info-box">
          <Zap size={14} />
          <span>
            The system will auto-generate an inspection ID, timestamp, and status tracking.
            You don't need to fill in product details manually.
          </span>
        </div>

        <Button type="submit" loading={loading} size="lg" iconRight={<ChevronRight size={16} />}>
          Create Inspection &amp; Continue
        </Button>
      </form>
    </div>
  );
}

// ── Step 2: Upload ────────────────────────────────────────────────────────────

function StepUpload({ onNext }: { inspection: Inspection; onNext: () => void }) {
  const [files, setFiles] = useState<FileUploadProgress[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter(f => f.type.startsWith('image/'));
    const uploads: FileUploadProgress[] = valid.map(file => ({
      file, progress: 0, state: 'idle',
    }));
    setFiles(prev => [...prev, ...uploads]);

    // Simulate upload for each file
    uploads.forEach((_, i) => {
      const idx = files.length + i;
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles(prev => prev.map((f, j) => j === idx ? { ...f, progress: 100, state: 'success' } : f));
        } else {
          setFiles(prev => prev.map((f, j) => j === idx ? { ...f, progress, state: 'uploading' } : f));
        }
      }, 200);
    });
  }, [files.length]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, j) => j !== i));

  const allDone = files.length > 0 && files.every(f => f.state === 'success');

  return (
    <div className="wizard-step-content animate-fade-in">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Upload Product Images</h2>
        <p className="wizard-step-desc">
          Upload clear photos of the product label — front, back, and any side panels.
          The AI will extract all mandatory declarations.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`upload-zone ${dragging ? 'upload-zone--dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => addFiles(Array.from(e.target.files || []))}
        />
        <ImageIcon size={36} className="upload-zone-icon" />
        <p className="upload-zone-title">Drop images here or click to browse</p>
        <p className="upload-zone-hint">JPEG, PNG, WEBP — up to 10MB each</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="upload-list">
          {files.map((f, i) => (
            <div key={i} className="upload-item">
              <div className="upload-item-icon">
                <ImageIcon size={16} />
              </div>
              <div className="upload-item-info">
                <span className="upload-item-name">{f.file.name}</span>
                <ProgressBar
                  value={f.progress}
                  color={f.state === 'success' ? 'var(--color-compliant)' : 'var(--color-primary)'}
                  height={4}
                />
              </div>
              <div className="upload-item-status">
                {f.state === 'success' && <Check size={16} color="var(--color-compliant)" />}
                {f.state === 'uploading' && <Spinner size={16} />}
                {f.state === 'idle' && (
                  <button className="upload-remove-btn" onClick={() => removeFile(i)}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="wizard-actions">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => onNext()}
          disabled={files.length === 0}
        >
          Skip (Demo Mode)
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          disabled={files.length > 0 && !allDone}
          iconRight={<ChevronRight size={16} />}
        >
          {allDone ? 'Continue to Analysis' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Analyze ───────────────────────────────────────────────────────────

function StepAnalyze({ inspection, onNext }: { inspection: Inspection; onNext: (insp: Inspection) => void }) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');

  const tasks = [
    'Preprocessing image...',
    'Detecting label region...',
    'Running OCR extraction...',
    'Parsing mandatory fields...',
    'Cross-checking against LMPC Rules 2011...',
    'Calculating compliance score...',
    'Preparing extraction report...',
  ];

  const startAnalysis = () => {
    setPhase('running');
    let taskIdx = 0;
    setCurrentTask(tasks[0]);

    const taskInterval = setInterval(() => {
      taskIdx++;
      if (taskIdx < tasks.length) {
        setCurrentTask(tasks[taskIdx]);
      }
    }, 500);

    let prog = 0;
    const progInterval = setInterval(() => {
      prog += Math.random() * 6 + 2;
      if (prog >= 100) {
        prog = 100;
        clearInterval(progInterval);
        clearInterval(taskInterval);
        setProgress(100);
        setCurrentTask('Analysis complete!');
        setTimeout(async () => {
          const result = await inspectionService.getAnalysisResult(inspection.id);
          setPhase('done');
          onNext(result);
        }, 600);
      } else {
        setProgress(prog);
      }
    }, 150);
  };

  return (
    <div className="wizard-step-content animate-fade-in">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">AI-Powered Analysis</h2>
        <p className="wizard-step-desc">
          Our AI will extract all mandatory fields from the product label and check them
          against Legal Metrology (Packaged Commodities) Rules, 2011.
        </p>
      </div>

      {phase === 'ready' && (
        <div className="analyze-ready">
          <div className="analyze-ready-icon">
            <Cpu size={48} />
          </div>
          <h3>Ready to Analyze</h3>
          <p>Click below to start the AI extraction process.</p>
          <div className="analyze-checks">
            {['Product Name & Brand', 'Net Weight / Volume', 'MRP (incl. taxes)', 'Manufacturer Details', 'Month & Year of Manufacture', 'Best Before Date', 'Batch / Lot Number', 'Customer Care Info', 'FSSAI License', 'Country of Origin'].map(field => (
              <div key={field} className="analyze-check-item">
                <CheckCircle size={14} color="var(--color-compliant)" />
                <span>{field}</span>
              </div>
            ))}
          </div>
          <Button size="lg" icon={<Zap size={16} />} onClick={startAnalysis}>
            Start AI Analysis
          </Button>
        </div>
      )}

      {phase === 'running' && (
        <div className="analyze-running">
          <div className="analyze-spinner-wrap">
            <div className="analyze-spinner-outer">
              <Spinner size={60} color="var(--color-primary)" />
            </div>
            <Cpu size={24} className="analyze-spinner-icon" />
          </div>
          <h3>Analyzing Label...</h3>
          <p className="analyze-task">{currentTask}</p>
          <div className="analyze-progress">
            <ProgressBar value={progress} color="var(--color-primary)" height={10} showLabel animated />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Review ────────────────────────────────────────────────────────────

function StepReview({ inspection, onNext }: { inspection: Inspection; onNext: (insp: Inspection) => void }) {
  const fields = inspection.compliance_result?.extracted_fields ?? [];
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleOverride = (fieldName: string, value: string) => {
    setOverrides(prev => ({ ...prev, [fieldName]: value }));
    setEditingField(null);
  };

  const criticals = fields.filter(f => !f.is_compliant && f.confidence < 60);
  const warnings = fields.filter(f => !f.is_compliant && f.confidence >= 60);

  return (
    <div className="wizard-step-content animate-fade-in">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Review Extracted Fields</h2>
        <p className="wizard-step-desc">
          Review and correct the AI-extracted values. Fields with low confidence are flagged.
          Your corrections will be logged for audit purposes.
        </p>
      </div>

      {/* Summary row */}
      <div className="review-summary-row">
        <div className="review-summary-item review-summary-item--ok">
          <CheckCircle size={14} />
          <span>{fields.filter(f => f.is_compliant).length} Compliant</span>
        </div>
        <div className="review-summary-item review-summary-item--warn">
          <AlertTriangle size={14} />
          <span>{warnings.length} Minor Issues</span>
        </div>
        <div className="review-summary-item review-summary-item--crit">
          <AlertCircle size={14} />
          <span>{criticals.length} Critical</span>
        </div>
      </div>

      {/* Field list */}
      <div className="review-fields">
        {fields.map(field => (
          <div
            key={field.field_name}
            className={`review-field ${!field.is_compliant ? 'review-field--violation' : ''} ${field.confidence < 70 ? 'review-field--low-confidence' : ''}`}
          >
            <div className="review-field-header">
              <div className="review-field-name">
                {field.is_compliant
                  ? <CheckCircle size={14} color="var(--color-compliant)" />
                  : <AlertCircle size={14} color={field.confidence < 60 ? 'var(--color-non-compliant)' : 'var(--color-warning)'} />
                }
                <span>{field.field_name}</span>
              </div>
              <div className="review-field-meta">
                <span
                  className="confidence-pill"
                  style={{ color: confidenceColor(field.confidence) }}
                >
                  {confidenceLabel(field.confidence)} ({field.confidence}%)
                </span>
                <button
                  className="review-edit-btn"
                  onClick={() => setEditingField(f => f === field.field_name ? null : field.field_name)}
                >
                  <Edit2 size={13} /> Edit
                </button>
              </div>
            </div>

            <div className="review-field-value">
              {overrides[field.field_name] ?? field.extracted_value ?? (
                <span className="review-missing">— Not Found —</span>
              )}
            </div>

            {field.violation_detail && (
              <div className="review-violation">
                <AlertTriangle size={12} /> {field.violation_detail}
              </div>
            )}

            {editingField === field.field_name && (
              <FieldEditor
                defaultValue={overrides[field.field_name] ?? field.extracted_value ?? ''}
                onSave={v => handleOverride(field.field_name, v)}
                onCancel={() => setEditingField(null)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="wizard-actions">
        <Button
          size="lg"
          iconRight={<ChevronRight size={16} />}
          onClick={() => onNext(inspection)}
        >
          Confirm &amp; Finalize
        </Button>
      </div>
    </div>
  );
}

function FieldEditor({ defaultValue, onSave, onCancel }: { defaultValue: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="field-editor">
      <input
        className="field-editor-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') onSave(value); if (e.key === 'Escape') onCancel(); }}
      />
      <div className="field-editor-actions">
        <Button size="sm" onClick={() => onSave(value)}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Step 5: Result ────────────────────────────────────────────────────────────

function StepResult({ inspection, onNext }: { inspection: Inspection; onNext: () => void }) {
  const result = inspection.compliance_result;
  if (!result) return null;

  const isCompliant = result.overall_score >= 80;
  const statusColor = isCompliant ? 'var(--color-compliant)' : 'var(--color-non-compliant)';

  return (
    <div className="wizard-step-content animate-fade-in">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Compliance Result</h2>
        <p className="wizard-step-desc">
          Based on AI analysis and your review, here is the final compliance assessment.
        </p>
      </div>

      {/* Score hero */}
      <div className="result-hero" style={{ borderColor: statusColor + '40', background: statusColor + '08' }}>
        <div className="result-score-ring" style={{ borderColor: statusColor }}>
          <span className="result-score-num" style={{ color: statusColor }}>
            {result.overall_score}%
          </span>
          <span className="result-score-label">Score</span>
        </div>
        <div className="result-hero-info">
          <div className={`result-verdict ${isCompliant ? 'result-verdict--pass' : 'result-verdict--fail'}`}>
            {isCompliant ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
          </div>
          <p className="result-summary">{result.summary}</p>
          <div className="result-stats">
            <div className="result-stat">
              <span className="result-stat-val">{result.compliant_fields}</span>
              <span className="result-stat-lbl">Fields OK</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-val" style={{ color: 'var(--color-non-compliant)' }}>
                {result.critical_violations}
              </span>
              <span className="result-stat-lbl">Critical</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-val" style={{ color: 'var(--color-warning)' }}>
                {result.minor_violations}
              </span>
              <span className="result-stat-lbl">Minor</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-val">{result.ai_confidence}%</span>
              <span className="result-stat-lbl">AI Confidence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Violations */}
      {result.extracted_fields.filter(f => !f.is_compliant).length > 0 && (
        <div className="result-violations">
          <h3 className="result-violations-title">Violations Found</h3>
          {result.extracted_fields.filter(f => !f.is_compliant).map(f => (
            <div key={f.field_name} className="result-violation-item">
              <AlertTriangle size={14} color="var(--color-non-compliant)" />
              <div>
                <strong>{f.field_name}</strong>
                {f.violation_detail && <p className="result-violation-detail">{f.violation_detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="wizard-actions">
        <Button size="lg" iconRight={<ChevronRight size={16} />} onClick={onNext}>
          Generate Compliance Report
        </Button>
      </div>
    </div>
  );
}

// ── Step 6: Report ────────────────────────────────────────────────────────────

function StepReport({ inspection, onDone }: { inspection: Inspection; onDone: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setGenerating(true);
    await reportService.generate(inspection.id);
    setGenerating(false);
    setGenerated(true);
  };

  return (
    <div className="wizard-step-content animate-fade-in">
      <div className="wizard-step-header">
        <h2 className="wizard-step-title">Generate Report</h2>
        <p className="wizard-step-desc">
          Generate an official compliance report for this inspection. The report can be
          downloaded as PDF or submitted digitally.
        </p>
      </div>

      {!generated ? (
        <div className="report-ready">
          <div className="report-ready-icon">
            <FileText size={48} />
          </div>
          <h3>Report Ready to Generate</h3>
          <p>
            Inspection <strong>#{inspection.id.slice(0, 8).toUpperCase()}</strong> —
            all fields have been reviewed.
          </p>
          <div className="report-options">
            <div className="report-option report-option--selected">
              <CheckCircle size={16} color="var(--color-primary)" />
              PDF Report (Official)
            </div>
            <div className="report-option">
              <div className="report-option-radio" />
              Excel Export (.xlsx)
            </div>
          </div>
          <Button
            size="lg"
            icon={<FileText size={16} />}
            loading={generating}
            onClick={handleGenerate}
          >
            Generate Official Report
          </Button>
        </div>
      ) : (
        <div className="report-done animate-fade-in">
          <div className="report-done-icon">
            <CheckCircle size={56} color="var(--color-compliant)" />
          </div>
          <h3>Report Generated!</h3>
          <p>Your compliance report is ready. You can download it or view the full inspection.</p>
          <div className="wizard-actions" style={{ justifyContent: 'center' }}>
            <Button variant="secondary" icon={<Download size={16} />}>
              Download PDF
            </Button>
            <Button onClick={() => navigate(`/inspections/${inspection.id}`)}>
              View Inspection
            </Button>
            <Button variant="ghost" onClick={onDone}>
              New Inspection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function NewInspectionPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>('create');
  const [inspection, setInspection] = useState<Inspection | null>(null);

  const handleCreateDone = (insp: Inspection) => {
    setInspection(insp);
    setCurrentStep('upload');
  };

  const handleUploadDone = () => setCurrentStep('analyze');

  const handleAnalyzeDone = (insp: Inspection) => {
    setInspection(insp);
    setCurrentStep('review');
  };

  const handleReviewDone = (insp: Inspection) => {
    setInspection(insp);
    setCurrentStep('result');
  };

  const handleResultDone = () => setCurrentStep('report');

  const handleDone = () => {
    setCurrentStep('create');
    setInspection(null);
    navigate('/inspections');
  };

  return (
    <div className="page-container new-inspection-page">
      {/* Header */}
      <div className="page-header flex items-center gap-4">
        <button className="wizard-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">New Inspection</h1>
          <p className="page-subtitle">
            {inspection ? `Inspection #${inspection.id.slice(0, 8).toUpperCase()}` : 'Follow the steps to complete a packaged commodity inspection'}
          </p>
        </div>
        {inspection && <StatusBadge status={inspection.status} />}
      </div>

      {/* Step indicator */}
      <StepIndicator current={currentStep} />

      {/* Step content */}
      <div className="wizard-content">
        {currentStep === 'create'  && <StepCreate onNext={handleCreateDone} />}
        {currentStep === 'upload'  && inspection && <StepUpload inspection={inspection} onNext={handleUploadDone} />}
        {currentStep === 'analyze' && inspection && <StepAnalyze inspection={inspection} onNext={handleAnalyzeDone} />}
        {currentStep === 'review'  && inspection && <StepReview inspection={inspection} onNext={handleReviewDone} />}
        {currentStep === 'result'  && inspection && <StepResult inspection={inspection} onNext={handleResultDone} />}
        {currentStep === 'report'  && inspection && <StepReport inspection={inspection} onDone={handleDone} />}
      </div>
    </div>
  );
}
