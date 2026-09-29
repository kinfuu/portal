// API client helper for Vacancy with resilient client-side storage fallback
import { User, Vacancy, Application, AuthResponse } from './types';
import { localStore } from './localStore';

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

// Resilient request helper that checks response Content-Type before calling .json()
// to prevent "Unexpected token 'T', 'The page c'... is not valid JSON" errors on static hosts like Vercel
async function safeApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; error?: string; isHtmlOrNetworkError?: boolean }> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token && !token.startsWith('local-token-')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';

    // If the server returned HTML or text (e.g. Vercel 404 "The page could not be found")
    if (!contentType.includes('application/json')) {
      return { ok: false, isHtmlOrNetworkError: true };
    }

    const json = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, isHtmlOrNetworkError: true };
      }
      return { ok: false, error: json.error || 'API Request failed' };
    }

    return { ok: true, data: json };
  } catch (err: any) {
    return { ok: false, isHtmlOrNetworkError: true, error: err.message };
  }
}

// Executes an API call with automatic seamless fallback to localStore
async function executeWithFallback<T>(
  apiRunner: () => Promise<{ ok: boolean; data?: T; error?: string; isHtmlOrNetworkError?: boolean }>,
  localFallback: () => Promise<T>
): Promise<T> {
  const res = await apiRunner();

  if (res.ok && res.data !== undefined) {
    return res.data;
  }

  // If server is not present or returned non-JSON (like Vercel static 404), fall back to localStore
  if (res.isHtmlOrNetworkError) {
    return await localFallback();
  }

  // If server returned a recognized JSON application error, throw it
  throw new Error(res.error || 'Request failed');
}

