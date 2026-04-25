export default function GradCard({ label, value, icon: Icon, gradient, shadow, sub }) {
  return (
    <div style={{ background:gradient, borderRadius:8, padding:'16px 16px', boxShadow:shadow, color:'white', position:'relative', overflow:'hidden', transition:'transform 0.2s' }}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
    >
      <div style={{ position:'absolute', top:-15, right:-15, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
      <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
        <Icon style={{ fontSize:19, color:'white' }} />
      </div>
      <div style={{ fontSize:'clamp(13px, 3.8vw, 22px)', fontWeight:900, letterSpacing:'-0.3px', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:700, opacity:0.8, marginTop:5 }}>{label}</div>
      {sub && <div style={{ fontSize:10, opacity:0.6, marginTop:2 }}>{sub}</div>}
    </div>
  );
}
