import cron from 'node-cron';
import User from '../models/User.js';
import Play from '../models/Play.js';
import { spotifyGet } from '../services/spotify.js';
import { config } from '../config.js';

/** Pulls the user's recently played tracks since the last sync and stores new plays. */
export async function syncUser(user) {
  const params = { limit: 50 };
  if (user.lastSyncedAt) params.after = user.lastSyncedAt.getTime();
  const data = await spotifyGet(user, '/me/player/recently-played', params);
  const items = data.items || [];
  if (!items.length) return 0;

  const ops = items.map((it) => ({
    updateOne: {
      filter: { user: user._id, playedAt: new Date(it.played_at) },
      update: {
        $setOnInsert: {
          trackId: it.track.id,
          trackName: it.track.name,
          durationMs: it.track.duration_ms,
          albumName: it.track.album?.name,
          albumImage: it.track.album?.images?.[0]?.url,
          artists: it.track.artists.map((a) => ({ id: a.id, name: a.name })),
        },
      },
      upsert: true,
    },
  }));
  const result = await Play.bulkWrite(ops, { ordered: false });

  const newest = Math.max(...items.map((it) => new Date(it.played_at).getTime()));
  user.lastSyncedAt = new Date(newest);
  await user.save();
  return result.upsertedCount;
}

export async function syncAll() {
  const users = await User.find();
  for (const user of users) {
    try {
      const n = await syncUser(user);
      if (n) console.log(`[sync] ${user.displayName}: ${n} new plays`);
    } catch (e) {
      console.error(`[sync] ${user.displayName} failed:`, e.message);
    }
  }
}

export function startSyncJob() {
  cron.schedule(config.syncCron, syncAll);
  console.log(`[sync] scheduled with "${config.syncCron}"`);
}
