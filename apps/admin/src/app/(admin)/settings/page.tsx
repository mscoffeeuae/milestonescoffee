export default function SettingsPage() {
  const sections = [
    { title:'General', items:[
      { label:'Brand Name',     value:'Milestones Coffee' },
      { label:'Primary Domain', value:'milestonescoffee.ae' },
      { label:'Default Locale', value:'en (English + Arabic)' },
      { label:'Currency',       value:'AED (UAE Dirham)' },
      { label:'Country',        value:'UAE' },
    ]},
    { title:'Sanity CMS', items:[
      { label:'Project ID',  value:'txh3gqgo' },
      { label:'Dataset',     value:'production' },
      { label:'Studio URL',  value:'https://txh3gqgo.sanity.studio' },
      { label:'API Version', value:'2021-10-21' },
    ]},
    { title:'Pending Decisions', items:[
      { label:'D-004 Auth/OTP',        value:'⏳ Not configured', warn:true },
      { label:'D-005 Payment Gateway', value:'⏳ Not configured', warn:true },
      { label:'D-006 POS Integration', value:'⏳ Not configured', warn:true },
      { label:'D-007 Hosting',         value:'⏳ Not configured', warn:true },
      { label:'D-008 Email/SMS',       value:'⏳ Not configured', warn:true },
    ]},
    { title:'Apps', items:[
      { label:'Web App (port 3005)',   value:'http://localhost:3005' },
      { label:'Admin App (port 3006)', value:'http://localhost:3006' },
      { label:'API (port 4000)',       value:'http://localhost:4000' },
      { label:'Sanity Studio',         value:'http://localhost:3335' },
    ]},
  ];
  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Settings</h1>
        <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginTop:2 }}>System configuration and pending decisions</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {sections.map(({title,items})=>(
          <div key={title} style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ padding:'14px 20px', background:'var(--color-bg-muted)', borderBottom:'1px solid var(--color-border)', fontWeight:700, fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--color-text-secondary)' }}>{title}</div>
            {items.map(({label,value,warn}:{label:string;value:string;warn?:boolean})=>(
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid var(--color-border)' }}>
                <span style={{ fontSize:'0.875rem', fontWeight:500 }}>{label}</span>
                <span style={{ fontSize:'0.875rem', color:warn?'#B86A00':'var(--color-text-secondary)', background:value.startsWith('http')?'var(--color-bg-muted)':'transparent', padding:value.startsWith('http')?'2px 8px':'0', borderRadius:4, fontFamily:value.startsWith('http')?'monospace':'inherit' }}>
                  {value.startsWith('http')
                    ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ color:'var(--color-brand-bronze)', textDecoration:'none' }}>{value}</a>
                    : value}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
