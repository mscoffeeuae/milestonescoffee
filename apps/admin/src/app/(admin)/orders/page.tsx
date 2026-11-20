export const dynamic = 'force-dynamic';
const ORDERS = [
  { id: '#MC-1001', customer: 'Ahmed Al Mansouri', branch: 'Abu Dhabi Mall', items: 'Flat White × 2, Croissant', total: 42, status: 'completed', time: '09:14' },
  { id: '#MC-1002', customer: 'Sara Hassan',       branch: 'Khalidiyah',     items: 'Cappuccino × 1',           total: 18, status: 'in-progress', time: '09:22' },
  { id: '#MC-1003', customer: 'Mohammed Al Zaabi', branch: 'Al Ain Mall',    items: 'Latte × 3, Muffin × 2',   total: 76, status: 'pending',     time: '09:30' },
  { id: '#MC-1004', customer: 'Fatima Khalil',     branch: 'Marina Mall',    items: 'Espresso × 1',             total: 14, status: 'completed',   time: '09:45' },
  { id: '#MC-1005', customer: 'Omar Farooq',       branch: 'Electra St.',    items: 'Cold Brew × 2, Cake slice', total: 54, status: 'cancelled', time: '09:51' },
];
const ST: Record<string,{bg:string;color:string;label:string}> = {
  completed:   {bg:'#E8F5EC',color:'#2D7A4A',label:'Completed'},
  'in-progress':{bg:'#FFF3E0',color:'#B86A00',label:'In Progress'},
  pending:     {bg:'#E3F0FB',color:'#1A5F8A',label:'Pending'},
  cancelled:   {bg:'#FDECEA',color:'#C0392B',label:'Cancelled'},
};
export default function OrdersPage() {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Orders</h1>
          <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem', marginTop:2 }}>Live orders (sample — connect POS/API for real data)</p>
        </div>
      </div>
      <div style={{ background:'var(--color-bg-elevated)', borderRadius:'var(--radius-lg)', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
          <thead><tr style={{ background:'var(--color-bg-muted)' }}>
            {['Order ID','Customer','Branch','Items','Total (AED)','Time','Status',''].map(h=>(
              <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:600, color:'var(--color-text-secondary)', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {ORDERS.map((o,i)=>{
              const s=ST[o.status];
              return (
                <tr key={o.id} style={{ borderTop:'1px solid var(--color-border)', background:i%2===0?'white':'#FAFAF8' }}>
                  <td style={{ padding:'14px 16px', fontWeight:600, color:'var(--color-brand-bronze)' }}>{o.id}</td>
                  <td style={{ padding:'14px 16px' }}>{o.customer}</td>
                  <td style={{ padding:'14px 16px', color:'var(--color-text-secondary)' }}>{o.branch}</td>
                  <td style={{ padding:'14px 16px', color:'var(--color-text-secondary)', maxWidth:200 }}>{o.items}</td>
                  <td style={{ padding:'14px 16px', fontWeight:600 }}>{o.total}</td>
                  <td style={{ padding:'14px 16px', color:'var(--color-text-muted)' }}>{o.time}</td>
                  <td style={{ padding:'14px 16px' }}><span style={{ padding:'3px 10px', borderRadius:20, background:s.bg, color:s.color, fontSize:'0.78rem', fontWeight:600 }}>{s.label}</span></td>
                  <td style={{ padding:'14px 16px' }}><button style={{ padding:'5px 12px', borderRadius:6, border:'1px solid var(--color-border)', background:'white', cursor:'pointer', fontSize:'0.8rem' }}>View</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:12, padding:'10px 16px', background:'#FFF3E0', borderRadius:'var(--radius-md)', fontSize:'0.8rem', color:'#B86A00' }}>
        ⚠️ Sample data — connect D-005 (payment) and D-006 (POS) for live orders.
      </div>
    </div>
  );
}
