export const dynamic = 'force-dynamic';
async function getImages() {
  try {
    const q = encodeURIComponent('*[_type == "galleryImage"] | order(_createdAt desc) { _id, title, "url": image.asset->url }');
    const res = await fetch(`https://txh3gqgo.api.sanity.io/v2021-10-21/data/query/production?query=${q}`, { cache:'no-store' });
    return (await res.json()).result ?? [];
  } catch { return []; }
}
export default async function GalleryAdminPage() {
  const images = await getImages();
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Gallery</h1>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginTop:2 }}>{images.length} images in Sanity</p>
        </div>
        <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
          style={{ padding:'9px 18px', background:'var(--color-brand-bronze)', color:'#fff', borderRadius:'var(--radius-md)', textDecoration:'none', fontSize:'0.875rem', fontWeight:600 }}>
          + Upload via Sanity
        </a>
      </div>
      {images.length === 0 ? (
        <div style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', padding:48, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>🖼</div>
          <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:8 }}>No gallery images yet</h2>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginBottom:20 }}>Add a <code>galleryImage</code> schema in Sanity Studio then upload images.</p>
          <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
            style={{ padding:'10px 20px', background:'var(--color-brand-bronze)', color:'#fff', borderRadius:'var(--radius-md)', textDecoration:'none', fontWeight:600 }}>Open Sanity Studio →</a>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
          {images.map((img: {_id:string;url:string;title:string}) => (
            <div key={img._id} style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              {img.url
                ? <img src={`${img.url}?w=400&h=300&fit=crop`} alt={img.title} style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} />
                : <div style={{ height:160, background:'var(--color-bg-muted)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>🖼</div>
              }
              <div style={{ padding:12 }}>
                <div style={{ fontWeight:500, fontSize:'0.875rem', marginBottom:8 }}>{img.title||'Untitled'}</div>
                <button style={{ width:'100%', padding:'6px', borderRadius:6, border:'1px solid #FDECEA', background:'#FDECEA', color:'#C0392B', cursor:'pointer', fontSize:'0.8rem' }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
