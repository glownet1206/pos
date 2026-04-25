import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import SpareParts from './pages/SpareParts';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import { authAPI, adminAPI } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    const calls = [authAPI.me()];
    if (isAdminRoute) calls.push(adminAPI.me());

    Promise.allSettled(calls).then(([userRes, adminRes]) => {
      if (userRes.status === 'fulfilled') setUser(userRes.value.data);
      if (adminRes?.status === 'fulfilled') setAdmin(adminRes.value.data);
    }).finally(() => setChecking(false));
  }, []);

  const handleAdminLogout = async () => {
    try { await adminAPI.logout(); } catch (_) {}
    setAdmin(null);
  };

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch (_) {}
    setUser(null);
  };

  if (checking) return <Spinner />;

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 1800, style: { background: '#1e2235', color: '#e8eaf6', border: '1px solid #2d3250', fontSize: 13 } }}
        containerStyle={{ top: 68, right: 12 }}
        gutter={6}
      />
      <Routes>

        <Route path="/admin/*" element={
          !admin
            ? <AdminLogin onLogin={setAdmin} />
            : <AdminPanel admin={admin} onLogout={handleAdminLogout} />
        } />
        <Route path="/*" element={
          !user
            ? <Login onLogin={setUser} />
            : <UserLayout user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} onUpdate={setUser} />
        } />
      </Routes>
    </BrowserRouter>
  );
}

function UserLayout({ user, sidebarOpen, setSidebarOpen, onLogout, onUpdate }) {
  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} onLogout={onLogout} />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={user} />
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/sales" element={<Sales user={user} />} />
          <Route path="/inventory" element={<Inventory user={user} />} />
          <Route path="/spare-parts" element={<SpareParts user={user} />} />
          <Route path="/suppliers" element={<Suppliers user={user} />} />
          <Route path="/reports" element={<Reports user={user} />} />
          <Route path="/settings" element={<Settings user={user} />} />
          <Route path="/profile" element={<Profile user={user} onUpdate={onUpdate} onLogout={onLogout} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #fed7aa', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );
}
