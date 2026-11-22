const ERRORS = {
  access_denied: 'You cancelled the Spotify login.',
  state_mismatch: 'Login expired, please try again.',
  login_failed: 'Login failed. If this is a new Spotify app, make sure your account is added under User Management.',
};

export default function Login() {
  const error = new URLSearchParams(window.location.search).get('error');
  return (
    <div className="center login">
      <h1>Your listening, in numbers</h1>
      <p className="muted">Top artists and tracks, genre mix, listening trends, and a shareable card.</p>
      {error && <p className="error">{ERRORS[error] || error}</p>}
      <a className="btn" href="/api/auth/login">Log in with Spotify</a>
    </div>
  );
}
