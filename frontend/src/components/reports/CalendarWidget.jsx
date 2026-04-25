import { MdChevronLeft, MdChevronRight, MdCalendarMonth } from 'react-icons/md';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmt = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtShort = n => { n=Number(n||0); if(n>=1000000) return `${(n/1000000).toFixed(1)}M`; if(n>=1000) return `${(n/1000).toFixed(1)}k`; return n.toFixed(0); };

export default function CalendarWidget({ calYear, setCalYear, calMonth, setCalMonth, calDayData, selectedDay, setSelectedDay }) {
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const firstDow    = new Date(calYear, calMonth - 1, 1).getDay();
  const mm2         = String(calMonth).padStart(2,'0');
  const dayKey      = d => `${calYear}-${mm2}-${String(d).padStart(2,'0')}`;
  const todayStr    = new Date().toISOString().split('T')[0];
  const selData     = selectedDay ? calDayData?.dailyMap[dayKey(selectedDay)] : null;

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => { if(calMonth===1){setCalMonth(12);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); };
  const nextMonth = () => { if(calMonth===12){setCalMonth(1);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); };

  return (
    <div style={{ borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(249,115,22,0.13)', border:'1.5px solid #ffe4cc', background:'white' }}>
      <div style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={prevMonth} style={{ width:24, height:24, borderRadius:6, border:'1.5px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.15)', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}><MdChevronLeft /></button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:13, fontWeight:900, color:'white', letterSpacing:'0.3px' }}>{MONTH_FULL[calMonth-1]}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>{calYear}</div>
        </div>
        <button onClick={nextMonth} style={{ width:24, height:24, borderRadius:6, border:'1.5px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.15)', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}><MdChevronRight /></button>
      </div>

      <div style={{ padding:'8px 10px 10px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
          {['S','M','T','W','T','F','S'].map((d,i) => (
            <div key={i} style={{ textAlign:'center', fontSize:9, fontWeight:800, color:'#cbd5e1' }}>{d}</div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const key   = dayKey(d);
            const data  = calDayData?.dailyMap[key];
            const isSel = selectedDay === d;
            const isToday = key === todayStr;
            return (
              <button key={key}
                onClick={() => setSelectedDay(isSel ? null : d)}
                title={data ? `${data.sales} sales · ${localStorage.getItem('inv_currency')||'Rs.'}${fmt(data.revenue)}` : ''}
                style={{
                  height:30, borderRadius:6, border:'none', padding:0, margin:0,
                  background: isSel ? 'linear-gradient(135deg,#f97316,#ea580c)' : data ? '#fff7ed' : isToday ? '#f1f5f9' : 'transparent',
                  color: isSel ? 'white' : data ? '#c2410c' : isToday ? '#374151' : '#94a3b8',
                  fontSize:11, fontWeight: isSel||data ? 800 : 400,
                  cursor: data ? 'pointer' : 'default',
                  fontFamily:'inherit',
                  boxShadow: isSel ? '0 2px 8px rgba(249,115,22,0.4)' : 'none',
                  transition:'all 0.13s',
                  position:'relative',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
                onMouseEnter={e=>{ if(data&&!isSel){ e.currentTarget.style.background='#ffedd5'; e.currentTarget.style.transform='scale(1.08)'; }}}
                onMouseLeave={e=>{ if(data&&!isSel){ e.currentTarget.style.background='#fff7ed'; e.currentTarget.style.transform='scale(1)'; }}}
              >
                {d}
                {data && !isSel && (
                  <span style={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:3, height:3, borderRadius:'50%', background:'#f97316' }} />
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop:10 }}>
          {selectedDay ? (
            <div style={{ padding:'10px 12px', borderRadius:10, background: selData ? '#fff7ed' : '#f9fafb', border: `1.5px solid ${selData ? '#fed7aa' : '#e5e7eb'}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: selData ? 8 : 0 }}>
                <div style={{ width:28, height:28, borderRadius:7, background: selData ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <MdCalendarMonth style={{ color:'white', fontSize:14 }} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:'#111827', lineHeight:1.2 }}>{MONTH_NAMES[calMonth-1]} {selectedDay}, {calYear}</div>
                  <div style={{ fontSize:9.5, color:'#9ca3af', fontWeight:500 }}>{selData ? 'Sales recorded' : 'No sales this day'}</div>
                </div>
              </div>
              {selData && (
                <div style={{ display:'grid', gridTemplateColumns: selData.cost > 0 ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap:6 }}>
                  {[
                    { label:'Sales', value: selData.sales, color:'#3b82f6', isNum: true },
                    { label:'Revenue', value: `${localStorage.getItem('inv_currency')||'Rs.'}${fmtShort(selData.revenue)}`, color:'#f97316' },
                    ...(selData.cost > 0 ? [
                      { label:'Cost', value: `${localStorage.getItem('inv_currency')||'Rs.'}${fmtShort(selData.cost)}`, color:'#ef4444' },
                      { label:'Profit', value: `${localStorage.getItem('inv_currency')||'Rs.'}${fmtShort(selData.profit)}`, color: selData.profit >= 0 ? '#10b981' : '#ef4444' },
                    ] : []),
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign:'center', background:'#fff7ed', borderRadius:7, padding:'5px 4px', border:'1px solid #fed7aa' }}>
                      <div style={{ fontSize:8, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.3px' }}>{label}</div>
                      <div style={{ fontSize:12, fontWeight:900, color, lineHeight:1.2, marginTop:1 }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign:'center', fontSize:10, color:'#d1d5db', fontWeight:600, padding:'4px 0' }}>
              Tap an orange day to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
