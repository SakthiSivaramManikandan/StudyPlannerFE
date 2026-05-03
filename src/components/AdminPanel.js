import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [delConfirm, setDelConfirm] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => { fetchUsers(); }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      const { data } = await api.get('/admin/users?' + params.toString());
      setUsers(data.data || []);
      setPagination(data.pagination || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const deactivate = async (id) => {
    try {
      await api.put(`/admin/users/${id}/deactivate`);
      showToast('User deactivated.');
      fetchUsers();
    } catch (err) { showToast('Failed to deactivate.'); }
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      showToast('User and all their data deleted.');
      setDelConfirm(null);
      fetchUsers();
    } catch (err) { showToast('Delete failed.'); }
  };

  return (
    <div>
      {toast && (
        <div style={{position:'fixed',top:20,right:20,background:'var(--accent)',color:'#fff',padding:'10px 18px',borderRadius:10,zIndex:9999,fontSize:'0.88rem',boxShadow:'0 4px 20px #0004'}}>
          {toast}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">🛡 Admin Panel</h1>
          <p className="page-subtitle">Manage users, view all data, control access</p>
        </div>
      </div>

      {/* Stats Bar */}
      {pagination.total !== undefined && (
        <div style={{display:'flex',gap:16,marginBottom:24,flexWrap:'wrap'}}>
          {[
            ['Total Users', pagination.total, '#6c63ff'],
            ['Current Page', `${pagination.page} / ${pagination.pages}`, '#2dd4bf'],
          ].map(([l,v,c]) => (
            <div key={l} style={{flex:1,minWidth:140,padding:'16px 20px',background:'var(--surface)',borderRadius:12,border:'1px solid var(--border)',borderLeft:`4px solid ${c}`}}>
              <div style={{fontSize:'1.5rem',fontWeight:700,color:c}}>{v}</div>
              <div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="card" style={{padding:'16px 20px',marginBottom:20}}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input
            placeholder="Search users by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{flex:1}}
          />
          <span style={{fontSize:'0.82rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{pagination.total || 0} users</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.88rem'}}>
            <thead>
              <tr style={{background:'var(--surface)',borderBottom:'1px solid var(--border)'}}>
                {['User','Email','Role','Status','Joined','Actions'].map(h => (
                  <th key={h} style={{padding:'12px 16px',textAlign:'left',fontWeight:600,color:'var(--text-secondary)',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>No users found.</td></tr>
              ) : users.map((u, i) => (
                <tr key={u._id} style={{borderBottom:'1px solid var(--border)',background:i%2===0?'transparent':'var(--surface)22'}}>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:30,height:30,borderRadius:'50%',background:'var(--accent)22',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--accent)',fontSize:'0.8rem',flexShrink:0}}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{fontWeight:500}}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{padding:'12px 16px',color:'var(--text-secondary)'}}>{u.email}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{fontSize:'0.75rem',padding:'3px 10px',borderRadius:20,background:u.role==='admin'?'#6c63ff22':'#2dd4bf22',color:u.role==='admin'?'#6c63ff':'#2dd4bf',fontWeight:600}}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{fontSize:'0.75rem',padding:'3px 10px',borderRadius:20,background:u.isActive?'#4ade8022':'#fb718522',color:u.isActive?'#4ade80':'#fb7185',fontWeight:600}}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{padding:'12px 16px',color:'var(--text-muted)',fontSize:'0.8rem'}}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',gap:6}}>
                      {u.isActive && (
                        <button onClick={() => deactivate(u._id)} style={{background:'none',border:'1px solid #f59e0b66',color:'#f59e0b',cursor:'pointer',padding:'4px 10px',borderRadius:6,fontSize:'0.75rem',whiteSpace:'nowrap'}}>
                          Deactivate
                        </button>
                      )}
                      <button onClick={() => setDelConfirm(u)} style={{background:'none',border:'1px solid #fb718566',color:'#fb7185',cursor:'pointer',padding:'4px 10px',borderRadius:6,fontSize:'0.75rem',marginLeft:4}}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16}}>
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p-1)}>← Prev</button>
          <span style={{padding:'8px 16px',color:'var(--text-secondary)',fontSize:'0.85rem'}}>Page {page} of {pagination.pages}</span>
          <button className="btn btn-ghost" disabled={page >= pagination.pages} onClick={() => setPage(p => p+1)}>Next →</button>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {delConfirm && (
        <div className="modal-backdrop" onClick={() => setDelConfirm(null)}>
          <div className="modal" style={{maxWidth:380}}>
            <h2 className="modal-title">🗑 Delete User</h2>
            <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',marginBottom:8}}>
              Delete <strong>{delConfirm.name}</strong>? This will permanently remove their account and all courses, tasks, and exams.
            </p>
            <div style={{padding:'10px 14px',background:'#fb718518',borderRadius:8,fontSize:'0.82rem',color:'#fb7185',marginBottom:16}}>
              ⚠️ This action cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteUser(delConfirm._id)}>Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
