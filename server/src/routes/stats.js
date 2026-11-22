import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { spotifyGet } from '../services/spotify.js';
import Play from '../models/Play.js';
import { syncUser } from '../jobs/sync.js';

const router = Router();
router.use(requireAuth);

const RANGES = ['short_term', 'medium_term', 'long_term'];
const range = (req) => (RANGES.includes(req.query.range) ? req.query.range : 'medium_term');

// Keep only the fields the client uses (Spotify removed popularity/followers in dev mode).
const slimArtist = (a) => ({ id: a.id, name: a.name, genres: a.genres || [], image: a.images?.[0]?.url, url: a.external_urls?.spotify });
const slimTrack = (t) => ({
  id: t.id,
  name: t.name,
  artists: t.artists.map((a) => a.name).join(', '),
  album: t.album?.name,
  image: t.album?.images?.[0]?.url,
  durationMs: t.duration_ms,
  url: t.external_urls?.spotify,
});

const topArtists = (user, r) => spotifyGet(user, '/me/top/artists', { time_range: r, limit: 50 }).then((d) => d.items.map(slimArtist));
const topTracks = (user, r) => spotifyGet(user, '/me/top/tracks', { time_range: r, limit: 50 }).then((d) => d.items.map(slimTrack));

/** Counts genres across top artists, weighting higher-ranked artists more. */
function genreBreakdown(artists, limit = 10) {
  const counts = {};
  artists.forEach((a, i) => {
    const weight = artists.length - i;
    a.genres.forEach((g) => (counts[g] = (counts[g] || 0) + weight));
  });
  const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre, score]) => ({ genre, percent: Math.round((score / total) * 1000) / 10 }));
}

router.get('/top/artists', async (req, res, next) => {
  try { res.json(await topArtists(req.user, range(req))); } catch (e) { next(e); }
});

router.get('/top/tracks', async (req, res, next) => {
  try { res.json(await topTracks(req.user, range(req))); } catch (e) { next(e); }
});

router.get('/genres', async (req, res, next) => {
  try { res.json(genreBreakdown(await topArtists(req.user, range(req)))); } catch (e) { next(e); }
});

router.get('/recent', async (req, res, next) => {
  try {
    const data = await spotifyGet(req.user, '/me/player/recently-played', { limit: 50 });
    res.json(data.items.map((it) => ({ playedAt: it.played_at, ...slimTrack(it.track) })));
  } catch (e) { next(e); }
});

/** Trends from the plays we've stored in MongoDB. */
router.get('/history', async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 86400_000);
    const tz = typeof req.query.tz === 'string' ? req.query.tz : 'UTC';
    const match = { $match: { user: req.user._id, playedAt: { $gte: since } } };

    const [perDay, perHour, topArtistsHist, totals] = await Promise.all([
      Play.aggregate([
        match,
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$playedAt', timezone: tz } }, plays: { $sum: 1 }, ms: { $sum: '$durationMs' } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', plays: 1, minutes: { $round: [{ $divide: ['$ms', 60000] }, 0] } } },
      ]),
      Play.aggregate([
        match,
        { $group: { _id: { $hour: { date: '$playedAt', timezone: tz } }, plays: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, hour: '$_id', plays: 1 } },
      ]),
      Play.aggregate([
        match,
        { $unwind: '$artists' },
        { $group: { _id: '$artists.name', plays: { $sum: 1 } } },
        { $sort: { plays: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, name: '$_id', plays: 1 } },
      ]),
      Play.aggregate([match, { $group: { _id: null, plays: { $sum: 1 }, ms: { $sum: '$durationMs' }, tracks: { $addToSet: '$trackId' } } }]),
    ]);

    // Fill in all 24 hours so the chart has no gaps.
    const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, plays: perHour.find((p) => p.hour === h)?.plays || 0 }));
    const t = totals[0];
    res.json({
      days,
      totalPlays: t?.plays || 0,
      totalMinutes: t ? Math.round(t.ms / 60000) : 0,
      uniqueTracks: t?.tracks.length || 0,
      perDay,
      perHour: hours,
      topArtists: topArtistsHist,
      lastSyncedAt: req.user.lastSyncedAt,
    });
  } catch (e) { next(e); }
});

router.post('/sync', async (req, res, next) => {
  try { res.json({ added: await syncUser(req.user) }); } catch (e) { next(e); }
});

/** Data for the shareable "Wrapped" card. */
router.get('/wrapped', async (req, res, next) => {
  try {
    const r = range(req);
    const [artists, tracks] = await Promise.all([topArtists(req.user, r), topTracks(req.user, r)]);
    const minutes = await Play.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, ms: { $sum: '$durationMs' } } },
    ]);
    res.json({
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
      range: r,
      topArtists: artists.slice(0, 5),
      topTracks: tracks.slice(0, 5),
      topGenre: genreBreakdown(artists, 1)[0]?.genre || null,
      minutesTracked: minutes[0] ? Math.round(minutes[0].ms / 60000) : 0,
    });
  } catch (e) { next(e); }
});

export default router;
