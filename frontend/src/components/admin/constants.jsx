import { FaStore, FaUtensils, FaCapsules } from 'react-icons/fa';
import { GiCarWheel } from 'react-icons/gi';

export const C = {
  sidebar:      '#ffffff',
  bg:           '#eef0f4',
  card:         '#ffffff',
  border:       '#d1d9e0',
  accent:       '#f97316',
  accentSoft:   '#fff7ed',
  accentBorder: '#fdba74',
  text:         '#111827',
  textMid:      '#374151',
  textSoft:     '#6b7280',
  green:        '#16a34a',
  greenSoft:    '#dcfce7',
  greenBorder:  '#86efac',
  amber:        '#d97706',
  amberSoft:    '#fef3c7',
  amberBorder:  '#fcd34d',
  red:          '#dc2626',
  redSoft:      '#fee2e2',
  redBorder:    '#fca5a5',
  blue:         '#2563eb',
  blueSoft:     '#dbeafe',
  blueBorder:   '#93c5fd',
};

export const BIZ_META = {
  tyre_shop:     { label: 'Tyre Shop',     icon: GiCarWheel, color: '#ea580c', bg: '#ffedd5' },
  restaurant:    { label: 'Restaurant',    icon: FaUtensils, color: '#16a34a', bg: '#dcfce7' },
  general_store: { label: 'General Store', icon: FaStore,    color: '#2563eb', bg: '#dbeafe' },
  pharmacy:      { label: 'Pharmacy',      icon: FaCapsules, color: '#7c3aed', bg: '#ede9fe' },
};

export const STATUS_META = {
  active:    { label: 'Active',    color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  pending:   { label: 'Pending',   color: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
  suspended: { label: 'Suspended', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
};

export const Avatar = ({ name, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: 8,
    background: 'linear-gradient(135deg,#f97316,#ea580c)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.42, fontWeight: 800, color: 'white', flexShrink: 0,
  }}>
    {name?.charAt(0).toUpperCase()}
  </div>
);
