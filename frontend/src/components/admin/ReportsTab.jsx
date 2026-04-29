import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { C, BIZ_META, Avatar } from './constants.jsx';
import { RechartsPie, EmptyChart } from './Charts';
import { AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const tip = { background:'rgba(15,10,30,0.95)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:12, fontSize:12, color:'white', boxShadow:'0 8px 32px rgba(0,0,0,0.6)' };
const gc = { background:'white', border:'1px solid #e8ecf0', borderRadius:8 };

export default function ReportsTab({ stats, users }) {
  const [revenueData, setRevenueData] = useState([]);
  const [growthData,  setGrowthData]  = useState([]);
  const [topRevenue,  setTopRevenue]  = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [activeChart, setActiveChart] = useState('revenue');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => { const h = () => setIsMobile(window.innerWidth <= 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  useEffect(() => {
    adminAPI.getRevenueChart().then(r => setRevenueData(r.data)).catch(() => {});
    adminAPI.getGrowthChart().then(r => setGrowthData(r.data)).catch(() => {});
    adminAPI.getTopRevenue().then(r => setTopRevenue(r.data)).catch(() => {});
    adminAPI.getRecentPayments().then(r => setPayments(r.data)).catch(() => {});
  }, []);

  const bizCounts = {};
  (users||[]).forEach(u => { bizCounts[u.business_type] = (bizCounts[u.business_type]||0)+1; });
  const totalRevenue  = payments.reduce((s,p) => s + Number(p.amount || 0), 0);
  const avgPayment    = payments.length ? Math.round(totalRevenue / payments.length) : 0;
  const lifetimeCount = (users||[]).filter(u => u.plan==='lifetime').length;
  const monthlyCount  = (users||[]).filter(u => u.plan==='monthly').length;
  const lastTwo = revenueData.slice(-2);
  const momGrowth = lastTwo.length===2 && lastTwo[0].revenue>0 ? (((lastTwo[1].revenue-lastTwo[0].revenue)/lastTwo[0].revenue)*100).toFixed(1) : null;
  const momPos = momGrowth!=null && parseFloat(momGrowth)>=0;
  const planDonut   = [{ name:'Monthly', value:monthlyCount, color:C.green },{ name:'Lifetime', value:lifetimeCount, color:C.accent }].filter(d=>d.value>0);
  const statusDonut = [{ name:'Active', value:stats?.active||0, color:C.green },{ name:'Pending', value:stats?.pending||0, color:C.amber },{ name:'Suspended', value:stats?.suspended||0, color:C.red }].filter(d=>d.value>0);

  const statCards = [
    { label:'Total Revenue', value:`Rs.${Number(totalRevenue).toLocaleString('en-PK')}`, sub:`${payments.length} payments`, bg:'#f0fdf4', iconBg:'#dcfce7', border:'#bbf7d0', color:'#22c55e' },
    { label:'Avg Payment',   value:`Rs.${Number(avgPayment).toLocaleString('en-PK')}`,   sub:'per transaction', bg:'#eff6ff', iconBg:'#dbeafe', border:'#bfdbfe', color:'#3b82f6' },    { label:'Monthly Plans', value:monthlyCount, sub:`${lifetimeCount} lifetime`, bg:'#f5f3ff', iconBg:'#ede9fe', border:'#ddd6fe', color:'#8b5cf6' },
    { label:'MoM Growth', value:momGrowth!=null?`${momPos?'+':''}${momGrowth}%`:'—', sub:'vs last month', bg:momPos?'#f0fdf4':'#fef2f2', iconBg:momPos?'#dcfce7':'#fecaca', border:momPos?'#bbf7d0':'#fecaca', color:momPos?'#22c55e':'#ef4444' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:14 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize: isMobile?16:20, fontWeight:900, color:'#1a1d23', letterSpacing:'-0.5px', lineHeight:1.2, marginBottom:5, wordBreak:'break-all', overflow:'hidden' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#9aa5b4' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ ...gc, padding:'22px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:C.text }}>{activeChart==='revenue'?'Monthly Revenue':'User Growth'}</div>
            <div style={{ fontSize:11, color:C.textSoft, marginTop:2 }}>Last 6 months trend</div>
          </div>
          <div style={{ display:'flex', gap:4, background:'#f4f6f9', borderRadius:6, padding:3, border:'1px solid #e8ecf0' }}>
            {[{id:'revenue',label:'Revenue'},{id:'growth',label:'User Growth'}].map(t => (
              <button key={t.id} onClick={() => setActiveChart(t.id)} style={{ padding:'5px 12px', borderRadius:5, border:'none', cursor:'pointer', fontFamily:'inherit', background:activeChart===t.id?'white':'transparent', color:activeChart===t.id?'#f97316':'#9aa5b4', fontSize:12, fontWeight:700, transition:'all 0.12s', boxShadow:activeChart===t.id?'0 1px 4px rgba(0,0,0,0.08)':'none' }}>{t.label}</button>
            ))}
          </div>
        </div>
        {activeChart === 'revenue' ? (
          revenueData.length > 0
            ? <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={revenueData} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:'#6b7280', fontWeight:600 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                  <Tooltip contentStyle={{ background:'#1a1d23', border:'1px solid #2d3748', borderRadius:6, fontSize:12, color:'white', padding:'8px 12px' }} formatter={v=>[`Rs.${Number(v).toLocaleString('en-PK')}`, 'Revenue']} cursor={{ fill:'rgba(249,115,22,0.05)' }}/>
                  <Bar dataKey="revenue" fill="#f97316" fillOpacity={0.15} radius={[3,3,0,0]} />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={{ fill:'#f97316', r:3, strokeWidth:2, stroke:'white' }} activeDot={{ r:5, fill:'#f97316', stroke:'white', strokeWidth:2 }}/>
                </ComposedChart>
              </ResponsiveContainer>
            : <EmptyChart label="No revenue data yet" />
        ) : (
          growthData.length > 0
            ? <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={growthData} margin={{ top:8, right:8, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:'#6b7280', fontWeight:600 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ background:'#1a1d23', border:'1px solid #2d3748', borderRadius:6, fontSize:12, color:'white', padding:'8px 12px' }} formatter={(v,n)=>[v, n==='newUsers'?'New Users':'Total']} cursor={{ fill:'rgba(22,163,74,0.04)' }}/>
                  <Bar dataKey="newUsers" fill="#16a34a" fillOpacity={0.2} radius={[3,3,0,0]} />
                  <Line type="monotone" dataKey="newUsers" stroke="#16a34a" strokeWidth={2.5} dot={{ fill:'#16a34a', r:3, strokeWidth:2, stroke:'white' }} activeDot={{ r:5 }}/>
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
                </ComposedChart>
              </ResponsiveContainer>
            : <EmptyChart label="No growth data yet" />
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr 1fr', gap:16 }}>
        <div style={{ ...gc, padding:'22px 24px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:18 }}>By Business Type</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {Object.entries(BIZ_META).map(([type, meta]) => {
              const Icon = meta.icon;
              const count = bizCounts[type]||0;
              const pct = Math.round((count/((users||[]).length||1))*100);
              return (
                <div key={type}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 8px ${meta.color}44` }}><Icon style={{ fontSize:13, color:meta.color }}/></div>
                      <span style={{ fontSize:12.5, fontWeight:600, color:C.textMid }}>{meta.label}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:14, fontWeight:900, color:meta.color }}>{count}</span>
                      <span style={{ fontSize:10.5, color:C.textSoft }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height:5, background:`${meta.color}18`, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:meta.color, borderRadius:4, transition:'width 0.8s ease', boxShadow:`0 0 8px ${meta.color}66` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...gc, padding:'22px 24px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:18 }}>Plan Distribution</div>
          {planDonut.length > 0 ? (
            <>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><RechartsPie data={planDonut}/></div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {planDonut.map(d => (
                  <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:`${d.color}12`, borderRadius:10, border:`1px solid ${d.color}30` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:8, height:8, borderRadius:2, background:d.color, boxShadow:`0 0 6px ${d.color}` }}/><span style={{ fontSize:12.5, fontWeight:700, color:d.color }}>{d.name}</span></div>
                    <div><span style={{ fontSize:18, fontWeight:900, color:d.color }}>{d.value}</span><span style={{ fontSize:10.5, color:C.textSoft, marginLeft:4 }}>users</span></div>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ color:C.textSoft, fontSize:13 }}>No data</div>}
        </div>

        <div style={{ ...gc, padding:'22px 24px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:18 }}>User Status</div>
          {statusDonut.length > 0 ? (
            <>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}><RechartsPie data={statusDonut}/></div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {statusDonut.map(d => (
                  <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:`${d.color}12`, borderRadius:10, border:`1px solid ${d.color}30` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:8, height:8, borderRadius:2, background:d.color, boxShadow:`0 0 6px ${d.color}` }}/><span style={{ fontSize:12.5, fontWeight:700, color:d.color }}>{d.name}</span></div>
                    <div><span style={{ fontSize:18, fontWeight:900, color:d.color }}>{d.value}</span><span style={{ fontSize:10.5, color:C.textSoft, marginLeft:4 }}>users</span></div>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ color:C.textSoft, fontSize:13 }}>No data</div>}
        </div>
      </div>

      <div style={{ ...gc, overflow:'hidden' }}>
        <div style={{ padding:'16px 22px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(168,85,247,0.05)' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:C.text }}>Top Revenue Users</div>
            <div style={{ fontSize:11, color:C.textSoft, marginTop:2 }}>Highest paying customers</div>
          </div>
          <span style={{ fontSize:11, fontWeight:700, background:'rgba(168,85,247,0.15)', color:C.accent, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(168,85,247,0.25)' }}>Top 5</span>
        </div>
        {topRevenue.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:C.textSoft, fontSize:13 }}>No data yet</div>
        ) : isMobile ? (
          <div>
            {topRevenue.map((u, i) => {
              const bm = BIZ_META[u.business_type];
              const rankColors = ['#f59e0b','#94a3b8','#cd7f32',C.accent,C.accent];
              return (
                <div key={u.id} style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:rankColors[i], display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'white', flexShrink:0, boxShadow:`0 0 8px ${rankColors[i]}66` }}>{i+1}</div>
                  <Avatar name={u.name} size={34}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{u.name}</div>
                    <div style={{ fontSize:11, color:C.textSoft }}>{u.business_name || bm?.label || u.business_type}</div>
                    <span style={{ fontSize:10.5, fontWeight:700, color:u.plan==='lifetime'?C.accent:C.blue, background:u.plan==='lifetime'?C.accentSoft:C.blueSoft, padding:'1px 7px', borderRadius:20, textTransform:'capitalize' }}>{u.plan}</span>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:900, color:C.green }}>Rs.{Number(u.total_paid).toLocaleString('en-PK')}</div>
                    <div style={{ fontSize:10.5, color:C.textSoft }}>{u.payment_count} payments</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'rgba(168,85,247,0.06)' }}>
                  {['Rank','User','Business','Type','Plan','Total Paid','Payments'].map(h => (
                    <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.7px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRevenue.map((u, i) => {
                  const bm = BIZ_META[u.business_type];
                  const BIcon = bm?.icon;
                  const rankColors = ['#f59e0b','#94a3b8','#cd7f32',C.accent,C.accent];
                  return (
                    <tr key={u.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding:'12px 18px' }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:rankColors[i], display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'white', boxShadow:`0 0 8px ${rankColors[i]}66` }}>{i+1}</div>
                      </td>
                      <td style={{ padding:'12px 18px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={u.name} size={32}/>
                          <div><div style={{ fontSize:13, fontWeight:700, color:C.text }}>{u.name}</div><div style={{ fontSize:11, color:C.textSoft }}>{u.email}</div></div>
                        </div>
                      </td>
                      <td style={{ padding:'12px 18px', fontSize:12.5, color:C.textMid }}>{u.business_name||'—'}</td>
                      <td style={{ padding:'12px 18px' }}>{bm&&BIcon&&<div style={{ display:'flex', alignItems:'center', gap:6 }}><BIcon style={{ fontSize:12, color:bm.color }}/><span style={{ fontSize:12, color:C.textMid }}>{bm.label}</span></div>}</td>
                      <td style={{ padding:'12px 18px' }}>
                        <span style={{ fontSize:11.5, fontWeight:700, color:u.plan==='lifetime'?C.accent:C.blue, background:u.plan==='lifetime'?C.accentSoft:C.blueSoft, padding:'3px 10px', borderRadius:20, textTransform:'capitalize' }}>{u.plan}</span>
                      </td>
                      <td style={{ padding:'12px 18px', fontSize:13, fontWeight:900, color:C.green }}>Rs.{Number(u.total_paid).toLocaleString('en-PK')}</td>
                      <td style={{ padding:'12px 18px', fontSize:12.5, color:C.textMid }}>{u.payment_count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
