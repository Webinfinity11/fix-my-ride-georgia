// Prepare public text previews for individual services. The root document only
// carries their small URL index; no gallery or profile data is shipped globally.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const root = new URL('../', import.meta.url);
const source = await readFile(new URL('src/integrations/supabase/client.ts', root),'utf8');
const url = source.match(/SUPABASE_URL = "([^"]+)"/)?.[1];
const key = source.match(/SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)?.[1];
if (!url || !key) throw new Error('Public app client configuration not found');
const client = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error} = await client.from('mechanic_services').select('id,name,description,price_from,price_to,city,district,estimated_hours,photos').eq('is_active',true).limit(1000);
if (error) throw new Error(error.message);
const images = JSON.parse(await readFile(new URL('src/data/service-display-images.json',root),'utf8'));
const hints = {};
for (const {photos,...service} of data) {
 const preview = JSON.stringify({...service,image:images[photos?.[0]] || ''});
 const hash = createHash('sha256').update(preview).digest('hex').slice(0,16);
 const path = `/assets/service-initial-${hash}.json`;
 await writeFile(new URL('public'+path,root),preview+'\n');
 hints[String(service.id)] = {data:path};
}
await writeFile(new URL('scripts/service-boot-data.json',root),JSON.stringify(hints)+'\n');
console.log(`[service boot] ${data.length} public text previews refreshed`);
