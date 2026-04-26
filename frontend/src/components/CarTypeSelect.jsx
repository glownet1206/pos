import { useEffect, useRef, useState } from 'react';
import { MdExpandMore } from 'react-icons/md';

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
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = value
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleFocus = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropUp(window.innerHeight - rect.bottom < 260);
    }
    setOpen(true);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Input box */}
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1.5px solid ${open ? '#f97316' : 'var(--gray-200)'}`,
        borderRadius: 9, background: 'white', transition: 'border-color 0.15s',
      }}>
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            padding: '9px 12px', fontSize: 13, fontFamily: 'inherit',
            color: 'var(--gray-800)', borderRadius: 9,
          }}
        />
        {value ? (
          <span
            onMouseDown={e => { e.preventDefault(); onChange(''); setOpen(false); }}
            style={{ padding: '0 8px', color: 'var(--gray-400)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
          >✕</span>
        ) : (
          <MdExpandMore
            onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
            style={{ marginRight: 8, color: 'var(--gray-400)', fontSize: 18, cursor: 'pointer',
              transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          ...(dropUp ? { bottom: 'calc(100% + 4px)' } : { top: 'calc(100% + 4px)' }),
          left: 0, right: 0, zIndex: 9999,
          background: 'white', borderRadius: 10,
          border: '1.5px solid var(--gray-200)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {/* None option */}
          <div
            onMouseDown={e => { e.preventDefault(); handleSelect(''); }}
            style={{ padding: '8px 13px', fontSize: 12.5, color: 'var(--gray-400)', cursor: 'pointer', fontStyle: 'italic',
              borderBottom: '1px solid var(--gray-100)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >None</div>

          {filtered.length === 0 ? (
            <div style={{ padding: '10px 13px', fontSize: 12.5, color: 'var(--gray-400)', textAlign: 'center' }}>
              No match — press Enter to use "{value}"
            </div>
          ) : filtered.map(s => (
            <div
              key={s}
              onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
              style={{
                padding: '8px 13px', fontSize: 13, cursor: 'pointer',
                background: value === s ? '#fff7ed' : 'transparent',
                color: value === s ? '#f97316' : 'var(--gray-700)',
                fontWeight: value === s ? 700 : 400,
              }}
              onMouseEnter={e => { if (value !== s) e.currentTarget.style.background = 'var(--gray-50)'; }}
              onMouseLeave={e => { if (value !== s) e.currentTarget.style.background = 'transparent'; }}
            >{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}
