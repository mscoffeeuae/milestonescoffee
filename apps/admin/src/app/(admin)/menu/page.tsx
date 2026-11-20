export const dynamic = 'force-dynamic';

async function getMenuItems() {
  try {
    const q = encodeURIComponent(
      '*[_type == "menuItem"] | order(category asc, name asc) { _id, name, nameAr, description, descriptionAr, category, price, available, featured, allergens, calories, prepTime, "image": image.asset->url }'
    );
    const res = await fetch(`https://txh3gqgo.api.sanity.io/v2021-10-21/data/query/production?query=${q}`, { cache: 'no-store' });
    return (await res.json()).result ?? [];
  } catch { return []; }
}

type MenuItem = {
  _id: string; name: string; nameAr?: string;
  description?: string; category: string;
  price: number; available: boolean; featured?: boolean;
  allergens?: string[]; calories?: number; prepTime?: number;
  image?: string;
};

const STATIC: MenuItem[] = [
  { _id:'s1', name:'Signature Blend Espresso', nameAr:'إسبريسو مميز', description:'Our house double shot with complex notes of dark chocolate and dried fruit', category:'Espresso', price:18, available:true,  featured:true,  calories:12,  prepTime:3,  allergens:[] },
  { _id:'s2', name:'Flat White',               nameAr:'فلات وايت',     description:'Velvety micro-foam milk over a ristretto double shot',                   category:'Espresso', price:22, available:true,  featured:false, calories:120, prepTime:4,  allergens:['Dairy'] },
  { _id:'s3', name:'Cappuccino',               nameAr:'كابتشينو',       description:'Equal parts espresso, steamed milk and thick foam',                      category:'Espresso', price:22, available:true,  featured:false, calories:130, prepTime:4,  allergens:['Dairy'] },
  { _id:'s4', name:'Iced Caramel Latte',       nameAr:'لاتيه كراميل',  description:'Cold espresso with caramel syrup over crushed ice',                     category:'Cold Brew', price:28, available:true,  featured:true,  calories:210, prepTime:3,  allergens:['Dairy'] },
  { _id:'s5', name:'Cold Brew',                nameAr:'كولد برو',       description:'12-hour slow-steeped Arabica, served over ice',                          category:'Cold Brew', price:26, available:true,  featured:false, calories:5,   prepTime:2,  allergens:[] },
  { _id:'s6', name:'Matcha Latte',             nameAr:'لاتيه ماتشا',   description:'Premium ceremonial-grade matcha with oat milk',                          category:'Specialty', price:30, available:true,  featured:true,  calories:160, prepTime:4,  allergens:['Gluten'] },
  { _id:'s7', name:'Butter Croissant',         nameAr:'كرواسون بالزبدة', description:'Freshly baked layered pastry, light and flaky',                        category:'Pastries',  price:15, available:true,  featured:false, calories:230, prepTime:1,  allergens:['Gluten','Dairy','Eggs'] },
  { _id:'s8', name:'Chocolate Muffin',         nameAr:'مافن شوكولاتة',  description:'Double chocolate with Belgian chips',                                   category:'Pastries',  price:12, available:false, featured:false, calories:380, prepTime:1,  allergens:['Gluten','Dairy','Eggs'] },
  { _id:'s9', name:'Avocado Toast',            nameAr:'توست أفوكادو',   description:'Sourdough, smashed avocado, feta, chilli flakes',                       category:'Food',      price:38, available:true,  featured:true,  calories:320, prepTime:7,  allergens:['Gluten','Dairy'] },
  { _id:'s10',name:'Acai Bowl',                nameAr:'بول أساي',       description:'Frozen acai with granola, fresh berries, honey drizzle',                category:'Food',      price:42, available:true,  featured:false, calories:410, prepTime:5,  allergens:['Gluten','Nuts'] },
];

const CATEGORY_ICONS: Record<string, string> = {
  Espresso: '☕', 'Cold Brew': '🧊', Specialty: '✨', Pastries: '🥐', Food: '🍽️',
};
const ALLERGEN_COLORS: Record<string, string> = {
  Dairy:'#1A5F8A', Gluten:'#B86A00', Eggs:'#7B4F9E', Nuts:'#2D7A4A',
};

