export const dynamic = 'force-dynamic';
async function getLocs() {
  try {
    const q = encodeURIComponent('*[_type == "location"] | order(city asc) { _id, name, city, address, phone, active }');
    const res = await fetch(`https://txh3gqgo.api.sanity.io/v2021-10-21/data/query/production?query=${q}`, { cache:'no-store' });
    return (await res.json()).result ?? [];
  } catch { return []; }
}
const STATIC = [
  { _id:'l1', name:'Abu Dhabi Mall',    city:'Abu Dhabi', address:'Tourist Club Area', phone:'+971 2 641 0062', active:true },
  { _id:'l2', name:'Khalidiyah',        city:'Abu Dhabi', address:'Khalidiyah Street', phone:'+971 2 641 0062', active:true },
  { _id:'l3', name:'Marina Mall',       city:'Abu Dhabi', address:'Breakwater',        phone:'+971 2 641 0062', active:true },
  { _id:'l4', name:'Al Ain Mall',       city:'Al Ain',    address:'Al Ain Mall',       phone:'+971 3 000 0000', active:true },
  { _id:'l5', name:'Al Ain City Centre',city:'Al Ain',    address:'City Centre Al Ain',phone:'+971 3 000 0000', active:false },
];
export default async function LocationsPage() {
  const sanity = await getLocs();
  const locations = sanity.length > 0 ? sanity : STATIC;
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Locations</h1>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginTop:2 }}>{locations.length} branches</p>
        </div>
        <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
          style={{ padding:'9px 18px', background:'var(--color-brand-bronze)', color:'#fff', borderRadius:'var(--radius-md)', textDecoration:'none', fontSize:'0.875rem', fontWeight:600 }}>
          + Add via Sanity
        </a>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
        {locations.map((loc: {_id:string;name:string;city:string;address:string;phone:string;active:boolean}) => (
          <div key={loc._id} style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', padding:18, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderTop:`3px solid ${loc.active?'var(--color-brand-bronze)':'#ccc'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700 }}>{loc.name}</div>
                <div style={{ fontSize:'0.8rem', color:'var(--color-text-muted)', marginTop:2 }}>📍 {loc.city}</div>
              </div>
              <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:20, background:loc.active?'#E8F5EC':'#F0F0F0', color:loc.active?'#2D7A4A':'#888', fontWeight:600 }}>{loc.active?'Open':'Closed'}</span>
            </div>
            <div style={{ fontSize:'0.85rem', color:'var(--color-text-secondary)', marginBottom:6 }}>{loc.address}</div>
            {loc.phone && <div style={{ fontSize:'0.85rem', color:'var(--color-brand-bronze)', fontWeight:500 }}>{loc.phone}</div>}
            <div style={{ marginTop:12, display:'flex', gap:8 }}>
              <button style={{ flex:1, padding:'6px', borderRadius:6, border:'1px solid var(--color-border)', background:'white', cursor:'pointer', fontSize:'0.8rem' }}>Edit</button>
              <button style={{ padding:'6px 10px', borderRadius:6, border:'1px solid var(--color-border)', background:loc.active?'#FFF3E0':'#E8F5EC', color:loc.active?'#B86A00':'#2D7A4A', cursor:'pointer', fontSize:'0.8rem' }}>{loc.active?'Close':'Open'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
