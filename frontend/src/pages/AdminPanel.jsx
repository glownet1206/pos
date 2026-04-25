import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../api';
import toast from 'react-hot-toast';
import {
  MdDashboard, MdPeople, MdLogout, MdCheckCircle,
  MdSearch, MdClose, MdBlock, MdRefresh, MdMenu,
  MdTrendingUp, MdAttachMoney, MdPersonAdd, MdAccessTime,
  MdNotifications, MdPayment, MdBarChart, MdSettings,
  MdSupportAgent,
} from 'react-icons/md';
import { FaShieldAlt } from 'react-icons/fa';
import { RiUserStarLine } from 'react-icons/ri';

import { C } from '../components/admin/constants.jsx';
import SidebarUserMenu from '../components/admin/SidebarUserMenu';
import PaymentsTab from '../components/admin/PaymentsTab';
import ReportsTab from '../components/admin/ReportsTab';
import ExpiringTab from '../components/admin/ExpiringTab';
import SupportTab from '../components/admin/SupportTab';
import SettingsTab from '../components/admin/SettingsTab';
import DashboardTab from '../components/admin/DashboardTab';
import UsersTab from '../components/admin/UsersTab';

export default function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [payments, setPayments] = useState([]);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payCurrency, setPayCurrency] = useState('PKR');
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const bellRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const load = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [s, u] = await Promise.all([adminAPI.getStats(), adminAPI.getUsers()]);
      setStats(s.data);
      setUsers(u.data);
      setFiltered(u.data);
      const now = new Date();
      const built = [];
      u.data.forEach(user => {
        if (user.status === 'pending') built.push({ id: `p-${user.id}`, type: 'pending', msg: `${user.name} is awaiting activation`, time: user.created_at });
        if (user.status === 'active' && user.expires_at) {
          const days = Math.ceil((new Date(user.expires_at) - now) / 86400000);
          if (days <= 7 && days >= 0) built.push({ id: `e-${user.id}`, type: 'expiring', msg: `${user.name} expires in ${days}d`, time: user.expires_at });
        }
      });
      built.sort((a, b) => new Date(b.time) - new Date(a.time));
      setNotifs(built.slice(0, 20));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to load data');
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let list = users;
    if (statusFilter !== 'all') list = list.filter(u => u.status === statusFilter);
    if (search) list = list.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.business_name || '').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
  }, [search, statusFilter, users]);

  const selectUser = async (user) => {
    setSelected(user);
    setConfirmDelete(false);
    setSidebarOpen(false);
    try {
      const p = await adminAPI.getPayments(user.id);
      setPayments(p.data);
    } catch { setPayments([]); }
  };

  const refreshSelected = async () => {
    await load(true);
    if (selected) {
      try {
        const updated = (await adminAPI.getUsers()).data.find(u => u.id === selected.id);
        setSelected(updated || null);
      } catch { }
    }
  };

  const activate = async () => {
    setBusy(true);
    try {
      await adminAPI.activateUser(selected.id, { months: months === 0 ? 0 : parseInt(months) });
      toast.success('User activated');
      await refreshSelected();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    setBusy(false);
  };

  const suspend = async () => {
    setBusy(true);
    try {
      await adminAPI.suspendUser(selected.id);
      toast.success('User suspended');
      await refreshSelected();
    } catch { toast.error('Failed'); }
    setBusy(false);
  };

  const recordPayment = async () => {
    if (!payAmount) return;
    setBusy(true);
    try {
      await adminAPI.recordPayment(selected.id, { amount: parseFloat(payAmount), note: payNote, currency: payCurrency });
      toast.success('Payment recorded');
      setPayAmount(''); setPayNote(''); setPayCurrency('PKR');
      const p = await adminAPI.getPayments(selected.id);
      setPayments(p.data);
      load(true);
    } catch { toast.error('Failed'); }
    setBusy(false);
  };

  const deleteUser = async () => {
    setBusy(true);
    try {
      await adminAPI.deleteUser(selected.id);
      toast.success('User deleted');
      setSelected(null);
      setConfirmDelete(false);
      await load(true);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    setBusy(false);
  };

  const NAV = [
    { id: 'dashboard', icon: MdDashboard,   label: 'Dashboard' },
    { id: 'users',     icon: RiUserStarLine, label: 'Users',    badge: stats?.pending || 0 },
    { id: 'payments',  icon: MdPayment,      label: 'Payments' },
    { id: 'reports',   icon: MdBarChart,     label: 'Reports' },
    { id: 'expiring',  icon: MdAccessTime,   label: 'Expiring', badge: stats?.expiringSoon || 0 },
    { id: 'support',   icon: MdSupportAgent, label: 'Support' },
    { id: 'settings',  icon: MdSettings,     label: 'Settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#eef0f4', fontFamily: "'Inter','Segoe UI',sans-serif", color: '#111827' }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
      )}

      <aside style={{
        width: 240, background: '#ffffff', borderRight: '1px solid #d1d9e0',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50,
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }} className="admin-sidebar">

        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f0f2f5' }}>
          <img src="/admin-logo.png" alt="logo" style={{ width: '100%', height: 'auto', maxHeight: 52, objectFit: 'contain', display: 'block' }} />
        </div>

        <nav style={{ padding: '12px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa5b4', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '0 8px', marginBottom: 8 }}>Menu</div>
          {NAV.map(item => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: active ? '#fff7ed' : 'transparent',
                color: active ? '#f97316' : '#4a5568',
                fontSize: 13.5, fontWeight: active ? 700 : 500, marginBottom: 1,
                transition: 'all 0.12s', position: 'relative',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#1a1d23'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a5568'; }}}
              >
                {active && <div style={{ position:'absolute', left:0, top:'18%', bottom:'18%', width:3, borderRadius:'0 2px 2px 0', background:'#f97316' }} />}
                <div style={{ width:30, height:30, borderRadius:6, background: active ? '#fff7ed' : '#f4f6f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon style={{ fontSize:15, color: active ? '#f97316' : '#9aa5b4' }} />
                </div>
                <span style={{ flex:1, textAlign:'left' }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ background:'#f97316', color:'white', borderRadius:4, padding:'1px 7px', fontSize:10.5, fontWeight:800 }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <SidebarUserMenu onLogout={onLogout} />
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="admin-main">
        <header style={{
          height: 60, background: '#ffffff', borderBottom: '1px solid #d1d9e0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(true)} className="admin-hamburger" style={{
              width: 34, height: 34, borderRadius: 6, border: '1px solid #e8ecf0',
              background: '#f4f6f9', color: '#4a5568', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            }}>
              <MdMenu style={{ fontSize: 18 }} />
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1d23' }}>
                {tab === 'dashboard' ? 'Dashboard' : tab === 'users' ? 'User Management' : tab === 'payments' ? 'Payments' : tab === 'reports' ? 'Reports' : tab === 'expiring' ? 'Expiring Soon' : tab === 'support' ? 'Support' : 'Settings'}
              </div>
              <div style={{ fontSize: 11, color: '#9aa5b4', marginTop: 1 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifs(v => !v)} style={{
                width: 36, height: 36, borderRadius: 6, border: '1px solid #e8ecf0',
                background: showNotifs ? '#fff7ed' : '#f4f6f9', color: showNotifs ? '#f97316' : '#4a5568',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative',
              }}>
                <MdNotifications style={{ fontSize: 18 }} />
                {notifs.length > 0 && <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid white' }} />}
              </button>
              {showNotifs && (
                <div style={{ position: 'absolute', top: 44, right: 0, width: 300, background: 'white', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e8ecf0', zIndex: 200, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1d23' }}>Notifications</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {notifs.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, background: '#fff7ed', color: '#f97316', padding: '2px 8px', borderRadius: 4 }}>{notifs.length}</span>}
                      {notifs.length > 0 && <button onClick={() => setNotifs([])} style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: '#fef2f2', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>Clear</button>}
                    </div>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9aa5b4', fontSize: 13 }}>All caught up!</div>
                    ) : notifs.map(n => (
                      <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <div onClick={() => { setTab(n.type === 'pending' ? 'users' : 'expiring'); setShowNotifs(false); }}
                          style={{ display: 'flex', gap: 10, flex: 1, cursor: 'pointer' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: n.type === 'pending' ? '#fffbeb' : '#fef2f2' }}>
                            {n.type === 'pending' ? <MdAccessTime style={{ fontSize: 14, color: '#f59e0b' }} /> : <MdNotifications style={{ fontSize: 14, color: '#ef4444' }} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1a1d23' }}>{n.msg}</div>
                            <div style={{ fontSize: 10.5, color: '#9aa5b4', marginTop: 2 }}>{new Date(n.time).toLocaleDateString('en-PK')}</div>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setNotifs(prev => prev.filter(x => x.id !== n.id)); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aa5b4', fontSize: 14, display: 'flex', alignItems: 'center' }}
                        ><MdClose /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => load()} style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #e8ecf0', background: '#f4f6f9', color: '#4a5568', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <MdRefresh style={{ fontSize: 17, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', background: '#eef0f4' }}>
          {tab === 'dashboard' && <DashboardTab stats={stats} users={users} />}
          {tab === 'users' && (
            <UsersTab
              filtered={filtered} search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              selected={selected} selectUser={selectUser}
              payments={payments} payAmount={payAmount} setPayAmount={setPayAmount}
              payNote={payNote} setPayNote={setPayNote}
              payCurrency={payCurrency} setPayCurrency={setPayCurrency}
              months={months} setMonths={setMonths}
              activate={activate} suspend={suspend} recordPayment={recordPayment}
              busy={busy} setSelected={setSelected}
              deleteUser={deleteUser} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete}
            />
          )}
          {tab === 'payments' && <PaymentsTab />}
          {tab === 'reports'  && <ReportsTab stats={stats} users={users} />}
          {tab === 'expiring' && <ExpiringTab />}
          {tab === 'support'  && <SupportTab setTab={setTab} />}
          {tab === 'settings' && <SettingsTab />}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .admin-sidebar { transform: translateX(0) !important; position: sticky !important; top: 0 !important; height: 100vh !important; flex-shrink: 0 !important; }
          .admin-hamburger { display: none !important; }
        }
      `}</style>
    </div>
  );
}
