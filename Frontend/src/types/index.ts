// =============================================================================
// SIH26034 — TypeScript Type Definitions
// =============================================================================

// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'INSPECTOR' | 'SUPERVISOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  badge_number?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

// ── Inspection ────────────────────────────────────────────────────────────────

export type InspectionStatus =
  | 'UPLOADED'
  | 'ANALYZING'
  | 'EXTRACTED'
  | 'UNDER_REVIEW'
  | 'COMPLIANT'
  | 'NON_COMPLIANT'
  | 'REQUIRES_REVIEW'
  | 'FINALIZED';

export interface ExtractedField {
  field_name: string;
  extracted_value: string | null;
  expected_format?: string;
  confidence: number;        // 0-100
  is_compliant: boolean | null;
  violation_detail?: string;
  reviewed: boolean;
  reviewer_override?: string;
}

export interface ComplianceResult {
  overall_score: number;           // 0-100
  critical_violations: number;
  minor_violations: number;
  total_fields_checked: number;
  compliant_fields: number;
  extracted_fields: ExtractedField[];
  ai_confidence: number;           // 0-100
  summary: string;
  recommendation: 'PASS' | 'FAIL' | 'REVIEW';
}

export interface InspectionImage {
  id: string;
  url: string;
  filename: string;
  upload_time: string;
  size_bytes: number;
  image_type: 'FRONT' | 'BACK' | 'LABEL' | 'OTHER';
}

export interface Inspection {
  id: string;
  product_id: string | null;
  inspector_id: string | null;
  inspector_name?: string;
  status: InspectionStatus;
  compliance_score: number | null;
  location: string | null;
  inspection_date: string;
  created_at: string;
  updated_at?: string;
  product_name?: string;
  product_category?: string;
  brand_name?: string;
  images?: InspectionImage[];
  compliance_result?: ComplianceResult;
  notes?: string;
  report_url?: string;
  batch_number?: string;
}

export interface InspectionCreate {
  location?: string;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export type ReportFormat = 'PDF' | 'XLSX' | 'CSV';
export type ReportStatus = 'GENERATING' | 'READY' | 'FAILED';

export interface Report {
  id: string;
  inspection_id: string;
  product_name?: string;
  location?: string;
  generated_at: string;
  format: ReportFormat;
  status: ReportStatus;
  download_url?: string;
  generated_by: string;
  file_size_kb?: number;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  inspection_id?: string;
  action_url?: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface DailyStats {
  date: string;
  total: number;
  compliant: number;
  non_compliant: number;
  pending: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  compliance_rate: number;
}

export interface DashboardStats {
  total_inspections: number;
  compliant: number;
  non_compliant: number;
  pending_review: number;
  compliance_rate: number;
  avg_score: number;
  inspections_today: number;
  critical_violations_today: number;
  trend_weekly: DailyStats[];
  category_breakdown: CategoryBreakdown[];
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

// ── API Responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ── Filter & Sort ─────────────────────────────────────────────────────────────

export interface InspectionFilters {
  status?: InspectionStatus | 'ALL';
  location?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  inspector_id?: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// ── Upload ────────────────────────────────────────────────────────────────────

export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export interface FileUploadProgress {
  file: File;
  progress: number;
  state: UploadState;
  error?: string;
}

// ── Multi-Step Inspection Wizard ──────────────────────────────────────────────

export type WizardStep =
  | 'create'
  | 'upload'
  | 'analyze'
  | 'review'
  | 'result'
  | 'report';

export interface WizardState {
  currentStep: WizardStep;
  inspection: Partial<Inspection> | null;
  uploads: FileUploadProgress[];
  isAnalyzing: boolean;
  analysisProgress: number;
}
