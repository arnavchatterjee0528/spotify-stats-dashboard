import { useState } from 'react';
import { api } from '../api';
import { useApi } from '../useApi';
import RangePicker from '../components/RangePicker';
import Status from '../components/Status';

export default function TopItems({ type }) {
  const [range, setRange] = useState('short_term');
  const { data, loading, error } = useApi(
    () => (type === 'artists' ? api.topArtists(range) : api.topTracks(range)),
    [type, range]
  );

  return (
    <section>
      <div className="section-head">
        <h2>Top {type}</h2>
        <RangePicker value={range} onChange={setRange} />
      </div>
      <Status loading={loading} error={error} empty={data?.length === 0 && 'Not enough listening data yet.'}>
        <ol className={type === 'artists' ? 'grid' : 'list'}>
          {data?.map((item, i) => (
            <li key={item.id}>
              <a href={item.url} target="_blank" rel="noreferrer" className={type === 'artists' ? 'card' : 'row'}>
                <span className="rank">{i + 1}</span>
                {item.image && <img src={item.image} alt="" loading="lazy" />}
                <span className="meta">
                  <strong>{item.name}</strong>
                  <span className="muted">
                    {type === 'artists' ? item.genres.slice(0, 2).join(', ') : `${item.artists} · ${item.album}`}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </Status>
    </section>
  );
}
