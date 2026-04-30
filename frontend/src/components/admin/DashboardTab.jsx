import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { MdPeople, MdCheckCircle, MdAccessTime, MdAttachMoney, MdPersonAdd, MdTrendingUp, MdTrendingDown, MdBarChart, MdBlock } from 'react-icons/md';
import { C, BIZ_META, STATUS_META, Avatar } from './constants.jsx';
import { RechartsBar, RechartsLine, RechartsPie, EmptyChart } from './Charts';

const card = (extra = {}) => ({
  background: '#ffffff', border: '1px solid #e8ecf0', borderRadius: 8,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)', ...extra,
});

export default function DashboardTab({ stats, users }) {
  const [revenueData, setRevenueData] = useState([]);
  const [growthData,  setGrowthData]  = useState([]);
  const [plansData,   setPlansData]   = useState([]);
  const [expiring,    setExpiring]    = useState([]);
  const [recentPay,   setRecentPay]   = useState([]);
  const [topRevenue,  setTopRevenue]  = useState([]);
  const [mrr,         setMrr]         = useState(null);
  const [expPage,     setExpPage]     = useState(0);
  const [payPage,     setPayPage]     = useState(0);
  const PAGE_SIZE = 5;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    adminAPI.getRevenueChart().then(r => setRevenueData(r.data)).catch(() => {});
    adminAPI.getGrowthChart().then(r => setGrowthData(r.data)).catch(() => {});
    adminAPI.getPlansChart().then(r => setPlansData(r.data)).catch(() => {});
    adminAPI.getExpiring().then(r => setExpiring(r.data)).catch(() => {});
    adminAPI.getRecentPayments().then(r => setRecentPay(r.data)).catch(() => {});
    adminAPI.getTopRevenue().then(r => setTopRevenue(r.data)).catch(() => {});
    adminAPI.getMrr().then(r => setMrr(r.data)).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total Users',    value: stats?.total ?? '—',  icon: MdPeople,      bg:'#fff7ed', iconBg:'#ffedd5', color:'#f97316', border:'#fed7aa' },
    { label: 'Active Users',   value: stats?.active ?? '—', icon: MdCheckCircle, bg:'#f0fdf4', iconBg:'#dcfce7', color:'#22c55e', border:'#bbf7d0' },
    { label: 'Pending',        value: stats?.pending ?? '—',icon: MdAccessTime,  bg:'#fffbeb', iconBg:'#fef9c3', color:'#f59e0b', border:'#fde68a' },
    { label: 'MRR This Month', value: mrr ? `Rs.${Number(mrr.mrr).toLocaleString('en-PK')}` : '—', icon: MdAttachMoney, bg:'#eff6ff', iconBg:'#dbeafe', color:'#3b82f6', border:'#bfdbfe' },
  ];

  const mrrPos = mrr?.growth != null && parseFloat(mrr.growth) >= 0;
  const planDonut = plansData.map(p => ({ name: p.plan === 'lifetime' ? 'Lifetime' : 'Monthly', value: p.count, color: p.plan === 'lifetime' ? C.accent : C.green }));
  const donutData = [
    { name: 'Active',    value: stats?.active    || 0, color: C.green },
    { name: 'Pending',   value: stats?.pending   || 0, color: C.amber },
    { name: 'Suspended', value: stats?.suspended || 0, color: C.red },
  ].filter(d => d.value > 0);
  const recentUsers = (users || []).slice(0, 5);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:14 }}>
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 8, padding: isMobile ? '16px' : '20px 22px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.15s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ width:40, height:40, borderRadius:8, background:s.iconBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon style={{ fontSize:20, color:s.color }} />
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:s.color, textTransform:'uppercase', letterSpacing:'0.8px' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: isMobile?22:32, fontWeight:900, color:'#1a1d23', letterSpacing:'-1.5px', lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* MRR Banner */}
      {mrr && (
        <div style={{ background:'white', border:'1px solid #e8ecf0', borderRadius:8, padding: isMobile ? '18px' : '20px 24px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 16 : 32, flexWrap:'wrap' }}>
            <div style={{ minWidth:160 }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#9aa5b4', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:6 }}>Monthly Revenue</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight:900, letterSpacing:'-1px', color:'#1a1d23' }}>Rs.{Number(mrr.mrr).toLocaleString('en-PK')}</div>
              {mrr.growth != null && (
                <div style={{ marginTop:8, display:'inline-flex', alignItems:'center', gap:4, borderRadius:4, padding:'3px 8px', background: mrrPos ? '#f0fdf4' : '#fef2f2', border:`1px solid ${mrrPos ? '#bbf7d0' : '#fecaca'}` }}>
                  {mrrPos ? <MdTrendingUp style={{ fontSize:12, color:'#22c55e' }} /> : <MdTrendingDown style={{ fontSize:12, color:'#ef4444' }} />}
                  <span style={{ fontSize:11, fontWeight:700, color: mrrPos ? '#22c55e' : '#ef4444' }}>{mrrPos?'+':''}{mrr.growth}% vs last month</span>
                </div>
              )}
            </div>
            <div style={{ width:1, height:44, background:'#e8ecf0', flexShrink:0 }} />
            <div style={{ display:'flex', gap: isMobile ? 20 : 40, flexWrap:'wrap', flex:1, justifyContent:'space-around' }}>
              {[
                { label:'Lifetime Revenue', value:`Rs.${stats?.revenue != null ? Number(stats.revenue).toLocaleString('en-PK') : '—'}`, color:'#8b5cf6' },
                { label:'New This Month',   value: mrr.newThisMonth ?? '—', color:'#22c55e' },
                { label:'Suspended',        value: stats?.suspended ?? '—', color:'#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#9aa5b4', textTransform:'uppercase', letterSpacing:'1px', marginBottom:5 }}>{label}</div>
                  <div style={{ fontSize: isMobile ? 18 : 24, fontWeight:900, letterSpacing:'-0.5px', color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
        <div style={{ ...card(), padding:'22px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:C.text }}>Monthly Revenue</div>
              <div style={{ fontSize:11, color:C.textSoft, marginTop:2 }}>Last 6 months</div>
            </div>
            <div style={{ width:34, height:34, borderRadius:10, background:'rgba(168,85,247,0.15)', border:'1px solid rgba(168,85,247,0.25)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 12px rgba(168,85,247,0.3)' }}>
              <MdTrendingUp style={{ color:C.accent, fontSize:17 }} />
            </div>
          </div>
          {revenueData.length > 0 ? <RechartsBar data={revenueData} /> : <EmptyChart label="No payment data yet" />}
        </div>
        <div style={{ ...card(), padding:'22px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:C.text }}>User Growth</div>
              <div style={{ fontSize:11, color:C.textSoft, marginTop:2 }}>New signups per month</div>
            </div>
            <div style={{ width:34, height:34, borderRadius:10, background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.25)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 12px rgba(16,185,129,0.3)' }}>
              <MdPersonAdd style={{ color:C.green, fontSize:17 }} />
            </div>
          </div>
          {growthData.length > 0 ? <RechartsLine data={growthData} /> : <EmptyChart label="No user data yet" />}
        </div>
      </div>

      {/* Donuts + Business Type */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:16 }}>
        <div style={{ ...card(), padding:'22px 24px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:16 }}>User Status</div>
          {donutData.length > 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <RechartsPie data={donutData} />
              <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
                {donutData.map(d => (
                  <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:d.color, boxShadow:`0 0 6px ${d.color}` }} />
                      <span style={{ fontSize:12.5, color:C.textMid, fontWeight:600 }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:900, color:d.color, textShadow:`0 0 10px ${d.color}66` }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ color:C.textSoft, fontSize:13 }}>No data yet</div>}
        </div>

        <div style={{ ...card(), padding:'22px 24px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:16 }}>Plan Distribution</div>
          {planDonut.length > 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <RechartsPie data={planDonut} />
              <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
                {planDonut.map(d => (
                  <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:d.color, boxShadow:`0 0 6px ${d.color}` }} />
                      <span style={{ fontSize:12.5, color:C.textMid, fontWeight:600 }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:900, color:d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ color:C.textSoft, fontSize:13 }}>No data yet</div>}
        </div>

        <div style={{ ...card(), padding:'22px 24px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:16 }}>By Business Type</div>
          {stats?.byType?.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {stats.byType.map(b => {
                const meta = BIZ_META[b.business_type] || { label:b.business_type, color:C.accent, icon:null };
                const Icon = meta.icon;
                const pct = stats.total > 0 ? Math.round((b.count / stats.total) * 100) : 0;
                return (
                  <div key={b.business_type}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        {Icon && <Icon style={{ fontSize:13, color:meta.color }} />}
                        <span style={{ fontSize:12.5, fontWeight:600, color:C.textMid }}>{meta.label}</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:meta.color }}>{b.count}</span>
                    </div>
                    <div style={{ height:5, background:`${meta.color}18`, borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${meta.color},${meta.color}aa)`, borderRadius:4, transition:'width 0.8s ease', boxShadow:`0 0 8px ${meta.color}66` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ color:C.textSoft, fontSize:13 }}>No data yet</div>}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:16 }}>

        {/* Expiring Soon */}
        {(() => {
          const expTotal = Math.ceil(expiring.length / PAGE_SIZE);
          const expSlice = expiring.slice(expPage * PAGE_SIZE, (expPage + 1) * PAGE_SIZE);
          return (
            <div style={{ ...card(), overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(245,158,11,0.06)' }}>
                <span style={{ fontSize:13, fontWeight:800, color:C.amber }}>Expiring Soon</span>
                <span style={{ fontSize:11, fontWeight:700, background:'rgba(245,158,11,0.2)', color:C.amber, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(245,158,11,0.3)' }}>30 days</span>
              </div>
              {expiring.length === 0
                ? <div style={{ padding:'28px', textAlign:'center', color:C.textSoft, fontSize:13 }}>No expiring users</div>
                : <>
                  {expSlice.map(u => (
                    <div key={u.id} style={{ padding:'11px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar name={u.name} size={30} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight:700, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                        <div style={{ fontSize:11, color:C.textSoft }}>{u.business_name || u.business_type}</div>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:C.amber, background:'rgba(245,158,11,0.12)', padding:'2px 8px', borderRadius:8, flexShrink:0 }}>{new Date(u.expires_at).toLocaleDateString('en-PK')}</span>
                    </div>
                  ))}
                  {expTotal > 1 && (
                    <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <button onClick={() => setExpPage(p => Math.max(0,p-1))} disabled={expPage===0} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:'transparent', cursor:expPage===0?'not-allowed':'pointer', color:expPage===0?C.border:C.textMid, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                      <span style={{ fontSize:11, color:C.textSoft }}>{expPage+1}/{expTotal}</span>
                      <button onClick={() => setExpPage(p => Math.min(expTotal-1,p+1))} disabled={expPage===expTotal-1} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:'transparent', cursor:expPage===expTotal-1?'not-allowed':'pointer', color:expPage===expTotal-1?C.border:C.textMid, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                    </div>
                  )}
                </>}
            </div>
          );
        })()}

        {/* Recent Payments */}
        {(() => {
          const payTotal = Math.ceil(recentPay.length / PAGE_SIZE);
          const paySlice = recentPay.slice(payPage * PAGE_SIZE, (payPage + 1) * PAGE_SIZE);
          return (
            <div style={{ ...card(), overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(16,185,129,0.06)' }}>
                <span style={{ fontSize:13, fontWeight:800, color:C.green }}>Recent Payments</span>
                <span style={{ fontSize:11, fontWeight:700, background:'rgba(16,185,129,0.15)', color:C.green, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(16,185,129,0.3)' }}>{recentPay.length} total</span>
              </div>
              {recentPay.length === 0
                ? <div style={{ padding:'28px', textAlign:'center', color:C.textSoft, fontSize:13 }}>No payments yet</div>
                : <>
                  {paySlice.map(p => (
                    <div key={p.id} style={{ padding:'11px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12.5, fontWeight:700, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.user_name}</div>
                        <div style={{ fontSize:11, color:C.textSoft }}>{p.note || p.business_name || '—'}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:13, fontWeight:800, color:C.green, textShadow:'0 0 10px rgba(16,185,129,0.4)' }}>Rs.{Number(p.amount).toLocaleString('en-PK')}</div>
                        <div style={{ fontSize:10.5, color:C.textSoft }}>{new Date(p.created_at).toLocaleDateString('en-PK')}</div>
                      </div>
                    </div>
                  ))}
                  {payTotal > 1 && (
                    <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <button onClick={() => setPayPage(p => Math.max(0,p-1))} disabled={payPage===0} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:'transparent', cursor:payPage===0?'not-allowed':'pointer', color:payPage===0?C.border:C.textMid, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                      <span style={{ fontSize:11, color:C.textSoft }}>{payPage+1}/{payTotal}</span>
                      <button onClick={() => setPayPage(p => Math.min(payTotal-1,p+1))} disabled={payPage===payTotal-1} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:'transparent', cursor:payPage===payTotal-1?'not-allowed':'pointer', color:payPage===payTotal-1?C.border:C.textMid, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                    </div>
                  )}
                </>}
            </div>
          );
        })()}

        {/* Top Revenue */}
        <div style={{ ...card(), overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(168,85,247,0.06)' }}>
            <span style={{ fontSize:13, fontWeight:800, color:C.accent }}>Top Revenue</span>
            <span style={{ fontSize:11, fontWeight:700, background:'rgba(168,85,247,0.15)', color:C.accent, padding:'3px 10px', borderRadius:20, border:`1px solid ${C.accentBorder}` }}>Top 5</span>
          </div>
          {topRevenue.length === 0
            ? <div style={{ padding:'28px', textAlign:'center', color:C.textSoft, fontSize:13 }}>No data yet</div>
            : topRevenue.map((u, i) => {
              const rankColors = ['#f59e0b','#94a3b8','#cd7f32',C.accent,C.accent];
              return (
                <div key={u.id} style={{ padding:'11px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:24, height:24, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'white', background:rankColors[i], boxShadow:`0 0 8px ${rankColors[i]}66` }}>{i+1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:700, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize:11, color:C.textSoft }}>{u.business_name || u.business_type}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.accent }}>Rs.{Number(u.total_paid).toLocaleString('en-PK')}</div>
                    <div style={{ fontSize:10.5, color:C.textSoft }}>{u.payment_count} payments</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Recent Signups */}
      {recentUsers.length > 0 && (
        <div style={{ ...card(), overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.text }}>Recent Signups</div>
            <span style={{ fontSize:11, fontWeight:700, background:C.accentSoft, color:C.accent, padding:'3px 12px', borderRadius:20, border:`1px solid ${C.accentBorder}` }}>Latest 5</span>
          </div>
          {isMobile ? (
            <div>
              {recentUsers.map(u => {
                const sm = STATUS_META[u.status] || STATUS_META.pending;
                const bm = BIZ_META[u.business_type];
                return (
                  <div key={u.id} style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:12 }}>
                    <Avatar name={u.name} size={36} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{u.name}</div>
                      <div style={{ fontSize:11, color:C.textSoft, marginBottom:5 }}>{u.business_name || bm?.label || u.business_type}</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:10.5, fontWeight:700, color:u.plan==='lifetime'?C.accent:C.blue, background:u.plan==='lifetime'?C.accentSoft:C.blueSoft, padding:'2px 8px', borderRadius:20, textTransform:'capitalize' }}>{u.plan}</span>
                        <span style={{ fontSize:10.5, fontWeight:700, color:sm.color, background:sm.bg, border:`1px solid ${sm.border}`, padding:'2px 8px', borderRadius:20 }}>{sm.label}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:11, color:C.textSoft, flexShrink:0 }}>{new Date(u.created_at).toLocaleDateString('en-PK')}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'rgba(168,85,247,0.06)' }}>
                    {['User','Business','Plan','Status','Joined'].map(h => (
                      <th key={h} style={{ padding:'10px 18px', textAlign:'left', fontSize:10.5, fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.7px', borderBottom:`1px solid rgba(255,255,255,0.06)` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(u => {
                    const sm = STATUS_META[u.status] || STATUS_META.pending;
                    const bm = BIZ_META[u.business_type];
                    return (
                      <tr key={u.id} style={{ borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
                        <td style={{ padding:'12px 18px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <Avatar name={u.name} size={32} />
                            <div>
                              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{u.name}</div>
                              <div style={{ fontSize:11, color:C.textSoft }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 18px', fontSize:12.5, color:C.textMid }}>{u.business_name || bm?.label || u.business_type}</td>
                        <td style={{ padding:'12px 18px' }}>
                          <span style={{ fontSize:11.5, fontWeight:700, color:u.plan==='lifetime'?C.accent:C.blue, background:u.plan==='lifetime'?C.accentSoft:C.blueSoft, padding:'3px 10px', borderRadius:20, textTransform:'capitalize' }}>{u.plan}</span>
                        </td>
                        <td style={{ padding:'12px 18px' }}>
                          <span style={{ fontSize:11.5, fontWeight:700, color:sm.color, background:sm.bg, border:`1px solid ${sm.border}`, padding:'3px 10px', borderRadius:20 }}>{sm.label}</span>
                        </td>
                        <td style={{ padding:'12px 18px', fontSize:12, color:C.textSoft }}>{new Date(u.created_at).toLocaleDateString('en-PK')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
