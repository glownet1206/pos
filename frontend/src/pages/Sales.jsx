import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { tyresAPI, customersAPI, salesAPI, sparePartsAPI } from '../api';
import {
  MdDelete, MdShoppingCart, MdSearch,
  MdChevronLeft, MdChevronRight
} from 'react-icons/md';
import { MdQrCodeScanner } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getConfig } from '../businessConfig';
import CartPanel from '../components/sales/CartPanel';
import InvoiceModal from '../components/sales/InvoiceModal';
import CameraScanner from '../components/CameraScanner';

const fmt = n => Number(n || 0).toFixed(2);
const getCurrency = () => localStorage.getItem('inv_currency') || 'PKR';

export default function Sales({ user }) {
  const cfg = getConfig(user?.business_type);
  const ItemIcon = cfg.inventoryIcon;
  const themeColor = cfg.color;
  const [currency, setCurrency] = useState(getCurrency);

  useEffect(() => {
    const onStorage = () => setCurrency(getCurrency());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const [items, setItems] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [activeTab, setActiveTab] = useState('tyres');
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [itemFilter, setItemFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [itemPage, setItemPage] = useState(0);
  const [lastSale, setLastSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]);
  const [histTotal, setHistTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [histPage, setHistPage] = useState(0);
  const HIST_PER_PAGE = 7;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 960);
  const ITEM_PAGE_SIZE = 12;
  const [showCart, setShowCart] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scanBuffer = useRef('');
  const scanTimer = useRef(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 960);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    tyresAPI.getAll().then(r => setItems(Array.isArray(r.data) ? r.data : []));
    sparePartsAPI.getAll().then(r => setSpareParts(Array.isArray(r.data) ? r.data : []));
    customersAPI.getAll().then(r => setCustomers(r.data));
    loadHistory(0);
  }, []);

  const loadHistory = useCallback((page = 0) => {
    return salesAPI.getAll({ page, limit: HIST_PER_PAGE }).then(r => {
      setSalesHistory(r.data.sales || []);
      setHistTotal(r.data.total || 0);
    }).catch(() => {});
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await salesAPI.delete(id);
      toast.success('Sale deleted');
      setDeleteConfirm(null);
      loadHistory(histPage);
      tyresAPI.getAll().then(r => setItems(Array.isArray(r.data) ? r.data : []));
      sparePartsAPI.getAll().then(r => setSpareParts(Array.isArray(r.data) ? r.data : []));
    } catch { toast.error('Failed to delete'); }
  }, [histPage, loadHistory]);

  const filtered = useMemo(() => {
    const source = activeTab === 'spare_parts' ? spareParts : items;
    return source.filter(t => {
      const mf = itemFilter === 'All' || t.type === itemFilter || t.category === itemFilter;
      const ms = !search || (activeTab === 'spare_parts' ? t.name : cfg.itemName(t)).toLowerCase().includes(search.toLowerCase()) || (t.barcode || '').toLowerCase().includes(search.toLowerCase());
      return mf && ms && t.stock > 0;
    });
  }, [items, spareParts, activeTab, itemFilter, search, cfg]);

  const totalItemPages = useMemo(() => Math.ceil(filtered.length / ITEM_PAGE_SIZE), [filtered.length]);
  const itemPageData = useMemo(() => isMobile ? filtered : filtered.slice(itemPage * ITEM_PAGE_SIZE, (itemPage + 1) * ITEM_PAGE_SIZE), [filtered, isMobile, itemPage]);

  useEffect(() => { setItemPage(0); }, [itemFilter, search]);

  const addToCart = useCallback((item) => {
    if (item.stock === 0) return toast.error('Out of stock');
    const isSparePart = activeTab === 'spare_parts';
    const itemName = isSparePart ? item.name : cfg.itemName(item);
    setCart(prev => {
      const cartId = `${isSparePart ? 'sp' : 'ty'}_${item.id}`;
      const ex = prev.find(i => i.cart_id === cartId);
      if (ex) {
        if (ex.quantity >= item.stock) { toast.error('Not enough stock'); return prev; }
        return prev.map(i => i.cart_id === cartId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { cart_id: cartId, tyre_id: item.id, tyre_name: itemName, unit_price: item.price, quantity: 1, discount: 0, stock: item.stock, item_type: isSparePart ? 'spare_part' : 'tyre' }];
    });
    toast.success(`Added`, { duration: 700 });
  }, [cfg, activeTab]);

  useEffect(() => {
    const handleKey = (e) => {
      const active = document.activeElement;
      const isScanInput = active?.dataset?.scaninput === 'true';

      if (e.key === 'Enter') {
        const code = scanBuffer.current.trim();
        scanBuffer.current = '';
        clearTimeout(scanTimer.current);
        if (code.length < 2) return;
        const found = items.find(t => t.barcode && t.barcode === code);
        const foundSp = !found && spareParts.find(t => t.barcode && t.barcode === code);
        if (found) addToCart(found);
        else if (foundSp) { setActiveTab('spare_parts'); addToCart(foundSp); }
        else toast.error(`Barcode not found: ${code}`, { duration: 1500 });
        if (isScanInput) { active.value = ''; e.preventDefault(); }
        return;
      }

      if (e.key && e.key.length === 1) {
        const tag = active?.tagName;
        const isOtherInput = (tag === 'INPUT' || tag === 'TEXTAREA') && !isScanInput;
        if (isOtherInput) return;
        scanBuffer.current += e.key;
        clearTimeout(scanTimer.current);
        scanTimer.current = setTimeout(() => { scanBuffer.current = ''; }, 300);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); clearTimeout(scanTimer.current); };
  }, [items, addToCart]);

  const updateQty = useCallback((cartId, qty) => { if (qty >= 1) setCart(prev => prev.map(i => i.cart_id === cartId ? { ...i, quantity: qty } : i)); }, []);
  const removeItem = useCallback((cartId) => setCart(prev => prev.filter(i => i.cart_id !== cartId)), []);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unit_price * i.quantity, 0), [cart]);
  const discountAmt = useMemo(() => (subtotal * discount) / 100, [subtotal, discount]);
  const taxAmt = useMemo(() => ((subtotal - discountAmt) * taxRate) / 100, [subtotal, discountAmt, taxRate]);
  const total = useMemo(() => subtotal - discountAmt + taxAmt, [subtotal, discountAmt, taxAmt]);

  const handleCheckout = useCallback(async () => {
    if (!cart.length) return toast.error('Cart is empty');
    try {
      const res = await salesAPI.create({ customer_name: customerName, items: cart, discount: discountAmt, tax: taxAmt, payment_method: paymentMethod });
      setLastSale({ id: res.data.id, customer_name: customerName, items: [...cart], subtotal, discount: discountAmt, tax: taxAmt, total, payment_method: paymentMethod, date: new Date().toLocaleString() });
      setCart([]); setCustomerName(''); setDiscount(0); setTaxRate(0);
      tyresAPI.getAll().then(r => setItems(Array.isArray(r.data) ? r.data : []));
      sparePartsAPI.getAll().then(r => setSpareParts(Array.isArray(r.data) ? r.data : []));
      setHistPage(0);
      await loadHistory(0);
      setShowCart(false);
      setShowInvoice(true);
      toast.success('Sale completed!');
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to complete sale';
      toast.error(msg);
      console.error('[checkout]', err?.response?.data || err);
    }
  }, [cart, customerName, discountAmt, taxAmt, paymentMethod, subtotal, total, loadHistory]);

  const handlePrint = useCallback(() => window.print(), []);

  const handleScan = useCallback((code) => {
    const found = items.find(t => t.barcode && t.barcode === code);
    const foundSp = !found && spareParts.find(t => t.barcode && t.barcode === code);
    if (found) {
      addToCart(found);
    } else if (foundSp) {
      setActiveTab('spare_parts');
      addToCart(foundSp);
    } else {
      toast.error(`Not found: ${code}`, { duration: 1500 });
    }
    setShowScanner(false);
  }, [items, spareParts, addToCart]);
  const histTotalPages = useMemo(() => Math.ceil(histTotal / HIST_PER_PAGE), [histTotal]);

  const cartProps = useMemo(() => ({
    isMobile, themeColor, cart, customers, customerName, setCustomerName,
    paymentMethod, setPaymentMethod, discount, setDiscount, taxRate, setTaxRate,
    subtotal, discountAmt, taxAmt, total, currency,
    updateQty, removeItem, handleCheckout,
    onClose: () => setShowCart(false),
  }), [isMobile, themeColor, cart, customers, customerName, paymentMethod, discount, taxRate, subtotal, discountAmt, taxAmt, total, currency, updateQty, removeItem, handleCheckout]);

  return (
    <div className="page" style={{ paddingBottom: isMobile ? 90 : undefined }}>
      <div className="page-header">
        <div><h1>{isMobile ? cfg.salesLabel.split(' /')[0] : cfg.salesLabel}</h1><p>Create new sale and manage orders</p></div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
            <MdQrCodeScanner style={{ position:'absolute', left:10, fontSize:18, color:'#9ca3af', pointerEvents:'none' }} />
            <input
              data-scaninput="true"
              placeholder="Scan barcode..."
              style={{ paddingLeft:34, paddingRight:12, height:38, borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, fontFamily:'inherit', outline:'none', width:180, background:'#f9fafb' }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const code = e.currentTarget.value.trim();
                  e.currentTarget.value = '';
                  if (!code) return;
                  const found = items.find(t => t.barcode && t.barcode === code);
                  const foundSp = !found && spareParts.find(t => t.barcode && t.barcode === code);
                  if (found) addToCart(found);
                  else if (foundSp) { setActiveTab('spare_parts'); addToCart(foundSp); }
                  else toast.error(`Barcode not found: ${code}`, { duration: 1500 });
                }
              }}
            />
          </div>
          <button onClick={() => setShowScanner(true)}
            style={{ height:38, padding:'0 14px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'#374151', fontFamily:'inherit' }}>
            <MdQrCodeScanner style={{ fontSize:18, color: themeColor }} />
            {!isMobile && 'Camera'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 18, alignItems: 'start' }}>


        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cfg.label === 'Tyre Shop' && (
                <div style={{ display:'flex', gap:8, marginBottom:4 }}>
                  {[['tyres','Tyres'],['spare_parts','Spare Parts']].map(([tab, label]) => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setItemFilter('All'); setSearch(''); }}
                      style={{ padding:'7px 18px', borderRadius:9, border:`1.5px solid ${activeTab===tab?themeColor:'var(--gray-200)'}`, background:activeTab===tab?themeColor:'white', color:activeTab===tab?'white':'var(--gray-600)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div className="filter-tabs" style={{ flexWrap: 'wrap' }}>
                {(activeTab === 'spare_parts'
                  ? ['All','Engine','Brakes','Suspension','Electrical','Body','Filters','Belts','Bearings','General']
                  : cfg.filterOptions
                ).map(f => (
                  <button key={f} className={`filter-tab ${itemFilter === f ? 'active' : ''}`}
                    onClick={() => setItemFilter(f)}>{f}</button>
                ))}
              </div>
              <div className="search-wrap">
                <MdSearch />
                <input placeholder={`Search ${cfg.itemsLabel.toLowerCase()}...`} value={search}
                  onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 16 }}>✕</button>}
              </div>
            </div>
          </div>


          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 8 : 10 }}>
            {itemPageData.map(item => (
              <div key={item.id} onClick={() => addToCart(item)}
                style={{ background: 'white', borderRadius: 12, border: '1.5px solid #e5e7eb', padding: isMobile ? '10px' : '12px', cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = themeColor; e.currentTarget.style.boxShadow = `0 4px 16px ${themeColor}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: themeColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <ItemIcon style={{ color: themeColor, fontSize: 16 }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: '#111827', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {activeTab === 'spare_parts' ? item.name : cfg.itemName(item)}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>{activeTab === 'spare_parts' ? (item.brand || item.category) : cfg.itemSubtitle(item)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: themeColor, fontSize: isMobile ? 12 : 14 }}>{currency}{fmt(item.price)}</span>
                  <span style={{ fontSize: 11, color: item.stock <= 5 ? '#ef4444' : '#9ca3af' }}>×{item.stock}</span>
                </div>
              </div>
            ))}
            {itemPageData.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                <ItemIcon style={{ fontSize: 32, marginBottom: 8 }} />
                <p>No {cfg.itemsLabel.toLowerCase()} found</p>
              </div>
            )}
          </div>


          {totalItemPages > 1 && !isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              <button disabled={itemPage === 0} onClick={() => setItemPage(p => p - 1)}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: itemPage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: itemPage === 0 ? '#d1d5db' : '#374151' }}>
                <MdChevronLeft />
              </button>
              {Array.from({ length: totalItemPages }, (_, i) => i).slice(Math.max(0, itemPage - 2), itemPage + 3).map(i => (
                <button key={i} onClick={() => setItemPage(i)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${itemPage === i ? themeColor : '#e5e7eb'}`, background: itemPage === i ? themeColor : 'white', color: itemPage === i ? 'white' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {i + 1}
                </button>
              ))}
              <button disabled={itemPage === totalItemPages - 1} onClick={() => setItemPage(p => p + 1)}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: itemPage === totalItemPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: itemPage === totalItemPages - 1 ? '#d1d5db' : '#374151' }}>
                <MdChevronRight />
              </button>
            </div>
          )}

        </div>


        {!isMobile && <CartPanel {...cartProps} />}
      </div>


      <div className="card" style={{ marginTop: 18 }}>
            <div className="card-header"><span className="card-title">Sales History</span></div>


            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {salesHistory.map(s => (
                  <div key={s.id} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{s.customer_name}</div>
                      <div style={{ fontWeight: 800, color: themeColor, fontSize: 14 }}>{currency}{fmt(s.total)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, lineHeight: 1.4 }}>{s.items_summary || '—'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 11, background: '#e5e7eb', borderRadius: 6, padding: '2px 8px', color: '#374151', fontWeight: 600 }}>{s.payment_method}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => setDeleteConfirm(s.id)} className="btn btn-danger btn-sm"><MdDelete /></button>
                    </div>
                  </div>
                ))}
                {salesHistory.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No sales yet</div>}
              </div>
            ) : (

              <div className="table-wrap">
                <table>
                  <thead><tr><th>Customer</th><th>Items</th><th>Total</th><th>Method</th><th>Date</th><th></th></tr></thead>
                  <tbody>
                    {salesHistory.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.customer_name}</td>
                        <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.items_summary || '—'}</td>
                        <td style={{ fontWeight: 800, color: themeColor }}>{currency}{fmt(s.total)}</td>
                        <td style={{ fontSize: 12 }}>{s.payment_method}</td>
                        <td style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                        <td><button onClick={() => setDeleteConfirm(s.id)} className="btn btn-danger btn-sm"><MdDelete /></button></td>
                      </tr>
                    ))}
                    {salesHistory.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No sales yet</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {histTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                <button disabled={histPage === 0} onClick={() => { const p = histPage - 1; setHistPage(p); loadHistory(p); }}
                  style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: histPage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdChevronLeft />
                </button>
                <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', padding: '0 8px' }}>{histPage + 1} / {histTotalPages}</span>
                <button disabled={histPage === histTotalPages - 1} onClick={() => { const p = histPage + 1; setHistPage(p); loadHistory(p); }}
                  style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', cursor: histPage === histTotalPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdChevronRight />
                </button>
              </div>
            )}
          </div>


      {isMobile && (
        <button onClick={() => setShowCart(true)}
          style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 300, background: `linear-gradient(135deg,${themeColor},${themeColor}cc)`, color: 'white', border: 'none', borderRadius: 50, padding: '14px 22px', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 6px 24px ${themeColor}55`, fontFamily: 'inherit' }}>
          <MdShoppingCart style={{ fontSize: 20 }} />
          Cart
          {cart.length > 0 && <span style={{ background: 'white', color: themeColor, borderRadius: 20, padding: '1px 8px', fontSize: 12, fontWeight: 900 }}>{cart.length}</span>}
        </button>
      )}


      {isMobile && showCart && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCart(false); }}>
          <div style={{ width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px 20px 0 0', background: 'white', padding: 16 }}>
            <CartPanel {...cartProps} />
          </div>
        </div>
      )}


      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header"><h2>Delete Sale</h2><button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button></div>
            <div className="modal-body"><p style={{ color: '#6b7280', margin: 0 }}>Delete this sale? Stock will be restored.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}


      {showInvoice && lastSale && (
        <InvoiceModal
          lastSale={lastSale}
          themeColor={themeColor}
          cfg={cfg}
          user={user}
          currency={currency}
          onClose={() => { setShowInvoice(false); setHistPage(0); loadHistory(0); }}
          onPrint={handlePrint}
        />
      )}

      {showScanner && (
        <CameraScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

    </div>
  );
}


