import React, { useState, useEffect } from 'react';
import '../styles/Task.css';
import api from '../api/axios';

function TaskModal({ task, courses, onSave, onClose }) {
  const [form, setForm] = useState(task
    ? { title: task.title, type: task.type || 'task', course_id: task.course_id?._id || task.course_id || '', deadline: task.deadline ? task.deadline.slice(0,10) : '', description: task.description || '' }
    : { title:'', type:'task', course_id:'', deadline:'', description:'' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleSave = async () => {
    if (!form.title || !form.deadline) { setError('Title and deadline are required'); return; }
    setLoading(true);
    setError('');
    try {
      await onSave({ ...form, course_id: form.course_id || null });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <h2 className="modal-title">{task ? '✏️ Edit Task' : '➕ New Task'}</h2>
        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Task title…" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e=>set('type',e.target.value)}>
              <option value="task">Personal Task</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={form.deadline} onChange={e=>set('deadline',e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Course (optional)</label>
          <select value={form.course_id||''} onChange={e=>set('course_id',e.target.value||null)}>
            <option value="">— None —</option>
            {courses.map(c=><option key={c._id} value={c._id}>{c.course_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Optional notes…" style={{resize:'vertical'}} />
        </div>
        {error && <div style={{color:'#fb7185',fontSize:'0.85rem',marginBottom:8}}>{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : task ? 'Save' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks({ searchQuery = '' }) {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [view, setView] = useState('list');

  useEffect(() => { fetchTasks(); fetchCourses(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCourse !== 'all') params.set('course', filterCourse);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterType !== 'all') params.set('type', filterType);
      const { data } = await api.get('/tasks?' + params.toString());
      setTasks(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.data || []);
    } catch (err) {}
  };

  useEffect(() => { fetchTasks(); }, [filterCourse, filterStatus, filterType]);

  const save = async (formData) => {
    if (modal && modal._id) {
      const { data } = await api.put(`/tasks/${modal._id}`, formData);
      setTasks(ts => ts.map(t => t._id === modal._id ? data.data : t));
    } else {
      const { data } = await api.post('/tasks', formData);
      setTasks(ts => [data.data, ...ts]);
    }
    setModal(null);
  };

  const del = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(ts => ts.filter(t => t._id !== id));
    } catch (err) { console.error(err); }
  };

  const complete = async (id) => {
    try {
      const { data } = await api.patch(`/tasks/${id}/complete`);
      setTasks(ts => ts.map(t => t._id === id ? data.data : t));
    } catch (err) { console.error(err); }
  };

  const GROUPS = [
    { label:'📋 Assignment', key:'assignment' },
    { label:'✅ Personal Task', key:'task' },
  ];

  // Apply navbar search on top of API filters
  const q = searchQuery.toLowerCase();
  const displayTasks = q
    ? tasks.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.course_id?.course_name?.toLowerCase().includes(q)
      )
    : tasks;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{tasks.filter(t=>t.status!=='done').length} pending · {tasks.filter(t=>t.status==='done').length} completed</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <div className="view-toggle">
            <button className={`view-btn ${view==='list'?'active':''}`} onClick={()=>setView('list')}>☰ List</button>
            <button className={`view-btn ${view==='kanban'?'active':''}`} onClick={()=>setView('kanban')}>⊞ Kanban</button>
          </div>
          <button className="btn btn-primary" onClick={()=>setModal('add')}>+ New Task</button>
        </div>
      </div>

      <div className="tasks-filters card" style={{padding:'16px 20px',marginBottom:24,display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
          <span style={{fontSize:'0.8rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>Course:</span>
          <select value={filterCourse} onChange={e=>setFilterCourse(e.target.value)} style={{width:'auto',flex:1}}>
            <option value="all">All Courses</option>
            {courses.map(c=><option key={c._id} value={c._id}>{c.course_name}</option>)}
          </select>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Status:</span>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:'auto'}}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Type:</span>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{width:'auto'}}>
            <option value="all">All</option>
            <option value="assignment">Assignment</option>
            <option value="task">Task</option>
          </select>
        </div>
        <span style={{fontSize:'0.8rem',color:'var(--text-muted)',marginLeft:'auto'}}>{tasks.length} tasks</span>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading…</div>
      ) : view === 'list' ? (
        <div className="tasks-grouped">
          {displayTasks.length === 0 && <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>{q ? `No tasks match "${searchQuery}"` : 'No tasks found. Create your first task!'}</div>}
          {GROUPS.map(g => {
            const group = displayTasks.filter(t => t.type===g.key);
            if (!group.length) return null;
            return (
              <div key={g.key} className="tasks-group">
                <h3 className="tasks-group-title">{g.label} <span>({group.length})</span></h3>
                <div className="card" style={{padding:0,overflow:'hidden'}}>
                  {group.map((t,i) => (
                    <div key={t._id} className={`task-row ${t.status==='done'?'done':''} ${i>0?'bordered':''}`}>
                      <button className="task-check" onClick={()=>complete(t._id)}>
                        {t.status==='done' ? '✓' : ''}
                      </button>
                      <div className="task-row-content">
                        <div className="task-row-top">
                          <span className="task-title">{t.title}</span>
                          <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setModal(t)}>✏️</button>
                            <button className="btn btn-danger btn-icon btn-sm" onClick={()=>del(t._id)}>✕</button>
                          </div>
                        </div>
                        {t.description && <p className="task-desc">{t.description}</p>}
                        <div className="task-row-meta">
                          {t.course_id && <span className="badge badge-muted">{t.course_id.course_name || t.course_id}</span>}
                          <span className="badge badge-accent">{t.type}</span>
                          {t.deadline && <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>📅 {new Date(t.deadline).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="kanban-board">
          {['pending','done'].map(status => (
            <div key={status} className="kanban-col card" style={{padding:0,overflow:'hidden'}}>
              <div className="kanban-col-header">
                <span>{status==='pending'?'⏳ Pending':'✅ Done'}</span>
                <span className="kanban-count">{displayTasks.filter(t=>(t.status==='done')===(status==='done')).length}</span>
              </div>
              <div className="kanban-items">
                {displayTasks.filter(t=>(t.status==='done')===(status==='done')).map(t=>(
                  <div key={t._id} className="kanban-card">
                    <div className="kanban-card-top">
                      <span className="badge badge-accent">{t.type}</span>
                      <button className="btn btn-ghost btn-icon" style={{padding:4}} onClick={()=>complete(t._id)}>
                        {t.status==='done'?'↩':'✓'}
                      </button>
                    </div>
                    <p className="kanban-card-title">{t.title}</p>
                    {t.course_id && <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{t.course_id.course_name || ''}</span>}
                    {t.deadline && <span style={{fontSize:'0.73rem',color:'var(--text-muted)'}}>📅 {new Date(t.deadline).toLocaleDateString()}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <TaskModal
          task={modal==='add'?null:modal}
          courses={courses}
          onSave={save}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}
