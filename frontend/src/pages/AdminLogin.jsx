import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MdEmail, MdLock } from 'react-icons/md';
import { adminAPI } from '../api';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState('');
  const [show, setShow]         = useState(false);

  useEffect(() => { setTimeout(() => setShow(true), 60); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await adminAPI.login({ email, password });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#eef0f4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter','Segoe UI',sans-serif", padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.35s ease',
      }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
            <img src="/admin-logo.png" alt="logo" style={{ maxWidth:200, maxHeight:64, objectFit:'contain' }} />
          </div>
          <div style={{ fontSize:13, color:'#6b7280', fontWeight:500 }}>Admin Portal</div>
        </div>

        <div style={{
          background: 'white', borderRadius: 8, border: '1px solid #d1d9e0',
          padding: 'clamp(24px,5vw,36px)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#111827', marginBottom:6 }}>Sign In</div>
          <div style={{ fontSize:13, color:'#6b7280', marginBottom:24 }}>Enter your credentials to continue</div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:6 }}>
                Email Address
              </label>
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                border:`1.5px solid ${focused==='email'?'#f97316':'#d1d9e0'}`,
                borderRadius:6, padding:'10px 12px', background:'white',
                boxShadow: focused==='email'?'0 0 0 3px rgba(249,115,22,0.1)':'none',
                transition:'all 0.15s',
              }}>
                <MdEmail style={{ color: focused==='email'?'#f97316':'#9ca3af', fontSize:17, flexShrink:0 }} />
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  placeholder="admin@example.com" required autoComplete="email"
                  style={{ flex:1, border:'none', outline:'none', fontSize:13.5, fontFamily:'inherit', background:'transparent', color:'#111827' }}
                />
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:6 }}>
                Password
              </label>
              <div style={{
                display:'flex', alignItems:'center', gap:10,
                border:`1.5px solid ${focused==='pass'?'#f97316':'#d1d9e0'}`,
                borderRadius:6, padding:'10px 12px', background:'white',
                boxShadow: focused==='pass'?'0 0 0 3px rgba(249,115,22,0.1)':'none',
                transition:'all 0.15s',
              }}>
                <MdLock style={{ color: focused==='pass'?'#f97316':'#9ca3af', fontSize:17, flexShrink:0 }} />
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onFocus={() => setFocused('pass')} onBlur={() => setFocused('')}
                  placeholder="••••••••••••" required autoComplete="current-password"
                  style={{ flex:1, border:'none', outline:'none', fontSize:14, fontFamily:'inherit', background:'transparent', color:'#111827' }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:15, display:'flex', alignItems:'center', flexShrink:0 }}>
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:6, padding:'10px 14px', marginBottom:18, fontSize:13, color:'#dc2626', fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'12px', borderRadius:6, border:'none',
              background: loading ? '#fed7aa' : '#f97316',
              color:'white', fontSize:14, fontWeight:700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily:'inherit', boxShadow: loading ? 'none' : '0 4px 14px rgba(249,115,22,0.35)',
              transition:'all 0.15s',
            }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.background='#ea580c'; }}
              onMouseLeave={e => { if(!loading) e.currentTarget.style.background='#f97316'; }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#9ca3af', fontWeight:500 }}>
          SECURED ADMIN ACCESS
        </div>
      </div>
    </div>
  );
}
