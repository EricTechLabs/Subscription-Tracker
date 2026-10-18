-- Run once in the NEW Subscription Tracker project, not the Crypto project.
begin;
create or replace function public.st_valid_reminder(value jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select value is null or coalesce(jsonb_typeof(value) = 'object'
    and jsonb_typeof(value->'days') = 'number'
    and (value->>'days') ~ '^[0-9]{1,3}$'
    and (value->>'days')::numeric between 0 and 365
    and (value->>'time') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$', false);
$$;
create table public.st_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 80),
  amount_cents integer not null check(amount_cents between 1 and 999999999),
  category text not null check(length(trim(category)) between 1 and 30),
  emoji text not null default '' check(length(emoji)<=16),
  image text not null default '' check(image='' or (image ~ '^data:image/(webp|png|jpeg);base64,' and length(image)<100000) or (image ~ '^https://([a-zA-Z0-9-]+\.)*mzstatic\.com/' and length(image)<4096)),
  app_store_url text not null default '' check(app_store_url='' or (app_store_url ~ '^https://(apps|itunes)\.apple\.com/' and length(app_store_url)<4096)),
  unit text not null check(unit in ('day','week','month','year')),
  interval integer not null default 1 check(interval between 1 and 999),
  start_date date not null check(start_date between '1900-01-01' and '2100-12-31'),
  end_date date check(end_date is null or (end_date>=start_date and end_date<='2100-12-31')),
  url text not null default '' check(url='' or (url ~ '^https?://' and length(url)<=2048)),
  payment_reminder jsonb check(public.st_valid_reminder(payment_reminder)),
  end_reminder jsonb check(public.st_valid_reminder(end_reminder)),
  created_at timestamptz not null default now(),
  check(end_reminder is null or end_date is not null)
);
create index st_subscriptions_user_idx on public.st_subscriptions(user_id);
create table public.st_push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null check(length(endpoint)<4096),
  subscription jsonb not null check(subscription->>'endpoint'=endpoint and subscription->'keys'->>'p256dh' is not null and subscription->'keys'->>'auth' is not null),
  created_at timestamptz not null default now(),
  unique(user_id,endpoint)
);
create table public.st_push_deliveries (
  device_id uuid not null references public.st_push_devices(id) on delete cascade,
  subscription_id uuid not null references public.st_subscriptions(id) on delete cascade,
  kind text not null check(kind in ('payment','end')),
  occurrence_date date not null,
  reminder_at timestamptz not null,
  state text not null default 'sending' check(state in ('sending','sent','failed')),
  attempted_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key(device_id,subscription_id,kind,occurrence_date)
);
alter table public.st_subscriptions enable row level security;
alter table public.st_push_devices enable row level security;
alter table public.st_push_deliveries enable row level security;
revoke all on public.st_subscriptions, public.st_push_devices, public.st_push_deliveries from anon, authenticated;
grant select,insert,update,delete on public.st_subscriptions,public.st_push_devices to authenticated;
grant all on public.st_subscriptions,public.st_push_devices,public.st_push_deliveries to service_role;
create policy st_subscriptions_select on public.st_subscriptions for select to authenticated using ((select auth.uid())=user_id);
create policy st_subscriptions_insert on public.st_subscriptions for insert to authenticated with check((select auth.uid())=user_id);
create policy st_subscriptions_update on public.st_subscriptions for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy st_subscriptions_delete on public.st_subscriptions for delete to authenticated using((select auth.uid())=user_id);
create policy st_devices_select on public.st_push_devices for select to authenticated using((select auth.uid())=user_id);
create policy st_devices_insert on public.st_push_devices for insert to authenticated with check((select auth.uid())=user_id);
create policy st_devices_update on public.st_push_devices for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy st_devices_delete on public.st_push_devices for delete to authenticated using((select auth.uid())=user_id);
-- Delivery records are server-only. No anon/authenticated policy or grants.
commit;
