-- After deploying the Edge Function, create the following secrets in Supabase Vault UI:
-- st_project_url = https://NEW-PROJECT.supabase.co
-- st_cron_secret = same value as ST_CRON_SECRET in Edge Function secrets.
-- Do not commit real secret values to GitHub.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
-- Run once; if changing the schedule, unschedule its existing job first.
select cron.schedule('subscription-reminders-every-minute', '* * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='st_project_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',
      (select decrypted_secret from vault.decrypted_secrets where name='st_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$$);
