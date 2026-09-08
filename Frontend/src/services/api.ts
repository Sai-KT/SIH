// =============================================================================
// SIH26034 — API Service Layer
// Real backend + mock fallback
// =============================================================================

import type {
  Inspection, InspectionCreate, DashboardStats, Report,
  Notification, AuditLog, User, PaginatedResponse, InspectionFilters,
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

// ── Inspections ───────────────────────────────────────────────────────────────

export const inspectionService = {
  async create(data: InspectionCreate): Promise<Inspection> {
    try {
      return await apiFetch<Inspection>('/api/v1/inspections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      // Mock fallback
      await delay(600);
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
      return newInspection;
    }
  },

  async getById(id: string): Promise<Inspection> {
    try {
      return await apiFetch<Inspection>(`/api/v1/inspections/${id}`);
    } catch {
      await delay(300);
      const inspection = mockInspections.find(i => i.id === id);
      if (!inspection) throw new Error('Inspection not found');
      return inspection;
    }
  },

  async list(filters?: InspectionFilters): Promise<PaginatedResponse<Inspection>> {
    await delay(400);
    let data = [...mockInspections];

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
    await delay(800);
    const inspection = mockInspections.find(i => i.id === id);
    if (!inspection) throw new Error('Inspection not found');
    return { ...inspection, status: 'ANALYZING' };
  },

  async getAnalysisResult(id: string): Promise<Inspection> {
    await delay(3000); // Simulate AI processing time
    const inspection = mockInspections.find(i => i.id === id);
    if (!inspection) throw new Error('Inspection not found');
    return { ...inspection, status: 'EXTRACTED' };
  },

  async updateStatus(id: string, status: Inspection['status']): Promise<Inspection> {
    await delay(400);
    const inspection = mockInspections.find(i => i.id === id);
    if (!inspection) throw new Error('Inspection not found');
    return { ...inspection, status };
  },

  async finalize(id: string): Promise<Inspection> {
    await delay(600);
    const inspection = mockInspections.find(i => i.id === id);
    if (!inspection) throw new Error('Inspection not found');
    return { ...inspection, status: 'FINALIZED' };
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
