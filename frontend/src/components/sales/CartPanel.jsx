import { memo } from 'react';
import { MdShoppingCart, MdClose, MdPerson, MdCheckCircle } from 'react-icons/md';
import { FaMoneyBillWave, FaCreditCard, FaUniversity, FaHandHoldingUsd } from 'react-icons/fa';

const PAY_METHODS = [
  { label: 'Cash',          icon: FaMoneyBillWave,  color: '#10b981', bg: '#ecfdf5' },
  { label: 'Card',          icon: FaCreditCard,     color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Bank Transfer', icon: FaUniversity,     color: '#8b5cf6', bg: '#f5f3ff' },
  { label: 'Credit',        icon: FaHandHoldingUsd, color: '#f97316', bg: '#fff7ed' },
];

const fmt = n => Number(n || 0).toFixed(2);

function CartPanel({ isMobile, themeColor, cart, customers, customerName, setCustomerName, paymentMethod, setPaymentMethod, discount, setDiscount, taxRate, setTaxRate, subtotal, discountAmt, taxAmt, total, currency, updateQty, removeItem, handleCheckout, onClose }) {
  const cur = currency || 'Rs.';
  return (
    <div className="card" style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 'auto' : 80 }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <MdShoppingCart style={{ color: themeColor }} /> Cart
        {cart.length > 0 && <span style={{ background: themeColor, color: 'white', borderRadius: 20, padding: '1px 8px', fontSize: 12 }}>{cart.length}</span>}
        {isMobile && <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20, display: 'flex', alignItems: 'center' }}><MdClose /></button>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>Customer</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '8px 12px' }}>
          <MdPerson style={{ color: '#9ca3af' }} />
          <input list="cust-list" value={customerName} onChange={e => setCustomerName(e.target.value)}
            placeholder="Customer name or walk-in"
            style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: 'transparent', width: '100%' }} />
          <datalist id="cust-list">{customers.map(c => <option key={c.id} value={c.name} />)}</datalist>
        </div>
      </div>

      <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 13 }}>
            <MdShoppingCart style={{ fontSize: 28, marginBottom: 6 }} /><br />Cart is empty
          </div>
        ) : cart.map(item => (
          <div key={item.cart_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.tyre_name}</div>
              <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{cur}{fmt(item.unit_price)} each</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => updateQty(item.cart_id, item.quantity - 1)}
                style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{item.quantity}</span>
              <button onClick={() => updateQty(item.cart_id, item.quantity + 1)}
                style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
            <span style={{ fontWeight: 800, color: themeColor, fontSize: 13, minWidth: 60, textAlign: 'right' }}>{cur}{fmt(item.unit_price * item.quantity)}</span>
            <button onClick={() => removeItem(item.cart_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, display: 'flex', alignItems: 'center' }}><MdClose /></button>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Discount %</label>
          <input type="number" min={0} max={100} value={discount} onChange={e => setDiscount(Number(e.target.value))}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tax %</label>
          <input type="number" min={0} max={100} value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#6b7280' }}>
          <span>Subtotal</span><span>{cur}{fmt(subtotal)}</span>
        </div>
        {discountAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#10b981' }}>
          <span>Discount ({discount}%)</span><span>−{cur}{fmt(discountAmt)}</span>
        </div>}
        {taxAmt > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#6b7280' }}>
          <span>Tax ({taxRate}%)</span><span>+{cur}{fmt(taxAmt)}</span>
        </div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, color: '#111827', borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 4 }}>
          <span>Total</span><span style={{ color: themeColor }}>{cur}{fmt(total)}</span>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Payment Method</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PAY_METHODS.map(pm => {
            const PMIcon = pm.icon;
            const active = paymentMethod === pm.label;
            return (
              <button key={pm.label} onClick={() => setPaymentMethod(pm.label)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 9, border: `2px solid ${active ? pm.color : '#e5e7eb'}`, background: active ? pm.bg : 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: active ? pm.color : '#6b7280', transition: 'all 0.15s' }}>
                <PMIcon style={{ fontSize: 14 }} />{pm.label}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={handleCheckout} disabled={!cart.length}
        style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: cart.length ? `linear-gradient(135deg,${themeColor},${themeColor}cc)` : '#e5e7eb', color: cart.length ? 'white' : '#9ca3af', fontSize: 15, fontWeight: 800, cursor: cart.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <MdCheckCircle style={{ fontSize: 18 }} /> Complete Sale · {cur}{fmt(total)}
      </button>
    </div>
  );
}

export default memo(CartPanel);
