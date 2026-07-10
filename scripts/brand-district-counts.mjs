// brand×Tbilisi-district feasibility (specialists only, ≥5 gate).
import { createClient } from '@supabase/supabase-js';
const s = createClient('https://kwozniwtygkdoagjegom.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3b3puaXd0eWdrZG9hZ2plZ29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzk3MjIsImV4cCI6MjA2MzQxNTcyMn0.hc51a_SvwYNUWfPmm2D3rriqGmE8LecInNmu5fa3tGk');
const SPECIALIST_MAX=5, GATE=5;
const BRANDS=new Set(['Ford','Toyota','Lincoln','Chevrolet','Lexus','Buick','Cadillac','GMC','Opel','Tesla','Audi','Volkswagen','Mercedes-Benz','Skoda','Kia','Hyundai']);
const DISTRICTS=new Set(['გლდანი','ვარკეთილი','დიღომი','დიდუბე','საბურთალო','ნაძალადევი','სამგორი','ისანი','ჩუღურეთი']);
const rows=[];for(let f=0;;f+=1000){const{data}=await s.from('mechanic_services').select('car_brands,district').eq('is_active',true).range(f,f+999);rows.push(...(data||[]));if(!data||data.length<1000)break;}
const spec=rows.filter(r=>Array.isArray(r.car_brands)&&r.car_brands.length>0&&r.car_brands.length<=SPECIALIST_MAX);
const withDist=spec.filter(r=>(r.district||'').trim());
console.log(`\nspecialists: ${spec.length} | with a district set: ${withDist.length}`);
const dcount=new Map();for(const r of withDist){const d=r.district.trim();dcount.set(d,(dcount.get(d)||0)+1);}
console.log('\n=== specialists by district ===');
for(const[d,n] of [...dcount.entries()].sort((a,b)=>b[1]-a[1]))console.log(`   ${String(n).padStart(3)}  ${d}${DISTRICTS.has(d)?'':'  (not whitelisted)'}`);
const bd=new Map();
for(const r of withDist){const d=r.district.trim();if(!DISTRICTS.has(d))continue;for(const raw of r.car_brands){const b=(raw||'').trim();if(!BRANDS.has(b))continue;const k=b+'||'+d;bd.set(k,(bd.get(k)||0)+1);}}
const q=[...bd.entries()].map(([k,n])=>[k.split('||'),n]).filter(([,n])=>n>=GATE).sort((a,b)=>b[1]-a[1]);
console.log(`\n=== brand×district specialist combos ≥${GATE}: ${q.length} ===`);
for(const[[b,d],n] of q)console.log(`   ${String(n).padStart(3)}  ${b} — ${d}`);
// also show ≥3 to see if a lower gate would help
const q3=[...bd.entries()].filter(([,n])=>n>=3).length;
console.log(`\n(reference) combos ≥3: ${q3}`);
