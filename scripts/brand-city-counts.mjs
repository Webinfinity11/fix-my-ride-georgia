// Phase C feasibility — specialist services per brand×city.
// Brand×city pages only make sense if specialists exist OUTSIDE Tbilisi;
// otherwise the page duplicates the brand hub (which is Tbilisi-dominated).
import { createClient } from '@supabase/supabase-js';
const s = createClient('https://kwozniwtygkdoagjegom.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3b3puaXd0eWdrZG9hZ2plZ29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzk3MjIsImV4cCI6MjA2MzQxNTcyMn0.hc51a_SvwYNUWfPmm2D3rriqGmE8LecInNmu5fa3tGk');
const SPECIALIST_MAX = 5, GATE = 5;
const BRANDS = new Set(['Ford','Toyota','Lincoln','Chevrolet','Lexus','Buick','Cadillac','GMC','Opel','Tesla','Audi','Volkswagen','Mercedes-Benz','Skoda','Kia','Hyundai']);
const rows=[];for(let f=0;;f+=1000){const{data}=await s.from('mechanic_services').select('car_brands,city').eq('is_active',true).range(f,f+999);rows.push(...(data||[]));if(!data||data.length<1000)break;}
const spec=rows.filter(r=>Array.isArray(r.car_brands)&&r.car_brands.length>0&&r.car_brands.length<=SPECIALIST_MAX);
console.log(`\nspecialist services: ${spec.length}`);
// City distribution of specialists
const cityTotal=new Map();
for(const r of spec){const c=(r.city||'').trim()||'—';cityTotal.set(c,(cityTotal.get(c)||0)+1);}
console.log('\n=== specialists by city ===');
for(const[c,n] of [...cityTotal.entries()].sort((a,b)=>b[1]-a[1]))console.log(`   ${String(n).padStart(4)}  ${c}`);
// Brand×city combos ≥ GATE, EXCLUDING Tbilisi (that's the hub)
const bc=new Map();
for(const r of spec){const c=(r.city||'').trim()||'—';for(const raw of r.car_brands){const b=(raw||'').trim();if(!BRANDS.has(b))continue;const k=b+'||'+c;bc.set(k,(bc.get(k)||0)+1);}}
const nonTbilisi=[...bc.entries()].map(([k,n])=>[k.split('||'),n]).filter(([[,c],n])=>n>=GATE && !/თბილის/.test(c)).sort((a,b)=>b[1]-a[1]);
console.log(`\n=== brand×city specialist combos ≥${GATE}, NON-Tbilisi: ${nonTbilisi.length} ===`);
for(const[[b,c],n] of nonTbilisi)console.log(`   ${String(n).padStart(4)}  ${b} — ${c}`);
const tbil=[...bc.entries()].map(([k,n])=>[k.split('||'),n]).filter(([[,c],n])=>n>=GATE && /თბილის/.test(c));
console.log(`\n(for reference) brand×Tbilisi combos ≥${GATE}: ${tbil.length}`);
