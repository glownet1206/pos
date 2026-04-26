export default function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  
  // CRITICAL FIX: For dual Y-axis charts, the data is in payload array items directly
  // payload[0].payload might be undefined, so we need to check payload items themselves
  
  // Try to get dataPoint from payload[0].payload, but it might be empty
  const dataPoint = payload[0]?.payload;
  
  // Use date if available from dataPoint, otherwise use label
  const displayLabel = (dataPoint?.date) || label || (dataPoint?.day) || (dataPoint?.name) || 'N/A';
  
  console.log('ChartTip Debug:', { 
    label, 
    payloadLength: payload.length,
    payloadItems: payload.map(p => ({ 
      name: p.name, 
      value: p.value, 
      dataKey: p.dataKey,
      payload: p.payload 
    }))
  });
  
  return (
    <div style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', fontSize:12.5 }}>
      <p style={{ fontWeight:700, color:'#374151', marginBottom:6 }}>{displayLabel}</p>
      {payload.map((p, idx) => {
        // CRITICAL: The value is directly in p.value for Recharts
        // This is the actual data value from the chart
        const value = p.value ?? 0;
        
        // Format the display value
        const displayValue = typeof value === 'number' && value > 100 
          ? `${localStorage.getItem('inv_currency')||'Rs.'}${Number(value).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`
          : value;
        
        return (
          <div key={`${p.name || p.dataKey}-${idx}`} style={{ display:'flex', alignItems:'center', gap:6, margin:'3px 0' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block' }} />
            <span style={{ color:'#6b7280', fontWeight:600 }}>{p.name}:</span>
            <span style={{ fontWeight:800, color:p.color }}>{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
}
