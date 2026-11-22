import 'dotenv/config';

const required = ['MONGODB_URI', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REDIRECT_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}. Copy server/.env.example to server/.env and fill it in.`);
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  clientUrl: process.env.CLIENT_URL || 'http://127.0.0.1:5173',
  jwtSecret: process.env.JWT_SECRET,
  syncCron: process.env.SYNC_CRON || '*/30 * * * *',
  isProd: process.env.NODE_ENV === 'production',
};
