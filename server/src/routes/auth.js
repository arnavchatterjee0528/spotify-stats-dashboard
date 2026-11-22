import { Router } from 'express';
import crypto from 'node:crypto';
import { authorizeUrl, exchangeCode, getProfile } from '../services/spotify.js';
import User from '../models/User.js';
import { setSession, requireAuth, COOKIE } from '../middleware/auth.js';
import { syncUser } from '../jobs/sync.js';
import { config } from '../config.js';

const router = Router();

router.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 });
  res.redirect(authorizeUrl(state));
});

router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${config.clientUrl}/?error=${encodeURIComponent(error)}`);
  if (!state || state !== req.cookies.oauth_state) {
    return res.redirect(`${config.clientUrl}/?error=state_mismatch`);
  }
  res.clearCookie('oauth_state');
  try {
    const tokens = await exchangeCode(code);
    const profile = await getProfile(tokens.access_token);
    const user = await User.findOneAndUpdate(
      { spotifyId: profile.id },
      {
        displayName: profile.display_name || profile.id,
        avatarUrl: profile.images?.[0]?.url,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    setSession(res, user._id);
    syncUser(user).catch((e) => console.error('[sync] first sync failed:', e.message));
    res.redirect(`${config.clientUrl}/`);
  } catch (e) {
    console.error('Login failed:', e.message);
    res.redirect(`${config.clientUrl}/?error=login_failed`);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const { displayName, avatarUrl, spotifyId, lastSyncedAt } = req.user;
  res.json({ displayName, avatarUrl, spotifyId, lastSyncedAt });
});

export default router;
