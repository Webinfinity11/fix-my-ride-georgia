import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModelSelector } from '@/components/forms/ModelSelector';
import { candidateModels, normalizeModels, type ServiceModel } from '@/utils/serviceModels';
import { toast } from 'sonner';
export function ModelAssignments() {
 const queryClient=useQueryClient();
 const [search,setSearch]=useState('');
 const [limit,setLimit]=useState(30);
 const [selected,setSelected]=useState<any>(null);
 const [models,setModels]=useState<ServiceModel[]>([]);
 const [saving,setSaving]=useState(false);
 const {data:services,isLoading,error}=useQuery({queryKey:['admin-model-assignments'],queryFn:async()=>{
  const {data,error}=await supabase.from('mechanic_services').select('id,name,description,car_brands,vehicle_models,updated_at').eq('is_active',true).order('id',{ascending:false}).range(0,4999);
  if(error) throw error; return data;
 }});
 const filtered=(services || []).filter(s=>`${s.name} ${(s.car_brands || []).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
 async function save() {
  setSaving(true);
  try {
   let query=supabase.from('mechanic_services').update({vehicle_models:models.filter(m=>selected.car_brands.includes(m.brand))}).eq('id',selected.id);
   query=selected.updated_at ? query.eq('updated_at',selected.updated_at) : query.is('updated_at',null);
   const {data,error}=await query.select('id').single();
   if(error || !data) throw new Error('შენახვა ვერ მოხერხდა ან განცხადება შეიცვალა. განაახლეთ სია და სცადეთ ხელახლა.');
   toast.success('მოდელების შესაბამისობა შენახულია');
   setSelected(null);
   await queryClient.invalidateQueries({queryKey:['admin-model-assignments']});
   await queryClient.invalidateQueries({queryKey:['brand-model-links']});
  } catch(e) {toast.error(e instanceof Error ? e.message : 'შენახვა ვერ მოხერხდა');}
  finally {setSaving(false);}
 }
 return <section className="space-y-4">
  <h2 className="text-xl font-bold">მოდელებისა და მომსახურებების შესაბამისობა</h2>
  <p className="text-muted-foreground">აღწერაში ნაპოვნი სახელები მხოლოდ კანდიდატებია. დაადასტურეთ კონკრეტულად ამ განცხადების მომსახურებასთან შესაბამისობა; განსაკუთრებით განასხვავეთ ნაწილების გაყიდვა და შეკეთება.</p>
  <Input aria-label="განცხადების ან ბრენდის ძიება" placeholder="მოძებნეთ განცხადება ან ბრენდი" value={search} onChange={e=>{setSearch(e.target.value);setLimit(30);}} />
  {isLoading && <p role="status">იტვირთება…</p>}
  {error && <p role="alert">მონაცემების ჩატვირთვა ვერ მოხერხდა.</p>}
  <div className="space-y-3">{filtered.slice(0,limit).map(s=>{
   const confirmed=normalizeModels(s.vehicle_models);
   const candidates=candidateModels(s.name,s.description || '',s.car_brands || []);
   return <div key={s.id} className="rounded-lg border bg-background p-4 space-y-2"><h3 className="font-semibold">#{s.id} — {s.name}</h3><p className="text-sm text-muted-foreground">დადასტურებული: {confirmed.map(m=>`${m.brand} ${m.model}`).join(', ') || 'არცერთი'}</p>{candidates.length>0 && <p className="text-sm">კანდიდატები: {candidates.map(m=>`${m.brand} ${m.model}`).join(', ')}</p>}<Button variant="outline" onClick={()=>{setSelected(s);setModels(confirmed);}}>მოდელების გადახედვა</Button></div>;
  })}</div>
  {filtered.length>limit && <Button variant="outline" onClick={()=>setLimit(limit+30)}>მეტის ჩვენება</Button>}
  <Dialog open={Boolean(selected)} onOpenChange={open=>{if(!open&&!saving)setSelected(null);}}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>{selected && <><p className="text-sm whitespace-pre-wrap">{selected.description}</p><ModelSelector brands={selected.car_brands || []} value={models} onChange={setModels} name={selected.name} description={selected.description || ''} /><Button disabled={saving} onClick={save}>{saving?'ინახება…':'შენახვა — შესაბამისობას ვადასტურებ'}</Button></>}</DialogContent></Dialog>
 </section>;
}
