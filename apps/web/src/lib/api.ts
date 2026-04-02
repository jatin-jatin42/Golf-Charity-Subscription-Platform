// ──────────────────────────────────────────────────────────────
//  API Client — wraps all backend calls
// ──────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) return null as T;
  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (data: any)  => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any)     => request('/auth/login',    { method: 'POST', body: JSON.stringify(data) }),
    me: ()                 => request('/auth/me'),
  },

  // ── Users ───────────────────────────────────────────────────
  users: {
    all: ()                    => request('/users'),
    profile: ()                => request('/users/profile'),
    updateProfile: (data: any) => request('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string)       => request(`/users/${id}`, { method: 'DELETE' }),
  },

  // ── Subscriptions ───────────────────────────────────────────
  subscriptions: {
    status: ()                              => request('/subscriptions/status'),
    createOrder: (plan: string)             => request('/subscriptions/create-order', { method: 'POST', body: JSON.stringify({ plan }) }),
    verify: (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      plan: string;
    })                                      => request('/subscriptions/verify', { method: 'POST', body: JSON.stringify(data) }),
    cancel: ()                              => request('/subscriptions/cancel', { method: 'DELETE' }),
  },

  // ── Scores ──────────────────────────────────────────────────
  scores: {
    mine: ()                               => request('/scores'),
    add: (value: number, date: string)     => request('/scores', { method: 'POST', body: JSON.stringify({ value, date }) }),
    update: (id: string, data: any)        => request(`/scores/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string)                   => request(`/scores/${id}`, { method: 'DELETE' }),
    adminGet: (userId: string)             => request(`/scores/admin/${userId}`),
    adminUpdate: (scoreId: string, d: any) => request(`/scores/admin/${scoreId}`, { method: 'PATCH', body: JSON.stringify(d) }),
  },

  // ── Charities ───────────────────────────────────────────────
  charities: {
    all: (search?: string, category?: string) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      return request(`/charities?${params}`);
    },
    featured: ()            => request('/charities/featured'),
    categories: ()          => request('/charities/categories'),
    byId: (id: string)      => request(`/charities/${id}`),
    create: (data: any)     => request('/charities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, d: any) => request(`/charities/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    delete: (id: string)    => request(`/charities/${id}`, { method: 'DELETE' }),
    addEvent: (id: string, d: any) => request(`/charities/${id}/events`, { method: 'POST', body: JSON.stringify(d) }),
  },

  // ── Draws ───────────────────────────────────────────────────
  draws: {
    all: ()              => request('/draws'),
    current: ()          => request('/draws/current'),
    byId: (id: string)   => request(`/draws/${id}`),
    myParticipation: ()  => request('/draws/me/participation'),
    create: (data: any)  => request('/draws', { method: 'POST', body: JSON.stringify(data) }),
    simulate: (id: string)  => request(`/draws/${id}/simulate`, { method: 'POST' }),
    publish: (id: string)   => request(`/draws/${id}/publish`,  { method: 'POST' }),
  },

  // ── Winners ─────────────────────────────────────────────────
  winners: {
    all: (verifyStatus?: string, payStatus?: string) => {
      const p = new URLSearchParams();
      if (verifyStatus) p.set('verifyStatus', verifyStatus);
      if (payStatus) p.set('payStatus', payStatus);
      return request(`/winners?${p}`);
    },
    mine: ()                         => request('/winners/me'),
    verify: (id: string, status: string) =>
      request(`/winners/${id}/verify?status=${status}`, { method: 'PATCH' }),
    markPaid: (id: string)           => request(`/winners/${id}/pay`, { method: 'PATCH' }),
  },

  // ── Reports ─────────────────────────────────────────────────
  reports: {
    overview: () => request('/reports/overview'),
  },
};

// ── Auth helpers ────────────────────────────────────────────────
export function saveToken(token: string) {
  localStorage.setItem('token', token);
}
export function clearToken() {
  localStorage.removeItem('token');
}
export function isLoggedIn(): boolean {
  return !!getToken();
}
