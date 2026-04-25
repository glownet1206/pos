import { useState, useEffect } from 'react';
import { MdClose, MdAccessTime, MdNotifications, MdPayment, MdBarChart, MdSettings, MdPeople, MdCheckCircle, MdPersonAdd } from 'react-icons/md';
import { FaShieldAlt } from 'react-icons/fa';
import { C } from './constants.jsx';

const gc = { background:'white', border:'1px solid #e8ecf0', borderRadius:8, overflow:'hidden' };

const SYS = [
  { label:'API Server',     status:'operational', uptime:'99.9%' },
  { label:'Database',       status:'operational', uptime:'100%'  },
  { label:'Authentication', status:'operational', uptime:'99.8%' },
  { label:'File Storage',   status:'degraded',    uptime:'97.2%' },
  { label:'Email Service',  status:'operational', uptime:'99.5%' },
];

const QA = [
  { label:'Pending Users', color:'#f59e0b', desc:'Activate new signups', tab:'users' },
  { label:'Expiring Soon', color:'#ef4444', desc:'Renew subscriptions',  tab:'expiring' },
  { label:'All Payments',  color:'#10b981', desc:'View payment history', tab:'payments' },
  { label:'View Reports',  color:'#a855f7', desc:'Revenue & growth',     tab:'reports' },
  { label:'Manage Users',  color:'#06b6d4', desc:'Edit user details',    tab:'users' },
  { label:'Settings',      color:'#6366f1', desc:'Configure platform',   tab:'settings' },
];

