import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { salesAPI, tyresAPI, reportsAPI, sparePartsAPI } from '../api';
import { MdAdd, MdArrowForward, MdTrendingUp, MdTrendingDown, MdShoppingCart, MdInventory2, MdWarning, MdAttachMoney, MdShowChart, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getConfig } from '../businessConfig';
import ChartTip from '../components/reports/ChartTip';

const PIE_COLORS = ['#f97316','#3b82f6','#10b981','#8b5cf6','#ef4444'];
const fmt = (n) => Number(n||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
const getCurrency = () => localStorage.getItem('inv_currency') || 'Rs.';

export default function Dashboard({ user }) {
  const cfg = getConfig(user?.business_type);
  const [currency, setCurrency] = useState(getCurrency);

  useEffect(() => {
    const onStorage = () => setCurrency(getCurrency());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const [today, setToday] = useState({});
  const [inv, setInv] = useState({});
  const [spInv, setSpInv] = useState({});
  const [sales, setSales] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [payments, setPayments] = useState([]);
  const [topTyres, setTopTyres] = useState([]);
  const [period, setPeriod] = useState(14);
  const [loading, setLoading] = useState(true);
  const [salesPage, setSalesPage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const PAGE_SIZE = 3;

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      salesAPI.getToday(), tyresAPI.getSummary(), salesAPI.getAll(),
      reportsAPI.getWeeklyChart(period), reportsAPI.getPaymentsChart(),
      reportsAPI.getSales({ from: new Date(Date.now()-30*86400000).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }),
      sparePartsAPI.getSummary(),
    ]).then(([t, i, s, w, pm, rep, sp]) => {
      if (t.status === 'fulfilled') setToday(t.value.data);
      if (i.status === 'fulfilled') setInv(i.value.data);
      if (s.status === 'fulfilled') setSales((s.value.data.sales || s.value.data || []).slice(0, 30));
      if (w.status === 'fulfilled') setWeekly(w.value.data);
      if (pm.status === 'fulfilled') setPayments(pm.value.data);
      if (rep.status === 'fulfilled') setTopTyres(rep.value.data.topTyres || []);
      if (sp.status === 'fulfilled') setSpInv(sp.value.data);
    }).finally(() => setLoading(false));
  }, [period]);

  const greet = useCallback(() => { const h = new Date().getHours(); if (h >= 5 && h < 12) return 'Good morning'; if (h >= 12 && h < 17) return 'Good afternoon'; if (h >= 17 && h < 21) return 'Good evening'; return 'Good night'; }, []);

  const trendLabel = (pct) => {
    if (pct === null || pct === undefined) return null;
    return (pct >= 0 ? '+' : '') + pct + '%';
  };

  const statCards = useMemo(() => [
    {
      label: "Today's Revenue", value: `${currency}${fmt(today.revenue)}`,
      icon: MdAttachMoney, gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
      shadow: '0 8px 24px rgba(249,115,22,0.35)', sub: `${today.totalSales||0} transactions`,
      trend: trendLabel(today.revenueTrend), up: (today.revenueTrend ?? 0) >= 0,
      noTrend: today.revenueTrend === null || today.revenueTrend === undefined,
    },
    {
      label: 'Sales Today', value: today.totalSales || 0,
      icon: MdShoppingCart, gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)',
      shadow: '0 8px 24px rgba(59,130,246,0.35)', sub: `${today.pendingOrders||0} pending`,
      trend: trendLabel(today.salesTrend), up: (today.salesTrend ?? 0) >= 0,
      noTrend: today.salesTrend === null || today.salesTrend === undefined,
    },
    {
      label: 'Total Stock', value: (inv.totalStock||0) + (spInv.totalStock||0),
      icon: MdInventory2, gradient: 'linear-gradient(135deg,#10b981,#059669)',
      shadow: '0 8px 24px rgba(16,185,129,0.35)', sub: `${inv.total||0} tyres · ${spInv.total||0} parts`,
      trend: null, noTrend: true,
    },
    {
      label: 'Low Stock Alert', value: (inv.lowStock||0) + (spInv.lowStock||0),
      icon: MdWarning, gradient: 'linear-gradient(135deg,#ef4444,#dc2626)',
      shadow: '0 8px 24px rgba(239,68,68,0.35)',
      sub: ((inv.outOfStock||0)+(spInv.outOfStock||0)) > 0 ? `${(inv.outOfStock||0)+(spInv.outOfStock||0)} out of stock` : 'All items in stock',
      trend: null, noTrend: true,
    },
  ], [today, inv, spInv, cfg, currency]);

  const pmColor = useMemo(() => ({ Cash:'var(--green)', Card:'var(--blue)', Credit:'var(--orange)', 'Bank Transfer':'var(--purple)' }), []);

  const BizIcon = cfg.icon;

  if (loading) return <div className="spinner" />;

  return (
    <div className="page">

      <div className="dash-header-card" style={{ position:'relative', overflow:'hidden' }}>

        <div style={{ position:'absolute', top:-40, right:120, width:160, height:160, borderRadius:'50%', background:'rgba(249,115,22,0.05)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-30, right:20, width:100, height:100, borderRadius:'50%', background:'rgba(59,130,246,0.05)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative' }}>

          <div style={{ flexShrink:0 }}>
            <div style={{ width:46, height:46, borderRadius:8, background:`linear-gradient(135deg,${cfg.color},${cfg.color}cc)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 16px ${cfg.color}44` }}>
              <BizIcon style={{ fontSize:30, color:'white' }} />
            </div>
          </div>
          <div>
            <div className="greeting" style={{ fontSize:22, fontWeight:900, color:'var(--gray-900)', letterSpacing:'-0.5px', lineHeight:1.2 }}>
              {greet()}, <span style={{ color:cfg.color }}>{user?.name || 'Admin'}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
              <span style={{ fontSize:12.5, color:'var(--gray-400)', fontWeight:500 }}>
                {user?.business_name || cfg.label} · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
              </span>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--green)', background:'var(--green-bg)', padding:'2px 9px', borderRadius:20 }}>
                ● Live
              </span>
            </div>
          </div>
        </div>

        <div className="dash-btns" style={{ display:'flex', gap:10, position:'relative' }}>
          <Link to="/reports" className="btn btn-secondary btn-sm"><MdShowChart />Reports</Link>
          <Link to="/sales" className="btn btn-primary"><MdAdd />New Sale</Link>
        </div>
      </div>


      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile ? 10 : 18, marginBottom:24 }}>
        {statCards.map(({ label, value, icon: Icon, gradient, shadow, sub, trend, up, noTrend }) => (
          <div key={label} style={{
            background: gradient, borderRadius: 8, padding: '22px 24px',
            boxShadow: shadow, color: 'white', position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s', cursor: 'default',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
            <div style={{ position:'absolute', bottom:-30, right:20, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }} />
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'relative' }}>
              <div style={{ width:46, height:46, borderRadius:8, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon style={{ fontSize:24, color:'white' }} />
              </div>
              {!noTrend && trend !== null && (
                <span style={{ fontSize:11.5, fontWeight:700, background:'rgba(255,255,255,0.2)', padding:'4px 10px', borderRadius:20, display:'flex', alignItems:'center', gap:4 }}>
                  {up ? <MdTrendingUp style={{ fontSize:13 }} /> : <MdTrendingDown style={{ fontSize:13 }} />}
                  {trend}
                </span>
              )}
            </div>
            <div style={{ marginTop:16, position:'relative' }}>
              <div style={{ fontSize:'clamp(14px, 4vw, 26px)', fontWeight:900, letterSpacing:'-0.5px', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{value}</div>
              <div style={{ fontSize:12.5, fontWeight:700, opacity:0.85, marginTop:6 }}>{label}</div>
              <div style={{ fontSize:11.5, opacity:0.65, marginTop:3, fontWeight:500 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>


      <div className="card mb-4" style={{ padding:'24px 28px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'var(--gray-900)', display:'flex', alignItems:'center', gap:8 }}>
              <MdShowChart style={{ color:'var(--orange)', fontSize:20 }} /> Revenue Overview
            </div>
            <div style={{ fontSize:12.5, color:'var(--gray-400)', marginTop:3, fontWeight:500 }}>Daily revenue trend</div>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[7,14,30].map(d => (
              <button key={d} onClick={() => setPeriod(d)} style={{
                padding:'6px 16px', borderRadius:20, border:'1.5px solid',
                borderColor: period===d ? 'var(--orange)' : 'var(--gray-200)',
                background: period===d ? 'var(--orange)' : 'white',
                color: period===d ? 'white' : 'var(--gray-500)',
                fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                transition:'all 0.15s',
              }}>{d}D</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={weekly} margin={{ top:4, right:4, left:-16, bottom:0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize:11.5, fill:'#9ca3af', fontWeight:600 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="rev" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v=>`$${v}`} />
            <YAxis yAxisId="cnt" orientation="right" tick={{ fontSize:11, fill:'#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTip />} />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r:5, fill:'#f97316', strokeWidth:0 }} />
            <Area yAxisId="cnt" type="monotone" dataKey="sales" name="sales" stroke="#3b82f6" strokeWidth={2} fill="url(#salesGrad)" dot={false} activeDot={{ r:4, fill:'#3b82f6', strokeWidth:0 }} />
          </AreaChart>
        </ResponsiveContainer>

        <div style={{ display:'flex', gap:20, marginTop:12, justifyContent:'center' }}>
          {[['#f97316','Revenue'],['#3b82f6','Sales Count']].map(([c,l]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'var(--gray-500)' }}>
              <span style={{ width:24, height:3, borderRadius:2, background:c, display:'inline-block' }} />{l}
            </span>
          ))}
        </div>
      </div>


      <div className="dashboard-bottom" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 2fr', gap:18, marginBottom:24 }}>


        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div className="card-header" style={{ marginBottom:4 }}>
            <span className="card-title">Payments</span>
            <span style={{ fontSize:11.5, fontWeight:700, color:'var(--gray-400)', background:'var(--gray-100)', padding:'3px 10px', borderRadius:20 }}>
              {payments.reduce((a,p)=>a+p.value,0)} total
            </span>
          </div>
          {payments.length === 0 ? (
            <div className="empty-state" style={{ padding:'24px 0' }}><MdShoppingCart /><p>No data</p></div>
          ) : (() => {
            const total = payments.reduce((a,p)=>a+p.value,0);
            return (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <defs>
                      {PIE_COLORS.map((c,i) => (
                        <radialGradient key={i} id={`pg${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={c} stopOpacity={1} />
                          <stop offset="100%" stopColor={c} stopOpacity={0.75} />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      data={payments} cx="50%" cy="50%"
                      innerRadius={48} outerRadius={72}
                      paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270}
                      strokeWidth={0}
                    >
                      {payments.map((_, i) => <Cell key={i} fill={`url(#pg${i})`} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [`${v} (${Math.round(v/total*100)}%)`, n]}
                      contentStyle={{ borderRadius:10, border:'1px solid #e5e7eb', fontSize:12.5, fontWeight:600, boxShadow:'0 8px 24px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:2 }}>
                  {payments.map((p, i) => {
                    const pct = Math.round(p.value/total*100);
                    const color = PIE_COLORS[i%PIE_COLORS.length];
                    return (
                      <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:10, height:10, borderRadius:3, background:color, display:'inline-block', flexShrink:0 }} />
                        <span style={{ flex:1, fontSize:12.5, fontWeight:600, color:'var(--gray-600)' }}>{p.name}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--gray-400)' }}>{p.value}</span>
                        <span style={{ fontSize:12, fontWeight:800, color, minWidth:34, textAlign:'right' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>


        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div className="card-header" style={{ marginBottom:16 }}>
            <div>
              <span className="card-title">Top {cfg.itemsLabel}</span>
              <div style={{ fontSize:11.5, color:'var(--gray-400)', fontWeight:500, marginTop:2 }}>Best sellers this month</div>
            </div>
            <span style={{ fontSize:11.5, fontWeight:700, color:cfg.color, background:cfg.color+'15', border:`1px solid ${cfg.color}30`, padding:'4px 12px', borderRadius:20 }}>30 days</span>
          </div>
          {topTyres.length === 0 ? (
            <div className="empty-state" style={{ padding:'24px 0' }}><MdInventory2 /><p>No sales data</p></div>
          ) : (() => {
            const max = topTyres[0].qty;
            const rankColors = ['#f59e0b','#94a3b8','#cd7f32','#f97316','#f97316'];
            const rankBg    = ['#fef3c7','#f1f5f9','#fdf4e7','var(--orange-50)','var(--orange-50)'];
            return (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {topTyres.slice(0,5).map((t, i) => {
                  const pct = Math.round(t.qty / max * 100);
                  return (
                    <div key={i}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>

                        <div style={{ width:26, height:26, borderRadius:8, background:rankBg[i], display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:12, fontWeight:900, color:rankColors[i] }}>#{i+1}</span>
                        </div>

                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:13, color:'var(--gray-800)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {t.name}
                          </div>
                        </div>

                        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:'var(--gray-400)' }}>{currency}{fmt(t.revenue)}</span>
                          <span style={{ fontSize:13, fontWeight:900, color:'var(--orange)', minWidth:28, textAlign:'right' }}>{t.qty}</span>
                        </div>
                      </div>

                      <div style={{ height:7, borderRadius:4, background:'var(--gray-100)', overflow:'hidden', marginLeft:36 }}>
                        <div style={{
                          height:'100%', borderRadius:4,
                          width:`${pct}%`,
                          background: i === 0
                            ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                            : i === 1
                            ? 'linear-gradient(90deg,#94a3b8,#cbd5e1)'
                            : i === 2
                            ? 'linear-gradient(90deg,#cd7f32,#e8a96a)'
                            : 'linear-gradient(90deg,#f97316,#fb923c)',
                          transition:'width 1s cubic-bezier(0.4,0,0.2,1)',
                          boxShadow: i===0 ? '0 2px 8px rgba(245,158,11,0.4)' : i<3 ? 'none' : '0 2px 8px rgba(249,115,22,0.3)',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>


        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Sales</span>
            <Link to="/sales" className="btn btn-ghost btn-sm">View All <MdArrowForward /></Link>
          </div>
          {sales.length === 0 ? (
            <div className="empty-state"><MdShoppingCart /><p>No sales yet</p></div>
          ) : (() => {
            const totalPages = Math.ceil(sales.length / PAGE_SIZE);
            const pageSales = sales.slice(salesPage * PAGE_SIZE, salesPage * PAGE_SIZE + PAGE_SIZE);
            return (
              <>
                {isMobile ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {pageSales.map(s => (
                      <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
                        <div style={{ width:34, height:34, borderRadius:6, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'white', flexShrink:0 }}>
                          {s.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.customer_name}</div>
                          <div style={{ fontSize:11, color:'var(--gray-400)' }}>{s.payment_method} · {new Date(s.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                        <div style={{ fontWeight:900, color:'var(--orange)', fontSize:14, flexShrink:0 }}>{currency}{fmt(s.total)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Customer</th><th>Total</th><th>Method</th><th>Status</th></tr></thead>
                      <tbody>
                        {pageSales.map(s => (
                          <tr key={s.id}>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <div style={{ width:32, height:32, borderRadius:6, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'white', flexShrink:0, boxShadow:'0 2px 8px rgba(249,115,22,0.3)' }}>
                                  {s.customer_name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight:700, fontSize:13 }}>{s.customer_name}</div>
                                  <div style={{ fontSize:11, color:'var(--gray-400)', fontWeight:500 }}>{new Date(s.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontWeight:900, color:'var(--orange)', fontSize:14 }}>{currency}{fmt(s.total)}</td>
                            <td><span style={{ fontSize:12, color:pmColor[s.payment_method]||'var(--gray-400)', fontWeight:700 }}>{s.payment_method}</span></td>
                            <td><span className={`badge badge-${s.status==='completed'?'success':'warning'}`}>{s.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}


                {(() => {
                  const WINDOW = 3;

                  let winStart = Math.max(0, salesPage - Math.floor(WINDOW / 2));
                  let winEnd = winStart + WINDOW;
                  if (winEnd > totalPages) { winEnd = totalPages; winStart = Math.max(0, winEnd - WINDOW); }
                  const pageNums = Array.from({ length: winEnd - winStart }, (_, i) => winStart + i);
                  return (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:12, borderTop:'1px solid var(--gray-100)' }}>
                      <span style={{ fontSize:12, color:'var(--gray-400)', fontWeight:600 }}>
                        {salesPage * PAGE_SIZE + 1}–{Math.min((salesPage + 1) * PAGE_SIZE, sales.length)} of {sales.length}
                      </span>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>

                        <button onClick={() => setSalesPage(p => p - 1)} disabled={salesPage === 0}
                          style={{ width:32, height:32, borderRadius:9, border:'1.5px solid var(--gray-200)', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:salesPage===0?'not-allowed':'pointer', color:salesPage===0?'var(--gray-300)':'var(--gray-600)', fontSize:19, transition:'all 0.15s', flexShrink:0 }}
                          onMouseEnter={e => { if(salesPage!==0){ e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='var(--orange)'; }}}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color=salesPage===0?'var(--gray-300)':'var(--gray-600)'; }}
                        ><MdChevronLeft /></button>


                        {pageNums.map(i => (
                          <button key={i} onClick={() => setSalesPage(i)}
                            style={{ width:32, height:32, borderRadius:9, border:'1.5px solid', borderColor:salesPage===i?'var(--orange)':'var(--gray-200)', background:salesPage===i?'var(--orange)':'white', color:salesPage===i?'white':'var(--gray-500)', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit', flexShrink:0 }}
                            onMouseEnter={e => { if(salesPage!==i){ e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='var(--orange)'; }}}
                            onMouseLeave={e => { if(salesPage!==i){ e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color='var(--gray-500)'; }}}
                          >{i + 1}</button>
                        ))}


                        <button onClick={() => setSalesPage(p => p + 1)} disabled={salesPage === totalPages - 1}
                          style={{ width:32, height:32, borderRadius:9, border:'1.5px solid var(--gray-200)', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:salesPage===totalPages-1?'not-allowed':'pointer', color:salesPage===totalPages-1?'var(--gray-300)':'var(--gray-600)', fontSize:19, transition:'all 0.15s', flexShrink:0 }}
                          onMouseEnter={e => { if(salesPage!==totalPages-1){ e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='var(--orange)'; }}}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color=salesPage===totalPages-1?'var(--gray-300)':'var(--gray-600)'; }}
                        ><MdChevronRight /></button>
                      </div>
                    </div>
                  );
                })()}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
