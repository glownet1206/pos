import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MdMenu, MdNotifications, MdTrendingUp,
  MdShoppingCart, MdInventory2,
  MdSpaceDashboard, MdReceiptLong, MdWarehouse,
  MdLocalShipping, MdInsertChart, MdTune,
  MdClose, MdDoneAll, MdWarning, MdError,
  MdInfo, MdCheckCircle, MdStorage
} from 'react-icons/md';
import GlobalSearch from './GlobalSearch';
import { salesAPI, reportsAPI } from '../api';
import { getConfig } from '../businessConfig';

const getRouteMeta = (cfg) => ({
  '/':          { label: 'Dashboard',                              sub: 'Overview & Analytics',    icon: MdSpaceDashboard },
  '/sales':     { label: cfg.salesLabel.split(' /')[0],            sub: 'New Transactions',        icon: MdReceiptLong },
  '/inventory': { label: cfg.inventoryLabel,                       sub: 'Stock Management',        icon: MdWarehouse },
  '/suppliers': { label: cfg.suppliersLabel,                       sub: 'Orders & Vendors',        icon: MdLocalShipping },
  '/reports':   { label: 'Reports',                                sub: 'Analytics & Insights',    icon: MdInsertChart },
  '/settings':  { label: 'Settings',                               sub: 'System Configuration',    icon: MdTune },
});

const STORAGE_KEY = 'tt_notifs_read';
const DISMISSED_KEY = 'tt_notifs_dismissed';

function getReadSet() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveReadSet(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
}
function getDismissedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveDismissedSet(s) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...s]));
}

