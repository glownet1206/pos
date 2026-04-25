import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { MdSearch, MdClose, MdPayment, MdReceiptLong, MdHistory, MdCalendarToday, MdArrowUpward, MdArrowDownward, MdFilterList, MdAccountBalanceWallet, MdShowChart, MdEmojiEvents } from 'react-icons/md';
import { FaStore, FaRupeeSign } from 'react-icons/fa';
import { C } from './constants.jsx';

export default function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [sortDir,  setSortDir]  = useState('desc');
  const [page,     setPage]     = useState(0);
  const PER = 12;

  useEffect(() => {
    adminAPI.getRecentPayments().then(r => { setPayments(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = payments
    .filter(p => { const q = search.toLowerCase(); return !q || (p.user_name||'').toLowerCase().includes(q) || (p.business_name||'').toLowerCase().includes(q) || (p.note||'').toLowerCase().includes(q); })
    .sort((a, b) => sortDir === 'desc' ? b.amount - a.amount : a.amount - b.amount);

  const totalPages = Math.ceil(filtered.length / PER);
  const slice      = filtered.slice(page * PER, (page + 1) * PER);
  const totalAmt   = payments.reduce((s, p) => s + Number(p.amount), 0);
  const maxAmt     = payments.length ? Math.max(...payments.map(p => Number(p.amount))) : 1;
  const avgAmt     = payments.length ? totalAmt / payments.length : 0;
  const thisMonth  = payments.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth()).length;

  const statCards = [
    { label:'Total Collected', value:`Rs.${Number(totalAmt).toLocaleString('en-PK')}`, sub:`${payments.length} transactions`, Icon:MdAccountBalanceWallet, bg:'#fff7ed', iconBg:'#ffedd5', color:'#f97316', border:'#fed7aa' },
    { label:'Average Payment',  value:`Rs.${Math.round(avgAmt).toLocaleString('en-PK')}`, sub:'per transaction', Icon:MdShowChart, bg:'#f0fdf4', iconBg:'#dcfce7', color:'#22c55e', border:'#bbf7d0' },
    { label:'Highest Payment',  value:`Rs.${Number(maxAmt).toLocaleString('en-PK')}`, sub:'single transaction', Icon:MdEmojiEvents, bg:'#f5f3ff', iconBg:'#ede9fe', color:'#8b5cf6', border:'#ddd6fe' },
    { label:'This Month',       value: thisMonth, sub:'payments recorded', Icon:MdCalendarToday, bg:'#eff6ff', iconBg:'#dbeafe', color:'#3b82f6', border:'#bfdbfe' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
        {statCards.map(({ label, value, sub, Icon, bg, iconBg, color, border }) => (
          <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:8, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:iconBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon style={{ fontSize:18, color }} />
              </div>
              <span style={{ fontSize:10, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</span>
            </div>
            <div style={{ fontSize:20, fontWeight:900, color:'#1a1d23', letterSpacing:'-0.5px', marginBottom:3 }}>{value}</div>
            <div style={{ fontSize:11, color:'#9aa5b4' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'white', border:'1px solid #e8ecf0', borderRadius:8, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', background:'#fafbfc' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:140 }}>
            <MdReceiptLong style={{ fontSize:16, color:'#f97316' }} />
            <span style={{ fontWeight:700, fontSize:13, color:'#1a1d23' }}>All Payments</span>
          </div>
          <div style={{ position:'relative', flexShrink:0 }}>
            <MdSearch style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#9aa5b4', fontSize:15, pointerEvents:'none' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search user, business…"
              style={{ paddingLeft:30, paddingRight:search?28:10, paddingTop:7, paddingBottom:7, borderRadius:6, border:'1px solid #e8ecf0', fontSize:12.5, fontFamily:'inherit', outline:'none', width:200, color:'#1a1d23', background:'white' }}
              onFocus={e => e.target.style.borderColor='#f97316'}
              onBlur={e => e.target.style.borderColor='#e8ecf0'} />
            {search && <MdClose onClick={() => { setSearch(''); setPage(0); }} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:'#9aa5b4', fontSize:14, cursor:'pointer' }} />}
          </div>
          <button onClick={() => setSortDir(d => d==='desc'?'asc':'desc')}
            style={{ padding:'6px 12px', borderRadius:6, border:'1px solid #e8ecf0', background:'white', color:'#4a5568', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
            {sortDir==='desc' ? <><MdArrowDownward style={{ fontSize:13 }} /> Highest</> : <><MdArrowUpward style={{ fontSize:13 }} /> Lowest</>}
          </button>
          <div style={{ padding:'5px 10px', borderRadius:6, background:'#fff7ed', color:'#f97316', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, border:'1px solid #fed7aa' }}>
            <MdFilterList style={{ fontSize:13 }} />{filtered.length} records
          </div>
        </div>

        {loading ? (
          <div style={{ padding:56, textAlign:'center', color:C.textSoft, fontSize:13, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <MdPayment style={{ fontSize:32, opacity:0.3 }} />Loading payments…
          </div>
        ) : (
          <>
            {slice.length === 0 ? (
              <div style={{ padding:48, textAlign:'center' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, color:C.textSoft }}>
                  <MdPayment style={{ fontSize:36, opacity:0.25 }} />
                  <span style={{ fontSize:13 }}>{search ? 'No payments match your search' : 'No payments yet'}</span>
                </div>
              </div>
            ) : (
              <div>
                {slice.map((p, i) => {
                  const rowNum = page * PER + i + 1;
                  const barPct = Math.round((Number(p.amount) / maxAmt) * 100);
                  return (
                    <div key={p.id} style={{ padding:'11px 14px', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:11, color:'#9aa5b4', fontWeight:600, minWidth:18 }}>{rowNum}</span>
                      <div style={{ width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'white', flexShrink:0 }}>
                        {(p.user_name||'?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:'#1a1d23' }}>{p.user_name}</div>
                        {p.business_name && <div style={{ fontSize:11, color:'#f97316', marginTop:1 }}>{p.business_name}</div>}
                        {p.note && <div style={{ fontSize:11, color:'#9aa5b4', marginTop:1 }}>{p.note}</div>}
                        <div style={{ fontSize:10.5, color:'#9aa5b4', marginTop:1 }}>{new Date(p.created_at).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' })}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontWeight:800, color:'#22c55e', fontSize:13 }}>Rs.{Number(p.amount).toLocaleString('en-PK')}</div>
                        <div style={{ height:3, borderRadius:2, background:'#f0f2f5', marginTop:4, width:56, overflow:'hidden', marginLeft:'auto' }}>
                          <div style={{ height:'100%', width:`${barPct}%`, borderRadius:2, background:'#22c55e' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {totalPages > 1 && (
              <div style={{ padding:'10px 16px', borderTop:'1px solid #f0f2f5', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafbfc' }}>
                <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
                  style={{ padding:'6px 14px', borderRadius:6, border:'1px solid #e8ecf0', background:'white', cursor:page===0?'not-allowed':'pointer', color:page===0?'#9aa5b4':'#4a5568', fontWeight:600, fontSize:12, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, opacity:page===0?0.5:1 }}>
                  <MdArrowUpward style={{ transform:'rotate(-90deg)', fontSize:14 }} /> Prev
                </button>
                <div style={{ display:'flex', gap:4 }}>
                  {Array.from({ length: Math.min(totalPages,5) }, (_,i) => {
                    const pg = totalPages<=5 ? i : Math.max(0,Math.min(page-2,totalPages-5))+i;
                    return (
                      <button key={pg} onClick={() => setPage(pg)}
                        style={{ width:32, height:32, borderRadius:6, border:`1px solid ${pg===page?'#f97316':'#e8ecf0'}`, background:pg===page?'#fff7ed':'white', color:pg===page?'#f97316':'#4a5568', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:'inherit' }}>
                        {pg+1}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page===totalPages-1}
                  style={{ padding:'6px 14px', borderRadius:6, border:'1px solid #e8ecf0', background:'white', cursor:page===totalPages-1?'not-allowed':'pointer', color:page===totalPages-1?'#9aa5b4':'#4a5568', fontWeight:600, fontSize:12, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, opacity:page===totalPages-1?0.5:1 }}>
                  Next <MdArrowDownward style={{ transform:'rotate(-90deg)', fontSize:14 }} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
