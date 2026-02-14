const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const api = {
  habits: {
    list: () => request('/habits'),
    create: (body) => request('/habits', { method: 'POST', body: JSON.stringify(body) }),
    complete: (id, date) => request(`/habits/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(date ? { date } : {}),
    }),
    update: (id, body) => request(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
  },
  tasks: {
    list: () => request('/tasks'),
    create: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  },
  pomodoro: {
    listSessions: () => request('/pomodoro/sessions'),
    getStats: () => request('/pomodoro/stats'),
    startSession: (body) => request('/pomodoro/sessions', { method: 'POST', body: JSON.stringify(body) }),
    completeSession: (id) => request(`/pomodoro/sessions/${id}/complete`, { method: 'PATCH' }),
  },
};
