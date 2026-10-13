// Generate the same edge implementation as one file for Supabase's dashboard.
// The CLI deployment continues to use the original shared modules and deno.json.
import { readFileSync, writeFileSync } from 'node:fs';
const output = process.argv[2];
if (!output) throw new Error('Usage: node scripts/bundle-fuel-dashboard.mjs /tmp/fuel-prices.ts');
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const source = read('../supabase/functions/_shared/priceshub.ts')
  .replace("from 'cheerio'", "from 'npm:cheerio@1.0.0'")
  .replaceAll('COMPANIES', 'SOURCE_COMPANIES');
const entry = read('../supabase/functions/fuel-prices/index.ts')
  .replace(/^import .* from "\.\.\/_shared\/.*";\n/gm, '');
writeFileSync(output, '// Generated from repository shared modules.\n' + source + '\n'
  + read('../supabase/functions/_shared/fuel-catalogue.ts') + '\n' + entry);
console.log(`Dashboard edge bundle written to ${output}`);
