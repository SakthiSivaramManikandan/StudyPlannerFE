import React, { useState, useEffect } from 'react';
import '../styles/CalenderPage.css';
import api from '../api/axios';
 
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
 
function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDay(year, month) { return new Date(year, month, 1).getDay(); }
function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
 
// Modal for adding/editing calendar events
function EventModal({ date, event, courses, onSave, onClose }) {
  const [form, setForm] = useState(event
    ? { title: event.title, type: event.type, course_id: event.course_id?._id || event.course_id || '', deadline: event.deadline ? event.deadline.slice(0,10) : date, description: event.description || '' }
    : { title: '', type: 'task', course_id: '', deadline: date, description: '' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
 
  const handleSave = async () => {
    if (!form.title || !form.deadline) { setError('Title and date are required'); return; }
    setLoading(true); setError('');
    try {
      await onSave({ ...form, course_id: form.course_id || null });
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to save');
    } finally { setLoading(false); }
  };
 
  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:460}}>
        <h2 className="modal-title">{event ? '✏️ Edit Event' : '➕ Add Event'} — {date}</h2>
        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Event title…" autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e=>set('type',e.target.value)}>
              <option value="task">Task</option>
              <option value="assignment">Assignment</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
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
          <textarea rows={2} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Optional notes…" style={{resize:'vertical'}} />
        </div>
        {error && <div style={{color:'#fb7185',fontSize:'0.85rem',marginBottom:8}}>{error}</div>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : event ? 'Save Changes' : 'Add Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
 
export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('month');
  const [events, setEvents] = useState({}); // keyed by YYYY-MM-DD
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(null); // null | { date, event? }
  const [loading, setLoading] = useState(true);
 
  useEffect(() => { fetchAllEvents(); fetchCourses(); }, []);
 
  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const [tasksRes, examsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/exams')
      ]);
      const evMap = {};
      const addEvent = (key, ev) => { if (!evMap[key]) evMap[key] = []; evMap[key].push(ev); };
 
      (tasksRes.data.data || []).forEach(t => {
        const k = t.deadline ? toKey(new Date(t.deadline)) : null;
        if (k) addEvent(k, {
          _id: t._id, label: t.title, color: t.type === 'assignment' ? '#6c63ff' : '#4ade80',
          type: t.type || 'task', source: 'task',
          title: t.title, deadline: t.deadline, course_id: t.course_id, description: t.description
        });
      });
      (examsRes.data.data || []).forEach(e => {
        const k = e.date ? toKey(new Date(e.date)) : null;
        if (k) addEvent(k, { _id: e._id, label: e.title, color: '#fb7185', type: 'exam', source: 'exam', title: e.title });
      });
      setEvents(evMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
 
  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data.data || []);
    } catch (err) {}
  };
 
  const handleAddEvent = async (formData) => {
    // Creates a task via the Tasks API
    await api.post('/tasks', {
      title: formData.title,
      type: formData.type,
      deadline: formData.deadline,
      course_id: formData.course_id || null,
      description: formData.description
    });
    fetchAllEvents(); // refresh the calendar
    setModal(null);
  };
 
  const handleDeleteEvent = async (ev) => {
    if (ev.source === 'task') {
      await api.delete(`/tasks/${ev._id}`);
    }
    // exams not deletable from calendar (use Exams page)
    fetchAllEvents();
  };
 
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m=>m-1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m=>m+1); };
  const fmt = d => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isToday = d => d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
 
  const selectedKey = selected ? fmt(selected) : null;
  const selectedEvents = selectedKey ? (events[selectedKey] || []) : [];
 
  // Week view
  const startOfWeek = new Date(year, month, (selected || now.getDate()) - new Date(year, month, selected || now.getDate()).getDay());
  const weekDays = Array.from({length:7}, (_,i) => { const d = new Date(startOfWeek); d.setDate(d.getDate()+i); return d; });
  const weekHours = Array.from({length:12},(_,i)=>i+8);
 
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Your schedule at a glance{loading ? ' (loading…)' : ''}</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-primary" onClick={() => setModal({ date: fmt(selected || now.getDate()) })}>
            + Add Task
          </button>
          <div className="view-toggle">
            <button className={`view-btn ${viewMode==='month'?'active':''}`} onClick={()=>setViewMode('month')}>Month</button>
            <button className={`view-btn ${viewMode==='week'?'active':''}`} onClick={()=>setViewMode('week')}>Week</button>
          </div>
        </div>
      </div>
 
      <div className="cal-layout">
        <div className="card cal-main" style={{padding:0,overflow:'hidden'}}>
          <div className="cal-header">
            <button className="btn btn-ghost btn-icon cal-nav" onClick={prev}>‹</button>
            <h2 className="cal-month-label">{MONTHS[month]} {year}</h2>
            <button className="btn btn-ghost btn-icon cal-nav" onClick={next}>›</button>
          </div>
 
          {viewMode === 'month' ? (
            <>
              <div className="cal-day-labels">
                {DAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
              </div>
              <div className="cal-grid">
                {Array.from({length: firstDay}).map((_,i) => <div key={`e-${i}`} className="cal-cell empty" />)}
                {Array.from({length: daysInMonth}).map((_,i) => {
                  const day = i + 1;
                  const key = fmt(day);
                  const dayEvents = events[key] || [];
                  const isSel = selected === day;
                  return (
                    <div
                      key={day}
                      className={`cal-cell ${isToday(day)?'today':''} ${isSel?'selected':''} ${dayEvents.length?'has-events':''}`}
                      onClick={() => setSelected(isSel ? null : day)}
                    >
                      <span className="cal-day-num">{day}</span>
                      <div className="cal-event-dots">
                        {dayEvents.slice(0,3).map((e,ei) => (
                          <span key={ei} className="cal-dot" style={{background:e.color}} title={e.label} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="week-view">
              <div className="week-header">
                <div className="week-time-col" />
                {weekDays.map((d,i) => (
                  <div key={i} className={`week-day-header ${toKey(d)===toKey(now)?'week-today':''}`}>
                    <span className="week-day-name">{DAYS[d.getDay()]}</span>
                    <span className="week-day-num">{d.getDate()}</span>
                  </div>
                ))}
              </div>
              <div className="week-body">
                {weekHours.map(h => (
                  <div key={h} className="week-row">
                    <div className="week-time">{h}:00</div>
                    {weekDays.map((d,i) => {
                      const k = toKey(d);
                      const dayEvs = events[k] || [];
                      const ev = h === 9 ? dayEvs[0] : null;
                      return (
                        <div key={i} className="week-cell">
                          {ev && (
                            <div className="week-event" style={{background:ev.color+'22',borderLeft:`3px solid ${ev.color}`,color:ev.color}}>
                              {ev.label}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* Sidebar */}
        <div className="cal-sidebar">
          <div className="card" style={{marginBottom:16}}>
            <div className="section-title" style={{marginBottom:12}}>
              {selected ? `${MONTHS[month]} ${selected}, ${year}` : 'Select a Day'}
            </div>
            {selected ? (
              <>
                <button
                  className="btn btn-primary"
                  style={{width:'100%',marginBottom:12,fontSize:'0.85rem'}}
                  onClick={() => setModal({ date: fmt(selected) })}
                >+ Add Task on This Day</button>
                {selectedEvents.length ? (
                  <div className="cal-event-list">
                    {selectedEvents.map((e,i) => (
                      <div key={i} className="cal-event-item" style={{position:'relative'}}>
                        <div className="cal-event-line" style={{background:e.color}} />
                        <div style={{flex:1}}>
                          <p className="cal-event-label">{e.label}</p>
                          <span className={`badge badge-${e.type==='exam'?'rose':e.type==='assignment'?'amber':'teal'}`}>{e.type}</span>
                        </div>
                        {e.source === 'task' && (
                          <button onClick={() => handleDeleteEvent(e)} style={{background:'none',border:'none',color:'#fb7185',cursor:'pointer',padding:'2px 4px',fontSize:'0.75rem'}}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>No events on this day.</p>
                )}
              </>
            ) : (
              <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>Click a date to see events or add tasks.</p>
            )}
          </div>
 
          <div className="card">
            <div className="section-title" style={{marginBottom:14}}>Legend</div>
            {[['#6c63ff','Assignment'],['#fb7185','Exam'],['#4ade80','Task']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <span style={{width:12,height:12,borderRadius:3,background:c,flexShrink:0,display:'block'}} />
                <span style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>{l}</span>
              </div>
            ))}
            <div style={{marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)',fontSize:'0.75rem',color:'var(--text-muted)'}}>
              Events are loaded from your tasks & exams. Add tasks here or from the Tasks page.
            </div>
          </div>
        </div>
      </div>
 
      {modal && (
        <EventModal
          date={modal.date}
          event={modal.event}
          courses={courses}
          onSave={handleAddEvent}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
 