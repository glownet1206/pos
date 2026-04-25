import { useState } from 'react';
import { authAPI } from '../api';
import { MdPerson, MdEmail, MdLock, MdSave, MdLogout } from 'react-icons/md';
import { FaUserCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
        width: '100%', maxWidth: 340, boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        border: '1px solid var(--gray-100)',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <MdLogout style={{ fontSize: 24, color: 'var(--red)' }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>Logout</div>
        <div style={{ fontSize: 13.5, color: 'var(--gray-500)', marginBottom: 24 }}>Are you sure you want to logout?</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--gray-200)',
            background: '#fff', color: 'var(--gray-700)', fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px', borderRadius: 10, border: 'none',
            background: 'var(--red)', color: '#fff', fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Logout</button>
        </div>
      </div>
    </div>
  );
}

export default function Profile({ user, onUpdate, onLogout }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) return toast.error('New passwords do not match');
    if (newPassword && newPassword.length < 4) return toast.error('Password too short');
    setSaving(true);
    try {
      const payload = { name, email };
      if (newPassword) { payload.newPassword = newPassword; payload.currentPassword = currentPassword; }
      const res = await authAPI.updateProfile(payload);
      const updated = { ...user, ...res.data };
      onUpdate(updated);
      toast.success('Profile updated');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => { setShowLogoutModal(false); onLogout(); };

  return (
    <div className="page">
      {showLogoutModal && <LogoutModal onConfirm={confirmLogout} onCancel={() => setShowLogoutModal(false)} />}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'var(--gray-900)', letterSpacing:'-0.4px' }}>Profile</h1>
          <p style={{ fontSize:13, color:'var(--gray-400)', marginTop:3, fontWeight:500 }}>Manage your account settings</p>
        </div>
        <button onClick={handleLogout} style={{
          display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:10,
          border:'1.5px solid #fecaca', background:'var(--red-bg)', color:'var(--red)',
          fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
          onMouseLeave={e => e.currentTarget.style.background='var(--red-bg)'}
        >
          <MdLogout style={{ fontSize:17 }} /> Logout
        </button>
      </div>

      <div style={{ maxWidth:560 }}>

        <div className="card mb-4" style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 6px 20px rgba(249,115,22,0.35)' }}>
            <FaUserCircle style={{ fontSize:44, color:'white' }} />
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:'var(--gray-900)' }}>{user.name}</div>
            <div style={{ fontSize:13, color:'var(--gray-400)', fontWeight:500, marginTop:3 }}>{user.email}</div>
            <span style={{ fontSize:11.5, fontWeight:700, background:'var(--orange-50)', color:'var(--orange)', border:'1px solid var(--orange-200)', padding:'3px 10px', borderRadius:20, display:'inline-block', marginTop:6 }}>Administrator</span>
          </div>
        </div>


        <form onSubmit={handleSave}>
          <div className="card mb-4">
            <div style={{ fontSize:14, fontWeight:800, color:'var(--gray-800)', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
              <MdPerson style={{ color:'var(--orange)', fontSize:18 }} /> Personal Info
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label" style={{ display:'flex', alignItems:'center', gap:5 }}><MdEmail style={{ fontSize:13 }} />Email</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Your email" />
            </div>
          </div>

          <div className="card mb-4">
            <div style={{ fontSize:14, fontWeight:800, color:'var(--gray-800)', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
              <MdLock style={{ color:'var(--orange)', fontSize:18 }} /> Change Password
            </div>
            <div style={{ fontSize:12.5, color:'var(--gray-400)', fontWeight:500, marginBottom:16 }}>Leave blank to keep current password</div>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position:'relative' }}>
                <input className="form-control" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" style={{ paddingRight:42 }} />
                <button type="button" onClick={() => setShowCurrent(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', fontSize:15, display:'flex' }}>
                  {showCurrent ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position:'relative' }}>
                <input className="form-control" type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" style={{ paddingRight:42 }} />
                <button type="button" onClick={() => setShowNew(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', fontSize:15, display:'flex' }}>
                  {showNew ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Confirm New Password</label>
              <input className="form-control" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px', fontSize:14 }}>
            <MdSave style={{ fontSize:18 }} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
