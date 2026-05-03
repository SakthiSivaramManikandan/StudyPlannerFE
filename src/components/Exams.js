import React, { useState, useEffect } from 'react';
import api from '../api/axios';

function ExamModal({ exam, courses, onSave, onClose }) {
  const [form, setForm] = useState(exam
    ? { title: exam.title, course_id: exam.course_id?._id || exam.course_id || '', date: exam.date ? exam.date.slice(0,10) : '', time: exam.time || '', location: exam.location || '', notes: exam.notes || '' }
    : { title:'', course_id:'', date:'', time:'', location:'', notes:'' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const handleSave = async () => {
    if (!form.title || !form.course_id || !form.date) { setError('Title, course, and date are required'); return; }
    setLoading(true);
    setError('');
    try { await onSave(form); }
    catch (err) { setError(err.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <h2 className="modal-title">{exam ? '✏️ Edit Exam' : '➕ New Exam'}</h2>
        <div className="form-group">
          <label>Exam Title</label>
          <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Midterm Exam" />
        </div>
        <div className="form-group">
          <label>Course</label>
          <select value={form.course_id} onChange={e=>set('course_id',e.target.value)}>
            <option value="">Select a course…</option>
            {courses.map(c=><option key={c._id} value={c._id}>{c.course_name}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={e=>set('date',e.target.value)} />
          </div>
          <div className="form-group">
            <label>Time (HH:MM)</label>
            <input placeholder="09:00" value={form.time} onChange={e=>set('time',e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Location</label>
          <input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="Room A-204" />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Optional notes…" style={{resize:'vertical'}} />
        </div>
        {error && <div style={{color:'#fb7185',fontSize:'0.85rem',marginBottom:8}}>{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : exam ? 'Save' : 'Add Exam'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Exams({ searchQuery = '' }) {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(null);
  const [delId, setDelId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchExams(); fetchCourses(); }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/exams');
      setExams(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.data || []);
    } catch (err) {}
  };

  const save = async (formData) => {
    if (modal && modal._id) {
      const { data } = await api.put(`/exams/${modal._id}`, formData);
      setExams(es => es.map(e => e._id === modal._id ? data.data : e));
    } else {
      const { data } = await api.post('/exams', formData);
      setExams(es => [data.data, ...es]);
    }
    setModal(null);
  };

  const del = async (id) => {
    try {
      await api.delete(`/exams/${id}`);
      setExams(es => es.filter(e => e._id !== id));
      setDelId(null);
    } catch (err) { console.error(err); }
  };

  const q = searchQuery.toLowerCase();
  const displayExams = q
    ? exams.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.course_id?.course_name?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q)
      )
    : exams;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Exams</h1>
          <p className="page-subtitle">{exams.length} exams scheduled</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Exam</button>
      </div>

      {loading ? (
        <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading…</div>
      ) : displayExams.length === 0 ? (
        <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>{q ? `No exams match "${searchQuery}"` : 'No exams scheduled. Add your first exam!'}</div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {displayExams.map(e => (
            <div key={e._id} className="card" style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:16}}>
              <div style={{width:4,height:48,borderRadius:4,background:e.course_id?.color||'#6c63ff',flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:'1rem'}}>{e.title}</div>
                <div style={{color:'var(--text-muted)',fontSize:'0.85rem',marginTop:2}}>
                  {e.course_id?.course_name || 'Unknown Course'} · 📅 {new Date(e.date).toLocaleDateString()}
                  {e.time && ` at ${e.time}`}
                  {e.location && ` · 📍 ${e.location}`}
                </div>
                {e.notes && <div style={{color:'var(--text-secondary)',fontSize:'0.82rem',marginTop:4}}>{e.notes}</div>}
              </div>
              <div style={{display:'flex',gap:8,flexShrink:0}}>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(e)}>✏️</button>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDelId(e._id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ExamModal exam={modal==='add'?null:modal} courses={courses} onSave={save} onClose={() => setModal(null)} />
      )}

      {delId && (
        <div className="modal-backdrop" onClick={() => setDelId(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <h2 className="modal-title">🗑 Delete Exam</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize:'0.9rem' }}>Are you sure you want to delete this exam?</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDelId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => del(delId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
