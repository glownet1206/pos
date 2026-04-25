import { useState } from 'react';
import { MdEmail, MdLock, MdBusiness, MdPerson, MdStorefront } from 'react-icons/md';
import { FaEye, FaEyeSlash, FaStore, FaUtensils, FaCapsules } from 'react-icons/fa';
import { GiCarWheel } from 'react-icons/gi';
import { authAPI } from '../api';

const BUSINESS_TYPES = [
  { value: 'tyre_shop',     label: 'Tyre Shop',     icon: <GiCarWheel />, color: '#f97316' },
  { value: 'restaurant',    label: 'Restaurant',    icon: <FaUtensils />, color: '#16a34a' },
  { value: 'general_store', label: 'General Store', icon: <FaStore />,    color: '#2563eb' },
  { value: 'pharmacy',      label: 'Pharmacy',      icon: <FaCapsules />, color: '#7c3aed' },
];

const PLANS = [
  { value: 'monthly',  label: 'Monthly',  desc: 'Pay every month' },
  { value: 'lifetime', label: 'Lifetime', desc: 'One-time payment' },
];

const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:5 };
const fld = { border:'none', outline:'none', fontSize:13.5, fontFamily:'inherit', background:'transparent', width:'100%', color:'#111827' };

function Inp({ focused, error, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, border:`1.5px solid ${error?'#dc2626':focused?'#f97316':'#d1d9e0'}`, borderRadius:6, padding:'9px 12px', background:'white', boxShadow:focused?'0 0 0 3px rgba(249,115,22,0.1)':'none', transition:'all 0.15s' }}>
      {children}
    </div>
  );
}

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reg, setReg] = useState({ name:'', business_name:'', business_type:'', email:'', password:'', plan:'monthly' });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      onLogin(res.data);
    } catch (err) {
      const code = err.response?.data?.error;
      if (code === 'subscription_pending') { setMode('pending'); return; }
      if (code === 'subscription_suspended' || code === 'subscription_expired') { setMode('suspended'); return; }
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!reg.business_type) { setError('Please select your business type'); return; }
    if (reg.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      await authAPI.register(reg);
      setMode('pending');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  if (mode === 'pending') return <StatusScreen color="#f97316" title="Account Pending" msg="Your account has been created. Please contact the admin to activate your account." action={() => setMode('login')} actionLabel="Back to Login" />;
  if (mode === 'suspended') return <StatusScreen color="#dc2626" title="Subscription Expired" msg="Your subscription has expired or been suspended. Please contact admin to renew." action={() => setMode('login')} actionLabel="Back to Login" />;

  return (
    <div style={{ minHeight:'100vh', background:'#eef0f4', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <div style={{ width:'100%', maxWidth: mode==='register' ? 520 : 400 }}>

        <div style={{ textAlign:'center', marginBottom:24 }}>
          <img src="/icon.png" alt="logo" style={{ width:56, height:56, objectFit:'contain', marginBottom:10, mixBlendMode:'multiply' }} />
          <div style={{ fontSize:20, fontWeight:900, color:'#111827' }}>PrimePOS</div>
          <div style={{ fontSize:12.5, color:'#6b7280', marginTop:2 }}>Multi-Business Point of Sale</div>
        </div>

        <div style={{ background:'white', borderRadius:8, border:'1px solid #d1d9e0', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', padding:'clamp(20px,5vw,32px)' }}>

          <div style={{ display:'flex', background:'#f0f2f5', borderRadius:6, padding:3, marginBottom:22 }}>
            {['login','register'].map(t => (
              <button key={t} onClick={() => { setMode(t); setError(''); }} style={{ flex:1, padding:'8px', borderRadius:5, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:700, background:mode===t?'white':'transparent', color:mode===t?'#f97316':'#6b7280', boxShadow:mode===t?'0 1px 4px rgba(0,0,0,0.08)':'none', transition:'all 0.15s' }}>
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Email</label>
                <Inp focused={focused==='email'} error={!!error}>
                  <MdEmail style={{ color:focused==='email'?'#f97316':'#9ca3af', fontSize:17, flexShrink:0 }} />
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="your@email.com" required style={fld} onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')} />
                </Inp>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={lbl}>Password</label>
                <Inp focused={focused==='pass'} error={!!error}>
                  <MdLock style={{ color:focused==='pass'?'#f97316':'#9ca3af', fontSize:17, flexShrink:0 }} />
                  <input type={showPass?'text':'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Enter your password" required style={fld} onFocus={()=>setFocused('pass')} onBlur={()=>setFocused('')} />
                  <button type="button" onClick={()=>setShowPass(p=>!p)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14, flexShrink:0 }}>{showPass?<FaEyeSlash/>:<FaEye/>}</button>
                </Inp>
              </div>
              {error && <ErrBox msg={error} />}
              <SubBtn loading={loading} label="Sign In" />
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                <div>
                  <label style={lbl}>Your Name</label>
                  <Inp focused={focused==='name'}>
                    <MdPerson style={{ color:focused==='name'?'#f97316':'#9ca3af', fontSize:17, flexShrink:0 }} />
                    <input value={reg.name} onChange={e=>setReg(r=>({...r,name:e.target.value}))} placeholder="Full name" required style={fld} onFocus={()=>setFocused('name')} onBlur={()=>setFocused('')} />
                  </Inp>
                </div>
                <div>
                  <label style={lbl}>Business Name</label>
                  <Inp focused={focused==='bname'}>
                    <MdStorefront style={{ color:focused==='bname'?'#f97316':'#9ca3af', fontSize:17, flexShrink:0 }} />
                    <input value={reg.business_name} onChange={e=>setReg(r=>({...r,business_name:e.target.value}))} placeholder="Shop name" style={fld} onFocus={()=>setFocused('bname')} onBlur={()=>setFocused('')} />
                  </Inp>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Business Type</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {BUSINESS_TYPES.map(bt => (
                    <button key={bt.value} type="button" onClick={()=>setReg(r=>({...r,business_type:bt.value}))} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:6, border:`1.5px solid ${reg.business_type===bt.value?bt.color:'#d1d9e0'}`, background:reg.business_type===bt.value?bt.color+'12':'white', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, color:reg.business_type===bt.value?bt.color:'#374151', transition:'all 0.12s' }}>
                      <span style={{ fontSize:15, color:bt.color }}>{bt.icon}</span>{bt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Plan</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                  {PLANS.map(p => (
                    <button key={p.value} type="button" onClick={()=>setReg(r=>({...r,plan:p.value}))} style={{ padding:'9px 12px', borderRadius:6, textAlign:'left', border:`1.5px solid ${reg.plan===p.value?'#f97316':'#d1d9e0'}`, background:reg.plan===p.value?'#fff7ed':'white', cursor:'pointer', fontFamily:'inherit' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:reg.plan===p.value?'#f97316':'#111827' }}>{p.label}</div>
                      <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Email</label>
                <Inp focused={focused==='remail'}>
                  <MdEmail style={{ color:focused==='remail'?'#f97316':'#9ca3af', fontSize:17, flexShrink:0 }} />
                  <input type="email" value={reg.email} onChange={e=>setReg(r=>({...r,email:e.target.value}))} placeholder="your@email.com" required style={fld} onFocus={()=>setFocused('remail')} onBlur={()=>setFocused('')} />
                </Inp>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={lbl}>Password</label>
                <Inp focused={focused==='rpass'}>
                  <MdLock style={{ color:focused==='rpass'?'#f97316':'#9ca3af', fontSize:17, flexShrink:0 }} />
                  <input type={showPass?'text':'password'} value={reg.password} onChange={e=>setReg(r=>({...r,password:e.target.value}))} placeholder="Min 8 characters" required style={fld} onFocus={()=>setFocused('rpass')} onBlur={()=>setFocused('')} />
                  <button type="button" onClick={()=>setShowPass(p=>!p)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:14, flexShrink:0 }}>{showPass?<FaEyeSlash/>:<FaEye/>}</button>
                </Inp>
              </div>

              {error && <ErrBox msg={error} />}
              <SubBtn loading={loading} label="Create Account" />
              <p style={{ textAlign:'center', fontSize:11.5, color:'#9ca3af', marginTop:10 }}>Admin will activate your account after registration.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrBox({ msg }) {
  return <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, padding:'9px 12px', fontSize:13, color:'#dc2626', fontWeight:600, marginBottom:14 }}>{msg}</div>;
}

function SubBtn({ loading, label }) {
  return (
    <button type="submit" disabled={loading} style={{ width:'100%', padding:'11px', borderRadius:6, border:'none', background:loading?'#fed7aa':'#f97316', color:'white', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', boxShadow:loading?'none':'0 4px 14px rgba(249,115,22,0.3)', fontFamily:'inherit', opacity:loading?0.8:1 }}>
      {loading ? 'Please wait...' : label}
    </button>
  );
}

function StatusScreen({ color, title, msg, action, actionLabel }) {
  return (
    <div style={{ minHeight:'100vh', background:'#eef0f4', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <div style={{ background:'white', borderRadius:8, border:'1px solid #d1d9e0', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', maxWidth:400, width:'100%', padding:'40px 32px', textAlign:'center' }}>
        <div style={{ width:52, height:52, borderRadius:8, background:color+'15', border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:24 }}>
          {color==='#dc2626'?'🔒':'⏳'}
        </div>
        <div style={{ fontSize:18, fontWeight:800, color:'#111827', marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:13.5, color:'#6b7280', lineHeight:1.6, marginBottom:24 }}>{msg}</div>
        <button onClick={action} style={{ padding:'10px 24px', borderRadius:6, border:'none', background:color, color:'white', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{actionLabel}</button>
      </div>
    </div>
  );
}
