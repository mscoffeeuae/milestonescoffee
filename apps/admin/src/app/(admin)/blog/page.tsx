export const dynamic = 'force-dynamic';
async function getPosts() {
  try {
    const q = encodeURIComponent('*[_type == "post"] | order(publishedAt desc) { _id, title, slug, publishedAt, "author": author->name }');
    const res = await fetch(`https://txh3gqgo.api.sanity.io/v2021-10-21/data/query/production?query=${q}`, { cache:'no-store' });
    return (await res.json()).result ?? [];
  } catch { return []; }
}
export default async function BlogAdminPage() {
  const posts = await getPosts();
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Blog</h1>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginTop:2 }}>{posts.length} posts in Sanity CMS</p>
        </div>
        <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
          style={{ padding:'9px 18px', background:'var(--color-brand-bronze)', color:'#fff', borderRadius:'var(--radius-md)', textDecoration:'none', fontSize:'0.875rem', fontWeight:600 }}>
          + Write via Sanity
        </a>
      </div>
      {posts.length === 0 ? (
        <div style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', padding:48, textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>✍️</div>
          <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:8 }}>No blog posts yet</h2>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginBottom:20 }}>Create your first post in Sanity Studio. The blog listing page will show it automatically.</p>
          <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
            style={{ padding:'10px 20px', background:'var(--color-brand-bronze)', color:'#fff', borderRadius:'var(--radius-md)', textDecoration:'none', fontWeight:600 }}>Open Sanity Studio →</a>
        </div>
      ) : (
        <div style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
            <thead><tr style={{ background:'var(--color-bg-muted)' }}>
              {['Title','Author','Published','Slug','Actions'].map(h=>(
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, color:'var(--color-text-secondary)', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {posts.map((p: {_id:string;title:string;author?:string;publishedAt?:string;slug?:{current:string}}, i: number) => (
                <tr key={p._id} style={{ borderTop:'1px solid var(--color-border)', background:i%2===0?'white':'#FAFAF8' }}>
                  <td style={{ padding:'14px 16px', fontWeight:600 }}>{p.title}</td>
                  <td style={{ padding:'14px 16px', color:'var(--color-text-secondary)' }}>{p.author||'—'}</td>
                  <td style={{ padding:'14px 16px', color:'var(--color-text-muted)', fontSize:'0.8rem' }}>{p.publishedAt?new Date(p.publishedAt).toLocaleDateString('en-AE'):'Draft'}</td>
                  <td style={{ padding:'14px 16px', fontSize:'0.8rem', color:'var(--color-text-muted)', fontFamily:'monospace' }}>{p.slug?.current??'—'}</td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <a href={`/en/blog/${p.slug?.current}`} target="_blank" rel="noopener noreferrer"
                        style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--color-border)', background:'white', textDecoration:'none', color:'var(--color-text-primary)', fontSize:'0.8rem' }}>View</a>
                      <a href="https://txh3gqgo.sanity.studio" target="_blank" rel="noopener noreferrer"
                        style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--color-brand-bronze)', background:'white', textDecoration:'none', color:'var(--color-brand-bronze)', fontSize:'0.8rem' }}>Edit</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
