export const dynamic = 'force-dynamic';
async function getMenuItems() {
  try {
    const q = encodeURIComponent('*[_type == "menuItem"] | order(category asc) { _id, name, category, price, available }');
    const res = await fetch(`https://txh3gqgo.api.sanity.io/v2021-10-21/data/query/production?query=${q}`, { cache:'no-store' });
    return (await res.json()).result ?? [];
  } catch { return []; }
}
const STATIC = [
  { _id:'s1', name:'Signature Blend Espresso', category:'Coffee', price:18, available:true },
  { _id:'s2', name:'Flat White',               category:'Coffee', price:20, available:true },
  { _id:'s3', name:'Cappuccino',               category:'Coffee', price:22, available:true },
  { _id:'s4', name:'Croissant',                category:'Food',   price:15, available:true },
  { _id:'s5', name:'Chocolate Muffin',         category:'Food',   price:12, available:false },
];
export default async function MenuPage() {
  const sanity = await getMenuItems();
  const items = sanity.length > 0 ? sanity : STATIC;
  const cats = [...new Set(items.map((i: {category:string}) => i.category))];
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Menu Items</h1>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginTop:2 }}>{items.length} items {sanity.length > 0 ? 'from Sanity' : '(static fallback)'}</p>
        </div>
        <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
          style={{ padding:'9px 18px', background:'var(--color-brand-bronze)', color:'#fff', borderRadius:'var(--radius-md)', textDecoration:'none', fontSize:'0.875rem', fontWeight:600 }}>
          + Add via Sanity
        </a>
      </div>
      {sanity.length === 0 && (
        <div style={{ marginBottom:20, padding:'12px 16px', background:'#E3F0FB', borderRadius:'var(--radius-md)', fontSize:'0.85rem', color:'#1A5F8A' }}>
          ℹ️ Add a <code>menuItem</code> schema in Sanity Studio to manage items dynamically.
        </div>
      )}
      {(cats as string[]).map((cat) => (
        <div key={cat} style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:'1rem', fontWeight:700, color:'var(--color-text-secondary)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>{cat}</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:14 }}>
            {items.filter((i: {category:string}) => i.category === cat).map((item: {_id:string;name:string;price:number;available:boolean}) => (
              <div key={item._id} style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', opacity:item.available?1:0.65 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div style={{ fontWeight:600 }}>{item.name}</div>
                  <span style={{ fontSize:'0.72rem', padding:'2px 8px', borderRadius:20, background:item.available?'#E8F5EC':'#FDECEA', color:item.available?'#2D7A4A':'#C0392B', fontWeight:600 }}>{item.available?'Available':'Off Menu'}</span>
                </div>
                <div style={{ marginTop:8, fontWeight:700, fontSize:'1.1rem', color:'var(--color-brand-bronze)' }}>AED {item.price}</div>
                <div style={{ marginTop:10, display:'flex', gap:8 }}>
                  <button style={{ flex:1, padding:'6px', borderRadius:6, border:'1px solid var(--color-border)', background:'white', cursor:'pointer', fontSize:'0.8rem' }}>Edit</button>
                  <button style={{ flex:1, padding:'6px', borderRadius:6, border:'1px solid #FDECEA', background:'#FDECEA', color:'#C0392B', cursor:'pointer', fontSize:'0.8rem' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
