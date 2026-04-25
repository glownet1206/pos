import { MdChevronLeft, MdChevronRight, MdCalendarMonth } from 'react-icons/md';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmt = n => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

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
      <div style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={prevMonth} style={{ width:28, height:28, borderRadius:8, border:'1.5px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.15)', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}><MdChevronLeft /></button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:900, color:'white', letterSpacing:'0.3px' }}>{MONTH_FULL[calMonth-1]}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', fontWeight:600 }}>{calYear}</div>
        </div>
        <button onClick={nextMonth} style={{ width:28, height:28, borderRadius:8, border:'1.5px solid rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.15)', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}><MdChevronRight /></button>
      </div>

      <div style={{ padding:'12px 14px 14px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:6 }}>
          {['S','M','T','W','T','F','S'].map((d,i) => (
            <div key={i} style={{ textAlign:'center', fontSize:10, fontWeight:800, color:'#cbd5e1' }}>{d}</div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
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
                  aspectRatio:'1', borderRadius:8, border:'none', padding:0, margin:0,
                  background: isSel ? 'linear-gradient(135deg,#f97316,#ea580c)' : data ? '#fff7ed' : isToday ? '#f1f5f9' : 'transparent',
                  color: isSel ? 'white' : data ? '#c2410c' : isToday ? '#374151' : '#94a3b8',
                  fontSize:12, fontWeight: isSel||data ? 800 : 400,
                  cursor: data ? 'pointer' : 'default',
                  fontFamily:'inherit',
                  boxShadow: isSel ? '0 3px 10px rgba(249,115,22,0.4)' : 'none',
                  transition:'all 0.13s',
                  position:'relative',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}
                onMouseEnter={e=>{ if(data&&!isSel){ e.currentTarget.style.background='#ffedd5'; e.currentTarget.style.transform='scale(1.1)'; }}}
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

        <div style={{ marginTop:12 }}>
          {selectedDay ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:10, background: selData ? '#fff7ed' : '#f9fafb', border: `1.5px solid ${selData ? '#fed7aa' : '#e5e7eb'}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:30, height:30, borderRadius:8, background: selData ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <MdCalendarMonth style={{ color:'white', fontSize:15 }} />
                </div>
                <div>
                  <div style={{ fontSize:11.5, fontWeight:800, color:'#111827', lineHeight:1.2 }}>{MONTH_NAMES[calMonth-1]} {selectedDay}, {calYear}</div>
                  <div style={{ fontSize:10, color:'#9ca3af', fontWeight:500 }}>{selData ? 'Sales recorded' : 'No sales this day'}</div>
                </div>
              </div>
              {selData && (
                <div style={{ display:'flex', gap:14, flexShrink:0 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px' }}>Sales</div>
                    <div style={{ fontSize:16, fontWeight:900, color:'#3b82f6', lineHeight:1.1 }}>{selData.sales}</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.4px' }}>Revenue</div>
                    <div style={{ fontSize:16, fontWeight:900, color:'#f97316', lineHeight:1.1 }}>{localStorage.getItem('inv_currency')||'Rs.'}{fmt(selData.revenue)}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign:'center', fontSize:10.5, color:'#d1d5db', fontWeight:600, padding:'6px 0' }}>
              Tap an orange day to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