export default function SupportTab({ setTab }) {
  const [anns, setAnns] = useState([
    { id:1, title:'Scheduled Maintenance', body:'System will be down for 30 mins on Sunday 2 AM.', type:'warning', date:'2026-03-20', read:false },
    { id:2, title:'New Feature: Reports',  body:'Advanced reports with MoM comparison are now live.', type:'info', date:'2026-03-18', read:false },
    { id:3, title:'Security Update',       body:'JWT token expiry reduced to 7 days for better security.', type:'success', date:'2026-03-15', read:true },
  ]);
  const [title, setTitle] = useState('');
  const [body,  setBody]  = useState('');
  const [type,  setType]  = useState('info');
  const [form,  setForm]  = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth <= 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

  const add = () => { if (!title.trim()||!body.trim()) return; setAnns(p => [{ id:Date.now(), title:title.trim(), body:body.trim(), type, date:new Date().toISOString().slice(0,10), read:false }, ...p]); setTitle(''); setBody(''); setForm(false); };
  const read = id => setAnns(p => p.map(a => a.id===id?{...a,read:true}:a));
  const del  = id => setAnns(p => p.filter(a => a.id!==id));

  const am = { info:{ color:'#06b6d4', border:'rgba(6,182,212,0.3)', bg:'rgba(6,182,212,0.1)' }, warning:{ color:C.amber, border:'rgba(245,158,11,0.3)', bg:'rgba(245,158,11,0.1)' }, success:{ color:C.green, border:'rgba(16,185,129,0.3)', bg:'rgba(16,185,129,0.1)' } };
  const allOk = SYS.every(s => s.status==='operational');
  const unread = anns.filter(a => !a.read).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:16 }}>

        <div style={{ ...gc }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafbfc' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:30, height:30, borderRadius:6, background:'#fff7ed', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FaShieldAlt style={{ fontSize:13, color:'#f97316' }}/>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:'#1a1d23' }}>System Status</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, background:allOk?'#f0fdf4':'#fffbeb', padding:'3px 10px', borderRadius:4, border:`1px solid ${allOk?'#bbf7d0':'#fde68a'}` }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:allOk?'#22c55e':'#f59e0b' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:allOk?'#22c55e':'#f59e0b' }}>{allOk?'All Operational':'Degraded'}</span>
            </div>
          </div>
          {SYS.map(s => {
            const c = s.status==='operational' ? '#22c55e' : '#f59e0b';
            return (
              <div key={s.label} style={{ padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #f0f2f5' }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#1a1d23' }}>{s.label}</span>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:11, color:'#9aa5b4', fontWeight:600 }}>{s.uptime}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:c, background:c==='#22c55e'?'#f0fdf4':'#fffbeb', padding:'2px 8px', borderRadius:4, border:`1px solid ${c==='#22c55e'?'#bbf7d0':'#fde68a'}` }}>{s.status==='operational'?'Operational':'Degraded'}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...gc }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f2f5', background:'#fafbfc' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#1a1d23' }}>Quick Actions</div>
            <div style={{ fontSize:11, color:'#9aa5b4', marginTop:2 }}>Jump to any section</div>
          </div>
          <div style={{ padding:'14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {QA.map(a => (
              <button key={a.label} onClick={() => setTab && setTab(a.tab)} style={{ padding:'13px 14px', borderRadius:12, background:`${a.color}12`, border:`1px solid ${a.color}22`, cursor:'pointer', transition:'all 0.15s', textAlign:'left', fontFamily:'inherit', display:'flex', flexDirection:'column', gap:5 }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 16px ${a.color}25`; e.currentTarget.style.borderColor=`${a.color}44`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor=`${a.color}22`; }}
              >
                <div style={{ fontSize:12, fontWeight:700, color:a.color }}>{a.label}</div>
                <div style={{ fontSize:10.5, color:C.textSoft }}>{a.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...gc }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, background:'#fafbfc' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:6, background:'#fff7ed', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MdNotifications style={{ fontSize:15, color:'#f97316' }}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#1a1d23' }}>Announcements</div>
              {unread>0 && <div style={{ fontSize:11, color:'#9aa5b4' }}>{unread} unread</div>}
            </div>
          </div>
          <button onClick={() => setForm(v=>!v)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:'inherit', background:form?'#f4f6f9':'#f97316', color:'white', fontSize:12, fontWeight:700 }}>
            {form ? <><MdClose style={{ fontSize:13 }}/> Cancel</> : '+ New'}
          </button>
        </div>

        {form && (
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f2f5', background:'#fafbfc' }}>
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:8, marginBottom:8 }}>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title..."
                style={{ padding:'8px 10px', borderRadius:6, border:'1px solid #e8ecf0', fontSize:13, fontFamily:'inherit', color:'#1a1d23', outline:'none', background:'white' }}
                onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e8ecf0'}/>
              <select value={type} onChange={e=>setType(e.target.value)}
                style={{ padding:'8px 10px', borderRadius:6, border:'1px solid #e8ecf0', fontSize:13, fontFamily:'inherit', color:'#1a1d23', outline:'none', background:'white' }}>
                <option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option>
              </select>
            </div>
            <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Message..." rows={2}
              style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:'1px solid #e8ecf0', fontSize:13, fontFamily:'inherit', color:'#1a1d23', outline:'none', resize:'none', boxSizing:'border-box', marginBottom:8, background:'white' }}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e8ecf0'}/>
            <button onClick={add} disabled={!title.trim()||!body.trim()} style={{ padding:'7px 18px', borderRadius:6, border:'none', fontFamily:'inherit', cursor:title.trim()&&body.trim()?'pointer':'not-allowed', background:title.trim()&&body.trim()?'#f97316':'#e8ecf0', color:'white', fontSize:12.5, fontWeight:700 }}>Post</button>
          </div>
        )}

        <div style={{ maxHeight:340, overflowY:'auto' }}>
          {anns.length===0 ? (
            <div style={{ padding:36, textAlign:'center', color:C.textSoft, fontSize:13 }}>No announcements yet</div>
          ) : anns.map(a => {
            const m = am[a.type];
            return (
              <div key={a.id} style={{ padding:'12px 16px', borderBottom:'1px solid #f0f2f5', display:'flex', gap:10, alignItems:'flex-start', background:a.read?'white':'#fafbfc' }}>
                <div style={{ width:30, height:30, borderRadius:6, background:m.bg, border:`1px solid ${m.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <MdNotifications style={{ fontSize:14, color:m.color }}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#1a1d23' }}>{a.title}</span>
                    {!a.read && <span style={{ fontSize:10, fontWeight:700, background:'#fff7ed', color:'#f97316', padding:'1px 6px', borderRadius:4 }}>NEW</span>}
                    <span style={{ fontSize:10.5, fontWeight:600, color:m.color, background:m.bg, padding:'1px 7px', borderRadius:4, textTransform:'capitalize' }}>{a.type}</span>
                  </div>
                  <div style={{ fontSize:12.5, color:'#4a5568', lineHeight:1.5, marginBottom:3 }}>{a.body}</div>
                  <div style={{ fontSize:10.5, color:'#9aa5b4' }}>{new Date(a.date).toLocaleDateString('en-PK')}</div>
                </div>
                <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                  {!a.read && (
                    <button onClick={() => read(a.id)} style={{ padding:'3px 8px', borderRadius:4, border:'1px solid #bbf7d0', background:'#f0fdf4', color:'#22c55e', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:3 }}>
                      <MdCheckCircle style={{ fontSize:11 }}/> Read
                    </button>
                  )}
                  <button onClick={() => del(a.id)} style={{ width:26, height:26, borderRadius:4, border:'1px solid #fecaca', background:'#fef2f2', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <MdClose style={{ fontSize:12 }}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
