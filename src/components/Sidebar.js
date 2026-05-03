import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const STUDENT_NAV = [
  { path: '/', icon: '⊞', label: 'Dashboard' },
  { path: '/calendar', icon: '📅', label: 'Calendar' },
  { path: '/courses', icon: '🎓', label: 'Courses' },
  { path: '/tasks', icon: '✅', label: 'Tasks' },
  { path: '/exams', icon: '📝', label: 'Exams' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const ADMIN_NAV = [
  { path: '/', icon: '⊞', label: 'Dashboard' },
  { path: '/calendar', icon: '📅', label: 'Calendar' },
  { path: '/courses', icon: '🎓', label: 'Courses' },
  { path: '/tasks', icon: '✅', label: 'Tasks' },
  { path: '/exams', icon: '📝', label: 'Exams' },
  { path: '/admin', icon: '🛡', label: 'Admin Panel' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar({ isOpen, onClose, onLogout, isAdmin }) {
  const location = useLocation();
  const NAV = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  useEffect(() => {
    if (onClose && window.innerWidth <= 768) onClose();
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen && window.innerWidth <= 768 ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">📚</span>
          StudyPlanner
          {isAdmin && <span style={{marginLeft:'auto',fontSize:'0.65rem',background:'var(--accent)',color:'#fff',padding:'2px 6px',borderRadius:20,fontWeight:700}}>ADMIN</span>}
          <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">✕</button>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {location.pathname === item.path && <span className="sidebar-active-bar" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={onLogout} className="sidebar-logout" aria-label="Logout">↩ Logout</button>
        </div>
      </aside>
    </>
  );
}
