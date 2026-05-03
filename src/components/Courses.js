import React, { useState, useEffect } from 'react';
import '../styles/Courses.css';
import api from '../api/axios';

const COLORS = ['#6c63ff','#2dd4bf','#f59e0b','#fb7185','#4ade80','#38bdf8','#e879f9','#f97316'];

function CourseModal({ course, onSave, onClose }) {
  const [form, setForm] = useState(course
    ? { course_name: course.course_name, instructor: course.instructor || '', semester: course.semester || '', color: course.color || COLORS[0] }
    : { course_name: '', instructor: '', semester: '', color: COLORS[0] }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleSave = async () => {
    if (!form.course_name) return;
    setLoading(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{course ? '✏️ Edit Course' : '➕ Add Course'}</h2>
        <div className="form-group">
          <label>Course Name</label>
          <input value={form.course_name} onChange={e => set('course_name', e.target.value)} placeholder="e.g. Linear Algebra" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Instructor</label>
            <input value={form.instructor} onChange={e => set('instructor', e.target.value)} placeholder="Prof. Name" />
          </div>
          <div className="form-group">
            <label>Semester</label>
            <input value={form.semester} onChange={e => set('semester', e.target.value)} placeholder="Spring 2026" />
          </div>
        </div>
        <div className="form-group">
          <label>Color</label>
          <div className="color-picker">
            {COLORS.map(c => (
              <button key={c} className={`color-swatch ${form.color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => set('color', c)} />
            ))}
          </div>
        </div>
        {error && <div style={{color:'#fb7185',fontSize:'0.85rem',marginBottom:8}}>{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : course ? 'Save Changes' : 'Add Course'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Courses({ searchQuery = '' }) {
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(null);
  const [delId, setDelId] = useState(null);
  const [search, setSearch] = useState('');

  // Sync navbar search into local search state
  React.useEffect(() => {
    setSearch(searchQuery);
    fetchCourses(searchQuery);
  }, [searchQuery]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/courses' + (q ? `?search=${encodeURIComponent(q)}` : ''));
      setCourses(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchCourses(val);
  };

  const save = async (formData) => {
    if (modal && modal._id) {
      const { data } = await api.put(`/courses/${modal._id}`, formData);
      setCourses(cs => cs.map(c => c._id === modal._id ? data.data : c));
    } else {
      const { data } = await api.post('/courses', formData);
      setCourses(cs => [data.data, ...cs]);
    }
    setModal(null);
  };

  const del = async (id) => {
    try {
      await api.delete(`/courses/${id}`);
      setCourses(cs => cs.filter(c => c._id !== id));
      setDelId(null);
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">{courses.length} courses this semester</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add Course</button>
      </div>

      <div style={{marginBottom:20}}>
        <input
          placeholder="🔍 Search courses…"
          value={search}
          onChange={handleSearch}
          style={{maxWidth:320, width:'100%'}}
        />
      </div>

      {loading ? (
        <div style={{textAlign:'center', padding:40, color:'var(--text-muted)'}}>Loading…</div>
      ) : courses.length === 0 ? (
        <div style={{textAlign:'center', padding:40, color:'var(--text-muted)'}}>No courses found. Add your first course!</div>
      ) : (
        <div className="courses-grid">
          {courses.map(c => (
            <div className="course-card card" key={c._id}>
              <div className="course-card-top" style={{ borderTopColor: c.color }}>
                <div className="course-icon" style={{ background: c.color + '22', color: c.color }}>🎓</div>
                <div className="course-actions">
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(c)}>✏️</button>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDelId(c._id)}>🗑</button>
                </div>
              </div>
              <h3 className="course-name">{c.course_name}</h3>
              {c.semester && <div className="course-code badge badge-muted">{c.semester}</div>}
              {c.instructor && <p className="course-instructor">👤 {c.instructor}</p>}
            </div>
          ))}
          <button className="course-add-btn" onClick={() => setModal('add')}>
            <span className="course-add-icon">+</span>
            <span>Add New Course</span>
          </button>
        </div>
      )}

      {modal && (
        <CourseModal
          course={modal === 'add' ? null : modal}
          onSave={save}
          onClose={() => setModal(null)}
        />
      )}

      {delId && (
        <div className="modal-backdrop" onClick={() => setDelId(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <h2 className="modal-title">🗑 Delete Course</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize:'0.9rem' }}>
              Are you sure? This will remove all associated tasks and exams.
            </p>
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
