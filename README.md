# Spotify Listening Stats Dashboard

A MERN stack app (MongoDB, Express, React, Node) that shows your Spotify listening stats:

- **Login with Spotify** (OAuth 2.0 authorization code flow, tokens stored in MongoDB, automatic refresh)
- **Top artists and top tracks** for the last 4 weeks, 6 months, or year
- **Genre breakdown** computed from your top 50 artists
- **Recently played** tracks
- **Listening trends**: a background job saves your plays to MongoDB every 30 minutes, so history grows past Spotify's 50-track limit. Charts show minutes per day, listening by hour, and most played artists.
- **Shareable Wrapped card** you can download as a PNG

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, React Router, Recharts, html-to-image |
| Backend | Node.js, Express, Mongoose, node-cron, JWT (httpOnly cookie) |
| Database | MongoDB Atlas |
| External API | Spotify Web API |

## Project structure

```
client/                 React app (Vite)
  src/pages/            Login, TopItems, Genres, Recent, Trends, Wrapped
  src/components/       Shared UI pieces
  src/api.js            All calls to the backend
server/
  src/index.js          Express app entry
  src/config.js         Reads .env
  src/models/           User, Play (Mongoose schemas)
  src/routes/auth.js    /api/auth: login, callback, logout, me
  src/routes/stats.js   /api/stats: top, genres, recent, history, sync, wrapped
  src/services/spotify.js  Spotify API client + token refresh
  src/jobs/sync.js      Scheduled recently-played sync
```

## Setup

### 1. Create a Spotify app

> The Spotify account that creates the app needs **Spotify Premium** (Spotify's rule for development apps since Feb 2026). Up to 5 users can log in.

1. Go to <https://developer.spotify.com/dashboard> and log in.
2. Click **Create app**. Any name and description.
3. Under **Redirect URIs**, add exactly: `http://127.0.0.1:5000/api/auth/callback` (Spotify does not allow `localhost`).
4. Under **Which API/SDKs are you planning to use?**, tick **Web API**. Save.
5. Open **Settings** and copy the **Client ID** and **Client secret**.
6. Open **User Management** and add the name and Spotify email of everyone who will log in (including yourself).

### 2. Create a MongoDB Atlas database

1. Go to <https://cloud.mongodb.com> and create a free **M0** cluster.
2. **Database Access**: add a database user with a password.
3. **Network Access**: add your IP address (or `0.0.0.0/0` for a demo).
4. **Connect > Drivers**: copy the connection string, put in your password, and add `/spotify-stats` before the `?` so the database has a name.

### 3. Configure and run

```bash
cp server/.env.example server/.env   # then fill in the values
npm run install:all
npm run dev
```

Open <http://127.0.0.1:5173> (use `127.0.0.1`, not `localhost`, or the login cookie won't stick).

`npm run dev` starts both the API (port 5000) and the React dev server (port 5173). Vite proxies `/api` to Express, so the browser only ever talks to one origin.

## API

All `/api/stats` routes need the login cookie. `range` is `short_term`, `medium_term`, or `long_term`.

| Method | Route | Description |
|---|---|---|
| GET | `/api/auth/login` | Redirects to Spotify login |
| GET | `/api/auth/callback` | Spotify redirects here; saves tokens, sets cookie |
| POST | `/api/auth/logout` | Clears the cookie |
| GET | `/api/auth/me` | Current user |
| GET | `/api/stats/top/artists?range=` | Top 50 artists |
| GET | `/api/stats/top/tracks?range=` | Top 50 tracks |
| GET | `/api/stats/genres?range=` | Genre percentages |
| GET | `/api/stats/recent` | Last 50 plays (live from Spotify) |
| GET | `/api/stats/history?days=30&tz=` | Trends from stored plays |
| POST | `/api/stats/sync` | Sync recently played now |
| GET | `/api/stats/wrapped?range=` | Data for the Wrapped card |

## How the history sync works

Spotify's API only returns your last 50 plays. On login, and then every 30 minutes (`SYNC_CRON`), the server calls `recently-played` with `after=<last saved play>` for every user and upserts each play into the `plays` collection. A unique index on `(user, playedAt)` prevents duplicates. Trends are MongoDB aggregation pipelines over that collection. The server has to be running for the sync to happen, so history starts from the first login.

## Production build

```bash
npm run build   # builds client/dist
npm start       # Express serves the API and the built React app
```

When deploying, set `SPOTIFY_REDIRECT_URI` and `CLIENT_URL` to your public URL and add that redirect URI in the Spotify dashboard.

## Notes and limits

- Spotify's audio features (danceability, energy, etc.) are closed to new apps, so there's no mood analysis.
- Spotify sometimes returns no genres for an artist; those artists are skipped in the genre chart.
- Development-mode Spotify apps allow up to 5 users, which must be added in User Management.
