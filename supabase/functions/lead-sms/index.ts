// SMS around leads. Two callers:
//  - the daily cron (x-cron-secret): VIP expiry reminders
//    {"mode":"dry_run"} | {"mode":"test","phone":"5XXXXXXXX"} | {"mode":"send"}
//  - a signed-in administrator: forwards a driver request to chosen mechanics
//    {"mode":"forward","requestId":1,"mechanicIds":["uuid"]}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { expiryMessage, requestMessage } from '../_shared/lead-sms.ts';
import { maskPhone, sendSms } from '../_shared/stats-sms.ts';

const MAX_RECIPIENTS = 10;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const mobile = (value: string | null) => (value ?? '').replace(/\D/g, '').replace(/^(995|0)(?=5\d{8}$)/, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const { mode = 'dry_run', phone, requestId, mechanicIds } = await req.json().catch(() => ({}));
  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const apiKey = Deno.env.get('SENDER_API_KEY') ?? '';

  // The unique key (campaign, phone) is what stops a second SMS.
  const sendOnce = async (campaign: string, to: string, content: string) => {
    const claim = await db.from('sms_campaign_log').insert({ campaign, phone: to });
    if (claim.error) return { status: 'skipped' as const, fatal: false };
    const result = await sendSms(apiKey, to, content);
    await db.from('sms_campaign_log').update({ status: result.status, error: result.error ?? null })
      .eq('campaign', campaign).eq('phone', to);
    return result;
  };

  if (mode === 'forward') {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');
    const { data: auth } = await db.auth.getUser(token);
    if (!auth?.user) return json({ error: 'Unauthorized' }, 401);
    const { data: admin } = await db.rpc('is_admin', { user_id: auth.user.id });
    if (admin !== true) return json({ error: 'Administrator access required' }, 403);
    if (!apiKey) return json({ error: 'SENDER_API_KEY is not set' }, 500);
    if (!Array.isArray(mechanicIds) || !mechanicIds.length || mechanicIds.length > MAX_RECIPIENTS) {
      return json({ error: `Choose 1 to ${MAX_RECIPIENTS} mechanics` }, 400);
    }
    const { data: request } = await db.from('driver_requests').select('*').eq('id', requestId).single();
    if (!request) return json({ error: 'Request not found' }, 404);

    // Numbers come from the database, never from the browser.
    const [{ data: services }, { data: profiles }, { data: optOuts }] = await Promise.all([
      db.from('mechanic_services').select('mechanic_id').eq('is_active', true).in('mechanic_id', mechanicIds),
      db.from('profiles').select('id, phone').in('id', mechanicIds),
      db.from('sms_opt_outs').select('phone'),
    ]);
    const active = new Set((services ?? []).map((s) => s.mechanic_id));
    const blocked = new Set((optOuts ?? []).map((o) => o.phone));
    const content = requestMessage(request.problem, request.car, request.phone);
    const summary = { sent: 0, failed: 0, unknown: 0, skipped: 0 };
    for (const profile of profiles ?? []) {
      const to = mobile(profile.phone);
      if (!active.has(profile.id) || !/^5\d{8}$/.test(to) || blocked.has(to)) {
        summary.skipped++;
        continue;
      }
      const result = await sendOnce(`request-${request.id}`, to, content);
      summary[result.status]++;
      if (result.status !== 'skipped') {
        await db.from('driver_request_sends').insert({ request_id: request.id, phone: to, mechanic_id: profile.id, status: result.status });
      }
      if (result.fatal) break;
    }
    if (summary.sent) await db.from('driver_requests').update({ status: 'sent' }).eq('id', request.id);
    return json(summary);
  }

  const secret = Deno.env.get('STATS_SMS_CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'Unauthorized' }, 401);
  if (!['dry_run', 'test', 'send'].includes(mode)) return json({ error: 'Invalid mode' }, 400);
  if (mode !== 'dry_run' && !apiKey) return json({ error: 'SENDER_API_KEY is not set' }, 500);

  if (mode === 'test') {
    if (!/^5\d{8}$/.test(String(phone))) return json({ error: 'phone must look like 5XXXXXXXX' }, 400);
    const content = expiryMessage('2026-12-28', 120, 15);
    return json({ content, result: await sendSms(apiKey, String(phone), content) });
  }

  const { data: due, error } = await db.rpc('get_vip_expiry_recipients');
  if (error) return json({ error: error.message }, 500);
  if (mode === 'dry_run') {
    return json({
      recipients: due.length,
      samples: due.slice(0, 10).map((d: any) => ({ phone: maskPhone(d.phone), content: expiryMessage(d.ends_on, d.views, d.calls) })),
    });
  }
  const summary = { sent: 0, failed: 0, unknown: 0, skipped: 0 };
  for (const d of due) {
    // One reminder per listing per VIP end date, however often the cron runs.
    const result = await sendOnce(`vip-expiry-${d.service_id}-${d.ends_on}`, d.phone, expiryMessage(d.ends_on, d.views, d.calls));
    summary[result.status]++;
    if (result.fatal) break;
  }
  console.log('lead-sms', JSON.stringify(summary));
  return json(summary);
});
