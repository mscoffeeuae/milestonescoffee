export const dynamic = 'force-dynamic';

async function getLocs() {
  try {
    const q = encodeURIComponent(
      '*[_type == "location"] | order(city asc, name asc) { _id, name, nameAr, city, address, addressAr, phone, email, active, seatingCapacity, openTime, closeTime, features, manager, coordinates }'
    );
    const res = await fetch(`https://txh3gqgo.api.sanity.io/v2021-10-21/data/query/production?query=${q}`, { cache: 'no-store' });
    return (await res.json()).result ?? [];
  } catch { return []; }
}

type Branch = {
  _id: string; name: string; nameAr?: string; city: string;
  address: string; addressAr?: string; phone: string; email?: string;
  active: boolean; seatingCapacity?: number;
  openTime?: string; closeTime?: string;
  features?: string[]; manager?: string;
  coordinates?: { lat: number; lng: number };
};

const STATIC: Branch[] = [
  { _id:'l1', name:'Abu Dhabi Mall',     nameAr:'أبوظبي مول',      city:'Abu Dhabi', address:'Tourist Club Area, Abu Dhabi',       addressAr:'منطقة النادي السياحي، أبوظبي',   phone:'+971 2 641 0062', email:'abudhabimall@milestonescoffee.ae',  active:true,  seatingCapacity:45, openTime:'07:00', closeTime:'23:00', features:['WiFi','Drive-Thru','Delivery','Dine-In'], manager:'Ahmed Al Mansouri' },
  { _id:'l2', name:'Khalidiyah',         nameAr:'الخالدية',          city:'Abu Dhabi', address:'Khalidiyah Street, Abu Dhabi',       addressAr:'شارع الخالدية، أبوظبي',          phone:'+971 2 666 1234', email:'khalidiyah@milestonescoffee.ae',    active:true,  seatingCapacity:32, openTime:'07:00', closeTime:'00:00', features:['WiFi','Delivery','Dine-In'],               manager:'Sara Hassan'       },
  { _id:'l3', name:'Marina Mall',        nameAr:'مارينا مول',        city:'Abu Dhabi', address:'Breakwater, Abu Dhabi',              addressAr:'البريك ووتر، أبوظبي',            phone:'+971 2 681 5600', email:'marinamall@milestonescoffee.ae',    active:true,  seatingCapacity:60, openTime:'08:00', closeTime:'23:30', features:['WiFi','Delivery','Dine-In','Outdoor'],     manager:'Mohammed Al Zaabi' },
  { _id:'l4', name:'Al Ain Mall',        nameAr:'العين مول',          city:'Al Ain',    address:'Al Ain Mall, Al Ain',                addressAr:'العين مول، العين',               phone:'+971 3 762 0000', email:'alainmall@milestonescoffee.ae',     active:true,  seatingCapacity:38, openTime:'09:00', closeTime:'22:00', features:['WiFi','Dine-In'],                          manager:'Fatima Khalil'     },
  { _id:'l5', name:'Al Ain City Centre', nameAr:'سيتي سنتر العين',   city:'Al Ain',    address:'City Centre Al Ain, Al Ain',         addressAr:'سيتي سنتر العين',                phone:'+971 3 751 8800', email:'alaincc@milestonescoffee.ae',       active:false, seatingCapacity:28, openTime:'09:00', closeTime:'22:00', features:['WiFi','Dine-In'],                          manager:'—'                 },
  { _id:'l6', name:'Yas Mall',           nameAr:'ياس مول',            city:'Abu Dhabi', address:'Yas Island, Abu Dhabi',              addressAr:'جزيرة ياس، أبوظبي',             phone:'+971 2 565 0000', email:'yasmall@milestonescoffee.ae',       active:true,  seatingCapacity:70, openTime:'10:00', closeTime:'00:00', features:['WiFi','Drive-Thru','Delivery','Dine-In','Outdoor'], manager:'Omar Bin Zayed' },
];

const FEATURE_ICONS: Record<string, string> = {
  'WiFi':'📶', 'Drive-Thru':'🚗', 'Delivery':'🛵', 'Dine-In':'🪑', 'Outdoor':'🌿',
};
const CITY_COLORS: Record<string, string> = {
  'Abu Dhabi':'#1A5F8A', 'Al Ain':'#2D7A4A', 'Dubai':'#B86A00',
};

