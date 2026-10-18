-- Run ONLY in the new Subscription Tracker Supabase project, after schema.sql and categories.sql.
-- Creates username records for new signups. No Crypto database is used.
begin;
create table public.st_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check(username ~ '^[a-z0-9_]{3,24}$'),
  created_at timestamptz not null default now()
);
alter table public.st_profiles enable row level security;
revoke all on public.st_profiles from public,anon,authenticated;
grant select on public.st_profiles to authenticated;
grant update(username) on public.st_profiles to authenticated;
grant all on public.st_profiles to service_role;
create policy st_profiles_select on public.st_profiles for select to authenticated using((select auth.uid())=user_id);
create policy st_profiles_update on public.st_profiles for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create schema if not exists st_private;
revoke all on schema st_private from public,anon,authenticated;
-- Privileged only because Auth inserts must create the corresponding profile before a user has a session.
-- Trigger-only function in an unexposed schema. Never used as a browser RPC.
create function st_private.st_create_profile()
returns trigger language plpgsql security definer set search_path='' as $$
declare chosen_username text;
begin
  if tg_table_schema <> 'auth' or tg_table_name <> 'users' or tg_op <> 'INSERT' or new.id is null then
    raise exception 'Invalid profile trigger context';
  end if;
  chosen_username := trim(coalesce(new.raw_user_meta_data->>'username',''));
  if chosen_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'Username must contain 3-24 lowercase letters, digits or underscores';
  end if;
  insert into public.st_profiles(user_id,username) values(new.id,chosen_username);
  insert into public.st_categories(user_id,name,color) values
    (new.id,'娛樂','#b49be7'),(new.id,'健身','#91c9b0'),(new.id,'工具','#91b7d2'),(new.id,'3C','#d4b58c'),(new.id,'生活','#d796ae');
  return new;
end;
$$;
revoke all on function st_private.st_create_profile() from public,anon,authenticated;
create trigger st_auth_user_created after insert on auth.users for each row execute function st_private.st_create_profile();
-- Username is display data only. All authorization remains auth.uid() ownership via RLS.
commit;
