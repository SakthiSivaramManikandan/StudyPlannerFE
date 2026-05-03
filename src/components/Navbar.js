import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const PAGE_LABELS = {
  dashboard: 'Dashboard',
  calendar: 'Calendar',
  courses: 'Courses',
  tasks: 'Tasks',
};

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: 'Math assignment due in 2 days', type: 'warning', time: '2h ago' },
  { id: 2, text: 'Physics exam tomorrow at 10:00', type: 'danger', time: '4h ago' },
  { id: 3, text: 'New course material uploaded', type: 'info', time: '1d ago' },
];

function getInitials(nameOrEmail = '') {
  if (!nameOrEmail) return '?';
  const base = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Navbar({ currentPage, toggleSidebar, user: userProp, onSearch }) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const resolvedUser = (() => {
    if (userProp?.name || userProp?.email) return userProp;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name || parsed?.email) return parsed;
      }
      const email =
        localStorage.getItem('email') ||
        localStorage.getItem('userEmail') ||
        localStorage.getItem('user_email');
      if (email) return { email };
    } catch (_) {}
    return null;
  })();

  const initials = getInitials(resolvedUser?.name || resolvedUser?.email);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+K focuses the search input
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear search when page changes
  useEffect(() => {
    setSearchQuery('');
    onSearch?.('');
  }, [currentPage]);

  const clearAll = () => setNotifications([]);
  const dismissOne = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch?.(val);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      onSearch?.('');
      searchRef.current?.blur();
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="btn btn-ghost btn-icon navbar-menu-btn" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="navbar-breadcrumb">
          <span className="navbar-home">StudyPlanner</span>
          <span className="navbar-sep">›</span>
          <span className="navbar-current">{PAGE_LABELS[currentPage] || currentPage}</span>
        </div>
      </div>

      <div className="navbar-center">
        <div className="navbar-search">
          <span className="search-icon">🔍</span>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search tasks, courses, exams…"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
          <kbd>Ctrl K</kbd>
        </div>
      </div>

      <div className="navbar-right">
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className="btn btn-ghost btn-icon notif-btn"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            🔔
            {notifications.length > 0 && (
              <span className="notif-badge">{notifications.length}</span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="section-title">Notifications</span>
                {notifications.length > 0 && (
                  <button className="btn btn-sm btn-ghost" onClick={clearAll}>
                    Clear all
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="notif-empty">No new notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`notif-item notif-${n.type}`}>
                    <div className="notif-dot" />
                    <div className="notif-body">
                      <p className="notif-text">{n.text}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                    <button
                      className="notif-dismiss"
                      onClick={() => dismissOne(n.id)}
                      aria-label="Dismiss notification"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          className="navbar-avatar"
          onClick={() => navigate('/profile')}
          title="Go to profile"
          aria-label="Go to profile"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
