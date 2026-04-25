import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdClose, MdInventory2, MdPerson, MdReceiptLong, MdArrowForward } from 'react-icons/md';
import { GiTyre } from 'react-icons/gi';
import { tyresAPI, customersAPI, salesAPI } from '../api';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tyres: [], customers: [], sales: [] });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setResults({ tyres: [], customers: [], sales: [] }); setSelected(0); }
  }, [open]);
  useEffect(() => {
    if (!query.trim()) { setResults({ tyres: [], customers: [], sales: [] }); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const [ty, cu, sa] = await Promise.all([
          tyresAPI.getAll({ search: query }),
          customersAPI.getAll({ search: query }),
          salesAPI.getAll({ limit: 100 }),
        ]);
        const salesArr = Array.isArray(sa.data) ? sa.data : (sa.data.sales || []);
        const salesFiltered = salesArr.filter(s =>
          s.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
          String(s.id).includes(query)
        ).slice(0, 4);
        setResults({ tyres: ty.data.slice(0, 4), customers: cu.data.slice(0, 4), sales: salesFiltered });
        setSelected(0);
      } catch { }
      setLoading(false);
    }, 280);
    return () => clearTimeout(t);
  }, [query]);
  const flat = [
    ...results.tyres.map(r => ({ type: 'tyre', data: r })),
    ...results.customers.map(r => ({ type: 'customer', data: r })),
    ...results.sales.map(r => ({ type: 'sale', data: r })),
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && flat[selected]) go(flat[selected]);
  };

  const go = ({ type, data }) => {
    setOpen(false);
    if (type === 'tyre') navigate('/inventory');
    if (type === 'customer') navigate('/settings');
    if (type === 'sale') navigate('/sales');
  };

  const total = flat.length;
  const isEmpty = query.trim() && !loading && total === 0;

  return (
    <>

      <button
        onClick={() => setOpen(true)}
        className="global-search-trigger"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)',
          borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
          transition: 'all 0.15s', fontFamily: 'inherit',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange-200)'; e.currentTarget.style.background = 'var(--orange-50)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)'; }}
      >
        <MdSearch style={{ color: 'var(--gray-400)', fontSize: 17 }} />
        <span className="search-label" style={{ fontSize: 13, color: 'var(--gray-300)', fontWeight: 500, userSelect: 'none' }}>Quick search...</span>
        <span className="search-kbd" style={{ fontSize: 11, color: 'var(--gray-300)', background: 'var(--gray-100)', padding: '2px 7px', borderRadius: 6, fontWeight: 700 }}>⌘K</span>
      </button>


      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80, paddingLeft: 12, paddingRight: 12 }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 580, background: 'white',
              borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.08)',
              border: '1px solid var(--gray-200)', overflow: 'hidden',
              animation: 'slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--gray-100)' }}>
              <MdSearch style={{ color: query ? 'var(--orange)' : 'var(--gray-400)', fontSize: 22, flexShrink: 0, transition: 'color 0.15s' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tyres, customers, sales..."
                style={{
                  flex: 1, border: 'none', outline: 'none', fontSize: 16,
                  fontWeight: 500, color: 'var(--gray-900)', background: 'transparent',
                  fontFamily: 'inherit',
                }}
              />
              {query ? (
                <button onClick={() => setQuery('')} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 16, flexShrink: 0 }}>
                  <MdClose />
                </button>
              ) : (
                <button onClick={() => setOpen(false)} style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 16, flexShrink: 0 }}>
                  <MdClose />
                </button>
              )}
            </div>


            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {!query.trim() && (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <MdSearch style={{ fontSize: 36, color: 'var(--gray-200)', display: 'block', margin: '0 auto 10px' }} />
                  <p style={{ color: 'var(--gray-400)', fontSize: 14, fontWeight: 500 }}>Type to search...</p>
                </div>
              )}

              {loading && (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <div style={{ width: 28, height: 28, border: '3px solid var(--gray-100)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
                </div>
              )}

              {isEmpty && (
                <div style={{ padding: '28px 20px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--gray-400)', fontSize: 14, fontWeight: 500 }}>No results for "<strong style={{ color: 'var(--gray-600)' }}>{query}</strong>"</p>
                </div>
              )}


              {results.tyres.length > 0 && (
                <Section label="Tyres" icon={<GiTyre style={{ color: 'var(--orange)', fontSize: 15 }} />}>
                  {results.tyres.map((t, i) => {
                    const idx = flat.findIndex(f => f.type === 'tyre' && f.data.id === t.id);
                    return (
                      <ResultRow
                        key={t.id}
                        active={selected === idx}
                        onClick={() => go({ type: 'tyre', data: t })}
                        onHover={() => setSelected(idx)}
                        icon={<div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--orange-50)', border: '1.5px solid var(--orange-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GiTyre style={{ color: 'var(--orange)', fontSize: 18 }} /></div>}
                        title={`${t.brand} ${t.model}`}
                        sub={`${t.size} · ${t.type} · ${t.stock} in stock`}
                        right={<span style={{ fontWeight: 900, color: 'var(--orange)', fontSize: 14 }}>${t.price.toFixed(2)}</span>}
                        badge={t.stock === 0 ? { label: 'Out', color: 'var(--red)', bg: 'var(--red-bg)' } : t.stock <= t.low_stock_threshold ? { label: 'Low', color: 'var(--orange)', bg: 'var(--orange-50)' } : null}
                      />
                    );
                  })}
                </Section>
              )}


              {results.customers.length > 0 && (
                <Section label="Customers" icon={<MdPerson style={{ color: 'var(--blue)', fontSize: 15 }} />}>
                  {results.customers.map((c) => {
                    const idx = flat.findIndex(f => f.type === 'customer' && f.data.id === c.id);
                    return (
                      <ResultRow
                        key={c.id}
                        active={selected === idx}
                        onClick={() => go({ type: 'customer', data: c })}
                        onHover={() => setSelected(idx)}
                        icon={<div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--blue-bg)', border: '1.5px solid rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--blue)' }}>{c.name.charAt(0).toUpperCase()}</div>}
                        title={c.name}
                        sub={[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact info'}
                        right={<MdArrowForward style={{ color: 'var(--gray-300)', fontSize: 16 }} />}
                      />
                    );
                  })}
                </Section>
              )}


              {results.sales.length > 0 && (
                <Section label="Sales" icon={<MdReceiptLong style={{ color: 'var(--green)', fontSize: 15 }} />}>
                  {results.sales.map((s) => {
                    const idx = flat.findIndex(f => f.type === 'sale' && f.data.id === s.id);
                    return (
                      <ResultRow
                        key={s.id}
                        active={selected === idx}
                        onClick={() => go({ type: 'sale', data: s })}
                        onHover={() => setSelected(idx)}
                        icon={<div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--green-bg)', border: '1.5px solid rgba(5,150,105,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MdReceiptLong style={{ color: 'var(--green)', fontSize: 18 }} /></div>}
                        title={`Sale #${s.id} — ${s.customer_name}`}
                        sub={new Date(s.created_at).toLocaleString()}
                        right={<span style={{ fontWeight: 900, color: 'var(--green)', fontSize: 14 }}>${s.total.toFixed(2)}</span>}
                        badge={{ label: s.status, color: s.status === 'completed' ? 'var(--green)' : 'var(--orange)', bg: s.status === 'completed' ? 'var(--green-bg)' : 'var(--orange-50)' }}
                      />
                    );
                  })}
                </Section>
              )}
            </div>


            {total > 0 && (
              <div style={{ padding: '10px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 16, alignItems: 'center' }}>
                {[['↑↓', 'Navigate'], ['↵', 'Open'], ['ESC', 'Close']].map(([key, label]) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--gray-400)', fontWeight: 500 }}>
                    <kbd style={{ background: 'var(--gray-100)', padding: '2px 7px', borderRadius: 5, fontWeight: 700, fontSize: 11, color: 'var(--gray-500)' }}>{key}</kbd>
                    {label}
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>{total} result{total !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Section({ label, icon, children }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 20px 4px', fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {icon}{label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ active, onClick, onHover, icon, title, sub, right, badge }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 20px', cursor: 'pointer', transition: 'background 0.1s',
        background: active ? 'var(--orange-50)' : 'transparent',
        borderLeft: active ? '3px solid var(--orange)' : '3px solid transparent',
      }}
    >
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2, fontWeight: 500 }}>{sub}</div>
      </div>
      {badge && (
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
      )}
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}