export default async function LocationsPage() {
  const sanity = await getLocs();
  const locations: Branch[] = sanity.length > 0 ? sanity : STATIC;

  const totalBranches = locations.length;
  const openBranches  = locations.filter(l => l.active).length;
  const closedBranches= locations.filter(l => !l.active).length;
  const totalSeats    = locations.filter(l => l.active).reduce((s, l) => s + (l.seatingCapacity || 0), 0);
  const cities        = [...new Set(locations.map(l => l.city))];

  const statCards = [
    { label:'Total Branches', value: totalBranches,  icon:'🏪', color:'#3B1F0E' },
    { label:'Open Now',       value: openBranches,   icon:'✅', color:'#2D7A4A' },
    { label:'Temporarily Closed', value: closedBranches, icon:'🔒', color:'#C0392B' },
    { label:'Total Seats',    value: totalSeats,     icon:'🪑', color:'#1A5F8A' },
    { label:'Cities',         value: cities.length,  icon:'🗺️', color:'#7B4F9E' },
  ];

  const cityGroups = cities.map(city => ({
    city,
    branches: locations.filter(l => l.city === city),
  }));

  // Determine open/closed right now (Dubai time approximation using UTC+4)
  function isOpenNow(branch: Branch): boolean {
    if (!branch.active || !branch.openTime || !branch.closeTime) return branch.active;
    const now = new Date();
    const dubaiH = (now.getUTCHours() + 4) % 24;
    const dubaiM = now.getUTCMinutes();
    const cur = dubaiH * 60 + dubaiM;
    const [oh, om] = branch.openTime.split(':').map(Number);
    const [ch, cm] = branch.closeTime.split(':').map(Number);
    const open = oh * 60 + om;
    let close = ch * 60 + cm;
    if (close < open) close += 1440; // past midnight
    return cur >= open && cur <= close;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Branch Management</h1>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginTop:2 }}>
            {totalBranches} branches across {cities.length} cities
            {sanity.length === 0 && <span style={{ color:'#B86A00', marginLeft:8 }}>· demo data</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <a href="/en/locations" target="_blank" rel="noopener noreferrer"
            style={{ padding:'9px 16px', background:'white', color:'var(--color-text-primary)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)', textDecoration:'none', fontSize:'0.875rem', fontWeight:600 }}>
            👁 View Live Map
          </a>
          <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
            style={{ padding:'9px 18px', background:'var(--color-brand-bronze)', color:'#fff', borderRadius:'var(--radius-md)', textDecoration:'none', fontSize:'0.875rem', fontWeight:600 }}>
            + Add Branch
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:28 }}>
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderTop:`3px solid ${color}` }}>
            <div style={{ fontSize:'1.5rem', marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:'1.5rem', fontWeight:800, color }}>{value}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:2, lineHeight:1.3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Sanity notice */}
      {sanity.length === 0 && (
        <div style={{ marginBottom:20, padding:'14px 18px', background:'linear-gradient(135deg,#E3F0FB,#EDF4FD)', borderRadius:'var(--radius-md)', fontSize:'0.85rem', color:'#1A5F8A', border:'1px solid #BBDAF7', display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{ fontSize:'1.2rem' }}>ℹ️</span>
          <div>
            <strong>Connect live branch data:</strong> Add a <code style={{ background:'#D0E9FA', padding:'1px 5px', borderRadius:3 }}>location</code> schema in Sanity Studio with fields:
            <code style={{ background:'#D0E9FA', padding:'1px 5px', borderRadius:3, marginLeft:4 }}>name, nameAr, city, address, phone, email, active, seatingCapacity, openTime, closeTime, features, manager, coordinates</code>
          </div>
        </div>
      )}

      {/* City groups */}
      {cityGroups.map(({ city, branches }) => (
        <div key={city} style={{ marginBottom:32 }}>
          {/* City header */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:10, borderBottom:'2px solid var(--color-border)' }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background: CITY_COLORS[city] || '#888', flexShrink:0 }} />
            <h2 style={{ fontSize:'1rem', fontWeight:800, color:'var(--color-text-primary)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>{city}</h2>
            <span style={{ fontSize:'0.78rem', padding:'2px 8px', borderRadius:20, background:'var(--color-bg-muted)', color:'var(--color-text-muted)', fontWeight:600 }}>{branches.length} branch{branches.length > 1 ? 'es' : ''}</span>
            <span style={{ fontSize:'0.78rem', color:'#2D7A4A', fontWeight:600, marginLeft:'auto' }}>
              {branches.filter(b => b.active).length} open
            </span>
          </div>

          {/* Branch cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px, 1fr))', gap:16 }}>
            {branches.map((loc) => {
              const nowOpen = isOpenNow(loc);
              const cityColor = CITY_COLORS[loc.city] || '#888';
              return (
                <div key={loc._id} style={{
                  background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)',
                  boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden',
                  border: loc.active ? '1px solid transparent' : '1px solid #EEE',
                  opacity: loc.active ? 1 : 0.7,
                }}>
                  {/* Card top bar */}
                  <div style={{ height:5, background: loc.active ? `linear-gradient(90deg,${cityColor},var(--color-brand-bronze))` : '#DDD' }} />

                  <div style={{ padding:'16px 16px 14px' }}>
                    {/* Name + status */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'1rem' }}>{loc.name}</div>
                        {loc.nameAr && <div style={{ fontSize:'0.8rem', color:'var(--color-text-muted)', direction:'rtl', marginTop:1 }}>{loc.nameAr}</div>}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                        <span style={{ fontSize:'0.7rem', padding:'2px 8px', borderRadius:20, background:loc.active?'#E8F5EC':'#F0F0F0', color:loc.active?'#2D7A4A':'#888', fontWeight:700 }}>
                          {loc.active ? 'Active' : 'Closed'}
                        </span>
                        {loc.active && (
                          <span style={{ fontSize:'0.68rem', padding:'1px 7px', borderRadius:20, background:nowOpen?'#E8F5EC':'#FFF3E0', color:nowOpen?'#2D7A4A':'#B86A00', fontWeight:600 }}>
                            {nowOpen ? '🟢 Open Now' : '🟡 After Hours'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div style={{ fontSize:'0.82rem', color:'var(--color-text-secondary)', marginBottom:3 }}>📍 {loc.address}</div>
                    {loc.addressAr && <div style={{ fontSize:'0.78rem', color:'var(--color-text-muted)', direction:'rtl', marginBottom:8 }}>{loc.addressAr}</div>}

                    {/* Info row */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, margin:'10px 0', fontSize:'0.8rem' }}>
                      <div style={{ background:'var(--color-bg-muted)', padding:'8px 10px', borderRadius:8 }}>
                        <div style={{ color:'var(--color-text-muted)', fontSize:'0.72rem', marginBottom:2 }}>PHONE</div>
                        <div style={{ color:'var(--color-brand-bronze)', fontWeight:600 }}>{loc.phone}</div>
                      </div>
                      <div style={{ background:'var(--color-bg-muted)', padding:'8px 10px', borderRadius:8 }}>
                        <div style={{ color:'var(--color-text-muted)', fontSize:'0.72rem', marginBottom:2 }}>HOURS</div>
                        <div style={{ fontWeight:600 }}>{loc.openTime || '—'} – {loc.closeTime || '—'}</div>
                      </div>
                      <div style={{ background:'var(--color-bg-muted)', padding:'8px 10px', borderRadius:8 }}>
                        <div style={{ color:'var(--color-text-muted)', fontSize:'0.72rem', marginBottom:2 }}>SEATING</div>
                        <div style={{ fontWeight:600 }}>🪑 {loc.seatingCapacity ?? '—'} seats</div>
                      </div>
                      <div style={{ background:'var(--color-bg-muted)', padding:'8px 10px', borderRadius:8 }}>
                        <div style={{ color:'var(--color-text-muted)', fontSize:'0.72rem', marginBottom:2 }}>MANAGER</div>
                        <div style={{ fontWeight:600, fontSize:'0.78rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{loc.manager || '—'}</div>
                      </div>
                    </div>

                    {/* Email */}
                    {loc.email && (
                      <div style={{ fontSize:'0.78rem', color:'var(--color-text-muted)', marginBottom:8 }}>✉️ {loc.email}</div>
                    )}

                    {/* Feature chips */}
                    {loc.features && loc.features.length > 0 && (
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                        {loc.features.map(f => (
                          <span key={f} style={{ fontSize:'0.72rem', padding:'3px 8px', borderRadius:20, background:`${cityColor}14`, color:cityColor, border:`1px solid ${cityColor}33`, fontWeight:600 }}>
                            {FEATURE_ICONS[f] || '•'} {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Coordinates link */}
                    {loc.coordinates && (
                      <a href={`https://maps.google.com/?q=${loc.coordinates.lat},${loc.coordinates.lng}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:'block', fontSize:'0.75rem', color:'var(--color-brand-bronze)', marginBottom:10, textDecoration:'none' }}>
                        🗺 Open in Google Maps
                      </a>
                    )}

                    {/* Actions */}
                    <div style={{ display:'flex', gap:8, paddingTop:10, borderTop:'1px solid var(--color-border)' }}>
                      <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
                        style={{ flex:1, padding:'7px', borderRadius:6, border:'1px solid var(--color-brand-bronze)', background:'white', textDecoration:'none', color:'var(--color-brand-bronze)', cursor:'pointer', fontSize:'0.8rem', textAlign:'center', fontWeight:600 }}>
                        ✏️ Edit
                      </a>
                      <button style={{ padding:'7px 12px', borderRadius:6, border:'1px solid var(--color-border)', background:loc.active?'#FFF3E0':'#E8F5EC', color:loc.active?'#B86A00':'#2D7A4A', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
                        {loc.active ? '🔒 Close' : '✅ Open'}
                      </button>
                      <button style={{ padding:'7px 12px', borderRadius:6, border:'1px solid var(--color-border)', background:'white', cursor:'pointer', fontSize:'0.8rem' }}>
                        📊
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
