import { useState, useEffect } from 'react';
import { MdSearch } from 'react-icons/md';
import { C, BIZ_META, STATUS_META, Avatar } from './constants.jsx';
import UserDetailPanel from './UserDetailPanel';

export default function UsersTab({ filtered, search, setSearch, statusFilter, setStatusFilter, selected, selectUser, payments, payAmount, setPayAmount, payNote, setPayNote, payCurrency, setPayCurrency, months, setMonths, activate, suspend, recordPayment, busy, setSelected, deleteUser, confirmDelete, setConfirmDelete }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected && !isMobile ? '1fr 360px' : '1fr', gap: 18, alignItems: 'start' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e8ecf0', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', background: '#fafbfc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e8ecf0', borderRadius: 6, padding: '7px 12px', flex: 1, minWidth: 160 }}>
            <MdSearch style={{ color: '#9aa5b4', fontSize: 16 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontFamily: 'inherit', color: '#1a1d23', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'active', 'pending', 'suspended'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '6px 12px', borderRadius: 6,
                border: `1px solid ${statusFilter === s ? '#f97316' : '#e8ecf0'}`,
                background: statusFilter === s ? '#fff7ed' : 'white',
                color: statusFilter === s ? '#f97316' : '#4a5568',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>
        </div>

        {isMobile ? (
          <div style={{ display:'flex', flexDirection:'column' }}>
            {filtered.length === 0 && <div style={{ padding:32, textAlign:'center', color:C.textSoft, fontSize:13 }}>No users found</div>}
            {filtered.map(u => {
              const sm = STATUS_META[u.status] || STATUS_META.pending;
              const bm = BIZ_META[u.business_type];
              const BIcon = bm?.icon;
              const isActive = selected?.id === u.id;
              return (
                <div key={u.id} onClick={() => selectUser(u)} style={{ padding:'13px 16px', borderBottom:`1px solid rgba(255,255,255,0.06)`, display:'flex', alignItems:'center', gap:12, background: isActive ? 'rgba(168,85,247,0.12)' : 'transparent', borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent', cursor:'pointer' }}>
                  <Avatar name={u.name} size={38} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:C.text }}>{u.name}</div>
                    <div style={{ fontSize:11, color:C.textSoft, marginBottom:5 }}>{u.email}</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                      {BIcon && <BIcon style={{ fontSize:11, color:bm.color }} />}
                      <span style={{ fontSize:11, color:C.textMid }}>{u.business_name || bm?.label}</span>
                      <span style={{ fontSize:10.5, fontWeight:700, color:sm.color, background:sm.bg, border:`1px solid ${sm.border}`, padding:'1px 7px', borderRadius:20 }}>{sm.label}</span>
                      <span style={{ fontSize:10.5, fontWeight:700, color:u.plan==='lifetime'?C.accent:C.blue, background:u.plan==='lifetime'?C.accentSoft:C.blueSoft, padding:'1px 7px', borderRadius:20, textTransform:'capitalize' }}>{u.plan}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafbfc' }}>
                  {['User', 'Business', 'Plan', 'Status', 'Expires'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#9aa5b4', textTransform: 'uppercase', letterSpacing: '0.7px', borderBottom: '1px solid #f0f2f5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9aa5b4', fontSize: 13 }}>No users found</td></tr>}
                {filtered.map(u => {
                  const sm = STATUS_META[u.status] || STATUS_META.pending;
                  const bm = BIZ_META[u.business_type];
                  const BIcon = bm?.icon;
                  const isActive = selected?.id === u.id;
                  return (
                    <tr key={u.id} onClick={() => selectUser(u)} style={{ cursor: 'pointer', background: isActive ? '#fff7ed' : 'white', transition: 'background 0.1s', borderLeft: isActive ? '3px solid #f97316' : '3px solid transparent' }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fafbfc'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'white'; }}
                    >
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={u.name} size={32} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: C.textSoft }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {BIcon && <BIcon style={{ fontSize: 12, color: bm.color }} />}
                          <span style={{ fontSize: 12.5, color: C.textMid }}>{u.business_name || bm?.label || u.business_type}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: u.plan === 'lifetime' ? C.accent : C.blue, background: u.plan === 'lifetime' ? C.accentSoft : C.blueSoft, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>{u.plan}</span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: sm.color, background: sm.bg, border: `1px solid ${sm.border}`, padding: '3px 9px', borderRadius: 20 }}>{sm.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textMid }}>
                        {u.expires_at ? new Date(u.expires_at).toLocaleDateString('en-PK') : u.plan === 'lifetime' ? '∞' : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        isMobile ? (
          <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end' }}
            onClick={e => { if(e.target===e.currentTarget) setSelected(null); }}>
            <div style={{ width:'100%', maxHeight:'90vh', overflowY:'auto', borderRadius:'12px 12px 0 0', background:'white', border:'1px solid #e8ecf0' }}>
              <UserDetailPanel selected={selected} payments={payments} payAmount={payAmount} setPayAmount={setPayAmount} payNote={payNote} setPayNote={setPayNote} payCurrency={payCurrency} setPayCurrency={setPayCurrency} months={months} setMonths={setMonths} activate={activate} suspend={suspend} recordPayment={recordPayment} busy={busy} setSelected={setSelected} deleteUser={deleteUser} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} />
            </div>
          </div>
        ) : (
          <UserDetailPanel selected={selected} payments={payments} payAmount={payAmount} setPayAmount={setPayAmount} payNote={payNote} setPayNote={setPayNote} payCurrency={payCurrency} setPayCurrency={setPayCurrency} months={months} setMonths={setMonths} activate={activate} suspend={suspend} recordPayment={recordPayment} busy={busy} setSelected={setSelected} deleteUser={deleteUser} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} />
        )
      )}
    </div>
  );
}
