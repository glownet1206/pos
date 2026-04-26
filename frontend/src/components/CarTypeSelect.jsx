import { useEffect, useRef, useState } from 'react';
import { MdSearch, MdExpandMore } from 'react-icons/md';

const CAR_SUGGESTIONS = [
  'Toyota Corolla','Toyota Yaris','Toyota Camry','Toyota Fortuner','Toyota Hilux',
  'Toyota Land Cruiser','Toyota Prado','Toyota Vitz','Toyota Aqua','Toyota Prius',
  'Honda Civic','Honda City','Honda BR-V','Honda HR-V','Honda CR-V','Honda Accord','Honda Vezel',
  'Suzuki Alto','Suzuki Cultus','Suzuki Swift','Suzuki Wagon R','Suzuki Jimny','Suzuki Vitara','Suzuki Bolan',
  'Hyundai Tucson','Hyundai Elantra','Hyundai Sonata','Hyundai Santa Fe',
  'KIA Sportage','KIA Stonic','KIA Picanto','KIA Sorento',
  'Nissan Sunny','Nissan Patrol','Nissan Navara',
  'Mitsubishi Pajero','Mitsubishi L200',
  'Changan Alsvin','Changan Oshan X7','Changan CS35',
  'MG HS','MG ZS','MG 5',
  'Proton Saga','Proton X70',
  'BMW 3 Series','BMW 5 Series','BMW X5',
  'Mercedes C-Class','Mercedes E-Class',
  'Audi A3','Audi A4','Audi Q5',
  'Universal / All Cars',
];

export default function CarTypeSelect({ value, onChange, suggestions = CAR_SUGGESTIONS, placeholder = 'Select car (optional)' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? suggestions.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : suggestions;

  const handleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 280);
    }
    setOpen(o => !o);
  };

  const handleSelect = (val) => { onChange(val); setSearch(''); setOpen(false); };
  const handleClear = (e) => { e.stopPropagation(); onChange(''); setSearch(''); };

  // Handle direct typing in the trigger box
  const handleDirectInput = (e) => {
    onChange(e.target.value);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        borderRadius: 9,
        border: `1.5px solid ${open ? '#f97316' : 'var(--gray-200)'}`,
        background: 'white', fontSize: 13, fontFamily: 'inherit',
        transition: 'border-color 0.15s', minHeight: 38,
      }}>
        {/* Editable input for manual typing */}
        <input
          type="text"
          value={value || ''}
          onChange={handleDirectInput}
          onFocus={() => {
            if (ref.current) {
              const rect = ref.current.getBoundingClientRect();
              setDropUp(window.innerHeight - rect.bottom < 280);
            }
            setOpen(true);
            setSearch('');
          }}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'none',
            padding: '8px 12px', fontSize: 13, fontFamily: 'inherit',
            color: value ? 'var(--gray-800)' : 'var(--gray-400)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, paddingRight: 8 }}>
          {value && (
            <span
              onClick={handleClear}
              style={{ fontSize: 13, color: 'var(--gray-400)', padding: '0 4px', lineHeight: 1, cursor: 'pointer' }}
            >✕</span>
          )}
          <MdExpandMore
            onClick={handleOpen}
            style={{
              fontSize: 18, color: 'var(--gray-400)', cursor: 'pointer',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </div>
      </div>

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
          {/* Search */}
          <div style={{ padding: '7px 8px', borderBottom: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--gray-50)', borderRadius: 7, padding: '5px 9px' }}>
              <MdSearch style={{ color: 'var(--gray-400)', fontSize: 14, flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cars..."
                onClick={e => e.stopPropagation()}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12.5, fontFamily: 'inherit', width: '100%', color: 'var(--gray-700)' }}
              />
              {search && (
                <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: 'var(--gray-400)', fontSize: 12 }}>✕</span>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 190, overflowY: 'auto' }}>
            <div
              onClick={() => handleSelect('')}
              style={{ padding: '7px 13px', fontSize: 12.5, color: 'var(--gray-400)', cursor: 'pointer', fontStyle: 'italic' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              None
            </div>
            {/* Show custom typed value as first option if not in list */}
            {value && !suggestions.includes(value) && (
              <div
                onClick={() => handleSelect(value)}
                style={{ padding: '7px 13px', fontSize: 13, cursor: 'pointer', background: '#fff7ed', color: '#f97316', fontWeight: 700 }}
              >
                ✓ Use "{value}"
              </div>
            )}
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 13px', fontSize: 12.5, color: 'var(--gray-400)', textAlign: 'center' }}>No results</div>
            ) : filtered.map(s => (
              <div
                key={s}
                onClick={() => handleSelect(s)}
                style={{
                  padding: '7px 13px', fontSize: 13, cursor: 'pointer',
                  background: value === s ? '#fff7ed' : 'transparent',
                  color: value === s ? '#f97316' : 'var(--gray-700)',
                  fontWeight: value === s ? 700 : 400,
                }}
                onMouseEnter={e => { if (value !== s) e.currentTarget.style.background = 'var(--gray-50)'; }}
                onMouseLeave={e => { if (value !== s) e.currentTarget.style.background = 'transparent'; }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
