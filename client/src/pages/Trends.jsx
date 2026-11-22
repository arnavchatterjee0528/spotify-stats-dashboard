import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';
import { useApi } from '../useApi';
import Status from '../components/Status';
import ChartTooltip from '../components/ChartTooltip';

const DAY_OPTIONS = [7, 30, 90];
const fmtDay = (d) => new Date(d + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtHour = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
const axis = { tickLine: false, axisLine: false, tick: { fill: 'var(--text-3)', fontSize: 12 } };

export default function Trends() {
  const [days, setDays] = useState(30);
  const [syncTick, setSyncTick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { data, loading, error } = useApi(() => api.history(days), [days, syncTick]);

  const syncNow = async () => {
    setSyncing(true);
    try { await api.sync(); setSyncTick((n) => n + 1); } finally { setSyncing(false); }
  };

  return (
    <section>
      <div className="section-head">
        <h2>Listening trends</h2>
        <div className="segmented">
          {DAY_OPTIONS.map((d) => (
            <button key={d} className={d === days ? 'active' : ''} onClick={() => setDays(d)}>{d} days</button>
          ))}
        </div>
      </div>
      <p className="muted small">
        Built from plays saved by the background sync.{' '}
        {data?.lastSyncedAt && `Last play saved ${new Date(data.lastSyncedAt).toLocaleString()}. `}
        <button className="link" onClick={syncNow} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync now'}</button>
      </p>
      <Status loading={loading} error={error}
        empty={data?.totalPlays === 0 && 'No saved plays in this period yet. Play some music, then hit Sync now.'}>
        {data && (
          <>
            <div className="tiles">
              <div className="tile"><span className="muted small">Plays</span><strong>{data.totalPlays.toLocaleString()}</strong></div>
              <div className="tile"><span className="muted small">Minutes</span><strong>{data.totalMinutes.toLocaleString()}</strong></div>
              <div className="tile"><span className="muted small">Unique tracks</span><strong>{data.uniqueTracks.toLocaleString()}</strong></div>
            </div>

            <div className="panel">
              <h3>Minutes per day</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.perDay} margin={{ top: 8, right: 8, left: -16 }}>
                  <CartesianGrid vertical={false} stroke="var(--grid)" />
                  <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={24} {...axis} />
                  <YAxis allowDecimals={false} {...axis} />
                  <Tooltip cursor={{ fill: 'var(--hover)' }} content={<ChartTooltip unit="min" format={fmtDay} />} />
                  <Bar dataKey="minutes" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="two-col">
              <div className="panel">
                <h3>When you listen</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.perHour} margin={{ top: 8, right: 8, left: -16 }}>
                    <CartesianGrid vertical={false} stroke="var(--grid)" />
                    <XAxis dataKey="hour" tickFormatter={fmtHour} interval={3} {...axis} />
                    <YAxis allowDecimals={false} {...axis} />
                    <Tooltip cursor={{ fill: 'var(--hover)' }} content={<ChartTooltip format={fmtHour} />} />
                    <Bar dataKey="plays" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="panel">
                <h3>Most played artists</h3>
                <ol className="ranked">
                  {data.topArtists.map((a) => (
                    <li key={a.name}><span>{a.name}</span><span className="muted">{a.plays} plays</span></li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}
      </Status>
    </section>
  );
}
