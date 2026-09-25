// API client helper for TalentFlow
import { User, Vacancy, Application, AuthResponse } from './types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('talentflow_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('talentflow_token', token);
  } else {
    localStorage.removeItem('talentflow_token');
  }
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('talentflow_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem('talentflow_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('talentflow_user');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; fullName: string; role?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getMe: () => request<{ user: User }>('/auth/me'),

  // Vacancies
  getVacancies: (params?: { department?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.department) q.append('department', params.department);
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    return request<Vacancy[]>(`/vacancies?${q.toString()}`);
  },

  getVacancy: (id: string) => request<Vacancy>(`/vacancies/${id}`),

  createVacancy: (data: Partial<Vacancy>) =>
    request<Vacancy>('/vacancies', { method: 'POST', body: JSON.stringify(data) }),

  updateVacancy: (id: string, data: Partial<Vacancy>) =>
    request<Vacancy>(`/vacancies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Applications
  submitApplication: (data: any) =>
    request<{ message: string; applicationId: string }>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getApplications: (params?: { vacancyId?: string; status?: string; verificationStatus?: string; search?: string; department?: string }) => {
    const q = new URLSearchParams();
    if (params?.vacancyId) q.append('vacancyId', params.vacancyId);
    if (params?.status) q.append('status', params.status);
    if (params?.verificationStatus) q.append('verificationStatus', params.verificationStatus);
    if (params?.search) q.append('search', params.search);
    if (params?.department) q.append('department', params.department);
    return request<Application[]>(`/applications?${q.toString()}`);
  },

  getApplication: (id: string) => request<Application>(`/applications/${id}`),

  updateApplicationStatus: (id: string, data: { status?: string; recruiterNotes?: string; recruiterRating?: number; rejectionReason?: string; comment?: string }) =>
    request<Application>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Document Verification
  verifyDocument: (id: string, data: { status: 'Verified' | 'Flagged' | 'Rejected' | 'Pending'; comment?: string }) =>
    request<{ message: string; document: any; overallVerificationStatus: string; verificationScore: number }>(
      `/documents/${id}/verify`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  runAiCheck: (docId: string) =>
    request<{ success: boolean; checkStatus: string; details: any }>(
      `/documents/${docId}/run-ai-check`,
      { method: 'POST' }
    ),

  // Applications deletion
  deleteApplication: (id: string) =>
    request<{ message: string }>(`/applications/${id}`, { method: 'DELETE' }),

  deleteVacancy: (id: string) =>
    request<{ message: string }>(`/vacancies/${id}`, { method: 'DELETE' }),

  // User Management (Admin & HR)
  getUsers: (params?: { role?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.role) q.append('role', params.role);
    if (params?.search) q.append('search', params.search);
    return request<User[]>(`/users?${q.toString()}`);
  },

  createUser: (data: { email: string; password: string; fullName: string; role: string }) =>
    request<{ user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUserRole: (id: string, role: string) =>
    request<{ user: User }>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),

  resetUserPassword: (id: string, password: string) =>
    request<{ message: string; user: User }>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),

  syncSystemHealth: () =>
    request<{ message: string; stats: any }>('/system/sync-health', {
      method: 'POST',
    }),

  // Recruiter Dashboard Metrics
  getRecruiterMetrics: () =>
    request<{
      stats: {
        totalVacancies: number;
        totalApplications: number;
        pendingVerification: number;
        verifiedCandidates: number;
        shortlistedCandidates: number;
      };
      statusFunnel: { status: string; count: number }[];
      verificationFunnel: { verification_status: string; count: number }[];
      recentActivity: any[];
    }>('/recruiter/metrics'),
};
