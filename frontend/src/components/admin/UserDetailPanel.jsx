import { MdClose, MdCheckCircle, MdBlock } from 'react-icons/md';
import { C, STATUS_META, BIZ_META } from './constants.jsx';

const CURRENCIES = ['PKR','USD','AED','SAR','QAR','EUR','GBP'];

export default function UserDetailPanel({ selected, payments, payAmount, setPayAmount, payNote, setPayNote, payCurrency, setPayCurrency, months, setMonths, activate, suspend, recordPayment, busy, setSelected, deleteUser, confirmDelete, setConfirmDelete }) {
  return (
    <div style={{ background:'white', border:'1px solid #e8ecf0', borderRadius:8, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ background:'linear-gradient(135deg,#f97316,#ea580c)', padding:'16px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:8, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:'white' }}>
              {selected.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'white' }}>{selected.name}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>{selected.email}</div>
            </div>
          </div>
          <button onClick={() => setSelected(null)} style={{ width:28, height:28, borderRadius:6, background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>
            <MdClose style={{ fontSize:15 }} />
          </button>
        </div>
      </div>

      <div style={{ padding:'14px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
          {[
            { label:'Status',   value:STATUS_META[selected.status]?.label || selected.status, color:STATUS_META[selected.status]?.color },
            { label:'Plan',     value:selected.plan, color:selected.plan==='lifetime'?'#8b5cf6':'#3b82f6' },
            { label:'Business', value:selected.business_name||'—' },
            { label:'Type',     value:BIZ_META[selected.business_type]?.label||selected.business_type },
            { label:'Expires',  value:selected.expires_at?new Date(selected.expires_at).toLocaleDateString('en-PK'):selected.plan==='lifetime'?'∞':'—' },
            { label:'Joined',   value:new Date(selected.created_at).toLocaleDateString('en-PK') },
          ].map(r => (
            <div key={r.label} style={{ background:'#fafbfc', borderRadius:6, padding:'8px 10px', border:'1px solid #f0f2f5' }}>
              <div style={{ fontSize:9.5, fontWeight:700, color:'#9aa5b4', textTransform:'uppercase', letterSpacing:'0.6px' }}>{r.label}</div>
              <div style={{ fontSize:12.5, fontWeight:700, color:r.color||'#1a1d23', marginTop:2, textTransform:'capitalize' }}>{r.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'12px', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#f97316', marginBottom:8 }}>Activate User</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <label style={{ fontSize:12, color:'#4a5568', fontWeight:600, flexShrink:0 }}>Plan:</label>
            <select value={months===0?'lifetime':'monthly'} onChange={e=>setMonths(e.target.value==='lifetime'?0:1)}
              style={{ flex:1, padding:'6px 8px', borderRadius:6, border:'1px solid #fed7aa', fontSize:12.5, fontFamily:'inherit', outline:'none', background:'white', color:'#1a1d23' }}>
              <option value="monthly">Monthly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          {months!==0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <label style={{ fontSize:12, color:'#4a5568', fontWeight:600 }}>Months:</label>
              <input type="number" min={1} max={24} value={months} onChange={e=>setMonths(Number(e.target.value))}
                style={{ width:60, padding:'6px 8px', borderRadius:6, border:'1px solid #fed7aa', fontSize:13, fontFamily:'inherit', outline:'none', textAlign:'center', background:'white' }} />
            </div>
          )}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={activate} disabled={busy} style={{ flex:1, padding:'8px', borderRadius:6, border:'none', background:'#f97316', color:'white', fontSize:12.5, fontWeight:700, cursor:busy?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5, opacity:busy?0.6:1 }}>
              <MdCheckCircle style={{ fontSize:14 }} /> Activate
            </button>
            <button onClick={suspend} disabled={busy} style={{ flex:1, padding:'8px', borderRadius:6, border:'1px solid #fecaca', background:'#fef2f2', color:'#ef4444', fontSize:12.5, fontWeight:700, cursor:busy?'not-allowed':'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:5, opacity:busy?0.6:1 }}>
              <MdBlock style={{ fontSize:14 }} /> Suspend
            </button>
          </div>
        </div>

        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'12px', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#22c55e', marginBottom:8 }}>Record Payment</div>
          <div style={{ display:'flex', gap:6, marginBottom:6 }}>
            <input type="number" placeholder="Amount" value={payAmount} onChange={e=>setPayAmount(e.target.value)}
              style={{ flex:1, padding:'7px 10px', borderRadius:6, border:'1px solid #bbf7d0', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box', background:'white' }} />
            <select value={payCurrency||'PKR'} onChange={e=>setPayCurrency&&setPayCurrency(e.target.value)}
              style={{ width:72, padding:'7px 4px', borderRadius:6, border:'1px solid #bbf7d0', fontSize:12, fontFamily:'inherit', outline:'none', background:'white', color:'#1a1d23' }}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input type="text" placeholder="Note (optional)" value={payNote} onChange={e=>setPayNote(e.target.value)}
            style={{ width:'100%', padding:'7px 10px', borderRadius:6, border:'1px solid #bbf7d0', fontSize:13, fontFamily:'inherit', outline:'none', marginBottom:8, boxSizing:'border-box', background:'white' }} />
          <button onClick={recordPayment} disabled={busy||!payAmount} style={{ width:'100%', padding:'8px', borderRadius:6, border:'none', background:'#22c55e', color:'white', fontSize:12.5, fontWeight:700, cursor:busy||!payAmount?'not-allowed':'pointer', fontFamily:'inherit', opacity:busy||!payAmount?0.6:1 }}>
            Save Payment
          </button>
        </div>

        {payments.length>0 && (
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#4a5568', marginBottom:6 }}>Payment History</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:160, overflowY:'auto' }}>
              {payments.map(p => (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:6, padding:'7px 10px' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#22c55e' }}>{p.currency||'PKR'} {Number(p.amount).toLocaleString('en-PK')}</div>
                    {p.note && <div style={{ fontSize:11, color:'#9aa5b4' }}>{p.note}</div>}
                  </div>
                  <div style={{ fontSize:11, color:'#9aa5b4' }}>{new Date(p.created_at).toLocaleDateString('en-PK')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!confirmDelete ? (
          <button onClick={()=>setConfirmDelete(true)} style={{ width:'100%', marginTop:6, padding:'8px', borderRadius:6, border:'1px solid #fecaca', background:'#fef2f2', color:'#ef4444', fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Delete User
          </button>
        ) : (
          <div style={{ marginTop:6, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'12px' }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:'#ef4444', marginBottom:4 }}>Are you sure?</div>
            <div style={{ fontSize:11.5, color:'#4a5568', marginBottom:10 }}>This will permanently delete the user and all their data.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={deleteUser} disabled={busy} style={{ flex:1, padding:'8px', borderRadius:6, border:'none', background:'#ef4444', color:'white', fontSize:12.5, fontWeight:700, cursor:busy?'not-allowed':'pointer', fontFamily:'inherit', opacity:busy?0.6:1 }}>Yes, Delete</button>
              <button onClick={()=>setConfirmDelete(false)} style={{ flex:1, padding:'8px', borderRadius:6, border:'1px solid #e8ecf0', background:'white', color:'#4a5568', fontSize:12.5, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
