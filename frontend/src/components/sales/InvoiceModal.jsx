import { MdPrint } from 'react-icons/md';
import BarcodeDisplay from '../BarcodeDisplay';

const fmt = n => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQ = n => Number(n || 0);

function numberToWords(amount) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (amount === 0) return 'Zero Only';
  const convert = n => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+convert(n%100) : '');
    if (n < 100000) return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+convert(n%1000) : '');
    if (n < 10000000) return convert(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' '+convert(n%100000) : '');
    return convert(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' '+convert(n%10000000) : '');
  };
  const i = Math.floor(amount);
  const d = Math.round((amount - i) * 100);
  return d > 0 ? convert(i) + ' and ' + convert(d) + ' Paise Only' : convert(i) + ' Only';
}

export default function InvoiceModal({ lastSale, themeColor, cfg, user, currency, onClose, onPrint }) {
  const F   = "'Courier New', Courier, monospace";
  const cur = currency || 'Rs.';
  const bInfo = (() => { try { return JSON.parse(localStorage.getItem('business_print_info') || '{}'); } catch { return {}; } })();

  const subtotal = lastSale.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const discount = Number(lastSale.discount || 0);
  const tax      = Number(lastSale.tax || 0);
  const total    = Number(lastSale.total || 0);
  const invoiceNum = String(lastSale.id).padStart(7, '0');
  const date     = new Date(lastSale.created_at || Date.now());
  const dateStr  = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr  = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const accent   = themeColor || '#f97316';

  /* dashed divider */
  const Dash = ({ my = 10 }) => (
    <div style={{ borderTop: '1.5px dashed #bbb', margin: `${my}px 0` }} />
  );

  /* label : value row */
  const MetaRow = ({ label, value }) => (
    <div style={{ display: 'flex', fontSize: 12, fontFamily: F, lineHeight: 1.7 }}>
      <span style={{ width: 90, color: '#333', fontWeight: 600 }}>{label}</span>
      <span style={{ marginRight: 8, color: '#333' }}>:</span>
      <span style={{ color: '#111', fontWeight: 700 }}>{value}</span>
    </div>
  );

  return (
    <div className="modal-overlay" style={{
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      padding: '16px',
      alignItems: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        display: 'flex', flexDirection: 'column',
        maxHeight: '94vh',
        borderRadius: 12,
        boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
        overflow: 'hidden',
      }}>

        {/* ══════════ RECEIPT PAPER ══════════ */}
        <div className="print-receipt" style={{
          overflowY: 'auto', flex: 1,
          background: '#fff',
          fontFamily: F,
          padding: '24px 22px 20px',
        }}>

          {/* ── HEADER: Logo left | Name right ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
            <img src="/icon.png" alt="logo"
              style={{ width: 64, height: 64, objectFit: 'contain', mixBlendMode: 'multiply', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1.1 }}>
                {user?.business_name || bInfo.businessName || 'YOUR SHOP'}
              </div>
              {/* thin line under name */}
              <div style={{ height: 1.5, background: '#111', margin: '5px 0 6px' }} />
              {bInfo.address && (
                <div style={{ fontSize: 11.5, color: '#444', lineHeight: 1.5, marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  {bInfo.address}
                </div>
              )}
              {bInfo.phone && (
                <div style={{ fontSize: 11.5, color: '#444', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {bInfo.phone}
                </div>
              )}
              {bInfo.email && (
                <div style={{ fontSize: 11.5, color: '#444', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <polyline points="2,4 12,13 22,4"/>
                  </svg>
                  {bInfo.email}
                </div>
              )}
              {bInfo.gstin && (
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>GSTIN: {bInfo.gstin}</div>
              )}
            </div>
          </div>

          <Dash my={8} />

          {/* ── SALES INVOICE title ── */}
          <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 900, letterSpacing: '3px', color: '#111', textTransform: 'uppercase', margin: '6px 0 10px' }}>
            SALES  INVOICE
          </div>

          <Dash my={4} />

          {/* ── Meta info ── */}
          <div style={{ margin: '8px 0' }}>
            <MetaRow label="Invoice No"  value={`#${lastSale.id}`} />
            <MetaRow label="Date"        value={dateStr} />
            <MetaRow label="Time"        value={timeStr} />
            <MetaRow label="Cashier"     value={user?.name || user?.username || 'Admin'} />
            {lastSale.customer_name?.trim() && (
              <MetaRow label="Customer" value={lastSale.customer_name} />
            )}
            {lastSale.customer_phone && (
              <MetaRow label="Phone" value={lastSale.customer_phone} />
            )}
          </div>

          <Dash />

          {/* ── Items Table ── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F }}>
            <thead>
              <tr>
                <th style={{ fontSize: 11, fontWeight: 800, color: '#333', textAlign: 'left',   padding: '4px 4px 4px 0', letterSpacing: '0.5px', width: 20 }}>#</th>
                <th style={{ fontSize: 11, fontWeight: 800, color: '#333', textAlign: 'left',   padding: '4px 4px', letterSpacing: '0.5px' }}>DESCRIPTION</th>
                <th style={{ fontSize: 11, fontWeight: 800, color: '#333', textAlign: 'center', padding: '4px 4px', letterSpacing: '0.5px', width: 32 }}>QTY</th>
                <th style={{ fontSize: 11, fontWeight: 800, color: '#333', textAlign: 'right',  padding: '4px 4px', letterSpacing: '0.5px', width: 72 }}>RATE</th>
              </tr>
            </thead>
          </table>
          <Dash my={2} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F }}>
            <tbody>
              {lastSale.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12.5, color: '#555', padding: '6px 4px 6px 0', verticalAlign: 'top', width: 20 }}>{i+1}</td>
                  <td style={{ fontSize: 12.5, fontWeight: 600, color: '#111', padding: '6px 4px', verticalAlign: 'top' }}>
                    {item.tyre_name}
                  </td>
                  <td style={{ fontSize: 12.5, color: '#444', padding: '6px 4px', textAlign: 'center', verticalAlign: 'top', width: 32 }}>{fmtQ(item.quantity)}</td>
                  <td style={{ fontSize: 12.5, color: '#444', padding: '6px 4px', textAlign: 'right', verticalAlign: 'top', width: 72 }}>{fmt(item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Dash my={10} />

          {/* ── Subtotal / Discount / Tax ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
            <div style={{ minWidth: 220, fontFamily: F, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#555' }}>
                <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>SUBTOTAL</span>
                <span style={{ display: 'flex', gap: 8 }}><span>:</span><span style={{ minWidth: 80, textAlign: 'right' }}>{fmt(subtotal)}</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#555' }}>
                <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>DISCOUNT</span>
                <span style={{ display: 'flex', gap: 8 }}><span>:</span><span style={{ minWidth: 80, textAlign: 'right' }}>{fmt(discount)}</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#555' }}>
                <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>TAX</span>
                <span style={{ display: 'flex', gap: 8 }}><span>:</span><span style={{ minWidth: 80, textAlign: 'right' }}>{fmt(tax)}</span></span>
              </div>
            </div>
          </div>

          <Dash my={10} />

          {/* ── NET AMOUNT ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontFamily: F, padding: '4px 0', marginBottom: 4 }}>
            <span style={{ color: '#333', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Amount</span>
            <span style={{ color: '#111', fontWeight: 900, fontSize: 14 }}>{cur} {fmt(total)}</span>
          </div>

          <Dash my={10} />

          {/* ── Payment Method only ── */}
          <div style={{ margin: '4px 0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontFamily: F, lineHeight: 1.8 }}>
              <span style={{ color: '#333', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Payment Method</span>
              <span style={{ color: '#111', fontWeight: 700 }}>{lastSale.payment_method || 'Cash'}</span>
            </div>
          </div>

          {/* ── GST Details ── */}
          {tax > 0 && (
            <>
              <Dash />
              <div style={{ fontSize: 11, fontWeight: 800, color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>GST Details</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F, fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    {['Taxable', 'SGST%', 'Amt', 'CGST%', 'Amt'].map((h, i) => (
                      <th key={i} style={{ padding: '5px 4px', fontWeight: 800, color: '#555', textAlign: i === 0 ? 'left' : i % 2 === 0 ? 'right' : 'center' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '5px 4px' }}>{fmt(total / 1.05)}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center' }}>2.5%</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{fmt(tax / 2)}</td>
                    <td style={{ padding: '5px 4px', textAlign: 'center' }}>2.5%</td>
                    <td style={{ padding: '5px 4px', textAlign: 'right' }}>{fmt(tax / 2)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          <Dash />

          {/* ── Footer ── */}
          <div style={{ textAlign: 'center', padding: '4px 0 10px' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#111', letterSpacing: '0.5px' }}>Thank You!</div>
            <div style={{ fontSize: 11.5, color: '#888', marginTop: 3 }}>We look forward to serving you again.</div>
          </div>

          {/* ── Barcode ── */}
          <div style={{ textAlign: 'center' }}>
            <BarcodeDisplay value={invoiceNum} width={1.6} height={44} fontSize={10} />
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 3, fontFamily: F, letterSpacing: '0.5px' }}>
              INV-{lastSale.id}-{date.toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'}).replace(/\//g,'')}
            </div>
          </div>

        </div>

        {/* ══════════ BUTTONS ══════════ */}
        <div className="print-hide" style={{
          background: '#0f172a',
          padding: '13px 16px',
          display: 'flex', gap: 10, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: 9,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F,
          }}>Close</button>
          <button onClick={onPrint} style={{
            flex: 2, padding: '11px', borderRadius: 9,
            border: 'none',
            background: `linear-gradient(135deg,${accent},${accent}bb)`,
            color: 'white',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: `0 6px 20px ${accent}44`,
          }}>
            <MdPrint style={{ fontSize: 17 }} /> Print Receipt
          </button>
        </div>

      </div>
    </div>
  );
}
