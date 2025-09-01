-- Trigger sitemap regeneration to remove problematic URLs
SELECT net.http_post(
  url := 'https://kwozniwtygkdoagjegom.supabase.co/functions/v1/generate-sitemap',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}',
  body := '{"trigger": "manual_update", "remove_private_urls": true}'
) as sitemap_update_result;