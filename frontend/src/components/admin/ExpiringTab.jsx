import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { MdSearch, MdAccessTime } from 'react-icons/md';
import { C, BIZ_META, Avatar } from './constants.jsx';

const gc = { background:'white', border:'1px solid #e8ecf0', borderRadius:8 };

export default function ExpiringTab() {
  const [expiring, setExpiring] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(0);
  const PER = 8;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => { const h = () => setIsMobile(window.innerWidth <= 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  useEffect(() => { adminAPI.getExpiring().then(r => { setExpiring(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const withDays = expiring.map(u => ({ ...u, days: Math.ceil((new Date(u.expires_at) - new Date()) / 86400000) }));
  const critical = withDays.filter(u => u.days <= 3);
  const week     = withDays.filter(u => u.days > 3 && u.days <= 7);
  const soon     = withDays.filter(u => u.days > 7);

  const filtered = withDays
    .filter(u => filter==='all' ? true : filter==='critical' ? u.days<=3 : filter==='week' ? u.days<=7&&u.days>3 : u.days>7)
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || (u.business_name||'').toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / PER);
  const slice = filtered.slice(page * PER, (page + 1) * PER);

  const urgColor  = d => d<=3 ? C.red   : d<=7 ? C.amber   : '#06b6d4';
  const urgBg     = d => d<=3 ? C.redSoft : d<=7 ? C.amberSoft : 'rgba(6,182,212,0.12)';
  const urgBorder = d => d<=3 ? C.redBorder : d<=7 ? C.amberBorder : 'rgba(6,182,212,0.3)';
  const urgLabel  = d => d<=3 ? 'Critical' : d<=7 ? 'This Week' : 'Soon';

  const statCards = [
    { label:'Total Expiring', value:expiring.length, sub:'within 30 days',   bg:'#fffbeb', iconBg:'#fef9c3', border:'#fde68a', color:C.amber },
    { label:'Critical',       value:critical.length, sub:'expire in 3 days', bg:'#fef2f2', iconBg:'#fecaca', border:'#fecaca', color:C.red },
    { label:'This Week',      value:week.length,     sub:'expire in 7 days', bg:'#eff6ff', iconBg:'#dbeafe', border:'#bfdbfe', color:'#3b82f6' },
    { label:'Later',          value:soon.length,     sub:'8–30 days left',   bg:'#f0fdf4', iconBg:'#dcfce7', border:'#bbf7d0', color:C.green },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:14 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', cursor:'pointer', transition:'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'}
          >
            <div style={{ fontSize:10, fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize: isMobile?26:32, fontWeight:900, color:'#1a1d23', letterSpacing:'-1.5px', lineHeight:1, marginBottom:5 }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9aa5b4' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {expiring.length > 0 && (
        <div style={{ ...gc, padding:'18px 22px' }}>
          <div style={{ fontSize:12, fontWeight:800, color:C.text, marginBottom:12 }}>Urgency Breakdown</div>
          <div style={{ display:'flex', height:8, borderRadius:6, overflow:'hidden', gap:2 }}>
            {critical.length>0 && <div style={{ flex:critical.length, background:C.red, borderRadius:4, boxShadow:`0 0 8px ${C.red}66` }}/>}
            {week.length>0    && <div style={{ flex:week.length,     background:C.amber, borderRadius:4, boxShadow:`0 0 8px ${C.amber}66` }}/>}
            {soon.length>0    && <div style={{ flex:soon.length,     background:'#06b6d4', borderRadius:4, boxShadow:'0 0 8px rgba(6,182,212,0.5)' }}/>}
          </div>
          <div style={{ display:'flex', gap:20, marginTop:10, flexWrap:'wrap' }}>
            {[{color:C.red,label:'Critical (≤3d)',count:critical.length},{color:C.amber,label:'This Week (≤7d)',count:week.length},{color:'#06b6d4',label:'Soon (8–30d)',count:soon.length}].map(l => (
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:l.color, boxShadow:`0 0 6px ${l.color}` }}/>
                <span style={{ fontSize:11.5, color:C.textSoft, fontWeight:600 }}>{l.label}</span>
                <span style={{ fontSize:12, fontWeight:800, color:l.color }}>{l.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...gc, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(245,158,11,0.05)' }}>
          <span style={{ fontSize:13, fontWeight:800, color:C.amber }}>Expiring Subscriptions</span>
          <span style={{ fontSize:11, fontWeight:700, background:'rgba(245,158,11,0.15)', color:C.amber, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(245,158,11,0.3)' }}>{expiring.length} users</span>
        </div>

        <div style={{ padding:'12px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(168,85,247,0.08)', border:'1.5px solid rgba(168,85,247,0.2)', borderRadius:10, padding:'7px 12px', flex:1, minWidth:160 }}>
            <MdSearch style={{ color:C.textSoft, fontSize:16 }}/>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search users..."
              style={{ border:'none', outline:'none', background:'transparent', fontSize:13, fontFamily:'inherit', color:C.text, width:'100%' }}/>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[{id:'all',label:'All',count:expiring.length},{id:'critical',label:'Critical',count:critical.length},{id:'week',label:'This Week',count:week.length},{id:'soon',label:'Later',count:soon.length}].map(f => (
              <button key={f.id} onClick={() => { setFilter(f.id); setPage(0); }} style={{ padding:'6px 12px', borderRadius:9, border:`1.5px solid ${filter===f.id?'rgba(245,158,11,0.5)':'rgba(255,255,255,0.08)'}`, background:filter===f.id?'rgba(245,158,11,0.15)':'transparent', color:filter===f.id?C.amber:C.textMid, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                {f.label}
                <span style={{ fontSize:10.5, fontWeight:800, background:filter===f.id?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.08)', color:filter===f.id?C.amber:C.textSoft, borderRadius:20, padding:'1px 6px' }}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:C.textSoft }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:'center', color:C.textSoft, fontSize:13 }}>
            <MdAccessTime style={{ fontSize:32, opacity:0.2, display:'block', margin:'0 auto 10px' }}/>
            No expiring subscriptions found
          </div>
        ) : isMobile ? (
          <div>
            {slice.map(u => {
              const bm = BIZ_META[u.business_type];
              const BIcon = bm?.icon;
              return (
                <div key={u.id} style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <Avatar name={u.name} size={38}/>
                    <div style={{ position:'absolute', bottom:-2, right:-2, width:12, height:12, borderRadius:'50%', background:urgColor(u.days), border:'2px solid #0f0a1e', boxShadow:`0 0 6px ${urgColor(u.days)}` }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{u.name}</div>
                    <div style={{ fontSize:11, color:C.textSoft, marginBottom:4 }}>{u.email}</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                      {BIcon && <BIcon style={{ fontSize:11, color:bm.color }}/>}
                      <span style={{ fontSize:11, color:C.textMid }}>{u.business_name || bm?.label}</span>
                      <span style={{ fontSize:10.5, fontWeight:700, color:u.plan==='lifetime'?C.accent:C.blue, background:u.plan==='lifetime'?C.accentSoft:C.blueSoft, padding:'1px 7px', borderRadius:20, textTransform:'capitalize' }}>{u.plan}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:urgColor(u.days), background:urgBg(u.days), border:`1px solid ${urgBorder(u.days)}`, padding:'3px 9px', borderRadius:20, display:'block', marginBottom:4 }}>{u.days}d left</span>
                    <div style={{ fontSize:10.5, color:C.textSoft }}>{new Date(u.expires_at).toLocaleDateString('en-PK')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'rgba(245,158,11,0.05)' }}>
                  {['User','Business','Type','Plan','Expires','Urgency','Days Left'].map(h => (
                    <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.7px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slice.map(u => {
                  const bm = BIZ_META[u.business_type];
                  const BIcon = bm?.icon;
                  return (
                    <tr key={u.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding:'12px 18px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ position:'relative' }}>
                            <Avatar name={u.name} size={32}/>
                            <div style={{ position:'absolute', bottom:-1, right:-1, width:10, height:10, borderRadius:'50%', background:urgColor(u.days), border:'2px solid #0f0a1e', boxShadow:`0 0 6px ${urgColor(u.days)}` }}/>
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{u.name}</div>
                            <div style={{ fontSize:11, color:C.textSoft }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'12px 18px', fontSize:12.5, color:C.textMid }}>{u.business_name||'—'}</td>
                      <td style={{ padding:'12px 18px' }}>{bm&&BIcon&&<div style={{ display:'flex', alignItems:'center', gap:6 }}><BIcon style={{ fontSize:12, color:bm.color }}/><span style={{ fontSize:12, color:C.textMid }}>{bm.label}</span></div>}</td>
                      <td style={{ padding:'12px 18px' }}>
                        <span style={{ fontSize:11.5, fontWeight:700, color:u.plan==='lifetime'?C.accent:C.blue, background:u.plan==='lifetime'?C.accentSoft:C.blueSoft, padding:'3px 10px', borderRadius:20, textTransform:'capitalize' }}>{u.plan}</span>
                      </td>
                      <td style={{ padding:'12px 18px', fontSize:12.5, fontWeight:700, color:C.amber }}>{new Date(u.expires_at).toLocaleDateString('en-PK')}</td>
                      <td style={{ padding:'12px 18px' }}>
                        <span style={{ fontSize:11, fontWeight:700, color:urgColor(u.days), background:urgBg(u.days), border:`1px solid ${urgBorder(u.days)}`, padding:'3px 10px', borderRadius:20 }}>{urgLabel(u.days)}</span>
                      </td>
                      <td style={{ padding:'12px 18px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:5, background:`${urgColor(u.days)}20`, borderRadius:4, minWidth:50, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${Math.max(5,Math.round((1-u.days/30)*100))}%`, background:urgColor(u.days), borderRadius:4, boxShadow:`0 0 6px ${urgColor(u.days)}66` }}/>
                          </div>
                          <span style={{ fontSize:12, fontWeight:800, color:urgColor(u.days), flexShrink:0 }}>{u.days}d</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid rgba(255,255,255,0.08)', background:'transparent', cursor:page===0?'not-allowed':'pointer', color:page===0?C.textSoft:C.text, fontWeight:700, fontSize:12, opacity:page===0?0.4:1 }}>← Prev</button>
            <span style={{ fontSize:12, color:C.textSoft }}>{page+1} / {totalPages} · {filtered.length} users</span>
            <button onClick={() => setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid rgba(255,255,255,0.08)', background:'transparent', cursor:page===totalPages-1?'not-allowed':'pointer', color:page===totalPages-1?C.textSoft:C.text, fontWeight:700, fontSize:12, opacity:page===totalPages-1?0.4:1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
