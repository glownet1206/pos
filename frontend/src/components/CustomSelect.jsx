import { useEffect, useRef, useState } from 'react';
import { MdSearch, MdExpandMore } from 'react-icons/md';

/**
 * Generic custom dropdown — same style as CarTypeSelect.
 * Props:
 *   value, onChange, options (array of strings), placeholder,
 *   showSearch (bool, default false), clearable (bool, default false)
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  showSearch = false,
  clearable = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 260);
    }
    setOpen(o => !o);
  };

  const filtered = showSearch && search
    ? options.filter(o => !o.startsWith('---') && o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (val) => { onChange(val); setSearch(''); setOpen(false); };
  const handleClear = (e) => { e.stopPropagation(); onChange(''); setSearch(''); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderRadius: 9,
          border: `1.5px solid ${open ? '#f97316' : 'var(--gray-200)'}`,
          background: 'white', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          color: value ? 'var(--gray-800)' : 'var(--gray-400)',
          transition: 'border-color 0.15s', minHeight: 38, userSelect: 'none',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {clearable && value && (
            <span
              onClick={handleClear}
              style={{ fontSize: 13, color: 'var(--gray-400)', padding: '0 4px', lineHeight: 1 }}
            >✕</span>
          )}
          <MdExpandMore style={{
            fontSize: 18, color: 'var(--gray-400)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }} />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          ...(dropUp
            ? { bottom: 'calc(100% + 4px)', top: 'auto' }
            : { top: 'calc(100% + 4px)', bottom: 'auto' }),
          left: 0, right: 0, zIndex: 9999,
          background: 'white', borderRadius: 10, border: '1.5px solid var(--gray-200)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {/* Search bar — only if showSearch */}
          {showSearch && (
            <div style={{ padding: '7px 8px', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gray-50)', borderRadius: 7, padding: '5px 9px' }}>
                <MdSearch style={{ color: 'var(--gray-400)', fontSize: 14, flexShrink: 0 }} />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  onClick={e => e.stopPropagation()}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12.5, fontFamily: 'inherit', width: '100%', color: 'var(--gray-700)' }}
                />
                {search && (
                  <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: 'var(--gray-400)', fontSize: 12 }}>✕</span>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 13px', fontSize: 12.5, color: 'var(--gray-400)', textAlign: 'center' }}>No results</div>
            ) : filtered.map(opt => {
              const isSep = opt.startsWith('---');
              if (isSep) return (
                <div key={opt} style={{ padding: '6px 14px 2px', fontSize: 10.5, fontWeight: 800, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.6px', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)', userSelect: 'none' }}>
                  {opt.replace(/---/g, '').trim()}
                </div>
              );
              return (
                <div
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                    background: value === opt ? '#fff7ed' : 'transparent',
                    color: value === opt ? '#f97316' : 'var(--gray-700)',
                    fontWeight: value === opt ? 700 : 400,
                  }}
                  onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = 'var(--gray-50)'; }}
                  onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = 'transparent'; }}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
