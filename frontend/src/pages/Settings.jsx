import { useState, useEffect } from 'react';
import { customersAPI, reportsAPI } from '../api';
import { MdAdd, MdDelete, MdPerson, MdInfo, MdStorage, MdRefresh, MdChevronLeft, MdChevronRight, MdBusiness, MdPhone, MdLocationOn, MdSave } from 'react-icons/md';
import { FaNodeJs, FaReact, FaDatabase, FaTable, FaShoppingCart, FaUsers, FaTruck } from 'react-icons/fa';
import { GiTyre } from 'react-icons/gi';
import toast from 'react-hot-toast';

const fmt = n => Number(n||0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
const BINFO_KEY = 'business_print_info';
const getBInfo = () => { try { return JSON.parse(localStorage.getItem(BINFO_KEY)||'{}'); } catch { return {}; } };

export default function Settings() {
  const [bInfo, setBInfo] = useState(getBInfo);
  const [bInfoSaved, setBInfoSaved] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'' });
  const [showModal, setShowModal] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [custPage, setCustPage] = useState(0);
  const CUST_PAGE_SIZE = 6;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const load = () => customersAPI.getAll().then(r => setCustomers(r.data));
  const loadStats = () => {
    setLoadingStats(true);
    reportsAPI.getDbStats().then(r => setDbStats(r.data)).finally(() => setLoadingStats(false));
  };

  useEffect(() => { load(); loadStats(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await customersAPI.create(form); toast.success('Customer added');
    setShowModal(false); setForm({ name:'', phone:'', email:'', address:'' }); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await customersAPI.delete(id); toast.success('Deleted'); load();
  };

  const dbMB = dbStats ? dbStats.dbSizeMB : 0;
  const dbPct = Math.min((dbMB / 10) * 100, 100);

  const dbRows = dbStats ? [
    { icon: FaShoppingCart, label: 'Total Sales',     value: dbStats.totalSales,     color: '#f97316' },
    { icon: GiTyre,         label: 'Tyres',           value: dbStats.totalTyres,     color: '#3b82f6' },
    { icon: FaUsers,        label: 'Customers',       value: dbStats.totalCustomers, color: '#10b981' },
    { icon: FaTruck,        label: 'Suppliers',       value: dbStats.totalSuppliers, color: '#8b5cf6' },
    { icon: FaTable,        label: 'Sale Line Items', value: dbStats.totalSaleItems, color: '#ef4444' },
    { icon: FaDatabase,     label: 'Total Revenue',   value: `$${fmt(dbStats.totalRevenue)}`, color: '#f97316' },
  ] : [];

  const stack = [
    { icon: FaReact,    label:'Frontend', value:'React 19 + Vite',    color:'#4da6ff' },
    { icon: FaNodeJs,   label:'Backend',  value:'Node.js + Express',  color:'var(--green)' },
    { icon: FaDatabase, label:'Database', value:'SQLite3',            color:'var(--orange)' },
    { icon: GiTyre,     label:'Version',  value:'v1.0.0',             color:'var(--gray-400)' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:'var(--gray-900)', letterSpacing:'-0.4px' }}>Settings</h1>
          <p style={{ fontSize:13, color:'var(--gray-400)', marginTop:3, fontWeight:500 }}>Customers, database & system info</p>
        </div>
      </div>


      <div className="card mb-4">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <MdBusiness style={{ color:'var(--orange)', fontSize:20 }} />
          <span style={{ fontSize:15, fontWeight:800 }}>Business Info for Print</span>
          <span style={{ fontSize:11.5, color:'var(--gray-400)', fontWeight:500 }}>Shows on invoice/receipt</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12 }}>
          {[
            { key:'address', label:'Address',         Icon:MdLocationOn, placeholder:'e.g. Shop #5, Main Market, Lahore' },
            { key:'phone',   label:'Phone',           Icon:MdPhone,      placeholder:'e.g. 0300-1234567' },
            { key:'email',   label:'Email (optional)', Icon:MdInfo,       placeholder:'e.g. info@myshop.com' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>
                {f.label}
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:8, border:'1.5px solid var(--gray-200)', borderRadius:6, padding:'8px 12px', background:'white' }}>
                <f.Icon style={{ color:'var(--orange)', fontSize:16, flexShrink:0 }} />
                <input value={bInfo[f.key]||''} onChange={e=>setBInfo(p=>({...p,[f.key]:e.target.value}))}
                  placeholder={f.placeholder}
                  style={{ border:'none', outline:'none', fontSize:13, fontFamily:'inherit', background:'transparent', width:'100%', color:'var(--gray-900)' }} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { localStorage.setItem(BINFO_KEY, JSON.stringify(bInfo)); setBInfoSaved(true); toast.success('Saved!'); setTimeout(()=>setBInfoSaved(false),2000); }}
          style={{ marginTop:14, padding:'9px 20px', borderRadius:6, border:'none', background:'var(--orange)', color:'white', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}>
          <MdSave style={{ fontSize:16 }} /> {bInfoSaved ? 'Saved!' : 'Save Info'}
        </button>
      </div>

      <div className="card mb-4">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(249,115,22,0.3)' }}>
              <MdStorage style={{ color:'white', fontSize:20 }} />
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--gray-900)' }}>Database Overview</div>
              <div style={{ fontSize:12, color:'var(--gray-400)', fontWeight:500, marginTop:1 }}>tyretrack.db — SQLite</div>
            </div>
          </div>
          <button onClick={loadStats} style={{ width:34, height:34, borderRadius:9, border:'1.5px solid var(--gray-200)', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--gray-500)', fontSize:17, transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='var(--orange)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color='var(--gray-500)'; }}
          ><MdRefresh /></button>
        </div>

        {loadingStats ? <div className="spinner" style={{ margin:'24px auto' }} /> : dbStats && (
          <>

            <div style={{ background:'var(--gray-50)', borderRadius:14, border:'1px solid var(--gray-200)', padding:'20px 24px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--gray-700)', marginBottom:3 }}>Database Size</div>
                  <div style={{ fontSize:11.5, color:'var(--gray-400)', fontWeight:500 }}>tyretrack.db · SQLite</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:26, fontWeight:900, color:'var(--orange)', letterSpacing:'-1px', lineHeight:1 }}>{dbStats.dbSizeKB} <span style={{ fontSize:14, fontWeight:700 }}>KB</span></div>
                  <div style={{ fontSize:12, color:'var(--gray-400)', fontWeight:500, marginTop:3 }}>{dbStats.dbSizeMB} MB of 100 MB</div>
                </div>
              </div>
              <div style={{ height:8, borderRadius:6, background:'var(--gray-200)', overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:6,
                  width:`${Math.max((dbStats.dbSizeMB / 100) * 100, 0.5)}%`,
                  background:'linear-gradient(90deg,#f97316,#ea580c)',
                  boxShadow:'0 2px 8px rgba(249,115,22,0.35)',
                  transition:'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                <span style={{ fontSize:11.5, color:'var(--gray-400)', fontWeight:500 }}>0 MB</span>
                <span style={{ fontSize:11.5, color:'var(--gray-400)', fontWeight:500 }}>100 MB</span>
              </div>
            </div>


          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 18, alignItems: 'start' }}>

        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <MdPerson style={{ color:'var(--orange)', fontSize:20 }} />
              <span style={{ fontSize:15, fontWeight:800 }}>Customers</span>
              <span style={{ fontSize:12, fontWeight:700, background:'var(--orange-50)', color:'var(--orange)', border:'1px solid var(--orange-200)', padding:'2px 9px', borderRadius:20 }}>{customers.length}</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><MdAdd />Add</button>
          </div>
          {(() => {
            const totalPages = Math.ceil(customers.length / CUST_PAGE_SIZE);
            const pageData = customers.slice(custPage * CUST_PAGE_SIZE, (custPage + 1) * CUST_PAGE_SIZE);
            const WINDOW = 3;
            let winStart = Math.max(0, custPage - Math.floor(WINDOW / 2));
            let winEnd = winStart + WINDOW;
            if (winEnd > totalPages) { winEnd = totalPages; winStart = Math.max(0, winEnd - WINDOW); }
            const pageNums = Array.from({ length: winEnd - winStart }, (_, i) => winStart + i);
            return (
              <>
                <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Phone</th>{!isMobile && <th>Email</th>}<th></th></tr></thead>
                  <tbody>
                    {pageData.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                            <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'white', flexShrink:0 }}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight:700 }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize:13 }}>{c.phone || <span style={{ color:'var(--gray-300)' }}>—</span>}</td>
                        {!isMobile && <td style={{ fontSize:12, color:'var(--gray-400)' }}>{c.email || '—'}</td>}
                        <td><button className="btn btn-danger btn-sm" style={{ padding:'4px 8px' }} onClick={() => handleDelete(c.id)}><MdDelete /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {customers.length === 0 && <div className="empty-state"><MdPerson /><p>No customers yet</p></div>}
                {totalPages > 1 && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:12, borderTop:'1px solid var(--gray-100)' }}>
                    <span style={{ fontSize:12, color:'var(--gray-400)', fontWeight:600 }}>
                      {custPage * CUST_PAGE_SIZE + 1}–{Math.min((custPage + 1) * CUST_PAGE_SIZE, customers.length)} of {customers.length}
                    </span>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <button onClick={() => setCustPage(p => p - 1)} disabled={custPage === 0}
                        style={{ width:32, height:32, borderRadius:9, border:'1.5px solid var(--gray-200)', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:custPage===0?'not-allowed':'pointer', color:custPage===0?'var(--gray-300)':'var(--gray-600)', fontSize:19, transition:'all 0.15s' }}
                        onMouseEnter={e => { if(custPage!==0){ e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='var(--orange)'; }}}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color=custPage===0?'var(--gray-300)':'var(--gray-600)'; }}
                      ><MdChevronLeft /></button>
                      {pageNums.map(i => (
                        <button key={i} onClick={() => setCustPage(i)}
                          style={{ width:32, height:32, borderRadius:9, border:'1.5px solid', borderColor:custPage===i?'var(--orange)':'var(--gray-200)', background:custPage===i?'var(--orange)':'white', color:custPage===i?'white':'var(--gray-500)', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}
                          onMouseEnter={e => { if(custPage!==i){ e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='var(--orange)'; }}}
                          onMouseLeave={e => { if(custPage!==i){ e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color='var(--gray-500)'; }}}
                        >{i + 1}</button>
                      ))}
                      <button onClick={() => setCustPage(p => p + 1)} disabled={custPage === totalPages - 1}
                        style={{ width:32, height:32, borderRadius:9, border:'1.5px solid var(--gray-200)', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:custPage===totalPages-1?'not-allowed':'pointer', color:custPage===totalPages-1?'var(--gray-300)':'var(--gray-600)', fontSize:19, transition:'all 0.15s' }}
                        onMouseEnter={e => { if(custPage!==totalPages-1){ e.currentTarget.style.borderColor='var(--orange)'; e.currentTarget.style.color='var(--orange)'; }}}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--gray-200)'; e.currentTarget.style.color=custPage===totalPages-1?'var(--gray-300)':'var(--gray-600)'; }}
                      ><MdChevronRight /></button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <div className="card">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <MdInfo style={{ color:'var(--orange)', fontSize:20 }} />
              <span style={{ fontSize:15, fontWeight:800 }}>Tech Stack</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10, width:'100%' }}>
              {stack.map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ background:'var(--gray-50)', border:'1px solid var(--gray-200)', borderRadius:10, padding:'13px 14px', display:'flex', alignItems:'center', gap:11, minWidth:0 }}>
                  <Icon style={{ color, fontSize:22, flexShrink:0 }} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:10, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:700 }}>{label}</div>
                    <div style={{ fontSize:13, fontWeight:700, marginTop:2, color:'var(--gray-800)' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="card">
            <div style={{ fontSize:15, fontWeight:800, marginBottom:14, color:'var(--gray-900)' }}>Quick Info</div>
            {[
              { label:'API Port',      value:':5000',          color:'var(--green)' },
              { label:'Frontend Port', value:':5173',          color:'var(--blue)' },
              { label:'Database File', value:'tyretrack.db',   color:'var(--orange)' },
              { label:'DB Engine',     value:'SQLite3',        color:'var(--purple)' },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
                <span style={{ fontSize:13, color:'var(--gray-500)', fontWeight:600 }}>{item.label}</span>
                <span style={{ fontWeight:800, color:item.color, fontSize:13 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add Customer</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name *</label><input className="form-control" required value={form.name} onChange={e => setForm({...form,name:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={form.address} onChange={e => setForm({...form,address:e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
