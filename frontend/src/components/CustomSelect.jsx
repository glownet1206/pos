import { useEffect, useRef, useState } from 'react';
import { MdSearch, MdExpandMore, MdAdd } from 'react-icons/md';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  optionLabels = null,
  placeholder = 'Select...',
  showSearch = false,
  clearable = false,
  allowCustom = false,
  onAddCustom = null,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropUp, setDropUp] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowAddForm(false);
        setNewCategory('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 300);
    }
    setOpen(o => !o);
    setShowAddForm(false);
    setNewCategory('');
  };

  const filtered = showSearch && search
    ? options.filter(o => !o.startsWith('---') && o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (val) => { onChange(val); setSearch(''); setOpen(false); setShowAddForm(false); };
  const handleClear = (e) => { e.stopPropagation(); onChange(''); setSearch(''); };

  const handleAddCustom = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) {
      onChange(trimmed);
    } else {
      if (onAddCustom) onAddCustom(trimmed);
      onChange(trimmed);
    }
    setNewCategory('');
    setShowAddForm(false);
    setOpen(false);
  };

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
          {value
            ? (optionLabels && options.indexOf(value) >= 0 ? optionLabels[options.indexOf(value)] : value)
            : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {clearable && value && (
            <span onClick={handleClear} style={{ fontSize: 13, color: 'var(--gray-400)', padding: '0 4px', lineHeight: 1 }}>✕</span>
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
          ...(dropUp ? { bottom: 'calc(100% + 4px)', top: 'auto' } : { top: 'calc(100% + 4px)', bottom: 'auto' }),
          left: 0, right: 0, zIndex: 9999,
          background: 'white', borderRadius: 10, border: '1.5px solid var(--gray-200)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)', overflow: 'hidden',
        }}>

          {/* Search bar */}
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
                {search && <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: 'var(--gray-400)', fontSize: 12 }}>✕</span>}
              </div>
            </div>
          )}

          {/* Add New Category — inline form at top, OUTSIDE scroll area */}
          {allowCustom && (
            <div style={{ borderBottom: '1px solid #f3f4f6' }}>
              {!showAddForm ? (
                /* Button */
                <div
                  onClick={() => setShowAddForm(true)}
                  style={{
                    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                    color: '#f97316', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <MdAdd style={{ fontSize: 17, flexShrink: 0 }} />
                  Add New Category
                </div>
              ) : (
                /* Input form — full width, no overflow issues */
                <div style={{ padding: '10px 12px', background: '#fff7ed' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      autoFocus
                      type="text"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      placeholder="Category name..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddCustom();
                        if (e.key === 'Escape') { setShowAddForm(false); setNewCategory(''); }
                      }}
                      style={{
                        flex: 1, minWidth: 0,
                        padding: '7px 10px', height: 34,
                        borderRadius: 7, border: '1.5px solid #fed7aa',
                        fontSize: 13, fontFamily: 'inherit',
                        outline: 'none', background: 'white',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={handleAddCustom}
                      disabled={!newCategory.trim()}
                      style={{
                        height: 34, padding: '0 14px', flexShrink: 0,
                        borderRadius: 7, border: 'none',
                        background: newCategory.trim() ? '#f97316' : '#e5e7eb',
                        color: newCategory.trim() ? 'white' : '#9ca3af',
                        fontSize: 13, fontWeight: 700,
                        cursor: newCategory.trim() ? 'pointer' : 'default',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowAddForm(false); setNewCategory(''); }}
                      style={{
                        height: 34, width: 34, flexShrink: 0,
                        borderRadius: 7, border: '1.5px solid #e5e7eb',
                        background: 'white', color: '#9ca3af',
                        fontSize: 16, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'inherit',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Options list — scrollable */}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
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
                  {optionLabels ? optionLabels[options.indexOf(opt)] || opt : opt}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
