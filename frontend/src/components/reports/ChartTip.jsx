export default function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', fontSize:12.5 }}>
      <p style={{ fontWeight:700, color:'#374151', marginBottom:6 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display:'flex', alignItems:'center', gap:6, margin:'3px 0' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block' }} />
          <span style={{ color:'#6b7280', fontWeight:600 }}>{p.name}:</span>
          <span style={{ fontWeight:800, color:p.color }}>{typeof p.value==='number'&&p.value>100?`${localStorage.getItem('inv_currency')||'Rs.'}${Number(p.value||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`:p.value}</span>
        </div>
      ))}
    </div>
  );
}
