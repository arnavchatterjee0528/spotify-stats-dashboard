import { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';
import { useApi } from '../useApi';
import RangePicker from '../components/RangePicker';
import Status from '../components/Status';
import ChartTooltip from '../components/ChartTooltip';

export default function Genres() {
  const [range, setRange] = useState('medium_term');
  const { data, loading, error } = useApi(() => api.genres(range), [range]);

  return (
    <section>
      <div className="section-head">
        <h2>Genre breakdown</h2>
        <RangePicker value={range} onChange={setRange} />
      </div>
      <p className="muted small">Share of genres across your top 50 artists, weighted by rank.</p>
      <Status loading={loading} error={error}
        empty={data?.length === 0 && 'Spotify has no genre tags for your top artists yet.'}>
        <div className="panel">
          <ResponsiveContainer width="100%" height={Math.max(240, (data?.length || 0) * 36)}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="genre" width={150} tickLine={false} axisLine={false}
                tick={{ fill: 'var(--text-2)', fontSize: 13 }} />
              <Tooltip cursor={{ fill: 'var(--hover)' }} content={<ChartTooltip unit="%" />} />
              <Bar dataKey="percent" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20}
                label={{ position: 'right', fill: 'var(--text-2)', fontSize: 12, formatter: (v) => `${v}%` }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Status>
    </section>
  );
}