export const api = {
  // Auth
  register: async (body: { email: string; password: string; fullName: string; role?: string }): Promise<AuthResponse> => {
    return executeWithFallback(
      () => safeApiRequest<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
      () => localStore.register(body)
    );
  },

  login: async (body: { email: string; password: string }): Promise<AuthResponse> => {
    return executeWithFallback(
      () => safeApiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
      () => localStore.login(body.email, body.password)
    );
  },

  getMe: async (): Promise<{ user: User }> => {
    const current = getStoredUser();
    return executeWithFallback(
      () => safeApiRequest<{ user: User }>('/auth/me'),
      () => localStore.getMe(current)
    );
  },

  // Vacancies
  getVacancies: async (params?: { department?: string; search?: string; status?: string }): Promise<Vacancy[]> => {
    const q = new URLSearchParams();
    if (params?.department) q.append('department', params.department);
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    const endpoint = `/vacancies?${q.toString()}`;

    return executeWithFallback(
      () => safeApiRequest<Vacancy[]>(endpoint),
      () => localStore.getVacancies(params)
    );
  },

  getVacancy: async (id: string): Promise<Vacancy> => {
    return executeWithFallback(
      () => safeApiRequest<Vacancy>(`/vacancies/${id}`),
      () => localStore.getVacancy(id)
    );
  },

  createVacancy: async (data: Partial<Vacancy>): Promise<Vacancy> => {
    const current = getStoredUser();
    return executeWithFallback(
      () => safeApiRequest<Vacancy>('/vacancies', { method: 'POST', body: JSON.stringify(data) }),
      () => localStore.createVacancy(data, current?.id)
    );
  },

  updateVacancy: async (id: string, data: Partial<Vacancy>): Promise<Vacancy> => {
    return executeWithFallback(
      () => safeApiRequest<Vacancy>(`/vacancies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      () => localStore.updateVacancy(id, data)
    );
  },

  deleteVacancy: async (id: string): Promise<{ message: string }> => {
    return executeWithFallback(
      () => safeApiRequest<{ message: string }>(`/vacancies/${id}`, { method: 'DELETE' }),
      () => localStore.deleteVacancy(id)
    );
  },

  // Applications
  submitApplication: async (data: any): Promise<{ message: string; applicationId: string }> => {
    const current = getStoredUser();
    return executeWithFallback(
      () => safeApiRequest<{ message: string; applicationId: string }>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      () => localStore.submitApplication(data, current?.id)
    );
  },

  getApplications: async (params?: {
    vacancyId?: string;
    status?: string;
    verificationStatus?: string;
    search?: string;
    department?: string;
  }): Promise<Application[]> => {
    const q = new URLSearchParams();
    if (params?.vacancyId) q.append('vacancyId', params.vacancyId);
    if (params?.status) q.append('status', params.status);
    if (params?.verificationStatus) q.append('verificationStatus', params.verificationStatus);
    if (params?.search) q.append('search', params.search);
    if (params?.department) q.append('department', params.department);
    const endpoint = `/applications?${q.toString()}`;

    const current = getStoredUser();
    return executeWithFallback(
      () => safeApiRequest<Application[]>(endpoint),
      () => localStore.getApplications(params, current?.id, current?.role)
    );
  },

  getApplication: async (id: string): Promise<Application> => {
    return executeWithFallback(
      () => safeApiRequest<Application>(`/applications/${id}`),
      () => localStore.getApplication(id)
    );
  },

  updateApplicationStatus: async (
    id: string,
    data: { status?: string; recruiterNotes?: string; recruiterRating?: number; rejectionReason?: string; comment?: string }
  ): Promise<Application> => {
    const current = getStoredUser();
    return executeWithFallback(
      () => safeApiRequest<Application>(`/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
      () => localStore.updateApplicationStatus(id, data, current?.fullName || 'Staff')
    );
  },

  deleteApplication: async (id: string): Promise<{ message: string }> => {
    return executeWithFallback(
      () => safeApiRequest<{ message: string }>(`/applications/${id}`, { method: 'DELETE' }),
      () => localStore.deleteApplication(id)
    );
  },

  // Document Verification
  verifyDocument: async (
    id: string,
    data: { status: 'Verified' | 'Flagged' | 'Rejected' | 'Pending'; comment?: string }
  ): Promise<{ message: string; document: any; overallVerificationStatus: string; verificationScore: number }> => {
    const current = getStoredUser();
    return executeWithFallback(
      () => safeApiRequest<any>(`/documents/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),
      () => localStore.verifyDocument(id, data, current?.fullName || 'Recruiter')
    );
  },

  runAiCheck: async (docId: string): Promise<{ success: boolean; checkStatus: string; details: any }> => {
    return executeWithFallback(
      () => safeApiRequest<any>(`/documents/${docId}/run-ai-check`, { method: 'POST' }),
      () => localStore.runAiCheck(docId)
    );
  },

  // User Management
  getUsers: async (params?: { role?: string; search?: string }): Promise<User[]> => {
    const q = new URLSearchParams();
    if (params?.role) q.append('role', params.role);
    if (params?.search) q.append('search', params.search);
    const endpoint = `/users?${q.toString()}`;

    return executeWithFallback(
      () => safeApiRequest<User[]>(endpoint),
      () => localStore.getUsers(params)
    );
  },

  createUser: async (data: { email: string; password: string; fullName: string; role: string }): Promise<{ user: User }> => {
    return executeWithFallback(
      () => safeApiRequest<{ user: User }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      () => localStore.createUser(data)
    );
  },

  updateUser: async (id: string, data: { fullName?: string; email?: string; role?: string }): Promise<{ message: string; user: User }> => {
    return executeWithFallback(
      () => safeApiRequest<{ message: string; user: User }>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
      () => localStore.updateUser(id, data)
    );
  },

  updateUserRole: async (id: string, role: string): Promise<{ user: User }> => {
    return executeWithFallback(
      () => safeApiRequest<{ user: User }>(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
      () => localStore.updateUserRole(id, role)
    );
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    return executeWithFallback(
      () => safeApiRequest<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
      () => localStore.deleteUser(id)
    );
  },

  resetUserPassword: async (id: string, password: string): Promise<{ message: string; user: User }> => {
    return executeWithFallback(
      () => safeApiRequest<{ message: string; user: User }>(`/users/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      }),
      () => localStore.resetUserPassword(id, password)
    );
  },

  syncSystemHealth: async (): Promise<{ message: string; stats: any }> => {
    return executeWithFallback(
      () => safeApiRequest<{ message: string; stats: any }>('/system/sync-health', { method: 'POST' }),
      () => localStore.syncHealth()
    );
  },

  // Recruiter Dashboard Metrics
  getRecruiterMetrics: async (): Promise<{
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
  }> => {
    return executeWithFallback(
      () => safeApiRequest<any>('/recruiter/metrics'),
      () => localStore.getRecruiterMetrics()
    );
  },
};
