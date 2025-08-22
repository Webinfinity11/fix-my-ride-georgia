-- Create a scheduled job to update sitemap daily
SELECT cron.schedule(
  'update-sitemap-daily',
  '0 2 * * *', -- Run at 2 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://kwozniwtygkdoagjegom.supabase.co/functions/v1/generate-sitemap',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3b3puaXd0eWdrZG9hZ2plZ29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgzOTcyMiwiZXhwIjoyMDYzNDE1NzIyfQ.LgQBajkgMQCLqjjXPRHg-0lLwFkXMeq_xGLR2K7p9tE"}'::jsonb,
        body:='{"trigger": "scheduled_daily"}'::jsonb
    ) as request_id;
  $$
);