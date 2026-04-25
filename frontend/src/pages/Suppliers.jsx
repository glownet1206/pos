import { useEffect, useState } from 'react';
import { suppliersAPI, tyresAPI } from '../api';
import { MdAdd, MdCheckCircle, MdLocalShipping, MdStorefront, MdPendingActions, MdPhone, MdEmail, MdDelete, MdEdit } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getConfig } from '../businessConfig';

const fmt = n => Number(n || 0).toFixed(2);

export default function Suppliers({ user }) {
  const cfg = getConfig(user?.business_type);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tyres, setTyres] = useState([]);
  const [tab, setTab] = useState('orders');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null); // null = add, obj = edit
  const [orderForm, setOrderForm] = useState({ supplier_id: '', supplier_name: '', items: [], notes: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [orderItem, setOrderItem] = useState({ tyre_id: '', tyre_name: '', quantity: 1, unit_price: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const load = () => {
    suppliersAPI.getAll().then(r => setSuppliers(r.data));
    suppliersAPI.getOrders().then(r => setOrders(r.data));
    tyresAPI.getAll().then(r => setTyres(r.data));
  };
  useEffect(() => { load(); }, []);

  const addItem = () => {
    if (!orderItem.tyre_name || !orderItem.quantity || !orderItem.unit_price) return toast.error('Fill all fields');
    setOrderForm(p => ({ ...p, items: [...p.items, { ...orderItem }] }));
    setOrderItem({ tyre_id: '', tyre_name: '', quantity: 1, unit_price: '' });
  };

  const submitOrder = async () => {
    if (!orderForm.items.length) return toast.error('Add items');
    try {
      await suppliersAPI.createOrder(orderForm);
      toast.success('Order created');
      setShowOrderModal(false);
      setOrderForm({ supplier_id: '', supplier_name: '', items: [], notes: '' });
      load();
    } catch { toast.error('Failed'); }
  };

  const receiveOrder = async (id) => {
    if (!confirm('Mark received & update stock?')) return;
    await suppliersAPI.receiveOrder(id);
    toast.success('Stock updated');
    load();
  };

  const deleteOrder = async (id) => {
    if (!confirm('Delete this order?')) return;
    try {
      await suppliersAPI.deleteOrder(id);
      toast.success('Order deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const openAddSupplier = () => {
    setEditSupplier(null);
    setSupplierForm({ name: '', phone: '', email: '', address: '' });
    setShowSupplierModal(true);
  };

  const openEditSupplier = (s) => {
    setEditSupplier(s);
    setSupplierForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '' });
    setShowSupplierModal(true);
  };

  const submitSupplier = async (e) => {
    e.preventDefault();
    try {
      if (editSupplier) {
        await suppliersAPI.update(editSupplier.id, supplierForm);
        toast.success('Supplier updated');
      } else {
        await suppliersAPI.create(supplierForm);
        toast.success('Supplier added');
      }
      setShowSupplierModal(false);
      setSupplierForm({ name: '', phone: '', email: '', address: '' });
      setEditSupplier(null);
      load();
    } catch { toast.error('Failed'); }
  };

  const deleteSupplier = async (id) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await suppliersAPI.delete(id);
      toast.success('Supplier deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Suppliers & Orders</h1><p>Manage stock replenishment</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={openAddSupplier}><MdStorefront />Add Supplier</button>
          <button className="btn btn-primary" onClick={() => setShowOrderModal(true)}><MdAdd />New Order</button>
        </div>
      </div>

      <div className="filter-tabs mb-4">
        <button className={`filter-tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Orders ({orders.length})</button>
        <button className={`filter-tab ${tab === 'suppliers' ? 'active' : ''}`} onClick={() => setTab('suppliers')}>Suppliers ({suppliers.length})</button>
      </div>

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <div className="card">
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders.length === 0 && <div className="empty-state"><MdLocalShipping /><p>No orders yet</p></div>}
              {orders.map(o => (
                <div key={o.id} style={{ background: 'var(--gray-50)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--orange)', fontSize: 14 }}>Order #{o.id}</div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{o.supplier_name || 'N/A'}</div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: 14 }}>Rs.{fmt(o.total)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {o.status === 'received'
                        ? <span className="badge badge-success"><MdCheckCircle style={{ fontSize: 11 }} />Received</span>
                        : <span className="badge badge-warning"><MdPendingActions style={{ fontSize: 11 }} />Pending</span>}
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {o.status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => receiveOrder(o.id)}><MdCheckCircle />Receive</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteOrder(o.id)}><MdDelete /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order #</th><th>Supplier</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 800, color: 'var(--orange)' }}>#{o.id}</td>
                      <td style={{ fontWeight: 600 }}>{o.supplier_name || 'N/A'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--green)' }}>Rs.{fmt(o.total)}</td>
                      <td>{o.status === 'received'
                        ? <span className="badge badge-success"><MdCheckCircle style={{ fontSize: 11 }} />Received</span>
                        : <span className="badge badge-warning"><MdPendingActions style={{ fontSize: 11 }} />Pending</span>}
                      </td>
                      <td className="text-muted text-sm">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {o.status === 'pending' && (
                            <button className="btn btn-success btn-sm" onClick={() => receiveOrder(o.id)}><MdCheckCircle />Receive</button>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => deleteOrder(o.id)}><MdDelete /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <div className="empty-state"><MdLocalShipping /><p>No orders yet</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ── SUPPLIERS TAB ── */}
      {tab === 'suppliers' && (
        <div className="card">
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {suppliers.length === 0 && <div className="empty-state"><MdStorefront /><p>No suppliers</p></div>}
              {suppliers.map(s => (
                <div key={s.id} style={{ background: 'var(--gray-50)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--gray-200)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--orange-50)', border: '1px solid var(--orange-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MdStorefront style={{ color: 'var(--orange)', fontSize: 20 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{s.name}</div>
                    {s.phone && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}><MdPhone style={{ fontSize: 13 }} />{s.phone}</div>}
                    {s.email && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MdEmail style={{ fontSize: 13 }} />{s.email}</div>}
                    {s.address && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{s.address}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditSupplier(s)}><MdEdit /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteSupplier(s.id)}><MdDelete /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Actions</th></tr></thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--orange-50)', border: '1px solid var(--orange-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MdStorefront style={{ color: 'var(--orange)', fontSize: 16 }} />
                          </div>
                          <span style={{ fontWeight: 800 }}>{s.name}</span>
                        </div>
                      </td>
                      <td>{s.phone || <span className="text-muted">—</span>}</td>
                      <td>{s.email || <span className="text-muted">—</span>}</td>
                      <td>{s.address || <span className="text-muted">—</span>}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditSupplier(s)}><MdEdit />Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteSupplier(s.id)}><MdDelete /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {suppliers.length === 0 && <div className="empty-state"><MdStorefront /><p>No suppliers</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ── NEW ORDER MODAL ── */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header"><h2>New Supplier Order</h2><button className="modal-close" onClick={() => setShowOrderModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <select className="form-control" value={orderForm.supplier_id} onChange={e => { const s = suppliers.find(s => s.id === parseInt(e.target.value)); setOrderForm({ ...orderForm, supplier_id: e.target.value, supplier_name: s?.name || '' }); }}>
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Notes</label><input className="form-control" value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} placeholder="Optional" /></div>
              </div>
              <div className="divider" />
              <div className="form-label mb-2">ADD ITEMS</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr auto', gap: 8, alignItems: 'end', marginBottom: 14 }}>
                <div style={{ gridColumn: isMobile ? '1/-1' : 'auto' }}>
                  <label className="form-label">{cfg.itemLabel}</label>
                  <select className="form-control" value={orderItem.tyre_id} onChange={e => { const t = tyres.find(t => t.id === parseInt(e.target.value)); setOrderItem({ ...orderItem, tyre_id: e.target.value, tyre_name: t ? cfg.itemName(t) : '' }); }}>
                    <option value="">Select {cfg.itemLabel.toLowerCase()}</option>
                    {tyres.map(t => <option key={t.id} value={t.id}>{cfg.itemName(t)}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Qty</label><input type="number" className="form-control" min="1" value={orderItem.quantity} onChange={e => setOrderItem({ ...orderItem, quantity: parseInt(e.target.value) })} /></div>
                <div><label className="form-label">Unit Price</label><input type="number" className="form-control" min="0" step="0.01" value={orderItem.unit_price} onChange={e => setOrderItem({ ...orderItem, unit_price: parseFloat(e.target.value) })} /></div>
                <button className="btn btn-primary" onClick={addItem} style={{ alignSelf: 'flex-end' }}><MdAdd /></button>
              </div>
              {orderForm.items.length > 0 && (
                <div className="summary-box">
                  {orderForm.items.map((item, i) => (
                    <div key={i} className="summary-row">
                      <span style={{ fontSize: 12.5 }}>{item.tyre_name}</span>
                      <span style={{ fontSize: 12.5 }}>{item.quantity} × Rs.{item.unit_price} = <strong style={{ color: 'var(--orange)' }}>Rs.{(item.quantity * item.unit_price).toFixed(2)}</strong></span>
                    </div>
                  ))}
                  <div className="summary-row total"><span>Total</span><span>Rs.{orderForm.items.reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2)}</span></div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitOrder}>Create Order</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT SUPPLIER MODAL ── */}
      {showSupplierModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button className="modal-close" onClick={() => setShowSupplierModal(false)}>✕</button>
            </div>
            <form onSubmit={submitSupplier}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name *</label><input className="form-control" required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editSupplier ? 'Update Supplier' : 'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
