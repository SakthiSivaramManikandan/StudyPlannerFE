import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
 
import './styles/App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CalendarPage from './components/CalendarPage';
import Courses from './components/Courses';
import Tasks from './components/Tasks';
import Exams from './components/Exams';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';
import OAuthCallback from './components/OAuthCallback';
 
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
 
  useEffect(() => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }, []);
 
  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };
 
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };
 
  if (window.location.pathname === '/oauth/callback') {
    return <OAuthCallback onLogin={handleLogin} />;
  }
 
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }
 
  const isAdmin = currentUser?.role === 'admin';
 
  // Derive currentPage from pathname
  const path = window.location.pathname.replace('/', '') || 'dashboard';
  const currentPage = path.split('/')[0] || 'dashboard';
 
  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
      <div className="main-area">
        <Navbar
          toggleSidebar={() => setSidebarOpen(prev => !prev)}
          user={currentUser}
          currentPage={currentPage}
          onSearch={setSearchQuery}
        />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard searchQuery={searchQuery} />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/courses" element={<Courses searchQuery={searchQuery} />} />
            <Route path="/tasks" element={<Tasks searchQuery={searchQuery} />} />
            <Route path="/exams" element={<Exams searchQuery={searchQuery} />} />
            <Route path="/profile" element={<Profile onUserUpdate={setCurrentUser} />} />
            {isAdmin && <Route path="/admin" element={<AdminPanel />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
 
export default App;