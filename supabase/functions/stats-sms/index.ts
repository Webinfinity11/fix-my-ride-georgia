// Sends mechanics their listing statistics by SMS through sender.ge.
// Server-to-server only: every request needs the x-cron-secret header.
// Body: {"mode":"dry_run"} (default) | {"mode":"test","phone":"5XXXXXXXX"} | {"mode":"send"}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  buildMessage,
  maskPhone,
  Recipient,
  segments,
  sendAll,
  sendSms,
} from '../_shared/stats-sms.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const secret = Deno.env.get('STATS_SMS_CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'Unauthorized' }, 401);
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const { mode = 'dry_run', phone } = await req.json().catch(() => ({}));
  if (!['dry_run', 'test', 'send'].includes(mode)) return json({ error: 'Invalid mode' }, 400);

  const apiKey = Deno.env.get('SENDER_API_KEY');
  if (mode !== 'dry_run' && !apiKey) return json({ error: 'SENDER_API_KEY is not set' }, 500);

  if (mode === 'test') {
    if (!/^5\d{8}$/.test(String(phone))) return json({ error: 'phone must look like 5XXXXXXXX' }, 400);
    const content = buildMessage(100, 30, 200);
    return json({ content, result: await sendSms(apiKey!, String(phone), content) });
  }

  if (mode === 'send' && Deno.env.get('STATS_SMS_ENABLED') !== 'true') {
    return json({ error: 'Sending is disabled (STATS_SMS_ENABLED is not "true")' }, 403);
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const recipients: Recipient[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .rpc('get_mechanic_daily_sms_stats')
      .range(from, from + 999);
    if (error) return json({ error: error.message }, 500);
    recipients.push(...(data as Recipient[]));
    if (data.length < 1000) break;
  }

  if (mode === 'dry_run') {
    return json({
      recipients: recipients.length,
      smsParts: recipients.reduce((sum, r) => sum + segments(buildMessage(r.views, r.calls, r.display_id)), 0),
      samples: recipients.slice(0, 10).map((r) => ({
        phone: maskPhone(r.phone),
        content: buildMessage(r.views, r.calls, r.display_id),
      })),
    });
  }

  const summary = await sendAll(recipients, {
    claim: async (r, content) => {
      const { data, error } = await db
        .from('sms_log')
        .insert({ mechanic_id: r.mechanic_id, phone: r.phone, views: r.views, calls: r.calls, content })
        .select('id')
        .single();
      if (error?.code === '23505') return null;
      if (error) throw new Error(error.message);
      return data.id;
    },
    send: (to, content) => sendSms(apiKey!, to, content),
    record: async (id, result) => {
      const { error } = await db
        .from('sms_log')
        .update({ status: result.status, provider_message_id: result.messageId, error: result.error })
        .eq('id', id);
      if (error) console.error('sms_log update failed', id, error.message);
    },
  });
  console.log('stats-sms', JSON.stringify(summary));
  return json(summary, summary.stopped ? 502 : 200);
});
