import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdClose, MdSpaceDashboard, MdReceiptLong,
  MdWarehouse, MdLocalShipping, MdInsertChart, MdTune, MdLogout, MdPerson, MdKeyboardArrowUp
} from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import { useState } from 'react';
import { getConfig } from '../businessConfig';

const getNav = (cfg) => [
  {
    section: 'Main',
    items: [
      { to: '/', icon: MdSpaceDashboard, label: 'Dashboard' },
      { to: '/sales', icon: MdReceiptLong, label: cfg.salesLabel },
    ]
  },
  {
    section: 'Manage',
    items: [
      { to: '/inventory', icon: MdWarehouse, label: cfg.inventoryLabel },
      ...(cfg.label === 'Tyre Shop' ? [{ to: '/spare-parts', icon: MdWarehouse, label: 'Spare Parts' }] : []),
      { to: '/suppliers', icon: MdLocalShipping, label: cfg.suppliersLabel },
      { to: '/reports', icon: MdInsertChart, label: 'Reports' },
    ]
  },
  {
    section: 'System',
    items: [
      { to: '/settings', icon: MdTune, label: 'Settings' },
    ]
  },
];

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
        width: '100%', maxWidth: 340, boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        border: '1px solid var(--gray-100)',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <MdLogout style={{ fontSize: 24, color: 'var(--red)' }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>Logout</div>
        <div style={{ fontSize: 13.5, color: 'var(--gray-500)', marginBottom: 24 }}>Are you sure you want to logout?</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--gray-200)',
            background: '#fff', color: 'var(--gray-700)', fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px', borderRadius: 10, border: 'none',
            background: 'var(--red)', color: '#fff', fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Logout</button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose, user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const cfg = getConfig(user?.business_type);
  const nav = getNav(cfg);
  const BizIcon = cfg.icon;
  const themeColor = cfg.color;

  const handleLogout = () => {
    setMenuOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <>
      {showLogoutModal && <LogoutModal onConfirm={confirmLogout} onCancel={() => setShowLogoutModal(false)} />}

      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.4)', zIndex: 99, backdropFilter: 'blur(2px)' }} />
      )}
      <aside className={`sidebar ${open ? 'open' : ''}`}>


        <div className="sidebar-logo">
          <div className="logo-row">
            <div className="logo-box" style={{ background: `linear-gradient(145deg, ${themeColor}, ${themeColor}cc)` }}>
              <BizIcon style={{ fontSize: 28, color: 'white' }} />
            </div>
            <div className="logo-text">
              <h1>{user?.business_name || cfg.label}</h1>
              <p>{cfg.label} · POS System</p>
            </div>
            <button id="sidebar-close" onClick={onClose}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 20, padding: 4, borderRadius: 6, display: open ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}>
              <MdClose />
            </button>
          </div>
        </div>


        <nav className="sidebar-nav">
          {nav.map(({ section, items }) => (
            <div className="nav-section" key={section}>
              <div className="nav-label">{section}</div>
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}>
                  <div className="nav-icon-wrap"><Icon /></div>
                  <span className="nav-item-label">{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>


        <div className="sidebar-bottom" style={{ position: 'relative' }}>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: 12, right: 12,
                background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 100,
              }}>
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); onClose(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--orange-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdPerson style={{ color: 'var(--orange)', fontSize: 17 }} />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--gray-800)' }}>Profile</span>
                </button>
                <div style={{ height: 1, background: 'var(--gray-100)', margin: '0 12px' }} />
                <button onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--red-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdLogout style={{ color: 'var(--red)', fontSize: 17 }} />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--red)' }}>Logout</span>
                </button>
              </div>
            </>
          )}

          <div className="sidebar-user" style={{ cursor: 'pointer' }} onClick={() => setMenuOpen(p => !p)}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(249,115,22,0.35)' }}>
              <FaUserCircle style={{ fontSize: 22, color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Admin'}</h4>
              <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'Administrator'}</p>
            </div>
            <MdKeyboardArrowUp style={{
              color: 'var(--gray-400)', fontSize: 20, flexShrink: 0,
              transition: 'transform 0.2s',
              transform: menuOpen ? 'rotate(0deg)' : 'rotate(180deg)',
            }} />
          </div>
        </div>
      </aside>
    </>
  );
}
