# ხელოსნების სტატისტიკის SMS (sender.ge)

წინა კალენდარული დღის (Asia/Tbilisi 00:00–24:00) ნახვები და ნომერზე დაჭერები. SMS ეგზავნება მხოლოდ მათ, ვისაც იმ დღეს მინიმუმ ერთი დაჭერა ჰქონდა. ერთ ნომერზე დღეში ერთი შეტყობინება; ერთი ნომრით რამდენიმე პროფილის შედეგები ჯამდება.

ტექსტი: `გუშინ: ნახვა 100, დარეკა 30.` შემდეგ ახალ ხაზზე `https://fixup.ge/mechanic/200`. პირადი ბმული იყენებს `mechanic_profiles.display_id`-ს. თუ პროფილის ნომერი არ არის, ბმული გადადის `https://fixup.ge/`-ზე. „დარეკა“ აღნიშნავს ნომერზე დაჭერას, არა დადასტურებულ ზარს.

## ჩართვის მდგომარეობა — 2026-11-27

- ორივე მიგრაცია და განახლებული `stats-sms` ფუნქცია ატვირთულია Supabase-ზე. დღიური RPC: `get_mechanic_daily_sms_stats()`. ძველი კვირეული RPC თავსებადობისთვის რჩება და SMS ფუნქცია მას აღარ იყენებს.
- `SENDER_API_KEY`, `STATS_SMS_CRON_SECRET` და `STATS_SMS_ENABLED=true` შენახულია Edge Functions Secrets-ში; cron-ის კოდი ინახება Vault-ში სახელით `stats_sms_cron_secret`.
- აქტიურია `fixup-stats-sms-daily`: `0 7 * * *` (ყოველდღე 11:00, Asia/Tbilisi). პირველი დაგეგმილი გაგზავნა: 2026-11-28.
- ბაზიდან `pg_net`-ით ფუნქციის `dry_run` შემოწმებამ დააბრუნა HTTP 200, 48 მიმღები და 48 SMS ნაწილი. ეს 26 ნოემბრის შედეგებია; რაოდენობა ყოველდღიურად იცვლება. 48 SMS ნაწილი მიმდინარე 2.5-თეთრიანი ტარიფით არის 1.20 ₾, დღგ-ს ჩათვლით.
- ფუნქციის `test` რეჟიმიდან გაგზავნა და პროვაიდერთან მიწოდების სტატუსი შემოწმებულია წარმატებით. ტესტში 100 ნახვა და 30 დაჭერა საცდელი მონაცემებია.
- ადგილობრივი შემოწმება: `node --test scripts/stats-sms.test.mjs`.

## 1. ბაზა

Supabase → SQL Editor-ში რიგრიგობით გაუშვით `supabase/migrations/20261127120000_mechanic_stats_sms.sql` და `supabase/migrations/20261127140000_daily_mechanic_stats_sms.sql`.
მიგრაციები არაფერს აგზავნის და არაფერს გეგმავს.

## 2. Secrets (Supabase → Edge Functions → Secrets)

| სახელი | მნიშვნელობა |
| --- | --- |
| `SENDER_API_KEY` | sender.ge → Brand Names → FixUp → KEY |
| `STATS_SMS_CRON_SECRET` | თქვენ მიერ შექმნილი გრძელი შემთხვევითი სტრიქონი |
| `STATS_SMS_ENABLED` | ჯერ არ დაამატოთ; `true` რთავს მასობრივ გაგზავნას |

გასაღებები კოდში, git-ში ან ჩატში არ უნდა მოხვდეს.

## 3. ფუნქცია

```bash
supabase functions deploy stats-sms --project-ref kwozniwtygkdoagjegom
```

## 4. შემოწმება

`CRON_SECRET` და `ANON_KEY` თქვენს ტერმინალში ცვლადებად დააყენეთ. `ANON_KEY` პროექტის საჯარო anon გასაღებია (`src/integrations/supabase/client.ts`); ფუნქციაზე „Verify JWT“ ჩართული რჩება.

საცდელი რეჟიმი — არაფერი იგზავნება, ჩანს რაოდენობა და ტექსტები:

```bash
curl -X POST https://kwozniwtygkdoagjegom.supabase.co/functions/v1/stats-sms -H "Authorization: Bearer $ANON_KEY" -H "x-cron-secret: $CRON_SECRET" -d '{"mode":"dry_run"}'
```

ერთი სატესტო SMS თქვენს ნომერზე (ციფრები საცდელია: 100 და 30):

```bash
curl -X POST https://kwozniwtygkdoagjegom.supabase.co/functions/v1/stats-sms -H "Authorization: Bearer $ANON_KEY" -H "x-cron-secret: $CRON_SECRET" -d '{"mode":"test","phone":"5XXXXXXXX"}'
```

## 5. ყოველდღიური გაგზავნის ჩართვა

მხოლოდ შემოწმების შემდეგ: დაამატეთ `STATS_SMS_ENABLED=true`, შემდეგ SQL Editor-ში
(11:00 თბილისის დროით = 07:00 UTC; `pg_cron` და `pg_net` უკვე გამოიყენება პროექტში):

```sql
-- უკვე ჩართულ პროექტზე ხელახლა შექმნა საჭირო არ არის.
select vault.create_secret('<იგივე STATS_SMS_CRON_SECRET>', 'stats_sms_cron_secret');

select cron.schedule('fixup-stats-sms-daily', '0 7 * * *', $$
  select net.http_post(
    url := 'https://kwozniwtygkdoagjegom.supabase.co/functions/v1/stats-sms',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3b3puaXd0eWdrZG9hZ2plZ29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mzk3MjIsImV4cCI6MjA2MzQxNTcyMn0.hc51a_SvwYNUWfPmm2D3rriqGmE8LecInNmu5fa3tGk',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'stats_sms_cron_secret')
    ),
    body := '{"mode":"send"}'::jsonb,
    timeout_milliseconds := 120000
  );
$$);
```

## მართვა

- გამორთვა: `select cron.unschedule('fixup-stats-sms-daily');` ან წაშალეთ `STATS_SMS_ENABLED`.
- ხელოსანს აღარ უნდა SMS: `insert into sms_opt_outs(phone) values ('5XXXXXXXX');`
- ისტორია: `select * from sms_log order by created_at desc limit 100;`
- ბალანსის ამოწურვისას (`402`) გაგზავნა ჩერდება. გაურკვეველი შედეგი (`unknown`) ავტომატურად აღარ მეორდება.
