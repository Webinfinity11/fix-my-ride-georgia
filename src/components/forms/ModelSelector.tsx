import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { candidateModels, modelsForBrand, normalizeModels, type ServiceModel } from '@/utils/serviceModels';
export function ModelSelector({ brands, value, onChange, name, description }: {
  brands: string[]; value: ServiceModel[]; onChange: (value: ServiceModel[]) => void; name: string; description: string;
}) {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [model, setModel] = useState('');
  const brand = brands.includes(selectedBrand) ? selectedBrand : brands[0] || '';
  const visible = value.filter(m => brands.includes(m.brand));
  const add = (item: {brand:string;model:string}) => {
    const rows = normalizeModels([item]);
    if (!rows.length) return;
    onChange(normalizeModels([...visible, ...rows]));
    setModel('');
  };
  const candidates = candidateModels(name, description, brands).filter(m => !visible.some(v => v.brand === m.brand && v.slug === m.slug));
  return <section className="rounded-lg border p-4 space-y-3">
    <Label className="text-base">ავტომობილის მოდელები (არასავალდებულო)</Label>
    <p className="text-sm text-muted-foreground">აირჩიეთ მხოლოდ მოდელები, რომლებზეც ამ განცხადებაში მითითებულ მომსახურებას ნამდვილად ასრულებთ. მოდელის სახელი შეიყვანეთ ლათინური ასოებით. მოდელების გარეშე განცხადებაც ჩვეულებრივ გამოქვეყნდება.</p>
    {brand ? <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <select aria-label="მოდელის ბრენდი" value={brand} onChange={e => setSelectedBrand(e.target.value)} className="rounded-md border bg-background p-2 min-w-0">
        {brands.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
      <Input aria-label="ავტომობილის მოდელი" value={model} onChange={e => setModel(e.target.value)} list="service-model-suggestions" maxLength={80} placeholder="მაგ. Fusion, Prius, Model 3" />
      <datalist id="service-model-suggestions">{modelsForBrand(brand).map(m => <option key={m.model} value={m.model} />)}</datalist>
      <Button type="button" disabled={!normalizeModels([{brand, model}]).length || visible.length >= 50} onClick={() => add({brand,model})}>დამატება</Button>
    </div> : <p className="text-sm">ჯერ აირჩიეთ მანქანის მარკა ზემოთ.</p>}
    <div className="flex flex-wrap gap-2">{visible.map(m => <Button key={`${m.brand}:${m.slug}`} type="button" variant="outline" size="sm" aria-label={`${m.brand} ${m.model} — ამოღება`} onClick={() => onChange(visible.filter(v => v !== m))}>{m.brand} {m.model} ×</Button>)}</div>
    {candidates.length > 0 && <div className="space-y-2"><p className="text-sm text-muted-foreground">აღწერაში ნაპოვნი კანდიდატები — დამატება ნიშნავს, რომ ამ მოდელის მომსახურებას ადასტურებთ:</p><div className="flex flex-wrap gap-2">{candidates.map(m => <Button key={`${m.brand}:${m.slug}`} type="button" variant="secondary" size="sm" disabled={visible.length>=50} onClick={() => add(m)}>+ {m.brand} {m.model}</Button>)}</div></div>}
  </section>;
}
