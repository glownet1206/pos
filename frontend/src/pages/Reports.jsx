import { useEffect, useState } from 'react';
import { reportsAPI, sparePartsAPI } from '../api';
import {
  MdPrint, MdBarChart, MdInventory2, MdTrendingUp, MdShowChart,
  MdAttachMoney, MdDiscount, MdChevronLeft, MdChevronRight, MdAutoGraph, MdWarning
} from 'react-icons/md';
import { FaBoxOpen, FaChartLine, FaFire } from 'react-icons/fa';
import { GiTyre } from 'react-icons/gi';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart
} from 'recharts';
import ChartTip from '../components/reports/ChartTip';
import GradCard from '../components/reports/GradCard';
import CalendarWidget from '../components/reports/CalendarWidget';

const getCur = () => localStorage.getItem('inv_currency') || 'Rs.';

const PIE_COLORS = ['#f97316','#3b82f6','#10b981','#8b5cf6','#ef4444'];
const fmt = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtShort = n => { n=Number(n||0); if(n>=1000000) return `${(n/1000000).toFixed(1)}M`; if(n>=1000) return `${(n/1000).toFixed(1)}k`; return `${n.toFixed(0)}`; };


export default function Reports({ user }) {
  const [cur, setCur] = useState(getCur);
  useEffect(() => { const h = () => setCur(getCur()); window.addEventListener('storage', h); return () => window.removeEventListener('storage', h); }, []);
  const biz = user?.business_type || 'tyre_shop';
  const [salesRep, setSalesRep] = useState(null);
  const [invRep, setInvRep] = useState(null);
  const [spRep, setSpRep] = useState(null);
  const [payments, setPayments] = useState([]);
  const [yearly, setYearly] = useState(null);
  const [tab, setTab] = useState('sales');
  const [dailyPage, setDailyPage] = useState(0);
  const DAILY_PAGE_SIZE = 7;
  const [invPage, setInvPage] = useState(0);
  const INV_PAGE_SIZE = 5;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate()-30);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calDayData, setCalDayData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [yearPage, setYearPage] = useState(0);
  const YEAR_PAGE_SIZE = 4;

  useEffect(() => {
    setDailyPage(0);
    reportsAPI.getSales({ from, to }).then(r => setSalesRep(r.data));
    reportsAPI.getInventory().then(r => setInvRep(r.data));
    reportsAPI.getPaymentsChart().then(r => setPayments(r.data));
    if (biz === 'tyre_shop') sparePartsAPI.getSummary().then(r => setSpRep(r.data)).catch(() => {});
  }, [from, to]);

  useEffect(() => { reportsAPI.getYearly().then(r => setYearly(r.data)); }, []);

  useEffect(() => {
    if (tab !== 'yearly') return;
    setSelectedDay(null);
    const mm = String(calMonth).padStart(2,'0');
    const firstDay = `${calYear}-${mm}-01`;
    const lastDay = new Date(calYear, calMonth, 0);
    const lastStr = `${calYear}-${mm}-${String(lastDay.getDate()).padStart(2,'0')}`;
    reportsAPI.getSales({ from: firstDay, to: lastStr }).then(r => {
      const map = {};
      (r.data.daily || []).forEach(d => {
        // PostgreSQL returns date as Date object or string — normalize to YYYY-MM-DD
        const dateKey = d.date instanceof Date
          ? d.date.toISOString().split('T')[0]
          : String(d.date).split('T')[0];
        map[dateKey] = { ...d, date: dateKey };
      });
      setCalDayData({ dailyMap: map });
    });
  }, [tab, calYear, calMonth]);

  const Pagination = ({ page, setPage, total, pageSize }) => {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
    const WINDOW = 3;
    let ws = Math.max(0, page - Math.floor(WINDOW/2));
    let we = ws + WINDOW;
    if (we > totalPages) { we = totalPages; ws = Math.max(0, we - WINDOW); }
    const nums = Array.from({ length: we - ws }, (_, i) => ws + i);
    const btn = (active, dis) => ({ width:32, height:32, borderRadius:9, border:`1.5px solid ${active?'var(--orange)':'var(--gray-200)'}`, background:active?'var(--orange)':'white', color:active?'white':dis?'var(--gray-300)':'var(--gray-600)', fontSize:active?13:19, fontWeight:700, cursor:dis?'not-allowed':'pointer', transition:'all 0.15s', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center' });
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:12, borderTop:'1px solid var(--gray-100)' }}>
        <span style={{ fontSize:12, color:'var(--gray-400)', fontWeight:600 }}>{page*pageSize+1}-{Math.min((page+1)*pageSize,total)} of {total}</span>
        <div style={{ display:'flex', gap:4 }}>
          <button style={btn(false,page===0)} disabled={page===0} onClick={()=>setPage(p=>p-1)}><MdChevronLeft /></button>
          {nums.map(i => <button key={i} style={btn(page===i,false)} onClick={()=>setPage(i)}>{i+1}</button>)}
          <button style={btn(false,page===totalPages-1)} disabled={page===totalPages-1} onClick={()=>setPage(p=>p+1)}><MdChevronRight /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="page print-area">
      <div className="page-header">
        <div><h1>Reports</h1><p>Sales &amp; inventory analytics</p></div>
        <button className="btn btn-secondary no-print" onClick={() => window.print()}><MdPrint />Print</button>
      </div>
      <div className="filter-tabs mb-4" style={{ flexWrap: 'wrap' }}>
        <button className={`filter-tab ${tab==='sales'?'active':''}`} onClick={() => setTab('sales')}>{isMobile ? 'Sales' : 'Sales Report'}</button>
        <button className={`filter-tab ${tab==='inventory'?'active':''}`} onClick={() => setTab('inventory')}>{isMobile ? 'Inventory' : 'Inventory Report'}</button>
        <button className={`filter-tab ${tab==='yearly'?'active':''}`} onClick={() => setTab('yearly')}>{isMobile ? 'Yearly' : 'Yearly Overview'}</button>
      </div>


      {tab === 'sales' && salesRep && (
        <>
          <div style={{ display:'flex', gap:12, marginBottom:24, alignItems:'flex-end', flexWrap:'wrap' }}>
            <div className="form-group" style={{ marginBottom:0, flex:'1 1 140px' }}><label className="form-label">From</label><input type="date" className="form-control" value={from} onChange={e=>setFrom(e.target.value)} /></div>
            <div className="form-group" style={{ marginBottom:0, flex:'1 1 140px' }}><label className="form-label">To</label><input type="date" className="form-control" value={to} onChange={e=>setTo(e.target.value)} /></div>
            <div style={{ display:'flex', gap:6, paddingBottom:2, flexWrap:'wrap' }}>
              {[['7D',7],['30D',30],['90D',90]].map(([lbl,days]) => (
                <button key={lbl} onClick={() => {
                  const d=new Date(); d.setDate(d.getDate()-days);
                  const fmt = x => `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
                  setFrom(fmt(d));
                  const t=new Date(); setTo(fmt(t));
                }}
                  style={{ padding:'8px 14px', borderRadius:8, border:'1.5px solid var(--gray-200)', background:'white', color:'var(--gray-500)', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--orange)';e.currentTarget.style.color='var(--orange)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--gray-200)';e.currentTarget.style.color='var(--gray-500)';}}
                >{lbl}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            <GradCard label="Total Sales" value={salesRep.summary.totalSales} icon={MdBarChart} gradient="linear-gradient(135deg,#3b82f6,#2563eb)" shadow="0 8px 24px rgba(59,130,246,0.3)" />
            <GradCard label="Revenue" value={`${cur}${fmt(salesRep.summary.revenue)}`} icon={MdAttachMoney} gradient="linear-gradient(135deg,#f97316,#ea580c)" shadow="0 8px 24px rgba(249,115,22,0.3)" />
            <GradCard label="Discounts" value={`${cur}${fmt(salesRep.summary.totalDiscount)}`} icon={MdDiscount} gradient="linear-gradient(135deg,#ef4444,#dc2626)" shadow="0 8px 24px rgba(239,68,68,0.3)" />
            <GradCard label="Tax Collected" value={`${cur}${fmt(salesRep.summary.totalTax)}`} icon={MdTrendingUp} gradient="linear-gradient(135deg,#10b981,#059669)" shadow="0 8px 24px rgba(16,185,129,0.3)" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:18, marginBottom:24 }}>
            <div className="card">
              <div className="card-header"><span className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}><MdShowChart style={{ color:'var(--orange)', fontSize:18 }} />Revenue Trend</span></div>
              {salesRep.daily.length === 0 ? <div className="empty-state"><FaBoxOpen /><p>No data</p></div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={salesRep.daily} margin={{ top:4, right:4, left:-16, bottom:0 }}>
                    <defs><linearGradient id="rRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.25} /><stop offset="100%" stopColor="#f97316" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize:10, fill:'#9ca3af', fontWeight:600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="revenue" name="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#rRev)" dot={false} activeDot={{ r:5, fill:'#f97316', strokeWidth:0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title" style={{ display:'flex', alignItems:'center', gap:8 }}><MdBarChart style={{ color:'#3b82f6', fontSize:18 }} />Daily Sales</span></div>
              {salesRep.daily.length === 0 ? <div className="empty-state"><FaBoxOpen /><p>No data</p></div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salesRep.daily} margin={{ top:4, right:4, left:-16, bottom:0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize:10, fill:'#9ca3af', fontWeight:600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="sales" name="sales" radius={[6,6,0,0]} maxBarSize={32}>
                      {salesRep.daily.map((_,i) => <Cell key={i} fill={i===salesRep.daily.length-1?'#f97316':'#bfdbfe'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:18, marginBottom:24 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Payment Methods</span></div>
              {payments.length === 0 ? <div className="empty-state"><FaBoxOpen /><p>No data</p></div> : (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart><Pie data={payments} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>{payments.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} stroke="none" />)}</Pie><Tooltip formatter={(v,n)=>[v,n]} /></PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
                    {payments.map((p,i) => { const tot=payments.reduce((a,x)=>a+x.value,0); const pct=Math.round(p.value/tot*100); return (
                      <div key={p.name}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, fontWeight:600, color:'var(--gray-600)', marginBottom:4 }}>
                          <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[i%PIE_COLORS.length], display:'inline-block' }} />{p.name}</span>
                          <span style={{ fontWeight:800, color:'var(--gray-800)' }}>{p.value} ({pct}%)</span>
                        </div>
                        <div style={{ height:5, borderRadius:3, background:'var(--gray-100)', overflow:'hidden' }}><div style={{ height:'100%', width:`${pct}%`, background:PIE_COLORS[i%PIE_COLORS.length], borderRadius:3 }} /></div>
                      </div>
                    ); })}
                  </div>
                </>
              )}
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Top Selling Items</span></div>
              {salesRep.topTyres.length === 0 ? <div className="empty-state"><FaBoxOpen /><p>No data</p></div> : (
                <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:4 }}>
                  {salesRep.topTyres.map((t,i) => { const pct=Math.round(t.qty/salesRep.topTyres[0].qty*100); return (
                    <div key={i}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, fontWeight:600, marginBottom:5 }}>
                        <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:22, height:22, borderRadius:6, background:i===0?'#fef3c7':'var(--gray-100)', color:i===0?'#d97706':'var(--gray-500)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900 }}>{i+1}</span>
                          <span style={{ color:'var(--gray-700)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{t.name}</span>
                        </span>
                        <span style={{ fontWeight:800, color:'var(--orange)', flexShrink:0 }}>{t.qty} sold</span>
                      </div>
                      <div style={{ height:6, borderRadius:3, background:'var(--gray-100)', overflow:'hidden' }}><div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#f97316,#ea580c)', borderRadius:3 }} /></div>
                    </div>
                  ); })}
                </div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Daily Breakdown</span></div>
            {salesRep.daily.length === 0 ? <div className="empty-state"><FaBoxOpen /><p>No data</p></div> : (() => {
              const sorted = [...salesRep.daily].reverse();
              const pageData = sorted.slice(dailyPage*DAILY_PAGE_SIZE,(dailyPage+1)*DAILY_PAGE_SIZE);
              return (
                <>
                  <div className="table-wrap"><table><thead><tr><th>Date</th><th>Sales</th><th>Revenue</th><th>Cost</th><th>Profit</th></tr></thead><tbody>{pageData.map(d=>(<tr key={d.date}><td style={{ fontWeight:600 }}>{d.date}</td><td><span className="badge badge-info">{d.sales}</span></td><td style={{ fontWeight:800, color:'var(--orange)' }}>{cur}{fmt(d.revenue)}</td><td style={{ fontWeight:600, color:'var(--gray-500)' }}>{d.cost > 0 ? `${cur}${fmt(d.cost)}` : '—'}</td><td style={{ fontWeight:800, color: d.cost > 0 ? (d.profit >= 0 ? '#10b981' : '#ef4444') : 'var(--gray-400)' }}>{d.cost > 0 ? `${cur}${fmt(d.profit)}` : '—'}</td></tr>))}</tbody></table></div>
                  <Pagination page={dailyPage} setPage={setDailyPage} total={sorted.length} pageSize={DAILY_PAGE_SIZE} />
                </>
              );
            })()}
          </div>
        </>
      )}


      {tab === 'inventory' && invRep && (
        <>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            <GradCard
              label={biz === 'restaurant' ? 'Total Menu Items' : biz === 'pharmacy' ? 'Total Medicines' : biz === 'general_store' ? 'Total Products' : 'Total Tyres'}
              value={invRep.all.length} icon={MdInventory2} gradient="linear-gradient(135deg,#3b82f6,#2563eb)" shadow="0 8px 24px rgba(59,130,246,0.3)" />
            <GradCard
              label={biz === 'restaurant' ? 'Available Items' : biz === 'pharmacy' ? 'Medicine Stock' : biz === 'general_store' ? 'Product Stock' : 'Tyre Stock'}
              value={biz === 'restaurant' ? invRep.all.filter(i => i.available === 1 || i.available === '1').length : invRep.all.reduce((s,t)=>s+(t.stock||0),0)}
              icon={MdBarChart} gradient="linear-gradient(135deg,#f97316,#ea580c)" shadow="0 8px 24px rgba(249,115,22,0.3)" />
            <GradCard
              label={biz === 'restaurant' ? 'Unavailable Items' : 'Low Stock'}
              value={biz === 'restaurant' ? invRep.outOfStock.length : invRep.lowStock.length}
              icon={MdWarning} gradient="linear-gradient(135deg,#ef4444,#dc2626)" shadow="0 8px 24px rgba(239,68,68,0.3)" />
            <GradCard label="Inventory Value" value={`${cur}${fmt(invRep.totalValue)}`} icon={MdTrendingUp} gradient="linear-gradient(135deg,#10b981,#059669)" shadow="0 8px 24px rgba(16,185,129,0.3)" />
          </div>
          {spRep && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
              <GradCard label="Total Parts" value={spRep.total||0} icon={MdInventory2} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" shadow="0 8px 24px rgba(139,92,246,0.3)" />
              <GradCard label="Parts Stock" value={spRep.totalStock||0} icon={MdBarChart} gradient="linear-gradient(135deg,#06b6d4,#0891b2)" shadow="0 8px 24px rgba(6,182,212,0.3)" />
              <GradCard label="Parts Low Stock" value={spRep.lowStock||0} icon={MdWarning} gradient="linear-gradient(135deg,#f59e0b,#d97706)" shadow="0 8px 24px rgba(245,158,11,0.3)" />
              <GradCard label="Parts Value" value={`${cur}${fmt(spRep.totalValue||0)}`} icon={MdTrendingUp} gradient="linear-gradient(135deg,#ec4899,#db2777)" shadow="0 8px 24px rgba(236,72,153,0.3)" />
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:18, marginBottom:24 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Stock by Category</span></div>
              {(() => {
                const groupKey = biz === 'tyre_shop' ? 'brand' : 'category';
                const grouped = invRep.all.reduce((acc,t) => {
                  const k = t[groupKey] || 'Other';
                  const val = biz === 'restaurant'
                    ? (t.available === 1 || t.available === '1' ? 1 : 0)
                    : (t.stock || 0);
                  acc[k] = (acc[k] || 0) + val;
                  return acc;
                }, {});
                const bd = Object.entries(grouped).map(([name,stock])=>({name,stock})).sort((a,b)=>b.stock-a.stock).slice(0,8);
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={bd} margin={{ top:4, right:4, left:-16, bottom:0 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize:10.5, fill:'#9ca3af', fontWeight:600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:10, fill:'#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip formatter={v=>[v,'units']} />
                      <Bar dataKey="stock" radius={[6,6,0,0]} maxBarSize={40}>{bd.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Stock Status</span></div>
              {(() => {
                const inStock = invRep.all.length - invRep.lowStock.length - invRep.outOfStock.length;
                const pd = [{name:'In Stock',value:Math.max(0,inStock)},{name:'Low Stock',value:invRep.lowStock.length},{name:'Out of Stock',value:invRep.outOfStock.length}].filter(d=>d.value>0);
                const colors = ['#10b981','#f97316','#ef4444'];
                const tot = pd.reduce((a,x)=>a+x.value,0);
                return (
                  <>
                    <ResponsiveContainer width="100%" height={170}><PieChart><Pie data={pd} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>{pd.map((_,i)=><Cell key={i} fill={colors[i]} stroke="none" />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
                      {pd.map((p,i) => { const pct=Math.round(p.value/tot*100); return (
                        <div key={p.name}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, fontWeight:600, color:'var(--gray-600)', marginBottom:4 }}>
                            <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:colors[i], display:'inline-block' }} />{p.name}</span>
                            <span style={{ fontWeight:800, color:'var(--gray-800)' }}>{p.value} ({pct}%)</span>
                          </div>
                          <div style={{ height:5, borderRadius:3, background:'var(--gray-100)', overflow:'hidden' }}><div style={{ height:'100%', width:`${pct}%`, background:colors[i], borderRadius:3 }} /></div>
                        </div>
                      ); })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          {invRep.lowStock.length > 0 && (
            <div className="card mb-4">
              <div className="card-header"><span className="card-title" style={{ color:'var(--orange)' }}>Low Stock Items</span></div>
              {isMobile ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {invRep.lowStock.map(t => (
                    <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:10, background:'#fff7ed', border:'1px solid #fed7aa' }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:13 }}>{t.name || `${t.brand||''} ${t.model||''}`}</div>
                        <div style={{ fontSize:12, color:'var(--gray-500)', marginTop:2 }}>{t.category || t.size || ''}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span className="badge badge-warning">{t.stock}</span>
                        <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:3 }}>min {t.low_stock_threshold || 10}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="table-wrap"><table><thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Min</th></tr></thead><tbody>{invRep.lowStock.map(t=>(<tr key={t.id}><td style={{ fontWeight:800 }}>{t.name||`${t.brand||''} ${t.model||''}`}</td><td>{t.category||t.size||'—'}</td><td><span className="badge badge-warning">{t.stock}</span></td><td className="text-muted">{t.low_stock_threshold||10}</td></tr>))}</tbody></table></div>
              )}
            </div>
          )}
          <div className="card">
            <div className="card-header"><span className="card-title">Full Inventory</span></div>
            {(() => {
              const totalPages = Math.ceil(invRep.all.length / INV_PAGE_SIZE);
              const pg = Math.min(invPage, Math.max(0, totalPages - 1));
              const paged = invRep.all.slice(pg * INV_PAGE_SIZE, (pg + 1) * INV_PAGE_SIZE);
              return (
                <>
                  {isMobile ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {paged.map(t => (
                        <div key={t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:10, background:'var(--gray-50)', border:'1px solid var(--gray-100)' }}>
                          <div>
                            <div style={{ fontWeight:800, fontSize:13 }}>{t.name || `${t.brand||''} ${t.model||''}`}</div>
                            <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                              {(t.category||t.size) && <span style={{ fontSize:11, fontWeight:600, color:'var(--gray-600)', background:'var(--gray-100)', borderRadius:5, padding:'1px 6px' }}>{t.category||t.size}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div style={{ fontWeight:800, color:'var(--orange)', fontSize:13 }}>{cur}{Number(t.price||0).toFixed(2)}</div>
                            {biz === 'restaurant'
                              ? <span className={`badge badge-${t.available==1?'success':'danger'}`} style={{ fontSize:10, marginTop:2 }}>{t.available==1?'Available':'Unavailable'}</span>
                              : <><div style={{ fontSize:11, color:'var(--gray-500)', marginTop:2 }}>Qty: {t.stock}</div>
                                 <div style={{ fontSize:11, color:'var(--gray-400)' }}>Val: {cur}{((t.price||0)*t.stock).toFixed(2)}</div></>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    biz === 'restaurant' ? (
                      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Category</th><th>Size</th><th>Price</th><th>Status</th></tr></thead><tbody>{paged.map(t=>(<tr key={t.id}><td style={{ fontWeight:800 }}>{t.name}</td><td>{t.category||'—'}</td><td>{t.size||'—'}</td><td style={{ color:'var(--orange)', fontWeight:700 }}>{cur}{Number(t.price||0).toFixed(2)}</td><td><span className={`badge badge-${t.available==1?'success':'danger'}`}>{t.available==1?'Available':'Unavailable'}</span></td></tr>))}</tbody></table></div>
                    ) : (
                      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Value</th></tr></thead><tbody>{paged.map(t=>(<tr key={t.id}><td style={{ fontWeight:800 }}>{t.name||`${t.brand||''} ${t.model||''}`}</td><td>{t.category||t.size||'—'}</td><td style={{ color:'var(--orange)', fontWeight:700 }}>{cur}{Number(t.price||0).toFixed(2)}</td><td style={{ fontWeight:700 }}>{t.stock}</td><td style={{ fontWeight:600 }}>{cur}{(Number(t.price||0)*Number(t.stock||0)).toFixed(2)}</td></tr>))}</tbody></table></div>
                    )
                  )}
                  <Pagination page={pg} setPage={setInvPage} total={invRep.all.length} pageSize={INV_PAGE_SIZE} />
                </>
              );
            })()}
          </div>
        </>
      )}


      {tab === 'yearly' && (
        <>
          {!yearly ? <div className="spinner" /> : (
            <>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:14, marginBottom:24 }}>
                <GradCard
                  label={biz === 'restaurant' ? 'Total Menu Items' : biz === 'pharmacy' ? 'Total Medicines' : biz === 'general_store' ? 'Total Products' : 'Total Products'}
                  value={yearly.totalProducts} sub="In catalogue" icon={GiTyre} gradient="linear-gradient(135deg,#f97316,#ea580c)" shadow="0 8px 24px rgba(249,115,22,0.3)" />
                <GradCard
                  label={biz === 'restaurant' ? 'Available Items' : 'Current Stock'}
                  value={yearly.currentStock}
                  sub={biz === 'restaurant' ? 'On menu' : 'Units available'}
                  icon={MdInventory2} gradient="linear-gradient(135deg,#3b82f6,#2563eb)" shadow="0 8px 24px rgba(59,130,246,0.3)" />
                <GradCard
                  label={biz === 'restaurant' ? 'Menu Value' : 'Inventory Value'}
                  value={fmtShort(yearly.inventoryValue)}
                  sub={biz === 'restaurant' ? 'Total menu price' : 'Stock worth'}
                  icon={MdAttachMoney} gradient="linear-gradient(135deg,#10b981,#059669)" shadow="0 8px 24px rgba(16,185,129,0.3)" />
                <GradCard label="All-Time Revenue" value={fmtShort(yearly.yearly.reduce((a,y)=>a+y.revenue,0))} sub="Total earned" icon={FaChartLine} gradient="linear-gradient(135deg,#8b5cf6,#7c3aed)" shadow="0 8px 24px rgba(139,92,246,0.3)" />
              </div>

              {yearly.yearly.length === 0 ? (
                <div className="card"><div className="empty-state"><FaChartLine /><p>No yearly data yet</p></div></div>
              ) : (
                <>

                  {(() => {
                    const chartData = [...yearly.yearly].reverse();
                    const totalRev = yearly.yearly.reduce((a,y)=>a+y.revenue,0);
                    const totalProfit = yearly.yearly.reduce((a,y)=>a+y.profit,0);
                    const bestYear = yearly.yearly[0];
                    const DarkTip = ({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const dataPoint = payload[0]?.payload || {};
                      const displayLabel = dataPoint.year || dataPoint.date || label || dataPoint.name;
                      return (
                        <div style={{ background:'rgba(17,24,39,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'12px 16px', boxShadow:'0 16px 40px rgba(0,0,0,0.4)', backdropFilter:'blur(12px)' }}>
                          <div style={{ fontSize:12, fontWeight:800, color:'rgba(255,255,255,0.5)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.8px' }}>{displayLabel}</div>
                          {payload.map((p, idx) => {
                            let value = p.value;
                            if (value === null || value === undefined) {
                              value = dataPoint[p.dataKey] || dataPoint[p.name] || 0;
                            }
                            return (
                              <div key={`${p.name || p.dataKey}-${idx}`} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:20, marginBottom:4 }}>
                                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)' }}>
                                  <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block', boxShadow:`0 0 6px ${p.color}` }} />{p.name}
                                </span>
                                <span style={{ fontSize:13, fontWeight:900, color:p.color }}>{cur}{fmt(value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    };
                    return (
                      <div style={{ borderRadius:20, background:'linear-gradient(145deg,#0f172a,#1e293b)', padding:'24px', marginBottom:20, boxShadow:'0 8px 40px rgba(0,0,0,0.25)', position:'relative', overflow:'hidden' }}>

                        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(249,115,22,0.15),transparent 70%)', pointerEvents:'none' }} />
                        <div style={{ position:'absolute', bottom:-40, left:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.12),transparent 70%)', pointerEvents:'none' }} />


                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12, position:'relative' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(249,115,22,0.5)' }}>
                              <MdAutoGraph style={{ color:'white', fontSize:22 }} />
                            </div>
                            <div>
                              <div style={{ fontSize:16, fontWeight:900, color:'white' }}>Revenue &amp; Profit Trend</div>
                              <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.4)', marginTop:2 }}>Year-over-year performance</div>
                            </div>
                          </div>

                          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                            {[
                              { label:'Total Revenue', value:`${cur}${fmtShort(totalRev)}`, color:'#f97316', bg:'rgba(249,115,22,0.15)', border:'rgba(249,115,22,0.3)' },
                              { label:'Total Profit', value:`${cur}${fmtShort(totalProfit)}`, color:'#10b981', bg:'rgba(16,185,129,0.15)', border:'rgba(16,185,129,0.3)' },
                              { label:'Best Year', value:bestYear?.year||'—', color:'#a78bfa', bg:'rgba(167,139,250,0.15)', border:'rgba(167,139,250,0.3)' },
                            ].map(s => (
                              <div key={s.label} style={{ padding:'6px 14px', borderRadius:20, background:s.bg, border:`1px solid ${s.border}` }}>
                                <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</div>
                                <div style={{ fontSize:14, fontWeight:900, color:s.color, lineHeight:1.2 }}>{s.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>


                        <div style={{ display:'flex', gap:20, marginBottom:16, position:'relative' }}>
                          {[['Revenue','#f97316'],['Profit','#10b981']].map(([name,color]) => (
                            <span key={name} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)' }}>
                              <span style={{ width:24, height:3, borderRadius:2, background:color, display:'inline-block', boxShadow:`0 0 8px ${color}` }} />{name}
                            </span>
                          ))}
                        </div>


                        <ResponsiveContainer width="100%" height={240}>
                          <ComposedChart data={chartData} margin={{ top:10, right:10, left:0, bottom:0 }}>
                            <defs>
                              <linearGradient id="darkRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="darkPro" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                              <filter id="glow-orange"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                              <filter id="glow-green"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis dataKey="year" tick={{ fontSize:12, fill:'rgba(255,255,255,0.4)', fontWeight:700 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize:10, fill:'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                            <Tooltip content={<DarkTip />} />
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" strokeWidth={3} fill="url(#darkRev)"
                              dot={{ r:5, fill:'#f97316', strokeWidth:2, stroke:'rgba(249,115,22,0.4)' }}
                              activeDot={{ r:8, fill:'#f97316', strokeWidth:3, stroke:'rgba(249,115,22,0.4)' }}
                              filter="url(#glow-orange)"
                            />
                            <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={3} fill="url(#darkPro)"
                              dot={{ r:5, fill:'#10b981', strokeWidth:2, stroke:'rgba(16,185,129,0.4)' }}
                              activeDot={{ r:8, fill:'#10b981', strokeWidth:3, stroke:'rgba(16,185,129,0.4)' }}
                              filter="url(#glow-green)"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}


                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20, marginBottom:20 }}>
                    <CalendarWidget
                      calYear={calYear} setCalYear={setCalYear}
                      calMonth={calMonth} setCalMonth={setCalMonth}
                      calDayData={calDayData}
                      selectedDay={selectedDay} setSelectedDay={setSelectedDay}
                    />


                    <div className="card" style={{ padding:'20px', display:'flex', flexDirection:'column' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:'#111827', display:'flex', alignItems:'center', gap:8 }}>
                          <MdBarChart style={{ color:'#f97316', fontSize:18 }} />Year Summary
                        </div>
                        <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>{yearly.yearly.length} years total</span>
                      </div>
                      {(() => {
                        const totalPages = Math.ceil(yearly.yearly.length / YEAR_PAGE_SIZE);
                        const pageData = yearly.yearly.slice(yearPage * YEAR_PAGE_SIZE, (yearPage + 1) * YEAR_PAGE_SIZE);
                        return (
                          <>
                            <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
                              {pageData.map((y, i) => {
                                const globalIdx = yearPage * YEAR_PAGE_SIZE + i;
                                const maxRev = yearly.yearly[0]?.revenue || 1;
                                const pct = Math.round((y.revenue / maxRev) * 100);
                                const isCurrent = globalIdx === 0;
                                return (
                                  <div key={y.year} style={{ borderRadius:14, border:`1.5px solid ${isCurrent?'#fed7aa':'#f1f5f9'}`, padding:'14px 16px', background:isCurrent?'#fff7ed':'white', transition:'all 0.2s' }}
                                    onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
                                    onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
                                  >
                                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                        <div style={{ width:38, height:38, borderRadius:10, background:isCurrent?'linear-gradient(135deg,#f97316,#ea580c)':'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:isCurrent?'0 4px 12px rgba(249,115,22,0.3)':'none' }}>
                                          {isCurrent ? <FaFire style={{ color:'white', fontSize:16 }} /> : <span style={{ fontSize:13, fontWeight:900, color:'#6b7280' }}>{y.year}</span>}
                                        </div>
                                        <div>
                                          <div style={{ fontSize:14, fontWeight:900, color:'#111827' }}>{y.year} {isCurrent && <span style={{ fontSize:10, background:'#fff7ed', color:'#f97316', border:'1px solid #fed7aa', padding:'1px 7px', borderRadius:20, marginLeft:4 }}>Current</span>}</div>
                                          <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{y.totalSales} sales · {y.unitsSold} units</div>
                                        </div>
                                      </div>
                                      <div style={{ textAlign:'right' }}>
                                        <div style={{ fontSize:16, fontWeight:900, color:'#f97316' }}>{fmtShort(y.revenue)}</div>
                                        <div style={{ fontSize:11, color:'#10b981', fontWeight:700 }}>+{fmtShort(y.profit)} profit</div>
                                      </div>
                                    </div>
                                    <div style={{ height:6, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
                                      <div style={{ height:'100%', width:`${pct}%`, background:isCurrent?'linear-gradient(90deg,#f97316,#ea580c)':'linear-gradient(90deg,#94a3b8,#cbd5e1)', borderRadius:4, transition:'width 0.8s ease' }} />
                                    </div>
                                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10.5, color:'#9ca3af', fontWeight:600 }}>
                                      <span>Discount: <span style={{ color:'#ef4444' }}>-{fmtShort(y.totalDiscount)}</span></span>
                                      <span>Tax: <span style={{ color:'#8b5cf6' }}>{fmtShort(y.totalTax)}</span></span>
                                      <span>Avg: <span style={{ color:'#3b82f6' }}>{fmtShort(y.totalSales>0?y.revenue/y.totalSales:0)}</span></span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {totalPages > 1 && (
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
                                <span style={{ fontSize:11.5, color:'#9ca3af', fontWeight:600 }}>
                                  {yearPage*YEAR_PAGE_SIZE+1}–{Math.min((yearPage+1)*YEAR_PAGE_SIZE, yearly.yearly.length)} of {yearly.yearly.length}
                                </span>
                                <div style={{ display:'flex', gap:4 }}>
                                  <button
                                    disabled={yearPage===0}
                                    onClick={()=>setYearPage(p=>p-1)}
                                    style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #e5e7eb', background:'white', color:yearPage===0?'#d1d5db':'#374151', cursor:yearPage===0?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, transition:'all 0.15s' }}
                                  ><MdChevronLeft /></button>
                                  {Array.from({length:totalPages},(_,i)=>i).map(i=>(
                                    <button key={i} onClick={()=>setYearPage(i)}
                                      style={{ width:30, height:30, borderRadius:8, border:`1.5px solid ${yearPage===i?'#f97316':'#e5e7eb'}`, background:yearPage===i?'linear-gradient(135deg,#f97316,#ea580c)':'white', color:yearPage===i?'white':'#374151', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', boxShadow:yearPage===i?'0 2px 8px rgba(249,115,22,0.35)':'none' }}
                                    >{i+1}</button>
                                  ))}
                                  <button
                                    disabled={yearPage===totalPages-1}
                                    onClick={()=>setYearPage(p=>p+1)}
                                    style={{ width:30, height:30, borderRadius:8, border:'1.5px solid #e5e7eb', background:'white', color:yearPage===totalPages-1?'#d1d5db':'#374151', cursor:yearPage===totalPages-1?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, transition:'all 0.15s' }}
                                  ><MdChevronRight /></button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>


                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20 }}>
                    <div className="card" style={{ padding:'20px 24px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                        <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center' }}><MdAttachMoney style={{ color:'white', fontSize:17 }} /></div>
                        <div style={{ fontSize:13, fontWeight:900, color:'#111827' }}>Revenue by Year</div>
                      </div>
                      <ResponsiveContainer width="100%" height={Math.max(yearly.yearly.length * 50, 80)}>
                        <BarChart data={[...yearly.yearly].reverse()} layout="vertical" margin={{ top:0, right:8, left:0, bottom:0 }} barCategoryGap="30%">
                          <defs><linearGradient id="revH" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#fdba74" /></linearGradient></defs>
                          <XAxis type="number" tick={{ fontSize:9, fill:'#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:`${v}`} />
                          <YAxis type="category" dataKey="year" tick={{ fontSize:12, fill:'#374151', fontWeight:700 }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip formatter={v=>[`${cur}${fmt(v)}`,'Revenue']} contentStyle={{ borderRadius:10, fontSize:11, border:'1px solid #e5e7eb' }} cursor={{ fill:'rgba(249,115,22,0.06)' }} />
                          <Bar dataKey="revenue" fill="url(#revH)" radius={[0,8,8,0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="card" style={{ padding:'20px 24px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                        <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center' }}><MdTrendingUp style={{ color:'white', fontSize:17 }} /></div>
                        <div style={{ fontSize:13, fontWeight:900, color:'#111827' }}>Profit by Year</div>
                      </div>
                      <ResponsiveContainer width="100%" height={Math.max(yearly.yearly.length * 50, 80)}>
                        <BarChart data={[...yearly.yearly].reverse()} layout="vertical" margin={{ top:0, right:8, left:0, bottom:0 }} barCategoryGap="30%">
                          <defs><linearGradient id="proH" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#6ee7b7" /></linearGradient></defs>
                          <XAxis type="number" tick={{ fontSize:9, fill:'#d1d5db' }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:`${v}`} />
                          <YAxis type="category" dataKey="year" tick={{ fontSize:12, fill:'#374151', fontWeight:700 }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip formatter={v=>[`${cur}${fmt(v)}`,'Profit']} contentStyle={{ borderRadius:10, fontSize:11, border:'1px solid #e5e7eb' }} cursor={{ fill:'rgba(16,185,129,0.06)' }} />
                          <Bar dataKey="profit" fill="url(#proH)" radius={[0,8,8,0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}





