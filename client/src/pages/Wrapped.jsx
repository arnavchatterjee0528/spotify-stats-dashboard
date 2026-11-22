import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { api, RANGES } from '../api';
import { useApi } from '../useApi';
import RangePicker from '../components/RangePicker';
import Status from '../components/Status';

export default function Wrapped() {
  const [range, setRange] = useState('short_term');
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);
  const { data, loading, error } = useApi(() => api.wrapped(range), [range]);

  const download = async () => {
    setBusy(true);
    try {
      // Spotify image CDN sends CORS headers, so images render into the PNG.
      const url = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-listening-${range}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  };

  const label = RANGES.find((r) => r.value === range)?.label;

  return (
    <section>
      <div className="section-head">
        <h2>Your Wrapped card</h2>
        <RangePicker value={range} onChange={setRange} />
      </div>
      <Status loading={loading} error={error}>
        {data && (
          <>
            <div className="wrapped" ref={cardRef}>
              <div className="wrapped-head">
                {data.topArtists[0]?.image && <img className="hero" src={data.topArtists[0].image} alt="" crossOrigin="anonymous" />}
                <div>
                  <span className="eyebrow">{data.displayName} · {label}</span>
                  <h3>{data.topArtists[0]?.name || 'No top artist yet'}</h3>
                  <span className="eyebrow">Top artist</span>
                </div>
              </div>
              <div className="wrapped-cols">
                <div>
                  <span className="eyebrow">Top artists</span>
                  <ol>{data.topArtists.map((a) => <li key={a.id}>{a.name}</li>)}</ol>
                </div>
                <div>
                  <span className="eyebrow">Top tracks</span>
                  <ol>{data.topTracks.map((t) => <li key={t.id}>{t.name}</li>)}</ol>
                </div>
              </div>
              <div className="wrapped-foot">
                <div><span className="eyebrow">Top genre</span><strong>{data.topGenre || 'n/a'}</strong></div>
                <div><span className="eyebrow">Minutes tracked</span><strong>{data.minutesTracked.toLocaleString()}</strong></div>
              </div>
            </div>
            <button className="btn" onClick={download} disabled={busy}>{busy ? 'Rendering…' : 'Download as image'}</button>
          </>
        )}
      </Status>
    </section>
  );
}
