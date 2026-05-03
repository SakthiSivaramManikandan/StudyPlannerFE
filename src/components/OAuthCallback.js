import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Landing page for Google OAuth redirect.
 * URL format: /oauth/callback?token=JWT&user=JSON
 */
export default function OAuthCallback({ onLogin }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        onLogin(user);
        navigate('/', { replace: true });
      } catch {
        navigate('/login?error=oauth_failed', { replace: true });
      }
    } else {
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [navigate, onLogin]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', color: '#e2e8f0', fontFamily: 'sans-serif', flexDirection: 'column', gap: 16
    }}>
      <div style={{ fontSize: 40 }}>📚</div>
      <p style={{ color: '#818cf8', fontSize: '1.1rem' }}>Signing you in with Google…</p>
    </div>
  );
}
