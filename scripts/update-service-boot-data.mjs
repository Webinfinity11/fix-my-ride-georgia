// Refresh public first-screen hints using the same anonymous client as the app.
// No private profiles, credentials, or full service descriptions are published.
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
const root = new URL('../', import.meta.url);
const clientSource = await readFile(new URL('src/integrations/supabase/client.ts', root), 'utf8');
const url = clientSource.match(/SUPABASE_URL = "([^"]+)"/)?.[1];
const key = clientSource.match(/SUPABASE_PUBLISHABLE_KEY = "([^"]+)"/)?.[1];
if (!url || !key) throw new Error('Public app client configuration not found');
const client = createClient(url, key, {auth:{persistSession:false,autoRefreshToken:false}});
const {data,error} = await client.from('mechanic_services').select('id,name,photos').eq('is_active',true).limit(1000);
if (error) throw new Error(error.message);
const images = JSON.parse(await readFile(new URL('src/data/service-display-images.json', root),'utf8'));
const hints = Object.fromEntries(data.map(service=>[String(service.id),{name:service.name,image:images[service.photos?.[0]] || ''}]));
await writeFile(new URL('scripts/service-boot-data.json',root),JSON.stringify(hints)+'\n');
console.log(`[service boot] ${data.length} public service hints refreshed`);
