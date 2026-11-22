import mongoose from 'mongoose';

// One document per track play. Spotify only returns the last 50 plays,
// so the sync job stores them here to build a longer history.
const playSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  playedAt: { type: Date, required: true },
  trackId: { type: String, required: true },
  trackName: String,
  durationMs: Number,
  albumName: String,
  albumImage: String,
  artists: [{ id: String, name: String }],
});

// Prevents storing the same play twice when syncs overlap.
playSchema.index({ user: 1, playedAt: 1 }, { unique: true });

export default mongoose.model('Play', playSchema);
