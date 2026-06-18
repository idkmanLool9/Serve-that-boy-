-- ============================================================================
-- Family Requests — Supabase schema
-- ============================================================================
-- This is the full database setup for the app. It is already applied to the
-- hosted Supabase project, and is kept here for reproducibility / version
-- control. To recreate the backend on a fresh Supabase project, run this whole
-- file in the SQL editor (Database → SQL Editor).
-- ============================================================================

-- ---------- Tables ----------

create table if not exists public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null check (role in ('CUSTOMER','SERVER')),
  family_id  uuid not null references public.families(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  server_id    uuid references public.profiles(id) on delete set null,
  type         text not null check (type in ('item','ice_cream','clothes','help','custom')),
  title        text not null,
  note         text,
  status       text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','COMPLETED')),
  reply        text,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  completed_at timestamptz
);

create index if not exists requests_family_created_idx on public.requests (family_id, created_at desc);
create index if not exists profiles_family_idx on public.profiles (family_id);

-- ---------- Helper functions (SECURITY DEFINER avoids RLS recursion) ----------

create or replace function public.my_family_id()
returns uuid language sql stable security definer set search_path = public as $$
  select family_id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------- Row Level Security ----------

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.requests enable row level security;

drop policy if exists families_select on public.families;
create policy families_select on public.families
  for select to authenticated using (id = public.my_family_id());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (family_id = public.my_family_id());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists requests_select on public.requests;
create policy requests_select on public.requests
  for select to authenticated using (family_id = public.my_family_id());

-- Writes to requests/profiles go through the SECURITY DEFINER functions below.

-- ---------- Signup handler: create/join family + profile atomically ----------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_family_id   uuid;
  v_code        text;
  v_alphabet    text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_name        text := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email,'@',1));
  v_role        text := upper(coalesce(new.raw_user_meta_data->>'role',''));
  v_family_name text := new.raw_user_meta_data->>'family_name';
  v_invite      text := new.raw_user_meta_data->>'invite_code';
  i int;
begin
  if v_role not in ('CUSTOMER','SERVER') then
    return new; -- signup didn't include our setup metadata; skip.
  end if;

  if coalesce(trim(v_family_name),'') <> '' then
    loop
      v_code := '';
      for i in 1..6 loop
        v_code := v_code || substr(v_alphabet, 1 + floor(random()*length(v_alphabet))::int, 1);
      end loop;
      exit when not exists (select 1 from families where invite_code = v_code);
    end loop;
    insert into families(name, invite_code) values (trim(v_family_name), v_code)
      returning id into v_family_id;
  elsif coalesce(trim(v_invite),'') <> '' then
    select id into v_family_id from families where invite_code = upper(trim(v_invite));
    if v_family_id is null then
      raise exception 'No family found with that invite code';
    end if;
  else
    raise exception 'A family name or invite code is required';
  end if;

  insert into profiles(id, name, role, family_id) values (new.id, v_name, v_role, v_family_id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Request actions ----------

create or replace function public.create_request(p_type text, p_title text default null, p_note text default null)
returns public.requests language plpgsql security definer set search_path = public as $$
declare v_p profiles; v_title text; v_row requests;
begin
  select * into v_p from profiles where id = auth.uid();
  if v_p.id is null then raise exception 'No profile found'; end if;
  if v_p.role <> 'CUSTOMER' then raise exception 'Only customers can create requests'; end if;
  if p_type not in ('item','ice_cream','clothes','help','custom') then raise exception 'Invalid request type'; end if;

  v_title := coalesce(nullif(trim(p_title),''), case p_type
    when 'item'      then 'Bring me an item'
    when 'ice_cream' then 'Get me an ice cream'
    when 'clothes'   then 'Bring my clothes downstairs'
    when 'help'      then 'Help me with something'
    else null end);
  if v_title is null then raise exception 'A title is required for custom requests'; end if;

  insert into requests(family_id, customer_id, type, title, note)
    values (v_p.family_id, v_p.id, p_type, v_title, nullif(trim(p_note),''))
    returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.accept_request(p_id uuid)
returns public.requests language plpgsql security definer set search_path = public as $$
declare v_p profiles; v_row requests;
begin
  select * into v_p from profiles where id = auth.uid();
  if v_p.role <> 'SERVER' then raise exception 'Only servers can accept requests'; end if;
  select * into v_row from requests where id = p_id;
  if v_row.id is null or v_row.family_id <> v_p.family_id then raise exception 'Request not found'; end if;
  if v_row.status <> 'PENDING' then raise exception 'Only pending requests can be accepted'; end if;
  update requests set status='ACCEPTED', server_id=v_p.id, accepted_at=now()
    where id=p_id returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.complete_request(p_id uuid, p_reply text default null)
returns public.requests language plpgsql security definer set search_path = public as $$
declare v_p profiles; v_row requests;
begin
  select * into v_p from profiles where id = auth.uid();
  if v_p.role <> 'SERVER' then raise exception 'Only servers can complete requests'; end if;
  select * into v_row from requests where id = p_id;
  if v_row.id is null or v_row.family_id <> v_p.family_id then raise exception 'Request not found'; end if;
  if v_row.status = 'COMPLETED' then raise exception 'Request is already completed'; end if;
  update requests set
    status='COMPLETED',
    completed_at=now(),
    server_id=coalesce(v_row.server_id, v_p.id),
    accepted_at=coalesce(v_row.accepted_at, now()),
    reply=coalesce(nullif(trim(p_reply),''), reply)
    where id=p_id returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.reply_request(p_id uuid, p_reply text)
returns public.requests language plpgsql security definer set search_path = public as $$
declare v_p profiles; v_row requests;
begin
  select * into v_p from profiles where id = auth.uid();
  if v_p.role <> 'SERVER' then raise exception 'Only servers can reply'; end if;
  if coalesce(trim(p_reply),'') = '' then raise exception 'Reply cannot be empty'; end if;
  select * into v_row from requests where id = p_id;
  if v_row.id is null or v_row.family_id <> v_p.family_id then raise exception 'Request not found'; end if;
  update requests set reply=trim(p_reply) where id=p_id returning * into v_row;
  return v_row;
end;
$$;

-- ---------- Function execute grants (least privilege) ----------

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.my_family_id() from public;
revoke execute on function public.my_role() from public;
grant  execute on function public.my_family_id() to authenticated;
grant  execute on function public.my_role() to authenticated;

revoke execute on function public.create_request(text, text, text) from public;
revoke execute on function public.accept_request(uuid) from public;
revoke execute on function public.complete_request(uuid, text) from public;
revoke execute on function public.reply_request(uuid, text) from public;
grant  execute on function public.create_request(text, text, text) to authenticated;
grant  execute on function public.accept_request(uuid) to authenticated;
grant  execute on function public.complete_request(uuid, text) to authenticated;
grant  execute on function public.reply_request(uuid, text) to authenticated;

-- ---------- Realtime ----------

alter publication supabase_realtime add table public.requests;
