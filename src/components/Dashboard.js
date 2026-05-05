import React, { useState, useEffect, useCallback } from 'react';
import '../styles/Dashboard.css';
import api from '../api/axios';
 
export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
 
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showTips, setShowTips] = useState(true);
  const [activeSection, setActiveSection] = useState('tasks');
 
  // API Type 1: Static quote
  const [quote, setQuote] = useState(null);
 
  // API Type 2: Wikipedia dynamic search
  const [wikiTopic, setWikiTopic] = useState('');
  const [wikiResult, setWikiResult] = useState(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState('');
 
  // API Type 3: Books DB
  const [bookQuery, setBookQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [savedBooks, setSavedBooks] = useState([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookSearch, setBookSearch] = useState('');
 
  // Admin stats
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
 
  const [stats, setStats] = useState({ tasks: 0, exams: 0, courses: 0, done: 0 });
 
  const fetchTasks = useCallback(async () => {
    try { const { data } = await api.get('/tasks'); setTasks(data.data || []); } catch (err) {}
  }, []);
 
  const fetchExams = useCallback(async () => {
    try { const { data } = await api.get('/exams'); setExams(data.data || []); } catch (err) {}
  }, []);
 
  const fetchStats = useCallback(async () => {
    try {
      const [tr, er, cr] = await Promise.all([api.get('/tasks'), api.get('/exams'), api.get('/courses')]);
      setStats({
        tasks: (tr.data.data || []).filter(t => t.status === 'pending').length,
        exams: er.data.count || 0,
        courses: cr.data.count || 0,
        done: (tr.data.data || []).filter(t => t.status === 'done').length,
      });
    } catch (err) {}
  }, []);
 
  const fetchQuote = useCallback(async () => {
    try { const { data } = await api.get('/external/quote'); setQuote(data.data); } catch (err) {}
  }, []);
 
  const fetchSavedBooks = useCallback(async (q = '') => {
    try {
      const { data } = await api.get('/external/books/saved' + (q ? `?search=${encodeURIComponent(q)}` : ''));
      setSavedBooks(data.data || []);
    } catch (err) {}
  }, []);
 
  const fetchAdminStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/users?limit=5');
      setAdminStats(data.pagination);
      setAdminUsers(data.data || []);
    } catch (err) {}
  }, []);
 
  useEffect(() => {
    fetchTasks();
    fetchExams();
    fetchStats();
    fetchQuote();
    fetchSavedBooks();
    if (isAdmin) fetchAdminStats();
  }, [isAdmin, fetchTasks, fetchExams, fetchStats, fetchQuote, fetchSavedBooks, fetchAdminStats]);
 
  const searchWiki = async () => {
    if (!wikiTopic.trim()) return;
    setWikiLoading(true); setWikiError(''); setWikiResult(null);
    try {
      const { data } = await api.get(`/external/wiki?topic=${encodeURIComponent(wikiTopic)}`);
      setWikiResult(data.data);
    } catch (err) {
      setWikiError(err.response?.data?.message || 'Topic not found. Try a different search term.');
    } finally { setWikiLoading(false); }
  };
 
  const searchBooks = async () => {
    if (!bookQuery.trim()) return;
    setBookLoading(true); setBookError('');
    try {
      const { data } = await api.get(`/external/books/search?q=${encodeURIComponent(bookQuery)}`);
      setBooks(data.data || []);
      fetchSavedBooks();
    } catch (err) {
      setBookError(err.response?.data?.message || 'Search failed');
    } finally { setBookLoading(false); }
  };
 
  const removeBook = async (id) => {
    try { await api.delete(`/external/books/${id}`); fetchSavedBooks(); } catch (err) {}
  };
 
  const toggleTask = async (id) => {
    try {
      const { data } = await api.patch(`/tasks/${id}/complete`);
      setTasks(ts => ts.map(t => t._id === id ? data.data : t));
      // Refresh stats to stay accurate
      fetchStats();
    } catch (err) {}
  };
 
  const deactivateUser = async (userId) => {
    try { await api.put(`/admin/users/${userId}/deactivate`); fetchAdminStats(); } catch (err) {}
  };
 
  const STATS_DATA = [
    { label: 'Active Tasks', value: stats.tasks, icon: '📋', color: 'accent', delta: 'pending tasks' },
    { label: 'Upcoming Exams', value: stats.exams, icon: '📝', color: 'amber', delta: 'scheduled' },
    { label: 'Courses', value: stats.courses, icon: '🎓', color: 'teal', delta: 'this semester' },
    { label: 'Completed', value: stats.done, icon: '✅', color: 'green', delta: 'tasks done' },
  ];
 
  const filtered = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'done';
    if (filter === 'done') return t.status === 'done';
    return true;
  });
 
  const SECTIONS = isAdmin
    ? [
        { key: 'tasks', label: '📋 Tasks' },
        { key: 'exams', label: '📝 Exams' },
        { key: 'wiki', label: '🔍 Wiki Search' },
        { key: 'books', label: '📚 Books' },
        { key: 'admin', label: '🛡 Admin' },
      ]
    : [
        { key: 'tasks', label: '📋 Tasks' },
        { key: 'exams', label: '📝 Exams' },
        { key: 'wiki', label: '🔍 Wiki Search' },
        { key: 'books', label: '📚 Books' },
      ];
 
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.name || 'Student'} 👋
            {isAdmin && <span style={{marginLeft:10, fontSize:'0.7rem', background:'var(--accent)', color:'#fff', padding:'2px 8px', borderRadius:20, verticalAlign:'middle'}}>ADMIN</span>}
          </h1>
          <p className="page-subtitle">Here's what's on your plate this week.</p>
        </div>
        <button style={{background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'6px 14px',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.85rem'}} onClick={() => setShowTips(v => !v)}>
          💡 {showTips ? 'Hide' : 'Show'} Tip
        </button>
      </div>
 
      {/* TYPE 1 API: Static Quote */}
      {showTips && (
        <div style={{padding:'12px 16px',marginBottom:20,background:'var(--surface)',borderRadius:10,borderLeft:'3px solid var(--accent)',display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:'1.4rem'}}>💡</span>
          <div>
            {quote
              ? <><em style={{color:'var(--text-secondary)'}}>&ldquo;{quote.quote}&rdquo;</em> <strong style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>— {quote.author}</strong></>
              : <span style={{color:'var(--text-muted)'}}>Loading today's quote…</span>
            }
            <div style={{fontSize:'0.68rem',color:'var(--text-muted)',marginTop:2}}>Daily quote from ZenQuotes</div>
          </div>
        </div>
      )}
 
      <div className="stats-grid">
        {STATS_DATA.map(s => (
          <div className={`stat-card stat-${s.color}`} key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-body">
              <span className="stat-value">{s.value}</span>
              <span className="stat-name">{s.label}</span>
              <span className="stat-delta">{s.delta}</span>
            </div>
          </div>
        ))}
      </div>
 
      {/* Section Navigation */}
      <div className="mobile-nav" style={{flexWrap:'wrap',gap:6,marginBottom:20}}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            style={{
              padding:'8px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:'0.85rem', fontWeight:500,
              background: activeSection === s.key ? 'var(--accent)' : 'var(--surface)',
              color: activeSection === s.key ? '#fff' : 'var(--text-secondary)',
              transition:'all 0.15s'
            }}
          >{s.label}</button>
        ))}
      </div>
 
      {/* TASKS */}
      {activeSection === 'tasks' && (
        <div className="dashboard-grid">
          <section className="card dash-tasks">
            <div className="section-header">
              <span className="section-title">Upcoming Tasks</span>
              <div className="filter-pills">
                {['all','pending','done'].map(f => (
                  <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
                ))}
              </div>
            </div>
            <ul className="task-list">
              {filtered.length === 0 && <li style={{padding:'20px 16px',color:'var(--text-muted)',textAlign:'center'}}>No tasks found. <a href="/tasks" style={{color:'var(--accent)'}}>Create one →</a></li>}
              {filtered.map(t => (
                <li key={t._id} className={`task-item ${t.status === 'done' ? 'done' : ''}`}>
                  <button className="task-check" onClick={() => toggleTask(t._id)}>
                    {t.status === 'done' ? '✓' : ''}
                  </button>
                  <div className="task-info">
                    <span className="task-title">{t.title}</span>
                    <div className="task-meta">
                      <span>{t.course_id?.course_name || 'No course'}</span>
                      <span>📅 {new Date(t.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
 
      {/* EXAMS */}
      {activeSection === 'exams' && (
        <section className="card">
          <div className="section-header" style={{marginBottom:16}}>
            <span className="section-title">Upcoming Exams</span>
          </div>
          {exams.length === 0 && <p style={{color:'var(--text-muted)',textAlign:'center',padding:'20px 0'}}>No exams scheduled. <a href="/exams" style={{color:'var(--accent)'}}>Add one →</a></p>}
          {exams.map(e => (
            <div key={e._id} style={{padding:'12px 0',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:4,height:40,borderRadius:4,background:e.course_id?.color||'#6c63ff',flexShrink:0}} />
              <div>
                <strong style={{fontSize:'0.95rem'}}>{e.title}</strong>
                <div style={{fontSize:'0.82rem',color:'var(--text-muted)',marginTop:2}}>
                  {e.course_id?.course_name} · 📅 {new Date(e.date).toLocaleDateString()}
                  {e.time && ` at ${e.time}`} {e.location && `· 📍 ${e.location}`}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
 
      {/* TYPE 2 API: Wikipedia Dynamic Search */}
      {activeSection === 'wiki' && (
        <section className="card">
          <div className="section-header" style={{marginBottom:16}}>
            <div>
              <span className="section-title">📖 Academic Topic Search</span>
              <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:2}}></div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <input
              placeholder="Search any academic topic (e.g. Photosynthesis, Calculus, Roman Empire)…"
              value={wikiTopic}
              onChange={e => setWikiTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchWiki()}
              style={{flex:1}}
            />
            <button className="btn btn-primary" onClick={searchWiki} disabled={wikiLoading} style={{whiteSpace:'nowrap'}}>
              {wikiLoading ? 'Searching…' : '🔍 Search'}
            </button>
          </div>
          {wikiError && <div style={{color:'#fb7185',marginBottom:12,padding:'8px 12px',background:'#fb718520',borderRadius:8}}>{wikiError}</div>}
          {wikiResult && (
            <div style={{background:'var(--surface)',borderRadius:12,padding:20,border:'1px solid var(--border)'}}>
              <div style={{display:'flex',gap:16,alignItems:'flex-start'}}>
                {wikiResult.thumbnail && (
                  <img src={wikiResult.thumbnail} alt={wikiResult.title} style={{width:80,height:80,objectFit:'cover',borderRadius:8,flexShrink:0}} />
                )}
                <div style={{flex:1}}>
                  <h3 style={{margin:'0 0 8px',fontSize:'1.1rem'}}>{wikiResult.title}</h3>
                  <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',lineHeight:1.6,margin:'0 0 12px'}}>{wikiResult.extract?.slice(0, 400)}{wikiResult.extract?.length > 400 ? '…' : ''}</p>
                  {wikiResult.url && (
                    <a href={wikiResult.url} target="_blank" rel="noopener noreferrer" style={{color:'var(--accent)',fontSize:'0.82rem',textDecoration:'none'}}>
                      📎 Read full article on Wikipedia →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          {!wikiResult && !wikiError && !wikiLoading && (
            <div style={{textAlign:'center',padding:'30px 0',color:'var(--text-muted)',fontSize:'0.9rem'}}>
              <div style={{fontSize:'2rem',marginBottom:8}}>🔍</div>
              Search any academic topic to get a Wikipedia summary instantly.
            </div>
          )}
        </section>
      )}
 
      {/* TYPE 3 API: Books DB */}
      {activeSection === 'books' && (
        <section className="card">
          <div className="section-header" style={{marginBottom:16}}>
            <div>
              <span className="section-title">📚 Study Book Finder</span>
              <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:2}}></div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:20}}>
            <input
              placeholder="Search study books (e.g. algorithms, linear algebra, biology)…"
              value={bookQuery}
              onChange={e => setBookQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchBooks()}
              style={{flex:1}}
            />
            <button className="btn btn-primary" onClick={searchBooks} disabled={bookLoading} style={{whiteSpace:'nowrap'}}>
              {bookLoading ? 'Searching…' : '📥 Search & Save'}
            </button>
          </div>
          {bookError && <div style={{color:'#fb7185',marginBottom:12}}>{bookError}</div>}
          {books.length > 0 && (
            <div style={{marginBottom:24}}>
              <h3 style={{marginBottom:10,fontSize:'0.95rem',color:'var(--text-secondary)'}}>Search Results — Saved to DB ({books.length})</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10}}>
                {books.map((b, i) => (
                  <div key={i} style={{padding:'12px 14px',background:'var(--surface)',borderRadius:10,border:'1px solid var(--border)'}}>
                    <div style={{fontWeight:600,fontSize:'0.9rem',marginBottom:2}}>{b.title}</div>
                    <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{b.author}{b.year ? ` (${b.year})` : ''}</div>
                    {b.subject && <div style={{fontSize:'0.75rem',color:'var(--accent)',marginTop:4}}>{b.subject}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <h3 style={{fontSize:'0.95rem',color:'var(--text-secondary)',margin:0}}>Library from Database ({savedBooks.length})</h3>
              <input
                placeholder="Filter saved books…"
                value={bookSearch}
                onChange={e => { setBookSearch(e.target.value); fetchSavedBooks(e.target.value); }}
                style={{flex:1,maxWidth:220,fontSize:'0.82rem',padding:'6px 10px'}}
              />
            </div>
            {savedBooks.length === 0
              ? <p style={{color:'var(--text-muted)',fontSize:'0.88rem'}}>No books saved yet. Use the search above to find and save books.</p>
              : <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {savedBooks.map((b, i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--surface)',borderRadius:8}}>
                      <span style={{fontSize:'0.88rem',flex:1}}><strong>{b.title}</strong> — {b.author}{b.year ? ` (${b.year})` : ''}</span>
                      <button onClick={() => removeBook(b._id)} style={{background:'none',border:'none',cursor:'pointer',color:'#fb7185',fontSize:'0.8rem',padding:'2px 6px',borderRadius:4,flexShrink:0}}>✕</button>
                    </div>
                  ))}
                </div>
            }
          </div>
        </section>
      )}
 
      {/* ADMIN PANEL */}
      {activeSection === 'admin' && isAdmin && (
        <section className="card">
          <div className="section-header" style={{marginBottom:20}}>
            <span className="section-title">🛡 Admin Panel</span>
            <a href="/admin" style={{fontSize:'0.82rem',color:'var(--accent)'}}>Full admin view →</a>
          </div>
          {adminStats && (
            <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap'}}>
              {[['Total Users', adminStats.total, '#6c63ff'],['Pages', adminStats.pages, '#2dd4bf']].map(([l,v,c]) => (
                <div key={l} style={{flex:1,minWidth:120,padding:'16px',background:'var(--surface)',borderRadius:10,borderLeft:`3px solid ${c}`}}>
                  <div style={{fontSize:'1.6rem',fontWeight:700,color:c}}>{v}</div>
                  <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{l}</div>
                </div>
              ))}
            </div>
          )}
          <h3 style={{fontSize:'0.9rem',color:'var(--text-secondary)',marginBottom:10}}>Recent Users</h3>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {adminUsers.map(u => (
              <div key={u._id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'var(--surface)',borderRadius:10,border:'1px solid var(--border)'}}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'var(--accent)22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.85rem',fontWeight:700,color:'var(--accent)',flexShrink:0}}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:'0.88rem'}}>{u.name}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{u.email}</div>
                </div>
                <span style={{fontSize:'0.72rem',padding:'3px 8px',borderRadius:20,background:u.role==='admin'?'#6c63ff22':'#2dd4bf22',color:u.role==='admin'?'#6c63ff':'#2dd4bf',fontWeight:600}}>{u.role}</span>
                <span style={{fontSize:'0.72rem',padding:'3px 8px',borderRadius:20,background:u.isActive?'#4ade8022':'#fb718522',color:u.isActive?'#4ade80':'#fb7185'}}>{u.isActive?'Active':'Inactive'}</span>
                {u.isActive && (
                  <button onClick={() => deactivateUser(u._id)} style={{background:'none',border:'1px solid #fb718566',color:'#fb7185',cursor:'pointer',padding:'3px 10px',borderRadius:6,fontSize:'0.75rem'}}>
                    Deactivate
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
 
      <footer style={{marginTop:30,textAlign:'center',color:'var(--text-muted)',fontSize:'0.8rem',padding:'16px 0'}}>
        © 2026 StudyPlanner — Your academic companion
      </footer>
    </div>
  );
}