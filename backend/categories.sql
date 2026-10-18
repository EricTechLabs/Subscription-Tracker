-- Install after schema.sql, only when the NEW Supabase project is set up.
begin;
create table public.st_categories (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check(length(trim(name)) between 1 and 30),
  color text not null check(color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  primary key(user_id,name)
);
alter table public.st_categories enable row level security;
revoke all on public.st_categories from anon, authenticated;
grant select,insert,update,delete on public.st_categories to authenticated;
grant all on public.st_categories to service_role;
create policy st_categories_select on public.st_categories for select to authenticated using((select auth.uid())=user_id);
create policy st_categories_insert on public.st_categories for insert to authenticated with check((select auth.uid())=user_id);
create policy st_categories_update on public.st_categories for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy st_categories_delete on public.st_categories for delete to authenticated using((select auth.uid())=user_id);
-- Both routines remain SECURITY INVOKER; all writes obey each user's RLS.
-- One RPC call is one transaction, so names and affected subscriptions change together.
create function public.st_save_category(old_name text,new_name text,new_color text)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if old_name is null then
    insert into public.st_categories(user_id,name,color) values(auth.uid(),new_name,new_color);
  else
    update public.st_categories set name=new_name,color=new_color where user_id=auth.uid() and name=old_name;
    if not found then raise exception 'Category not found'; end if;
    update public.st_subscriptions set category=new_name where user_id=auth.uid() and category=old_name;
  end if;
end;
$$;
create function public.st_delete_category(category_name text)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  perform 1 from public.st_categories where user_id=auth.uid() and name=category_name for update;
  if not found then raise exception 'Category not found'; end if;
  if exists(select 1 from public.st_subscriptions where user_id=auth.uid() and category=category_name) then
    if category_name='未分類' then raise exception 'Move subscriptions out of 未分類 first'; end if;
    insert into public.st_categories(user_id,name,color) values(auth.uid(),'未分類','#96959f') on conflict(user_id,name) do nothing;
    update public.st_subscriptions set category='未分類' where user_id=auth.uid() and category=category_name;
  end if;
  delete from public.st_categories where user_id=auth.uid() and name=category_name;
end;
$$;
revoke all on function public.st_save_category(text,text,text),public.st_delete_category(text) from public,anon;
grant execute on function public.st_save_category(text,text,text),public.st_delete_category(text) to authenticated;
commit;
