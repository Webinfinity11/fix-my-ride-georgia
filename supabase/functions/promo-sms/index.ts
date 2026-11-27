// One-off VIP promotion SMS. Separate from stats-sms so the daily messages are
// never at risk. Every request needs the x-cron-secret header.
// Body: {"mode":"test","phone":"5XXXXXXXX"} | {"mode":"dry_run"} | {"mode":"send","minClicks":1}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CAMPAIGN = 'vip-2026-11-27';
const TEXT = 'VIP 15₾, Super VIP 20₾! https://fixup.ge/vip';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sendSms(apikey: string, destination: string) {
  try {
    const res = await fetch('https://sender.ge/api/send.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // smsno 1 = advertising: recipients can opt out.
      body: new URLSearchParams({ apikey, smsno: '1', destination, content: TEXT }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await res.json().catch(() => null);
    const sent = body?.data?.[0];
    if (res.ok && sent?.messageId) return { status: 'sent', parts: Number(sent.qnt) || 1, error: null, fatal: false };
    const error = `${res.status} ${body?.message ?? ''}`.trim();
    return {
      status: res.status >= 400 && res.status < 500 ? 'failed' : 'unknown',
      parts: 0,
      error,
      fatal: [401, 402, 429].includes(res.status) || error.includes('apikey'),
    };
  } catch (_) {
    return { status: 'unknown', parts: 0, error: 'request failed', fatal: false };
  }
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('STATS_SMS_CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'Unauthorized' }, 401);
  const { mode = 'dry_run', phone, minClicks = 1 } = await req.json().catch(() => ({}));
  const apiKey = Deno.env.get('SENDER_API_KEY') ?? '';

  if (mode === 'test') {
    if (!/^5\d{8}$/.test(String(phone))) return json({ error: 'phone must look like 5XXXXXXXX' }, 400);
    return json({ content: TEXT, result: await sendSms(apiKey, String(phone)) });
  }
  if (mode !== 'dry_run' && mode !== 'send') return json({ error: 'Invalid mode' }, 400);

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const { data: recipients, error } = await db.rpc('get_vip_promo_recipients', { p_min_clicks: minClicks });
  if (error) return json({ error: error.message }, 500);
  if (mode === 'dry_run') return json({ content: TEXT, recipients: recipients.length });

  // Never advertise a promotion that is not running.
  const { data: pricing } = await db.from('vip_pricing').select('promo_ends_at').single();
  if (!(Date.parse(pricing?.promo_ends_at) > Date.now())) return json({ error: 'No active promotion' }, 409);

  const summary = { sent: 0, failed: 0, unknown: 0, skipped: 0, parts: 0, stopped: null as string | null };
  let next = 0;
  const worker = async () => {
    while (!summary.stopped && next < recipients.length) {
      const to = recipients[next++].phone;
      // The unique key is the guard: one message per number per campaign.
      const claim = await db.from('sms_campaign_log').insert({ campaign: CAMPAIGN, phone: to });
      if (claim.error) {
        summary.skipped++;
        continue;
      }
      const result = await sendSms(apiKey, to);
      summary[result.status as 'sent' | 'failed' | 'unknown']++;
      summary.parts += result.parts ?? 0;
      if (result.fatal) summary.stopped = result.error;
      await db.from('sms_campaign_log').update({ status: result.status, error: result.error })
        .eq('campaign', CAMPAIGN).eq('phone', to);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker(), worker()]);
  console.log('promo-sms', JSON.stringify(summary));
  return json(summary);
});
