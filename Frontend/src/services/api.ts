// =============================================================================
// SIH26034 — API Service Layer
// Real backend + mock fallback
// =============================================================================

import type {
  Inspection, InspectionCreate, DashboardStats, Report,
  Notification, AuditLog, User, PaginatedResponse, InspectionFilters,
  ComplianceResult,
} from '../types';

import {
  mockInspections, mockDashboardStats, mockReports,
  mockNotifications, mockAuditLogs, mockUsers,
} from '../mock/data';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

// ── Simulated delay for mock ──────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Dynamic In-Memory Inspections Store ────────────────────────────────────────

let inspectionsStore: Inspection[] = [...mockInspections];

// ── Inspections Service ───────────────────────────────────────────────────────

export const inspectionService = {
  async create(data: InspectionCreate): Promise<Inspection> {
    try {
      const newInsp = await apiFetch<Inspection>('/api/v1/inspections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      inspectionsStore.unshift(newInsp);
      return newInsp;
    } catch {
      // Mock fallback
      await delay(400);
      const newInspection: Inspection = {
        id: `insp-${Math.random().toString(36).slice(2, 10)}`,
        product_id: null,
        inspector_id: 'usr-003',
        inspector_name: 'Anil Kumar',
        status: 'UPLOADED',
        compliance_score: null,
        location: data.location || null,
        inspection_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        product_name: 'Pending Analysis',
        product_category: 'Unknown',
        brand_name: undefined,
      };
      inspectionsStore.unshift(newInspection);
      return newInspection;
    }
  },

  async getById(id: string): Promise<Inspection> {
    try {
      return await apiFetch<Inspection>(`/api/v1/inspections/${id}`);
    } catch {
      await delay(200);
      let inspection = inspectionsStore.find(i => i.id === id);
      if (!inspection) {
        inspection = mockInspections[0];
      }
      return inspection;
    }
  },

  async list(filters?: InspectionFilters): Promise<PaginatedResponse<Inspection>> {
    await delay(300);
    let data = [...inspectionsStore];

    if (filters?.status && filters.status !== 'ALL') {
      data = data.filter(i => i.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(i =>
        i.product_name?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.brand_name?.toLowerCase().includes(q)
      );
    }
    if (filters?.location) {
      data = data.filter(i => i.location?.toLowerCase().includes(filters.location!.toLowerCase()));
    }

    return {
      data,
      total: data.length,
      page: 1,
      per_page: 20,
      has_more: false,
    };
  },

  async startAnalysis(id: string): Promise<Inspection> {
    await delay(300);
    let inspection = inspectionsStore.find(i => i.id === id);
    if (!inspection) {
      inspection = { ...mockInspections[0], id };
      inspectionsStore.unshift(inspection);
    }
    const updated = { ...inspection, status: 'ANALYZING' as const };
    inspectionsStore = inspectionsStore.map(i => i.id === id ? updated : i);
    return updated;
  },

  async getAnalysisResult(id: string): Promise<Inspection> {
    await delay(400);
    let inspection = inspectionsStore.find(i => i.id === id);
    if (!inspection) {
      inspection = {
        ...mockInspections[0],
        id,
        created_at: new Date().toISOString(),
      };
      inspectionsStore.unshift(inspection);
    }

    // Generate comprehensive AI compliance extraction
    const score = 92;
    const compliance_result: ComplianceResult = {
      overall_score: score,
      critical_violations: 0,
      minor_violations: 1,
      total_fields_checked: 12,
      compliant_fields: 11,
      ai_confidence: 95,
      summary: 'Product packaging complies with mandatory Legal Metrology (Packaged Commodities) Rules, 2011 declarations. All mandatory Rule 6 declarations are verified on the Principal Display Panel.',
      recommendation: 'PASS',
      extracted_fields: [
        {
          field_name: 'Product Name',
          extracted_value: inspection.product_name && inspection.product_name !== 'Pending Analysis'
            ? inspection.product_name
            : 'Britannia Good Day Butter Cookies (200g)',
          confidence: 98,
          is_compliant: true,
          reviewed: true,
          expected_format: 'Common / Generic Commodity Name (Rule 6(1)(b))',
        },
        {
          field_name: 'Net Quantity',
          extracted_value: '200g',
          confidence: 96,
          is_compliant: true,
          reviewed: true,
          expected_format: 'Standard Unit of Weight/Measure (Rule 6(1)(c))',
        },
        {
          field_name: 'Maximum Retail Price (MRP)',
          extracted_value: '₹40.00 (incl. of all taxes)',
          confidence: 97,
          is_compliant: true,
          reviewed: true,
          expected_format: 'MRP ₹ xx.xx incl. of all taxes (Rule 6(1)(e))',
        },
        {
          field_name: 'Manufacturer Name',
          extracted_value: 'Britannia Industries Limited',
          confidence: 95,
          is_compliant: true,
          reviewed: true,
          expected_format: 'Complete Name & Address (Rule 6(1)(a))',
        },
        {
          field_name: 'Manufacturer Address',
          extracted_value: '5/1A, Hungerford Street, Kolkata - 700017, West Bengal',
          confidence: 93,
          is_compliant: true,
          reviewed: true,
        },
        {
          field_name: 'Month & Year of Manufacture',
          extracted_value: '02/2026',
          confidence: 91,
          is_compliant: true,
          reviewed: true,
          expected_format: 'MM/YYYY (Rule 6(1)(d))',
        },
        {
          field_name: 'Best Before Date',
          extracted_value: 'Best before 6 months from packaging',
          confidence: 92,
          is_compliant: true,
          reviewed: true,
        },
        {
          field_name: 'Batch / Lot Number',
          extracted_value: 'BD-2026-088',
          confidence: 94,
          is_compliant: true,
          reviewed: true,
        },
        {
          field_name: 'Consumer Care Details',
          extracted_value: '1800-425-4449 / feedback@britindia.com',
          confidence: 93,
          is_compliant: true,
          reviewed: true,
          expected_format: 'Name, address, phone & email (Rule 6(1)(f))',
        },
        {
          field_name: 'Country of Origin',
          extracted_value: 'India',
          confidence: 99,
          is_compliant: true,
          reviewed: true,
          expected_format: 'Rule 6(1)(g)',
        },
        {
          field_name: 'Unit Sale Price (USP)',
          extracted_value: '₹0.20 per g',
          confidence: 90,
          is_compliant: true,
          reviewed: true,
          expected_format: 'Unit Sale Price (Rule 7)',
        },
        {
          field_name: 'FSSAI License Number',
          extracted_value: '10015043001129',
          confidence: 94,
          is_compliant: true,
          reviewed: true,
        },
      ],
    };

    const updatedInspection: Inspection = {
      ...inspection,
      status: 'UNDER_REVIEW',
      compliance_score: score,
      compliance_result,
      product_name: inspection.product_name && inspection.product_name !== 'Pending Analysis'
        ? inspection.product_name
        : 'Britannia Good Day Butter Cookies (200g)',
      product_category: 'Packaged Food',
      brand_name: 'Britannia Industries Ltd.',
      batch_number: 'BD-2026-088',
    };

    inspectionsStore = inspectionsStore.map(i => i.id === id ? updatedInspection : i);
    return updatedInspection;
  },

  async updateStatus(id: string, status: Inspection['status']): Promise<Inspection> {
    await delay(200);
    let inspection = inspectionsStore.find(i => i.id === id);
    if (!inspection) {
      inspection = { ...mockInspections[0], id };
    }
    const updated = { ...inspection, status };
    inspectionsStore = inspectionsStore.map(i => i.id === id ? updated : i);
    return updated;
  },

  async finalize(id: string): Promise<Inspection> {
    await delay(300);
    let inspection = inspectionsStore.find(i => i.id === id);
    if (!inspection) {
      inspection = { ...mockInspections[0], id };
    }
    const updated = { ...inspection, status: 'FINALIZED' as const };
    inspectionsStore = inspectionsStore.map(i => i.id === id ? updated : i);
    return updated;
  },
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    await delay(500);
    return mockDashboardStats;
  },
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportService = {
  async list(): Promise<Report[]> {
    await delay(400);
    return mockReports;
  },

  async generate(inspectionId: string): Promise<Report> {
    await delay(1500);
    const newReport: Report = {
      id: `rep-${Math.random().toString(36).slice(2, 8)}`,
      inspection_id: inspectionId,
      generated_at: new Date().toISOString(),
      format: 'PDF',
      status: 'READY',
      generated_by: 'Anil Kumar',
      file_size_kb: Math.floor(Math.random() * 300) + 150,
    };
    return newReport;
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationService = {
  async list(): Promise<Notification[]> {
    await delay(300);
    return mockNotifications;
  },

  async markRead(_id: string): Promise<void> {
    await delay(200);
  },

  async markAllRead(): Promise<void> {
    await delay(300);
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const userService = {
  async list(): Promise<User[]> {
    await delay(400);
    return mockUsers;
  },

  async getById(id: string): Promise<User> {
    await delay(300);
    const user = mockUsers.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  },
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

export const auditService = {
  async list(): Promise<AuditLog[]> {
    await delay(400);
    return mockAuditLogs;
  },
};

// ── Officer Field Service ──────────────────────────────────────────────────────

import type { RapidInspectionPayload, OfficerTally, FieldInspectionRecord } from '../types';
import { mockFieldInspections } from '../mock/data';

// In-memory store for officer's rapid inspections in the current session
let fieldInspectionsStore: FieldInspectionRecord[] = [...mockFieldInspections];

export const officerService = {
  /**
   * Submit a complete rapid-audit record in a single POST.
   * Falls back to local mock store if the backend is unavailable (offline/spotty signal).
   */
  async rapidCreate(payload: RapidInspectionPayload): Promise<FieldInspectionRecord> {
    try {
      const serverRecord = await apiFetch<Record<string, unknown>>(
        '/api/v1/inspections/rapid',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );
      // Map server response to FieldInspectionRecord shape
      const record: FieldInspectionRecord = {
        id: String(serverRecord.id || `fi-${Math.random().toString(36).slice(2, 10)}`),
        timestamp: String(serverRecord.inspection_date || new Date().toISOString()),
        product_name: payload.product_name || 'Unknown Product',
        brand_name: payload.brand_name,
        vendor_name: payload.vendor_name || 'Unknown Vendor',
        location: payload.location || 'Unknown Location',
        status: payload.status as FieldInspectionRecord['status'],
        compliance_score: payload.compliance_score ?? (payload.violations.length === 0 ? 100 : 60),
        notice_issued: payload.status === 'NON_COMPLIANT',
        violations: payload.violations,
      };
      fieldInspectionsStore.unshift(record);
      return record;
    } catch {
      // Offline / backend unavailable — store locally
      await delay(150);
      const record: FieldInspectionRecord = {
        id: `fi-${Math.random().toString(36).slice(2, 10)}`,
        timestamp: new Date().toISOString(),
        product_name: payload.product_name || 'Unknown Product',
        brand_name: payload.brand_name,
        vendor_name: payload.vendor_name || 'Unknown Vendor',
        location: payload.location || 'Unknown Location',
        status: payload.status as FieldInspectionRecord['status'],
        compliance_score: payload.compliance_score ?? (payload.violations.length === 0 ? 100 : 60),
        notice_issued: payload.status === 'NON_COMPLIANT',
        violations: payload.violations,
      };
      fieldInspectionsStore.unshift(record);
      return record;
    }
  },

  /**
   * Fetch today's inspection tally for the officer badge counter.
   * Falls back to computing from local store.
   */
  async getDailySummary(inspector_id?: string): Promise<OfficerTally> {
    try {
      const params = inspector_id ? `?inspector_id=${encodeURIComponent(inspector_id)}` : '';
      return await apiFetch<OfficerTally>(`/api/v1/inspections/daily-summary${params}`);
    } catch {
      await delay(100);
      const today = new Date().toISOString().slice(0, 10);
      const todayRecords = fieldInspectionsStore.filter(r =>
        r.timestamp.startsWith(today),
      );
      return {
        date: today,
        total: todayRecords.length,
        compliant: todayRecords.filter(r => r.status === 'COMPLIANT').length,
        non_compliant: todayRecords.filter(r => r.status === 'NON_COMPLIANT').length,
        requires_review: todayRecords.filter(r => r.status === 'REQUIRES_REVIEW').length,
      };
    }
  },

  /** Return today's officer field inspection history (mock). */
  async getFieldHistory(): Promise<FieldInspectionRecord[]> {
    await delay(200);
    return [...fieldInspectionsStore];
  },

  /** Reset the local session store (used when switching officer profile). */
  resetSessionStore(): void {
    fieldInspectionsStore = [...mockFieldInspections];
  },
};
