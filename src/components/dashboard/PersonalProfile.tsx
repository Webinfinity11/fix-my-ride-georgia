import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Camera, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function PersonalProfile() {
  const { user, refreshProfile } = useAuth();
  const initial = () => ({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '', city: user?.city ?? '', district: user?.district ?? '', address: user?.fullAddress || user?.street || '' });
  const [form, setForm] = useState(initial);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!photo) { setPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const reset = () => { setForm(initial()); setPhoto(null); setRemovePhoto(false); if (fileInput.current) fileInput.current.value = ''; };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || saving) return;
    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      let avatarUrl = removePhoto ? null : user.avatarUrl ?? null;
      if (photo) {
        const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[photo.type];
        if (!extension || photo.size > 5 * 1024 * 1024) throw new Error('აირჩიეთ JPG, PNG ან WebP ფოტო, მაქსიმუმ 5 მბ.');
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from('avatars').upload(path, photo);
        if (error) throw error;
        uploadedPath = path;
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from('profiles').update({
        first_name: form.firstName.trim(), last_name: form.lastName.trim(),
        full_name: [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' '),
        phone: form.phone.trim(), city: form.city.trim() || null, district: form.district.trim() || null,
        full_address: form.address.trim() || null, street: form.address.trim() || null, avatar_url: avatarUrl,
      }).eq('id', user.id).select('id').single();
      if (error) throw error;
      uploadedPath = null;
      await refreshProfile();
      setPhoto(null); setRemovePhoto(false);
      if (fileInput.current) fileInput.current.value = '';
      toast.success('პირადი მონაცემები შენახულია');
    } catch (error) {
      if (uploadedPath) await supabase.storage.from('avatars').remove([uploadedPath]);
      toast.error(error instanceof Error ? error.message : 'მონაცემები ვერ შეინახა. სცადეთ ხელახლა.');
    } finally { setSaving(false); }
  };
  const avatar = preview || (!removePhoto ? user?.avatarUrl : null);
  return <section className="rounded-2xl border bg-card p-4 md:p-6">
    <h2 className="text-lg font-semibold">პირადი მონაცემები</h2>
    <p className="mt-1 text-sm text-muted-foreground">დაამატეთ ფოტო და საკონტაქტო მონაცემები. ცვლილების შემდეგ დააჭირეთ შენახვას.</p>
    <form onSubmit={save} className="mt-6 space-y-6">
      <fieldset disabled={saving} className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">{avatar ? <img src={avatar} alt="პროფილის ფოტო" className="h-full w-full object-cover" /> : <UserRound className="h-8 w-8 text-muted-foreground" />}</div>
          <div className="space-y-2">
            <Input ref={fileInput} id="profile-photo" aria-label="პროფილის ფოტოს არჩევა" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error('აირჩიეთ JPG, PNG ან WebP ფოტო, მაქსიმუმ 5 მბ.'); event.target.value = ''; return; }
              setPhoto(file); setRemovePhoto(false);
            }} />
            <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => fileInput.current?.click()}><Camera className="mr-2 h-4 w-4" />{avatar ? 'ფოტოს შეცვლა' : 'ფოტოს დამატება'}</Button>{avatar && <Button type="button" variant="ghost" onClick={() => { setPhoto(null); setRemovePhoto(true); }}>წაშლა</Button>}</div>
            <p className="text-xs text-muted-foreground">JPG, PNG ან WebP · მაქსიმუმ 5 მბ</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([['firstName','სახელი','given-name'],['lastName','გვარი','family-name'],['phone','ტელეფონი','tel'],['city','ქალაქი','address-level2'],['district','უბანი','address-level3'],['address','მისამართი','street-address']] as const).map(([name,label,autoComplete]) => <div key={name} className={`space-y-2 ${name === 'address' ? 'sm:col-span-2' : ''}`}><Label htmlFor={`profile-${name}`}>{label}</Label><Input id={`profile-${name}`} name={name} type={name === 'phone' ? 'tel' : 'text'} autoComplete={autoComplete} value={form[name]} onChange={event => setForm(previous => ({ ...previous, [name]: event.target.value }))} /></div>)}
          <div className="space-y-2"><Label htmlFor="profile-email">ელფოსტა</Label><Input id="profile-email" type="email" value={user?.email ?? ''} readOnly className="bg-muted" /></div>
        </div>
        <div className="flex flex-wrap gap-3"><Button type="submit">{saving ? 'ინახება...' : 'ცვლილებების შენახვა'}</Button><Button type="button" variant="outline" onClick={reset}>გაუქმება</Button></div>
      </fieldset>
    </form>
  </section>;
}
