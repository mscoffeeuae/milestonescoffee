export const dynamic = 'force-dynamic';

const MOCK_USERS = [
  { id: 'u1', name: 'Ahmed Al Mansouri', email: 'ahmed@example.com', role: 'Manager',  branch: 'Abu Dhabi Mall', joined: '2024-01-15', status: 'active' },
  { id: 'u2', name: 'Sara Hassan',       email: 'sara@example.com',  role: 'Barista',  branch: 'Khalidiyah',     joined: '2024-03-20', status: 'active' },
  { id: 'u3', name: 'Mohammed Al Zaabi', email: 'mz@example.com',    role: 'Admin',    branch: 'All Branches',   joined: '2023-11-01', status: 'active' },
  { id: 'u4', name: 'Fatima Khalil',     email: 'fk@example.com',    role: 'Cashier',  branch: 'Marina Mall',    joined: '2024-06-10', status: 'inactive' },
];

const roleColors: Record<string, string> = {
  Admin: '#3B1F0E', Manager: '#1A5F8A', Barista: '#2D7A4A', Cashier: '#B86A00',
};

export default function UsersPage() {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Users</h1>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginTop:2 }}>Staff accounts — connect auth (D-004) for live user management</p>
        </div>
        <button style={{ padding:'9px 18px', background:'var(--color-brand-bronze)', color:'#fff', borderRadius:'var(--radius-md)', border:'none', fontSize:'0.875rem', fontWeight:600, cursor:'pointer' }}>+ Invite User</button>
      </div>
      <div style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
          <thead><tr style={{ background:'var(--color-bg-muted)' }}>
            {['Name','Email','Role','Branch','Joined','Status','Actions'].map(h=>(
              <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, color:'var(--color-text-secondary)', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {MOCK_USERS.map((u,i)=>(
              <tr key={u.id} style={{ borderTop:'1px solid var(--color-border)', background:i%2===0?'white':'#FAFAF8' }}>
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:roleColors[u.role]||'#888', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'0.75rem', fontWeight:700, flexShrink:0 }}>
                      {u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                    </div>
                    <span style={{ fontWeight:500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding:'14px 16px', color:'var(--color-text-secondary)' }}>{u.email}</td>
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ padding:'3px 10px', borderRadius:20, background:`${roleColors[u.role]}18`, color:roleColors[u.role]||'#888', fontSize:'0.78rem', fontWeight:600 }}>{u.role}</span>
                </td>
                <td style={{ padding:'14px 16px', color:'var(--color-text-secondary)' }}>{u.branch}</td>
                <td style={{ padding:'14px 16px', color:'var(--color-text-muted)', fontSize:'0.8rem' }}>
                  {new Date(u.joined).toLocaleDateString('en-AE',{day:'numeric',month:'short',year:'numeric'})}
                </td>
                <td style={{ padding:'14px 16px' }}>
                  <span style={{ padding:'3px 10px', borderRadius:20, background:u.status==='active'?'#E8F5EC':'#F0F0F0', color:u.status==='active'?'#2D7A4A':'#888', fontSize:'0.78rem', fontWeight:600 }}>
                    {u.status==='active'?'Active':'Inactive'}
                  </span>
                </td>
                <td style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--color-border)', background:'white', cursor:'pointer', fontSize:'0.8rem' }}>Edit</button>
                    <button style={{ padding:'5px 10px', borderRadius:6, border:'1px solid #FDECEA', background:'#FDECEA', color:'#C0392B', cursor:'pointer', fontSize:'0.8rem' }}>Disable</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:12, padding:'10px 16px', background:'#FFF3E0', borderRadius:'var(--radius-md)', fontSize:'0.8rem', color:'#B86A00' }}>
        ⚠️ Sample data shown — connect auth system (D-004 OTP/JWT) for real user management.
      </div>
    </div>
  );
}
