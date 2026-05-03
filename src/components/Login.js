import React, { useState } from 'react';
import '../styles/Login.css';
import api from '../api/axios';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'student' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (mode === 'register' && !form.name) { setError('Please enter your name.'); return; }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name, role: form.role };
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) {
        const mapped = {};
        res.errors.forEach(e => { mapped[e.field] = e.message; });
        setFieldErrors(mapped);
      } else {
        setError(res?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(''); setFieldErrors({}); setForm({ email: '', password: '', name: '', role: 'student' }); };

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="login-orb orb1" />
        <div className="login-orb orb2" />
        <div className="login-grid" />
      </div>
      <div className="login-left">
        <div className="login-brand">
          <span className="login-logo">📚</span>
          <span className="login-wordmark">StudyPlanner</span>
        </div>
        <div className="login-hero">
          <h1 className="login-hero-title">Plan smarter.<br /><span className="gradient-text">Study better.</span></h1>
          <p className="login-hero-sub">Track courses, assignments, exams and deadlines — all in one focused workspace.</p>
          <ul className="login-features">
            {['📅 Calendar & deadline view','📋 Task & assignment tracker','🎓 Course management','📚 Academic book search','🔔 Deadline reminders'].map(f => (<li key={f}>{f}</li>))}
          </ul>
        </div>
        <div className="login-stats">
          {[['10k+','Students'],['98%','Satisfaction'],['4.9★','App Rating']].map(([n,l]) => (
            <div className="login-stat" key={l}><span className="stat-num">{n}</span><span className="stat-label">{l}</span></div>
          ))}
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <div className="login-tabs">
            <button className={`login-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
            <button className={`login-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Register</button>
          </div>
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Jane Smith" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  {fieldErrors.name && <span style={{color:'#fb7185',fontSize:'0.78rem'}}>{fieldErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Account Type</label>
                  <div style={{display:'flex',gap:10,marginTop:4}}>
                    {[['student','🎓 Student'],['admin','🛡 Admin']].map(([val,label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm({...form, role: val})}
                        style={{
                          flex:1, padding:'10px 8px', borderRadius:10, border:`2px solid ${form.role===val?'var(--accent)':'var(--border)'}`,
                          background: form.role===val ? 'var(--accent)22' : 'var(--surface)',
                          color: form.role===val ? 'var(--accent)' : 'var(--text-secondary)',
                          cursor:'pointer', fontWeight: form.role===val ? 700 : 400, fontSize:'0.9rem', transition:'all 0.15s'
                        }}
                      >{label}</button>
                    ))}
                  </div>
                  {form.role === 'admin' && (
                    <div style={{marginTop:6,padding:'6px 10px',background:'#f59e0b18',borderRadius:8,fontSize:'0.78rem',color:'#f59e0b',border:'1px solid #f59e0b44'}}>
                      ⚠️ Admin accounts can manage all users and view system data.
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@university.edu" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              {fieldErrors.email && <span style={{color:'#fb7185',fontSize:'0.78rem'}}>{fieldErrors.email}</span>}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder={mode === 'register' ? 'Min. 8 chars + a number' : '••••••••'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              {fieldErrors.password && <span style={{color:'#fb7185',fontSize:'0.78rem'}}>{fieldErrors.password}</span>}
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <div className="login-divider"><span>or</span></div>
          <a
            href={`${process.env.REACT_APP_API_URL}/auth/google`}
            className="btn-google-oauth"
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              width:'100%', padding:'11px 16px', borderRadius:10, border:'1.5px solid var(--border)',
              background:'var(--surface)', color:'var(--text)', fontWeight:600, fontSize:'0.95rem',
              textDecoration:'none', cursor:'pointer', marginBottom:8, transition:'background 0.15s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.15 0 5.64 1.08 7.55 2.84l5.62-5.62C33.67 3.53 29.18 1.5 24 1.5 14.98 1.5 7.3 7.1 4.08 14.94l6.54 5.08C12.27 13.72 17.65 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.14 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.44c-.54 2.88-2.17 5.32-4.62 6.96l7.1 5.52C43.18 37.14 46.14 31.3 46.14 24.5z"/>
              <path fill="#FBBC05" d="M10.62 28.02A14.6 14.6 0 0 1 9.5 24c0-1.4.24-2.76.62-4.02L3.58 14.9A22.46 22.46 0 0 0 1.5 24c0 3.24.68 6.32 1.88 9.1l7.24-5.08z"/>
              <path fill="#34A853" d="M24 46.5c5.18 0 9.52-1.7 12.7-4.62l-7.1-5.52c-1.78 1.2-4.06 1.9-5.6 1.9-6.35 0-11.73-4.22-13.38-9.92l-7.24 5.08C7.3 40.9 14.98 46.5 24 46.5z"/>
            </svg>
            Continue with Google
          </a>
          <p style={{textAlign:'center',fontSize:'0.8rem',color:'var(--text-muted)',margin:'8px 0 0'}}>
            {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
            <button style={{background:'none',border:'none',color:'var(--accent)',cursor:'pointer',padding:0,fontWeight:600}}
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Register here' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
