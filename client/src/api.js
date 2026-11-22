async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, { credentials: 'include', ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return body;
}

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const api = {
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  topArtists: (range) => request(`/stats/top/artists?range=${range}`),
  topTracks: (range) => request(`/stats/top/tracks?range=${range}`),
  genres: (range) => request(`/stats/genres?range=${range}`),
  recent: () => request('/stats/recent'),
  history: (days) => request(`/stats/history?days=${days}&tz=${encodeURIComponent(tz)}`),
  sync: () => request('/stats/sync', { method: 'POST' }),
  wrapped: (range) => request(`/stats/wrapped?range=${range}`),
};

export const RANGES = [
  { value: 'short_term', label: 'Last 4 weeks' },
  { value: 'medium_term', label: 'Last 6 months' },
  { value: 'long_term', label: 'Last year' },
];
