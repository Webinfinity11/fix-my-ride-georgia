// Pure logic of the stats-sms function (no Deno APIs, so Node tests can load it).

const SEND_URL = 'https://sender.ge/api/send.php';
// sender.ge: 1 = advertising (with SmsNo), 2 = informational.
const SMS_TYPE = '2';

export type Recipient = { mechanic_id: string; phone: string; views: number; calls: number; display_id?: number | null };
export type SendResult = {
  status: 'sent' | 'failed' | 'unknown';
  messageId?: string;
  error?: string;
  /** The account itself cannot send (bad key, no balance): stop the run. */
  fatal?: boolean;
};

export function buildMessage(views: number, calls: number, displayId?: number | null): string {
  const url = displayId ? `https://fixup.ge/mechanic/${displayId}` : 'https://fixup.ge/';
  return `გუშინ: ნახვა ${views}, დარეკა ${calls}.\n${url}`;
}

/** Georgian text is sent as UCS-2: 70 characters in one SMS, 67 per part beyond. */
export function segments(text: string): number {
  return text.length <= 70 ? 1 : Math.ceil(text.length / 67);
}

export const maskPhone = (phone: string) => `******${phone.slice(-3)}`;

export async function sendSms(
  apiKey: string,
  phone: string,
  content: string,
  fetcher: typeof fetch = fetch,
): Promise<SendResult> {
  try {
    const res = await fetcher(SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ apikey: apiKey, smsno: SMS_TYPE, destination: phone, content }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await res.json().catch(() => null);
    const messageId = body?.data?.[0]?.messageId;
    if (res.ok && messageId) return { status: 'sent', messageId: String(messageId) };
    // A 2xx without a messageId or a 5xx may or may not have been queued.
    return {
      status: res.status >= 400 && res.status < 500 ? 'failed' : 'unknown',
      error: `${res.status} ${body?.message ?? ''}`.trim(),
      fatal: res.status === 401 || res.status === 402 || res.status === 429,
    };
  } catch (error) {
    return { status: 'unknown', error: error instanceof Error ? error.name : 'request failed' };
  }
}

export type SendDeps = {
  /** Reserves today's log row; null means this phone was already handled today. */
  claim: (recipient: Recipient, content: string) => Promise<number | null>;
  send: (phone: string, content: string) => Promise<SendResult>;
  record: (logId: number, result: SendResult) => Promise<void>;
};

/** No automatic retries: a duplicate SMS is worse than a missed one. */
export async function sendAll(recipients: Recipient[], deps: SendDeps, concurrency = 5) {
  const summary = { sent: 0, failed: 0, unknown: 0, skipped: 0, stopped: null as string | null };
  let next = 0;
  const worker = async () => {
    while (!summary.stopped && next < recipients.length) {
      const recipient = recipients[next++];
      const content = buildMessage(recipient.views, recipient.calls, recipient.display_id);
      const logId = await deps.claim(recipient, content);
      if (logId === null) {
        summary.skipped++;
        continue;
      }
      const result = await deps.send(recipient.phone, content);
      summary[result.status]++;
      if (result.fatal) summary.stopped = result.error ?? 'provider rejected the account';
      await deps.record(logId, result);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return summary;
}
