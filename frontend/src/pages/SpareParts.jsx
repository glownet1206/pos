import { useEffect, useState } from 'react';
import { sparePartsAPI } from '../api';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdChevronLeft, MdChevronRight, MdQrCode } from 'react-icons/md';
import { GiGearStickPattern } from 'react-icons/gi';
import toast from 'react-hot-toast';
import BarcodeDisplay from '../components/BarcodeDisplay';

const PAGE_SIZE = 7;
const CATEGORIES = ['All', 'Engine', 'Brakes', 'Suspension', 'Electrical', 'Body', 'Filters', 'Belts', 'Bearings', 'General'];
const fmt = n => Number(n || 0).toFixed(2);
const getCurrency = () => localStorage.getItem('inv_currency') || 'Rs.';

const emptyForm = { name:'', category:'General', brand:'', price:'', stock:'', low_stock_threshold:5, barcode:'' };

export default function SpareParts({ user }) {
  const themeColor = '#f97316';
  const [currency] = useState(getCurrency);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [barcodeItem, setBarcodeItem] = useState(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const load = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (filter !== 'All') params.category = filter;
    sparePartsAPI.getAll(params).then(r => { setItems(Array.isArray(r.data) ? r.data : []); setPage(0); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, search]);

  const openAdd  = () => { setForm({ ...emptyForm }); setEditing(null); setShowModal(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditing(item.id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editing ? await sparePartsAPI.update(editing, form) : await sparePartsAPI.create(form);
      toast.success(editing ? 'Updated' : 'Spare part added');
      setShowModal(false); load();
    } catch { toast.error('Failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await sparePartsAPI.delete(deleteTarget);
    toast.success('Deleted');
    setDeleteTarget(null);
    load();
  };

  const filtered = items.filter(i => filter === 'All' || i.category === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Spare Parts</h1><p>Manage spare parts inventory</p></div>
        <button className="btn btn-primary" onClick={openAdd}><MdAdd /> Add Part</button>
      </div>

      <div className="card">
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
          <div className="filter-tabs" style={{ flexWrap:'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} className={`filter-tab ${filter===c?'active':''}`} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
          <div className="search-wrap">
            <MdSearch />
            <input placeholder="Search spare parts..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', fontSize:16 }}>✕</button>}
          </div>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {isMobile ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {pageData.map(item => (
                  <div key={item.id} style={{ background:'var(--gray-50)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--gray-200)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{item.name}</div>
                        <div style={{ fontSize:12, color:'var(--gray-400)' }}>{item.brand} · {item.category}</div>
                      </div>
                      <div style={{ fontWeight:800, color:themeColor, fontSize:14 }}>{currency}{fmt(item.price)}</div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:12, color: item.stock <= item.low_stock_threshold ? 'var(--red)' : 'var(--gray-400)' }}>Stock: {item.stock}</span>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setBarcodeItem(item)}><MdQrCode /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><MdEdit /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(item.id)}><MdDelete /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {pageData.length === 0 && <div style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>No spare parts found</div>}
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Barcode</th><th></th></tr></thead>
                  <tbody>
                    {pageData.map((item, i) => (
                      <tr key={item.id}>
                        <td style={{ color:'var(--gray-400)', fontSize:12 }}>{page*PAGE_SIZE+i+1}</td>
                        <td style={{ fontWeight:600 }}>{item.name}</td>
                        <td style={{ color:'var(--gray-500)' }}>{item.brand || '—'}</td>
                        <td><span className="badge badge-info">{item.category}</span></td>
                        <td style={{ fontWeight:700, color:themeColor }}>{currency}{fmt(item.price)}</td>
                        <td>
                          <span style={{ color: item.stock <= item.low_stock_threshold ? 'var(--red)' : 'var(--gray-700)', fontWeight:600 }}>
                            {item.stock}
                            {item.stock <= item.low_stock_threshold && <span style={{ fontSize:10, marginLeft:4, color:'var(--red)' }}>Low</span>}
                          </span>
                        </td>
                        <td style={{ fontSize:12, color:'var(--gray-400)' }}>{item.barcode || '—'}</td>
                        <td>
                          <div style={{ display:'flex', gap:4 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setBarcodeItem(item)}><MdQrCode /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><MdEdit /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(item.id)}><MdDelete /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pageData.length === 0 && <tr><td colSpan={8} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>No spare parts found</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:12 }}>
                <button disabled={page===0} onClick={() => setPage(p=>p-1)} style={{ width:32, height:32, borderRadius:8, border:'1.5px solid var(--gray-200)', background:'white', cursor:page===0?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:page===0?'var(--gray-300)':'var(--gray-600)' }}><MdChevronLeft /></button>
                {Array.from({length:totalPages},(_,i)=>i).slice(Math.max(0,page-2),page+3).map(i => (
                  <button key={i} onClick={() => setPage(i)} style={{ width:32, height:32, borderRadius:8, border:`1.5px solid ${page===i?themeColor:'var(--gray-200)'}`, background:page===i?themeColor:'white', color:page===i?'white':'var(--gray-700)', fontWeight:700, fontSize:13, cursor:'pointer' }}>{i+1}</button>
                ))}
                <button disabled={page===totalPages-1} onClick={() => setPage(p=>p+1)} style={{ width:32, height:32, borderRadius:8, border:'1.5px solid var(--gray-200)', background:'white', cursor:page===totalPages-1?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:page===totalPages-1?'var(--gray-300)':'var(--gray-600)' }}><MdChevronRight /></button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:480 }}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Spare Part' : 'Add Spare Part'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { key:'name',      label:'Name',           type:'text',   required:true,  full:true },
                  { key:'brand',     label:'Brand',          type:'text',   required:false },
                  { key:'price',     label:`Price (${currency})`,     type:'number', required:true },
                  { key:'stock',     label:'Stock Qty',       type:'number', required:false },
                  { key:'low_stock_threshold', label:'Low Stock Alert', type:'number', required:false },
                  { key:'barcode',   label:'Barcode',         type:'text',   required:false },
                ].map(f => (
                  <div key={f.key} style={{ gridColumn: f.full ? '1/-1' : 'auto' }}>
                    <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-600)', display:'block', marginBottom:4 }}>{f.label}{f.required && ' *'}</label>
                    <input type={f.type} value={form[f.key]||''} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} required={f.required}
                      style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid var(--gray-200)', fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={{ fontSize:12, fontWeight:600, color:'var(--gray-600)', display:'block', marginBottom:4 }}>Category</label>
                  <select value={form.category||'General'} onChange={e => setForm(p=>({...p,category:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid var(--gray-200)', fontSize:13, fontFamily:'inherit', outline:'none' }}>
                    {CATEGORIES.filter(c=>c!=='All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Part'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:360 }}>
            <div className="modal-header"><h2>Delete Part</h2><button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button></div>
            <div className="modal-body"><p style={{ color:'var(--gray-500)', margin:0 }}>Delete this spare part?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {barcodeItem && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:340 }}>
            <div className="modal-header"><h2>Barcode</h2><button className="modal-close" onClick={() => setBarcodeItem(null)}>✕</button></div>
            <div className="modal-body" style={{ textAlign:'center' }}>
              <div style={{ fontWeight:700, marginBottom:12 }}>{barcodeItem.name}</div>
              <BarcodeDisplay value={barcodeItem.barcode || String(barcodeItem.id)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => window.print()}>Print</button>
              <button className="btn btn-secondary" onClick={() => setBarcodeItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
