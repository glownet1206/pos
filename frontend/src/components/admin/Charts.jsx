import { MdTrendingUp } from 'react-icons/md';
import { C } from './constants.jsx';
import {
  ComposedChart, Bar, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const tip = { background:'#1a1d23', border:'1px solid #2d3748', borderRadius:6, fontSize:12, color:'white', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', padding:'8px 12px' };

const CustomBar = (props) => {
  const { x, y, width, height, value } = props;
  if (!height || height <= 0) return null;
  const isUp = value > 0;
  const color = isUp ? '#16a34a' : '#dc2626';
  const barW = Math.max(width * 0.6, 8);
  const bx = x + (width - barW) / 2;
  return (
    <g>
      <rect x={bx} y={y} width={barW} height={Math.abs(height)} fill={color} fillOpacity={0.85} rx={2} />
      <line x1={bx + barW/2} y1={y - 4} x2={bx + barW/2} y2={y} stroke={color} strokeWidth={1.5} />
      <line x1={bx + barW/2} y1={y + Math.abs(height)} x2={bx + barW/2} y2={y + Math.abs(height) + 4} stroke={color} strokeWidth={1.5} />
    </g>
  );
};

export function RechartsBar({ data }) {
  const processed = data.map((d, i) => ({
    ...d,
    prev: i > 0 ? data[i-1].revenue : d.revenue,
    change: i > 0 ? d.revenue - data[i-1].revenue : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={processed} margin={{ top:10, right:4, left:-20, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize:11, fill:'#6b7280', fontWeight:600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => v>=1000?`${(v/1000).toFixed(0)}k`:v} />
        <Tooltip contentStyle={tip} formatter={(v, n) => [n==='revenue' ? `Rs. ${Number(v).toLocaleString('en-PK')}` : `${v>=0?'+':''}Rs. ${Number(v).toLocaleString('en-PK')}`, n==='revenue'?'Revenue':'Change']} cursor={{ fill:'rgba(249,115,22,0.05)' }} />
        <ReferenceLine y={0} stroke="#d1d9e0" />
        <Bar dataKey="revenue" fill="#f97316" fillOpacity={0.15} radius={[3,3,0,0]} />
        <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={{ fill:'#f97316', r:3, strokeWidth:2, stroke:'white' }} activeDot={{ r:5, fill:'#f97316', stroke:'white', strokeWidth:2 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function RechartsLine({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top:8, right:4, left:-20, bottom:0 }}>
        <defs>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize:11, fill:'#6b7280', fontWeight:600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize:10, fill:'#6b7280' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tip} formatter={(v,n) => [v, n==='newUsers'?'New Users':'Total']} cursor={{ fill:'rgba(22,163,74,0.04)' }} />
        <Bar dataKey="newUsers" fill="#16a34a" fillOpacity={0.2} radius={[3,3,0,0]} />
        <Line type="monotone" dataKey="newUsers" stroke="#16a34a" strokeWidth={2.5} dot={{ fill:'#16a34a', r:3, strokeWidth:2, stroke:'white' }} activeDot={{ r:5 }} />
        <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function RechartsPie({ data }) {
  return (
    <ResponsiveContainer width={110} height={110}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value" strokeWidth={0}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip contentStyle={tip} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EmptyChart({ label }) {
  return (
    <div style={{ height:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#9aa5b4', fontSize:13, gap:8 }}>
      <MdTrendingUp style={{ fontSize:28, opacity:0.3 }} />
      {label}
    </div>
  );
}
