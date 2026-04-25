import { useEffect, useState } from 'react';
import { tyresAPI } from '../api';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdChevronLeft, MdChevronRight, MdQrCode } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getConfig } from '../businessConfig';
import BarcodeDisplay from '../components/BarcodeDisplay';
import CarTypeSelect from '../components/CarTypeSelect';
import CustomSelect from '../components/CustomSelect';

const PAGE_SIZE = 7;

export default function Inventory({ user }) {
  const cfg = getConfig(user?.business_type);
  const Icon = cfg.inventoryIcon;
  const themeColor = cfg.color;

  const [items, setItems] = useState([]);
  const [currency, setCurrency] = useState(() => localStorage.getItem('inv_currency') || 'PKR');

  useEffect(() => {
    const h = () => setCurrency(localStorage.getItem('inv_currency') || 'PKR');
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(cfg.emptyDefaults);
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
    const params = { search: search || undefined };
    if (filter !== 'All') params[cfg.filterKey] = filter;
    tyresAPI.getAll(params)
      .then(r => { setItems(r.data); setPage(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, search]);

  const openAdd = () => { setForm({ ...cfg.emptyDefaults }); setEditing(null); setShowModal(true); };
  const openEdit = (item) => { setForm({ ...item }); setEditing(item.id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editing ? await tyresAPI.update(editing, form) : await tyresAPI.create(form);
      toast.success(editing ? 'Updated' : `${cfg.itemLabel} added`);
      setShowModal(false); load();
    } catch { toast.error('Failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await tyresAPI.delete(deleteTarget);
    toast.success('Deleted');
    setDeleteTarget(null);
    load();
  };

  const stockBadge = (item) => {
    if (item.stock === 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (item.stock <= item.low_stock_threshold) return <span className="badge badge-warning">Low Stock</span>;
    return <span className="badge badge-success">In Stock</span>;
  };

  const expiryBadge = (item) => {
    if (!item.expiry_date) return null;
    const diff = (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return <span className="badge badge-danger">Expired</span>;
    if (diff < 30) return <span className="badge badge-warning">Expiring Soon</span>;
    return null;
  };

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageData = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  let ws = Math.max(0, page - 1);
  let we = Math.min(totalPages, ws + 3);
  if (we - ws < 3) ws = Math.max(0, we - 3);
  const pageNums = Array.from({ length: we - ws }, (_, i) => ws + i);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{cfg.inventoryLabel}</h1>
          <p>{items.length} {cfg.itemsLabel.toLowerCase()} in database</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ background: themeColor, borderColor: themeColor }}>
          <MdAdd />Add {cfg.itemLabel}
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <div className="filter-tabs" style={{ flexWrap: 'wrap' }}>
            {cfg.filterOptions.map(f => (
              <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="search-wrap" style={{ width: '100%' }}>
            <MdSearch />
            <input placeholder={`Search ${cfg.itemsLabel.toLowerCase()}...`} value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }} />
            {search && (
              <button onClick={() => { setSearch(''); setPage(0); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 16 }}>✕</button>
            )}
          </div>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pageData.length === 0 && <div className="empty-state"><Icon /><p>No {cfg.itemsLabel.toLowerCase()} found</p></div>}
                {pageData.map(item => (
                  <div key={item.id} style={{ background: 'var(--gray-50)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: themeColor + '18', border: `1px solid ${themeColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ color: themeColor, fontSize: 20 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{cfg.itemName(item)}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{cfg.itemSubtitle(item)}</div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: themeColor, fontSize: 14 }}>{currency}{Number(item.price).toFixed(2)}</span>
                        {(item.cost_price || item.cost) > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600 }}>Cost: {currency}{Number(item.cost_price || item.cost).toFixed(2)}</span>
                        )}
                        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Qty: {item.stock}</span>
                        {stockBadge(item)}
                        {expiryBadge(item)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}><MdEdit /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(item.id)}><MdDelete /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{cfg.itemLabel}</th>
                      <th>Category / Type</th>
                      <th>Sale Price</th>
                      <th>Cost Price</th>
                      <th>Stock</th>
                      <th>Barcode</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: themeColor + '18', border: `1px solid ${themeColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon style={{ color: themeColor, fontSize: 18 }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800 }}>{cfg.itemName(item)}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{cfg.itemSubtitle(item)}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--gray-600)' }}>
                          {item.category || item.type || '—'}
                        </td>
                        <td style={{ fontWeight: 800, color: themeColor }}>{currency} {Number(item.price).toFixed(2)}</td>
                        <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                          {(item.cost_price || item.cost) ? `${currency} ${Number(item.cost_price || item.cost).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ fontWeight: 700 }}>{item.stock}</td>
                        <td>
                          {item.barcode ? (
                            <button onClick={() => setBarcodeItem(item)} style={{ background:'none', border:'none', cursor:'pointer', color: themeColor, display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, padding:0 }}>
                              <MdQrCode style={{ fontSize:16 }} />{item.barcode}
                            </button>
                          ) : (
                            <span style={{ fontSize:11, color:'#9ca3af' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {stockBadge(item)}
                            {expiryBadge(item)}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}><MdEdit /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(item.id)}><MdDelete /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length === 0 && <div className="empty-state"><Icon /><p>No {cfg.itemsLabel.toLowerCase()} found</p></div>}
              </div>
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, items.length)} of {items.length}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    style={{ width: 32, height: 32, borderRadius: 9, border: '1.5px solid var(--gray-200)', background: 'white', color: page === 0 ? 'var(--gray-300)' : 'var(--gray-600)', cursor: page === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    <MdChevronLeft />
                  </button>
                  {pageNums.map(i => (
                    <button key={i} onClick={() => setPage(i)}
                      style={{ width: 32, height: 32, borderRadius: 9, border: `1.5px solid ${page === i ? themeColor : 'var(--gray-200)'}`, background: page === i ? themeColor : 'white', color: page === i ? 'white' : 'var(--gray-600)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i + 1}
                    </button>
                  ))}
                  <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}
                    style={{ width: 32, height: 32, borderRadius: 9, border: '1.5px solid var(--gray-200)', background: 'white', color: page === totalPages - 1 ? 'var(--gray-300)' : 'var(--gray-600)', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    <MdChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>


      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h2>Delete {cfg.itemLabel}</h2>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-600)', margin: 0 }}>Are you sure? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}


      {barcodeItem && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 340 }}>
            <div className="modal-header">
              <h2>Barcode — {cfg.itemName(barcodeItem)}</h2>
              <button className="modal-close" onClick={() => setBarcodeItem(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign:'center', padding:'24px 20px' }}>
              <BarcodeDisplay value={barcodeItem.barcode} width={2} height={60} fontSize={13} />
              <div style={{ marginTop:10, fontSize:13, color:'#6b7280', fontWeight:600 }}>{barcodeItem.barcode}</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setBarcodeItem(null)}>Close</button>
              <button className="btn btn-primary" style={{ background: themeColor, borderColor: themeColor }}
                onClick={() => window.print()}>Print Barcode</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editing ? `Edit ${cfg.itemLabel}` : `Add ${cfg.itemLabel}`}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'8px 12px', background:'#fff7ed', borderRadius:6, border:'1px solid #fed7aa', flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#f97316' }}>Currency:</span>
                  {['PKR','USD','AED','SAR','QAR'].map(c => (
                    <button key={c} type="button" onClick={() => { setCurrency(c); localStorage.setItem('inv_currency', c); window.dispatchEvent(new Event('storage')); }}
                      style={{ padding:'3px 10px', borderRadius:4, border:`1px solid ${currency===c?'#f97316':'#e8ecf0'}`, background:currency===c?'#f97316':'white', color:currency===c?'white':'#374151', fontSize:11.5, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="grid-2">
                  {cfg.itemFields.map(field => (
                    <div key={field.key} className="form-group" style={field.fullWidth ? { gridColumn: '1/-1' } : {}}>
                      <label className="form-label">
                        {field.isCurrency ? `${field.label} (${currency})` : field.label}
                        {field.required ? ' *' : ''}
                      </label>
                      {field.type === 'select' ? (
                        <CustomSelect
                          value={form[field.key] ?? ''}
                          onChange={val => setForm(f => ({ ...f, [field.key]: val }))}
                          options={field.options}
                          placeholder={field.options[0] || 'Select...'}
                        />
                      ) : field.type === 'datalist' ? (
                        <CarTypeSelect
                          value={form[field.key] ?? ''}
                          onChange={val => setForm(f => ({ ...f, [field.key]: val }))}
                          suggestions={field.suggestions}
                          placeholder={field.placeholder || 'Select...'}
                        />
                      ) : (
                        <input
                          type={field.type}
                          className="form-control"
                          required={field.required}
                          placeholder={field.placeholder || ''}
                          value={form[field.key] ?? ''}
                          min={field.type === 'number' ? 0 : undefined}
                          step={field.isCurrency ? '0.01' : undefined}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: themeColor, borderColor: themeColor }}>
                  {editing ? 'Update' : `Add ${cfg.itemLabel}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