const typeStyle = {
  danger:  { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  warning: { color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  info:    { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  success: { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
};

const typeIcon = {
  danger:  MdError,
  warning: MdWarning,
  info:    MdInfo,
  success: MdCheckCircle,
};

export default function Topbar({ onMenuClick, user }) {
  const [stats, setStats] = useState({ revenue: 0, totalSales: 0, pendingOrders: 0 });
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [read, setRead] = useState(getReadSet);
  const [dismissed, setDismissed] = useState(getDismissedSet);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 960);
  const location = useLocation();
  const bellRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 960);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const cfg = getConfig(user?.business_type);
  const routeMeta = getRouteMeta(cfg);
  const meta = routeMeta[location.pathname] || { label: 'Dashboard', sub: '', icon: MdSpaceDashboard };
  const PageIcon = meta.icon;

  useEffect(() => {
    salesAPI.getToday().then(r => setStats(r.data)).catch(() => {});
    reportsAPI.getNotifications().then(r => {
      const dis = getDismissedSet();
      setNotifs((r.data || []).filter(n => !dis.has(n.id)));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = showNotifs ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showNotifs]);
  useEffect(() => {
    function handler(e) {
      if (
        dropRef.current && !dropRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifs.filter(n => !read.has(n.id)).length;

  function markAllRead() {
    const s = new Set(notifs.map(n => n.id));
    setRead(s);
    saveReadSet(s);
  }

  function markOne(id) {
    const s = new Set(read);
    s.add(id);
    setRead(s);
    saveReadSet(s);
  }

  function dismissOne(e, id) {
    e.stopPropagation();
    const s = new Set(dismissed);
    s.add(id);
    setDismissed(s);
    saveDismissedSet(s);
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  function dismissAll() {
    const s = new Set(notifs.map(n => n.id));
    setDismissed(s);
    saveDismissedSet(s);
    setNotifs([]);
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button id="menu-btn" className="topbar-icon-btn" style={{ display: isMobile ? 'flex' : 'none' }} onClick={onMenuClick}>
          <MdMenu />
        </button>

        <div className="topbar-page-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && (
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'var(--orange-50)', border: '1.5px solid var(--orange-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PageIcon style={{ color: 'var(--orange)', fontSize: 20 }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 900, color: 'var(--gray-900)', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
              {meta.label}
            </div>
            {!isMobile && (
              <div style={{ fontSize: 11.5, color: 'var(--gray-400)', fontWeight: 500, marginTop: 1 }}>
                {meta.sub}
              </div>
            )}
          </div>
        </div>

        <div className="topbar-stat-group">
          <div className="topbar-stat-item">
            <MdTrendingUp style={{ color: 'var(--green)', fontSize: 16 }} />
            <span style={{ color: 'var(--gray-400)', fontWeight: 600, fontSize: 12 }}>Revenue</span>
            <span style={{ fontWeight: 900, color: 'var(--green)', fontSize: 13 }}>{localStorage.getItem('inv_currency')||'Rs.'}{(stats.revenue || 0).toFixed(2)}</span>
          </div>
          <div className="topbar-stat-divider" />
          <div className="topbar-stat-item">
            <MdShoppingCart style={{ color: 'var(--orange)', fontSize: 16 }} />
            <span style={{ color: 'var(--gray-400)', fontWeight: 600, fontSize: 12 }}>Sales</span>
            <span style={{ fontWeight: 900, color: 'var(--orange)', fontSize: 13 }}>{stats.totalSales || 0}</span>
          </div>
          <div className="topbar-stat-divider" />
          <div className="topbar-stat-item">
            <MdInventory2 style={{ color: 'var(--blue)', fontSize: 16 }} />
            <span style={{ color: 'var(--gray-400)', fontWeight: 600, fontSize: 12 }}>Pending</span>
            <span style={{ fontWeight: 900, color: 'var(--blue)', fontSize: 13 }}>{stats.pendingOrders || 0}</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <GlobalSearch />


        <div style={{ position: 'relative' }}>
          <button
            ref={bellRef}
            className="topbar-icon-btn"
            onClick={() => setShowNotifs(v => !v)}
            style={{ position: 'relative' }}
          >
            <MdNotifications />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 800,
                borderRadius: 99, minWidth: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', lineHeight: 1,
                border: '1.5px solid #fff',
                pointerEvents: 'none',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>


          {showNotifs && (
            <>

              <div
                onClick={() => setShowNotifs(false)}
                style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0,0,0,0.25)',
                  zIndex: 99998,
                }}
              />
            <div
              ref={dropRef}
              style={{
                position: 'fixed',
                top: isMobile ? 'var(--topbar-h)' : 'calc(var(--topbar-h) + 8px)',
                right: isMobile ? 8 : 12,
                left: isMobile ? 8 : 'auto',
                width: isMobile ? 'calc(100vw - 16px)' : 340,
                borderRadius: 14,
                maxHeight: 'calc(100vh - var(--topbar-h))',
                boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
                border: '1px solid var(--gray-100)',
                zIndex: 99999, overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                background: '#fff',
              }}
            >

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px 10px',
                borderBottom: '1px solid var(--gray-100)',
              }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--gray-900)' }}>
                  Notifications {unreadCount > 0 && (
                    <span style={{
                      background: '#ef4444', color: '#fff',
                      borderRadius: 99, fontSize: 10, fontWeight: 700,
                      padding: '1px 6px', marginLeft: 6,
                    }}>{unreadCount}</span>
                  )}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--orange)', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}
                    >
                      <MdDoneAll style={{ fontSize: 14 }} /> Mark all read
                    </button>
                  )}
                  {notifs.length > 0 && (
                    <button
                      onClick={dismissAll}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ef4444', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifs(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', alignItems: 'center' }}
                  >
                    <MdClose style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>


              <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                    No notifications
                  </div>
                ) : (
                  notifs.map(n => {
                    const isRead = read.has(n.id);
                    const ts = typeStyle[n.type] || typeStyle.info;
                    const Icon = typeIcon[n.type] || MdInfo;
                    return (
                      <div
                        key={n.id}
                        onClick={() => markOne(n.id)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '11px 16px',
                          background: isRead ? '#fff' : ts.bg,
                          borderBottom: '1px solid var(--gray-100)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          opacity: isRead ? 0.6 : 1,
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: ts.bg, border: `1.5px solid ${ts.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon style={{ color: ts.color, fontSize: 17 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: ts.color }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.msg}</div>
                        </div>
                        {!isRead && (
                          <div style={{ width: 7, height: 7, borderRadius: 99, background: ts.color, flexShrink: 0, marginTop: 4 }} />
                        )}
                        <button
                          onClick={e => dismissOne(e, n.id)}
                          title="Dismiss"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--gray-300)', fontSize: 15, flexShrink: 0,
                            display: 'flex', alignItems: 'center', padding: '0 2px',
                            borderRadius: 4, transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-300)'}
                        >
                          <MdClose />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
