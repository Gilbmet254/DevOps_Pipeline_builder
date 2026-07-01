const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request to ${path} failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  listTemplates: () => request('/templates'),
  getTemplate: (id) => request(`/templates/${id}`),
  saveTemplate: (payload) =>
    request('/templates', { method: 'POST', body: JSON.stringify(payload) }),
  generate: (pipeline) =>
    request('/generate', { method: 'POST', body: JSON.stringify(pipeline) }),
  simulate: (pipeline) =>
    request('/simulate', { method: 'POST', body: JSON.stringify(pipeline) }),
  estimateCost: (pipeline, runsPerMonth) =>
    request('/cost', { method: 'POST', body: JSON.stringify({ pipeline, runsPerMonth }) }),
};
