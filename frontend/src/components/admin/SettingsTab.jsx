import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { MdPerson, MdEmail, MdLock, MdCheckCircle, MdError } from 'react-icons/md';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const gc = { background:'white', border:'1px solid #e8ecf0', borderRadius:8, padding:'22px', marginBottom:14 };
const inp = (f,e) => ({ display:'flex', alignItems:'center', gap:10, border:`1.5px solid ${e?'#ef4444':f?'#f97316':'#e8ecf0'}`, borderRadius:6, padding:'9px 12px', background:'white', boxShadow:f?'0 0 0 3px rgba(249,115,22,0.08)':'none', transition:'all 0.15s' });
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#9aa5b4', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:5 };
const fld = { border:'none', outline:'none', fontSize:13, fontFamily:'inherit', background:'transparent', width:'100%', color:'#1a1d23' };

export default function SettingsTab({ adminUser }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [curPass,  setCurPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confPass, setConfPass] = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [focused,  setFocused]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState(null);
  const [changePass, setChangePass] = useState(false);

  useEffect(() => {
    if (adminUser) { setName(adminUser.name||''); setEmail(adminUser.email||''); }
    else { adminAPI.me().then(r => { setName(r.data.name||''); setEmail(r.data.email||''); }).catch(() => {}); }
  }, [adminUser]);

  const handleSave = async (e) => {
    e.preventDefault(); setMsg(null);
    if (changePass) {
      if (newPass.length < 8) { setMsg({ type:'error', text:'New password must be at least 8 characters' }); return; }
      if (newPass !== confPass) { setMsg({ type:'error', text:'Passwords do not match' }); return; }
      if (!curPass) { setMsg({ type:'error', text:'Enter your current password' }); return; }
    }
    setLoading(true);
    try {
      const payload = { name, email };
      if (changePass) { payload.currentPassword = curPass; payload.newPassword = newPass; }
      await adminAPI.updateProfile(payload);
      setMsg({ type:'success', text:'Profile updated successfully' });
      setCurPass(''); setNewPass(''); setConfPass(''); setChangePass(false);
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.error || 'Update failed' });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', maxWidth:540 }}>
      <form onSubmit={handleSave}>
        <div style={gc}>
          <div style={{ fontWeight:800, fontSize:14, color:'#1a1d23', marginBottom:18 }}>Admin Profile</div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Name</label>
            <div style={inp(focused==='name', false)}>
              <MdPerson style={{ color:'#f97316', fontSize:16, flexShrink:0 }}/>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Admin name" required style={fld} onFocus={()=>setFocused('name')} onBlur={()=>setFocused('')}/>
            </div>
          </div>
          <div>
            <label style={lbl}>Email</label>
            <div style={inp(focused==='email', false)}>
              <MdEmail style={{ color:'#f97316', fontSize:16, flexShrink:0 }}/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required style={fld} onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')}/>
            </div>
          </div>
        </div>

        <div style={gc}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:changePass?18:0 }}>
            <div style={{ fontWeight:800, fontSize:14, color:'#1a1d23' }}>Change Password</div>
            <button type="button" onClick={() => { setChangePass(v=>!v); setMsg(null); setCurPass(''); setNewPass(''); setConfPass(''); }}
              style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${changePass?'#e8ecf0':'#fed7aa'}`, background:changePass?'#f4f6f9':'#fff7ed', color:changePass?'#4a5568':'#f97316', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              {changePass?'Cancel':'Change Password'}
            </button>
          </div>
          {changePass && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Current Password', val:curPass, set:setCurPass, show:showCur, setShow:setShowCur, fk:'cur' },
                { label:'New Password',     val:newPass, set:setNewPass, show:showNew, setShow:setShowNew, fk:'new', err:newPass&&newPass.length<8, errMsg:'At least 8 characters required' },
                { label:'Confirm Password', val:confPass, set:setConfPass, show:showConf, setShow:setShowConf, fk:'conf', err:confPass&&confPass!==newPass, errMsg:'Passwords do not match' },
              ].map(f => (
                <div key={f.fk}>
                  <label style={lbl}>{f.label}</label>
                  <div style={inp(focused===f.fk, f.err)}>
                    <MdLock style={{ color:'#f97316', fontSize:16, flexShrink:0 }}/>
                    <input type={f.show?'text':'password'} value={f.val} onChange={e=>f.set(e.target.value)} style={fld} onFocus={()=>setFocused(f.fk)} onBlur={()=>setFocused('')}/>
                    <button type="button" onClick={()=>f.setShow(v=>!v)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9aa5b4', fontSize:13, flexShrink:0 }}>
                      {f.show?<FaEyeSlash/>:<FaEye/>}
                    </button>
                  </div>
                  {f.err && <div style={{ fontSize:11, color:'#ef4444', marginTop:3, fontWeight:600 }}>{f.errMsg}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {msg && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:6, marginBottom:12, background:msg.type==='success'?'#f0fdf4':'#fef2f2', border:`1px solid ${msg.type==='success'?'#bbf7d0':'#fecaca'}`, fontSize:13, fontWeight:600, color:msg.type==='success'?'#22c55e':'#ef4444' }}>
            {msg.type==='success'?<MdCheckCircle style={{ fontSize:16 }}/>:<MdError style={{ fontSize:16 }}/>}
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ width:'100%', padding:'11px', borderRadius:6, border:'none', background:'#f97316', color:'white', fontSize:13, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', opacity:loading?0.8:1, marginBottom:14 }}>
          {loading?'Saving...':'Save Changes'}
        </button>
      </form>

      <div style={gc}>
        <div style={{ fontWeight:800, fontSize:14, color:'#1a1d23', marginBottom:4 }}>Platform Info</div>
        <div style={{ fontSize:12.5, color:'#9aa5b4', marginBottom:14 }}>Current platform configuration</div>
        {[['Platform Name','POS Platform'],['Version','1.0.0'],['Database','SQLite (Multi-tenant)'],['Auth','JWT + Cookie']].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #f0f2f5', fontSize:13 }}>
            <span style={{ color:'#9aa5b4', fontWeight:600 }}>{k}</span>
            <span style={{ color:'#1a1d23', fontWeight:700 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
