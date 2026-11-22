import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    spotifyId: { type: String, required: true, unique: true },
    displayName: String,
    avatarUrl: String,
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpiresAt: { type: Date, required: true },
    lastSyncedAt: Date, // time of the newest play we've stored
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
