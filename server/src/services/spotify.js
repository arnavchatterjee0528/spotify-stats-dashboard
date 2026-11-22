import { config } from '../config.js';

const ACCOUNTS = 'https://accounts.spotify.com';
const API = 'https://api.spotify.com/v1';

export const SCOPES = ['user-read-private', 'user-top-read', 'user-read-recently-played'].join(' ');

function basicAuth() {
  return 'Basic ' + Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
}

async function tokenRequest(params) {
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw new Error(`Spotify token error ${res.status}: ${await res.text()}`);
  return res.json();
}

export function authorizeUrl(state) {
  const q = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    scope: SCOPES,
    redirect_uri: config.redirectUri,
    state,
  });
  return `${ACCOUNTS}/authorize?${q}`;
}

export const exchangeCode = (code) =>
  tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: config.redirectUri });

/** Returns a valid access token for the user, refreshing it if it expires within a minute. */
export async function getAccessToken(user) {
  if (user.tokenExpiresAt.getTime() - Date.now() > 60_000) return user.accessToken;
  const data = await tokenRequest({ grant_type: 'refresh_token', refresh_token: user.refreshToken });
  user.accessToken = data.access_token;
  if (data.refresh_token) user.refreshToken = data.refresh_token; // Spotify may rotate it
  user.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
  await user.save();
  return user.accessToken;
}

/** GET a Spotify Web API path on behalf of a user. */
export async function spotifyGet(user, path, params = {}) {
  const token = await getAccessToken(user);
  const url = `${API}${path}${Object.keys(params).length ? '?' + new URLSearchParams(params) : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 429) {
    const err = new Error('Spotify rate limit hit, try again shortly');
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`Spotify API ${res.status} on ${path}`);
    err.status = res.status === 401 ? 401 : 502;
    throw err;
  }
  return res.json();
}

export const getProfile = (accessToken) =>
  fetch(`${API}/me`, { headers: { Authorization: `Bearer ${accessToken}` } }).then((r) => {
    if (!r.ok) throw new Error(`Spotify /me error ${r.status}`);
    return r.json();
  });
