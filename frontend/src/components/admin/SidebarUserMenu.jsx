import { useState } from 'react';
import { MdLogout, MdExpandMore } from 'react-icons/md';
import { RiUserStarLine } from 'react-icons/ri';

export default function SidebarUserMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const handleLogout = () => { setConfirm(false); setOpen(false); onLogout(); };

  return (
    <div style={{ padding: '12px', borderTop: '1px solid #f0f2f5', position: 'relative' }}>
      <button onClick={() => { setOpen(v => !v); setConfirm(false); }} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px', borderRadius: 6, border: '1px solid #e8ecf0',
        cursor: 'pointer', background: open ? '#fff7ed' : '#f4f6f9',
        transition: 'all 0.12s', fontFamily: 'inherit',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <RiUserStarLine style={{ fontSize: 15, color: 'white' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d23', flex: 1, textAlign: 'left' }}>Admin</span>
        <MdExpandMore style={{ fontSize: 16, color: '#9aa5b4', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', bottom: '100%', left: 12, right: 12, marginBottom: 4, borderRadius: 6, overflow: 'hidden', border: '1px solid #e8ecf0', background: 'white', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)' }}>
          {!confirm ? (
            <button onClick={() => setConfirm(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', color: '#ef4444', fontSize: 13, fontWeight: 600, transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <MdLogout style={{ fontSize: 15 }} /> Sign Out
            </button>
          ) : (
            <div style={{ padding: '14px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1d23', marginBottom: 4, textAlign: 'center' }}>Sign out?</div>
              <div style={{ fontSize: 11.5, color: '#9aa5b4', textAlign: 'center', marginBottom: 12 }}>You will be logged out.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleLogout} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' }}>Logout</button>
                <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #e8ecf0', cursor: 'pointer', background: 'white', color: '#4a5568', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