export default async function MenuPage() {
  const sanity = await getMenuItems();
  const items: MenuItem[] = sanity.length > 0 ? sanity : STATIC;
  const cats = [...new Set(items.map(i => i.category))] as string[];

  const totalItems    = items.length;
  const available     = items.filter(i => i.available).length;
  const offMenu       = items.filter(i => !i.available).length;
  const featured      = items.filter(i => i.featured).length;
  const avgPrice      = Math.round(items.reduce((s, i) => s + i.price, 0) / items.length);

  const statCards = [
    { label:'Total Items',    value: totalItems,         icon:'🍽️', color:'#3B1F0E' },
    { label:'Available',      value: available,          icon:'✅', color:'#2D7A4A' },
    { label:'Off Menu',       value: offMenu,            icon:'⛔', color:'#C0392B' },
    { label:'Featured',       value: featured,           icon:'⭐', color:'#B86A00' },
    { label:'Avg Price (AED)',value: avgPrice,            icon:'💰', color:'#1A5F8A' },
    { label:'Categories',     value: cats.length,        icon:'📋', color:'#7B4F9E' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--color-text-primary)' }}>Menu Management</h1>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginTop:2 }}>
            {items.length} items across {cats.length} categories
            {sanity.length === 0 && <span style={{ color:'#B86A00', marginLeft:8 }}>· static demo data</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <a href="/en/menu" target="_blank" rel="noopener noreferrer"
            style={{ padding:'9px 16px', background:'white', color:'var(--color-text-primary)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)', textDecoration:'none', fontSize:'0.875rem', fontWeight:600 }}>
            👁 View Live Menu
          </a>
          <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
            style={{ padding:'9px 18px', background:'var(--color-brand-bronze)', color:'#fff', borderRadius:'var(--radius-md)', textDecoration:'none', fontSize:'0.875rem', fontWeight:600 }}>
            + Add via Sanity
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, marginBottom:28 }}>
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderTop:`3px solid ${color}` }}>
            <div style={{ fontSize:'1.5rem', marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:'1.4rem', fontWeight:800, color }}>{value}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:2, lineHeight:1.3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Sanity schema notice */}
      {sanity.length === 0 && (
        <div style={{ marginBottom:20, padding:'14px 18px', background:'linear-gradient(135deg,#E3F0FB,#EDF4FD)', borderRadius:'var(--radius-md)', fontSize:'0.85rem', color:'#1A5F8A', border:'1px solid #BBDAF7', display:'flex', alignItems:'flex-start', gap:10 }}>
          <span style={{ fontSize:'1.2rem' }}>ℹ️</span>
          <div>
            <strong>Connect live menu data:</strong> Add a <code style={{ background:'#D0E9FA', padding:'1px 5px', borderRadius:3 }}>menuItem</code> schema to your Sanity Studio with fields: <code style={{ background:'#D0E9FA', padding:'1px 5px', borderRadius:3 }}>name, nameAr, description, category, price, available, featured, allergens, calories, prepTime, image</code>. Items will appear here automatically.
          </div>
        </div>
      )}

      {/* Category sections */}
      {cats.map((cat) => {
        const catItems = items.filter(i => i.category === cat);
        const catAvail = catItems.filter(i => i.available).length;
        return (
          <div key={cat} style={{ marginBottom:32 }}>
            {/* Category header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:10, borderBottom:'2px solid var(--color-border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:'1.3rem' }}>{CATEGORY_ICONS[cat] || '🍴'}</span>
                <h2 style={{ fontSize:'1rem', fontWeight:800, color:'var(--color-text-primary)', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>{cat}</h2>
                <span style={{ fontSize:'0.78rem', padding:'2px 8px', borderRadius:20, background:'var(--color-bg-muted)', color:'var(--color-text-muted)', fontWeight:600 }}>{catItems.length} items</span>
              </div>
              <span style={{ fontSize:'0.78rem', color:'#2D7A4A', fontWeight:600 }}>{catAvail}/{catItems.length} available</span>
            </div>

            {/* Items grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
              {catItems.map((item) => (
                <div key={item._id} style={{
                  background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)',
                  boxShadow:'0 1px 6px rgba(0,0,0,0.07)', overflow:'hidden',
                  opacity: item.available ? 1 : 0.6,
                  border: item.featured ? '2px solid var(--color-brand-gold)' : '2px solid transparent',
                  position:'relative',
                }}>
                  {/* Featured badge */}
                  {item.featured && (
                    <div style={{ position:'absolute', top:10, right:10, background:'var(--color-brand-gold)', color:'#3B1F0E', fontSize:'0.7rem', fontWeight:800, padding:'2px 8px', borderRadius:20, zIndex:1 }}>⭐ FEATURED</div>
                  )}

                  {/* Image placeholder */}
                  <div style={{ height:110, background: item.image ? 'transparent' : 'linear-gradient(135deg,var(--color-brand-espresso),var(--color-brand-bronze))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', position:'relative', overflow:'hidden' }}>
                    {item.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={`${item.image}?w=300&h=120&fit=crop`} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      : <span style={{ opacity:0.5 }}>{CATEGORY_ICONS[cat] || '🍴'}</span>
                    }
                    {/* Price pill */}
                    <div style={{ position:'absolute', bottom:8, left:12, background:'rgba(0,0,0,0.65)', color:'#fff', fontSize:'0.85rem', fontWeight:800, padding:'3px 10px', borderRadius:20, backdropFilter:'blur(4px)' }}>
                      AED {item.price}
                    </div>
                  </div>

                  <div style={{ padding:'14px 14px 12px' }}>
                    {/* Name row */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:4 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.95rem', lineHeight:1.3 }}>{item.name}</div>
                        {item.nameAr && <div style={{ fontSize:'0.8rem', color:'var(--color-text-muted)', direction:'rtl', marginTop:1 }}>{item.nameAr}</div>}
                      </div>
                      <span style={{ fontSize:'0.7rem', padding:'2px 7px', borderRadius:20, background:item.available?'#E8F5EC':'#FDECEA', color:item.available?'#2D7A4A':'#C0392B', fontWeight:700, flexShrink:0, marginTop:2 }}>
                        {item.available ? 'Available' : 'Off Menu'}
                      </span>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p style={{ fontSize:'0.78rem', color:'var(--color-text-muted)', margin:'6px 0', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {item.description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
                      {item.calories != null && (
                        <span style={{ fontSize:'0.72rem', color:'var(--color-text-muted)', background:'var(--color-bg-muted)', padding:'2px 7px', borderRadius:20 }}>🔥 {item.calories} kcal</span>
                      )}
                      {item.prepTime != null && (
                        <span style={{ fontSize:'0.72rem', color:'var(--color-text-muted)', background:'var(--color-bg-muted)', padding:'2px 7px', borderRadius:20 }}>⏱ {item.prepTime} min</span>
                      )}
                    </div>

                    {/* Allergens */}
                    {item.allergens && item.allergens.length > 0 && (
                      <div style={{ display:'flex', gap:4, marginTop:8, flexWrap:'wrap' }}>
                        {item.allergens.map(a => (
                          <span key={a} style={{ fontSize:'0.68rem', padding:'2px 6px', borderRadius:20, background:`${ALLERGEN_COLORS[a] || '#888'}18`, color:ALLERGEN_COLORS[a] || '#888', fontWeight:600, border:`1px solid ${ALLERGEN_COLORS[a] || '#888'}33` }}>{a}</span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display:'flex', gap:8, marginTop:12 }}>
                      <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
                        style={{ flex:1, padding:'7px', borderRadius:6, border:'1px solid var(--color-brand-bronze)', background:'white', textDecoration:'none', color:'var(--color-brand-bronze)', cursor:'pointer', fontSize:'0.8rem', textAlign:'center', fontWeight:600 }}>
                        ✏️ Edit
                      </a>
                      <button style={{ padding:'7px 12px', borderRadius:6, border:'1px solid var(--color-border)', background:item.available?'white':'#E8F5EC', color:item.available?'var(--color-text-muted)':'#2D7A4A', cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
                        {item.available ? '⛔' : '✅'}
                      </button>
                      <button style={{ padding:'7px 12px', borderRadius:6, border:'1px solid #FDECEA', background:'#FDECEA', color:'#C0392B', cursor:'pointer', fontSize:'0.8rem' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
