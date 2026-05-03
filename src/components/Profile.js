import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Profile({ onUserUpdate }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [profileForm, setProfileForm] = useState({ name: user.name || '', email: user.email || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const [pwErrors, setPwErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      setUser(data.user);
      setProfileForm({ name: data.user.name, email: data.user.email });
    }).catch(() => {});
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErrors({});
    setProfileLoading(true);
    try {
      const { data } = await api.put('/auth/me', profileForm);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setProfileMsg('Profile updated successfully!');
      if (onUserUpdate) onUserUpdate(data.user);
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) {
        const mapped = {};
        res.errors.forEach(e => { mapped[e.field] = e.message; });
        setProfileErrors(mapped);
      } else {
        setProfileMsg(res?.message || 'Update failed');
      }
    } finally { setProfileLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwErrors({});
    setPwLoading(true);
    try {
      await api.put('/auth/me/password', pwForm);
      setPwMsg('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      const res = err.response?.data;
      if (res?.errors) {
        const mapped = {};
        res.errors.forEach(e => { mapped[e.field] = e.message; });
        setPwErrors(mapped);
      } else {
        setPwMsg(res?.message || 'Password change failed');
      }
    } finally { setPwLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:24}}>
        {/* Profile Info */}
        <div className="card" style={{padding:24}}>
          <h2 style={{marginBottom:16,fontSize:'1.1rem'}}>👤 Account Info</h2>
          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={profileForm.name} onChange={e=>setProfileForm(f=>({...f,name:e.target.value}))} />
              {profileErrors.name && <span style={{color:'#fb7185',fontSize:'0.78rem'}}>{profileErrors.name}</span>}
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={profileForm.email} onChange={e=>setProfileForm(f=>({...f,email:e.target.value}))} />
              {profileErrors.email && <span style={{color:'#fb7185',fontSize:'0.78rem'}}>{profileErrors.email}</span>}
            </div>
            <div className="form-group">
              <label>Role</label>
              <input value={user.role || 'student'} disabled style={{opacity:0.6}} />
            </div>
            {profileMsg && <div style={{color: profileMsg.includes('success') ? '#4ade80' : '#fb7185', fontSize:'0.85rem', marginBottom:8}}>{profileMsg}</div>}
            <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card" style={{padding:24}}>
          <h2 style={{marginBottom:16,fontSize:'1.1rem'}}>🔒 Change Password</h2>
          <form onSubmit={changePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={e=>setPwForm(f=>({...f,currentPassword:e.target.value}))} />
              {pwErrors.currentPassword && <span style={{color:'#fb7185',fontSize:'0.78rem'}}>{pwErrors.currentPassword}</span>}
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" placeholder="Min 8 chars + a number" value={pwForm.newPassword} onChange={e=>setPwForm(f=>({...f,newPassword:e.target.value}))} />
              {pwErrors.newPassword && <span style={{color:'#fb7185',fontSize:'0.78rem'}}>{pwErrors.newPassword}</span>}
            </div>
            {pwMsg && <div style={{color: pwMsg.includes('success') ? '#4ade80' : '#fb7185', fontSize:'0.85rem', marginBottom:8}}>{pwMsg}</div>}
            <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={pwLoading}>
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
