import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api';
import Login from './pages/Login';
import TopItems from './pages/TopItems';
import Genres from './pages/Genres';
import Recent from './pages/Recent';
import Trends from './pages/Trends';
import Wrapped from './pages/Wrapped';

const NAV = [
  ['/artists', 'Top artists'],
  ['/tracks', 'Top tracks'],
  ['/genres', 'Genres'],
  ['/recent', 'Recently played'],
  ['/trends', 'Trends'],
  ['/wrapped', 'Wrapped card'],
];

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still checking

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <div className="center muted">Loading…</div>;
  if (!user) return <Login />;

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <div className="layout">
      <header className="topbar">
        <span className="brand">Listening Stats</span>
        <nav>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
        <div className="user">
          {user.avatarUrl && <img src={user.avatarUrl} alt="" />}
          <span>{user.displayName}</span>
          <button className="link" onClick={logout}>Log out</button>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/artists" element={<TopItems type="artists" />} />
          <Route path="/tracks" element={<TopItems type="tracks" />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/recent" element={<Recent />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/wrapped" element={<Wrapped />} />
          <Route path="*" element={<Navigate to="/artists" replace />} />
        </Routes>
      </main>
    </div>
  );
}
