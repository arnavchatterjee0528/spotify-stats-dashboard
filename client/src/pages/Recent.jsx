import { api } from '../api';
import { useApi } from '../useApi';
import Status from '../components/Status';

const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return new Date(iso).toLocaleDateString();
};

export default function Recent() {
  const { data, loading, error } = useApi(() => api.recent(), []);
  return (
    <section>
      <div className="section-head"><h2>Recently played</h2></div>
      <Status loading={loading} error={error} empty={data?.length === 0 && 'Nothing played recently.'}>
        <ol className="list">
          {data?.map((t) => (
            <li key={t.playedAt}>
              <a href={t.url} target="_blank" rel="noreferrer" className="row">
                {t.image && <img src={t.image} alt="" loading="lazy" />}
                <span className="meta">
                  <strong>{t.name}</strong>
                  <span className="muted">{t.artists}</span>
                </span>
                <span className="muted small when">{timeAgo(t.playedAt)}</span>
              </a>
            </li>
          ))}
        </ol>
      </Status>
    </section>
  );
}
