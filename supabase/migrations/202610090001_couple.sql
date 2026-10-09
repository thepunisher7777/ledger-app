-- Only shared entities. There is deliberately NO personal-finance table.
begin;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists ledger_private;
revoke all on schema ledger_private from public;
create table public.ledger_couple_spaces (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 80),
 base_currency text not null check(base_currency in ('EUR','USD')),
 status text not null default 'pending' check(status in ('pending','active','closed')),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.ledger_couple_members (
 space_id uuid not null references public.ledger_couple_spaces(id), user_id uuid not null references auth.users(id),
 slot smallint not null check(slot in (1,2)), display_name text not null check(length(display_name) between 1 and 60),
 active boolean not null default true, joined_at timestamptz not null default now(), left_at timestamptz,
 primary key(space_id,user_id)
);
create unique index couple_two_slots on public.ledger_couple_members(space_id,slot) where active;
create unique index couple_one_active_space on public.ledger_couple_members(user_id) where active;
create table public.ledger_couple_invites (
 id uuid primary key default gen_random_uuid(), space_id uuid not null references public.ledger_couple_spaces(id),
 token_hash bytea not null unique, expires_at timestamptz not null, consumed_by uuid references auth.users(id),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), revoked boolean not null default false
);
create table public.ledger_couple_entities (
 id uuid primary key, space_id uuid not null references public.ledger_couple_spaces(id),
 kind text not null check(kind in ('expense','income','contribution','settlement','account','budget','goal','recurring')),
 payload jsonb not null, revision integer not null default 1, deleted boolean not null default false,
 created_by uuid not null references auth.users(id), updated_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index couple_entities_space on public.ledger_couple_entities(space_id,updated_at);
create table public.ledger_couple_activity (
 id bigint generated always as identity primary key, space_id uuid not null references public.ledger_couple_spaces(id),
 actor uuid not null references auth.users(id), action text not null, entity_id uuid, revision integer,
 occurred_at timestamptz not null default now()
);
create table ledger_private.operations (
 id uuid primary key, actor uuid not null, space_id uuid not null, request jsonb not null, result jsonb not null,
 created_at timestamptz not null default now()
);
create index couple_operation_rate on ledger_private.operations(actor,created_at);
revoke all on ledger_private.operations from public,anon,authenticated;
create function ledger_private.member(p_space uuid) returns boolean language sql stable security definer
set search_path = '' as $$ select exists(select 1 from public.ledger_couple_members where space_id=p_space and user_id=auth.uid() and active) $$;
grant usage on schema ledger_private to authenticated;
grant execute on function ledger_private.member(uuid) to authenticated;
alter table public.ledger_couple_spaces enable row level security;
alter table public.ledger_couple_members enable row level security;
alter table public.ledger_couple_invites enable row level security;
alter table public.ledger_couple_entities enable row level security;
alter table public.ledger_couple_activity enable row level security;
create policy couple_read_space on public.ledger_couple_spaces for select to authenticated using(ledger_private.member(id));
create policy couple_read_members on public.ledger_couple_members for select to authenticated using(ledger_private.member(space_id));
create policy couple_read_entities on public.ledger_couple_entities for select to authenticated using(ledger_private.member(space_id));
create policy couple_read_activity on public.ledger_couple_activity for select to authenticated using(ledger_private.member(space_id));
-- Invitations have NO read policy: even a partner cannot retrieve bearer secrets.
revoke all on public.ledger_couple_spaces,public.ledger_couple_members,public.ledger_couple_invites,public.ledger_couple_entities,public.ledger_couple_activity from public,anon,authenticated;
grant select on public.ledger_couple_spaces,public.ledger_couple_members,public.ledger_couple_entities,public.ledger_couple_activity to authenticated;

create function public.ledger_couple_create(p_name text,p_alias text,p_currency text) returns uuid
language plpgsql security definer set search_path='' as $$
declare s uuid; u uuid:=auth.uid(); begin
 if u is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if (select count(*) from public.ledger_couple_spaces where created_by=u and created_at>now()-interval '1 day')>=5 then raise exception 'RATE_LIMIT'; end if;
 insert into public.ledger_couple_spaces(name,base_currency,created_by) values(p_name,p_currency,u) returning id into s;
 insert into public.ledger_couple_members(space_id,user_id,slot,display_name) values(s,u,1,p_alias);
 insert into public.ledger_couple_activity(space_id,actor,action) values(s,u,'created'); return s;
end $$;
create function public.ledger_couple_invite(p_space uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.ledger_couple_spaces; token text; begin
 select * into s from public.ledger_couple_spaces where id=p_space for update;
 if not ledger_private.member(p_space) or s.status<>'pending' then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 if (select count(*) from public.ledger_couple_invites where created_by=auth.uid() and created_at>now()-interval '1 minute')>=10 then raise exception 'RATE_LIMIT'; end if;
 update public.ledger_couple_invites set revoked=true where space_id=p_space and consumed_by is null;
 token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.ledger_couple_invites(space_id,token_hash,expires_at,created_by)
 values(p_space,extensions.digest(token,'sha256'),now()+interval '24 hours',auth.uid());
 return jsonb_build_object('token',token,'expires_at',now()+interval '24 hours');
end $$;
create function public.ledger_couple_join(p_token text,p_alias text) returns uuid
language plpgsql security definer set search_path='' as $$
declare inv public.ledger_couple_invites; s public.ledger_couple_spaces; u uuid:=auth.uid(); begin
 if u is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
 if p_token !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_INVITE'; end if;
 select * into inv from public.ledger_couple_invites where token_hash=extensions.digest(p_token,'sha256');
 if not found then raise exception 'INVALID_INVITE'; end if;
 select * into s from public.ledger_couple_spaces where id=inv.space_id for update;
 select * into inv from public.ledger_couple_invites where id=inv.id for update;
 if inv.revoked or inv.consumed_by is not null or inv.expires_at<=now() or s.status<>'pending' or inv.created_by=u then raise exception 'INVALID_INVITE'; end if;
 insert into public.ledger_couple_members(space_id,user_id,slot,display_name) values(s.id,u,2,p_alias);
 update public.ledger_couple_invites set consumed_by=u where id=inv.id;
 update public.ledger_couple_spaces set status='active' where id=s.id;
 insert into public.ledger_couple_activity(space_id,actor,action) values(s.id,u,'joined'); return s.id;
end $$;

create function ledger_private.validate_payload(p_space uuid,p_kind text,p jsonb) returns void
language plpgsql set search_path='' as $$
declare k text; total bigint; amount bigint; m public.ledger_couple_members; base text; account uuid; begin
 if p is null or jsonb_typeof(p)<>'object' or octet_length(p::text)>12000 then raise exception 'INVALID_PAYLOAD'; end if;
 if exists(select 1 from jsonb_each(p) where value='null'::jsonb) then raise exception 'NULL_FIELD'; end if;
 for k in select jsonb_object_keys(p) loop
  if k not in ('title','amount_minor','currency','base_minor','fx_rate','fx_date','fx_source','date','category','payer','splits','account_id','from_user','to_user','month','target_minor','day','active','recurring_id','occurrence','split_mode') then raise exception 'UNSHARED_FIELD: %',k; end if;
 end loop;
 if jsonb_typeof(p->'title')<>'string' or coalesce(length(p->>'title'),0) not between 1 and 160 then raise exception 'INVALID_TITLE'; end if;
 if length(coalesce(p->>'category',''))>80 then raise exception 'INVALID_CATEGORY'; end if;
 select base_currency into base from public.ledger_couple_spaces where id=p_space;
 if p_kind in ('expense','income','contribution','settlement','recurring') then
  if not p ?& array['amount_minor','currency','base_minor','fx_rate','fx_date','fx_source','date'] then raise exception 'MISSING_MONEY_FIELD'; end if;
  if jsonb_typeof(p->'amount_minor')<>'number' or jsonb_typeof(p->'base_minor')<>'number' or jsonb_typeof(p->'fx_rate')<>'number' then raise exception 'INVALID_MONEY_TYPE'; end if;
  if p->>'currency' not in ('EUR','USD') or (p->>'amount_minor') !~ '^[0-9]+$' or (p->>'base_minor') !~ '^[0-9]+$' then raise exception 'INVALID_MONEY'; end if;
  amount:=(p->>'amount_minor')::bigint;
  if amount<=0 or amount>100000000000 or (p->>'base_minor')::bigint<=0 or (p->>'base_minor')::bigint>100000000000 then raise exception 'INVALID_MONEY'; end if;
  if (p->>'fx_rate')::numeric<=0 or (p->>'fx_rate')::numeric>1000 or round(amount*(p->>'fx_rate')::numeric)<>(p->>'base_minor')::numeric then raise exception 'INVALID_FX'; end if;
  if p->>'currency'=base and (p->>'fx_rate')::numeric<>1 then raise exception 'INVALID_FX'; end if;
  if p->>'date' !~ '^\d{4}-\d{2}-\d{2}$' or p->>'fx_date' !~ '^\d{4}-\d{2}-\d{2}$' or coalesce(length(p->>'fx_source'),0) not between 1 and 80 then raise exception 'INVALID_DATE'; end if;
  perform (p->>'date')::date; perform (p->>'fx_date')::date;
 end if;
 if p_kind in ('expense','recurring') then
  if not p ?& array['splits','payer'] then raise exception 'MISSING_SPLIT_FIELD'; end if;
  if jsonb_typeof(p->'splits')<>'object' or (select count(*) from jsonb_object_keys(p->'splits'))<>2 then raise exception 'INVALID_SPLITS'; end if;
  total:=0;
  for m in select * from public.ledger_couple_members where space_id=p_space and active loop
   if (p->'splits'->>m.user_id::text) is null or (p->'splits'->>m.user_id::text) !~ '^[0-9]+$' then raise exception 'INVALID_SPLITS'; end if;
   total:=total+(p->'splits'->>m.user_id::text)::bigint;
  end loop;
  if total<>amount or not exists(select 1 from public.ledger_couple_members where space_id=p_space and active and user_id::text=p->>'payer') then raise exception 'INVALID_SPLITS'; end if;
 end if;
 if p_kind='settlement' then
  if p->>'from_user'=p->>'to_user' or (select count(*) from public.ledger_couple_members where space_id=p_space and active and user_id::text in (p->>'from_user',p->>'to_user'))<>2 then raise exception 'INVALID_SETTLEMENT'; end if;
 end if;
 if p_kind in ('income','contribution') and not exists(select 1 from public.ledger_couple_members where space_id=p_space and active and user_id::text=p->>'payer') then raise exception 'INVALID_PAYER'; end if;
 if p_kind='recurring' and (not p ?& array['day','active'] or (p->>'day') !~ '^[0-9]+$' or (p->>'day')::int not between 1 and 28 or jsonb_typeof(p->'active')<>'boolean') then raise exception 'INVALID_RECURRENCE'; end if;
 if p_kind='budget' then
  if not p ?& array['month','target_minor'] or p->>'month' !~ '^\d{4}-(0[1-9]|1[0-2])$' or (p->>'target_minor') !~ '^[0-9]+$' or (p->>'target_minor')::bigint>100000000000 then raise exception 'INVALID_BUDGET'; end if;
 end if;
 if p_kind='goal' and (not p ? 'target_minor' or (p->>'target_minor') !~ '^[0-9]+$' or (p->>'target_minor')::bigint<=0 or (p->>'target_minor')::bigint>100000000000) then raise exception 'INVALID_GOAL'; end if;
 if p ? 'recurring_id' and (p_kind<>'expense' or not p ? 'occurrence' or p->>'occurrence' !~ '^\d{4}-(0[1-9]|1[0-2])$' or left(p->>'date',7)<>p->>'occurrence') then raise exception 'INVALID_OCCURRENCE'; end if;
 if p ? 'occurrence' and not p ? 'recurring_id' then raise exception 'INVALID_OCCURRENCE'; end if;
 if coalesce(p->>'account_id','')<>'' then
  account:=(p->>'account_id')::uuid;
  if not exists(select 1 from public.ledger_couple_entities where id=account and space_id=p_space and kind='account' and not deleted) then raise exception 'INVALID_ACCOUNT'; end if;
 end if;
 if p_kind in ('income','contribution') and account is null then raise exception 'ACCOUNT_REQUIRED'; end if;
end $$;

create function public.ledger_couple_apply(p_space uuid,p_id uuid,p_kind text,p_payload jsonb,p_revision integer,p_delete boolean,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.ledger_couple_spaces; e public.ledger_couple_entities; req jsonb; old ledger_private.operations; result jsonb; begin
 if p_space is null or p_id is null or p_operation is null or p_revision is null or p_revision<0 or p_delete is null or p_kind is null then raise exception 'MISSING_ARGUMENT'; end if;
 select * into s from public.ledger_couple_spaces where id=p_space for update;
 if not ledger_private.member(p_space) or s.status<>'active' then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 req:=jsonb_build_object('space',p_space,'id',p_id,'kind',p_kind,'payload',p_payload,'revision',p_revision,'delete',p_delete);
 select * into old from ledger_private.operations where id=p_operation;
 if found then
  if old.actor<>auth.uid() or old.request<>req then raise exception 'OPERATION_REUSED'; end if; return old.result;
 end if;
 if (select count(*) from ledger_private.operations where actor=auth.uid() and created_at>now()-interval '1 minute')>=120 then raise exception 'RATE_LIMIT'; end if;
 select * into e from public.ledger_couple_entities where id=p_id for update;
 if found then
  if e.space_id<>p_space then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
  if e.revision<>p_revision or e.deleted or e.kind<>p_kind then raise exception 'EDIT_CONFLICT' using errcode='40001'; end if;
 else
  if p_revision<>0 or p_delete then raise exception 'EDIT_CONFLICT' using errcode='40001'; end if;
  if (select count(*) from public.ledger_couple_entities where space_id=p_space)>=10000 then raise exception 'SPACE_LIMIT'; end if;
 end if;
 if p_delete then
  if e.kind='account' and exists(select 1 from public.ledger_couple_entities where space_id=p_space and not deleted and payload->>'account_id'=p_id::text) then raise exception 'ACCOUNT_IN_USE'; end if;
 else
  perform ledger_private.validate_payload(p_space,p_kind,p_payload);
  if p_kind='expense' and coalesce(p_payload->>'recurring_id','')<>'' then
   if not exists(select 1 from public.ledger_couple_entities where id=(p_payload->>'recurring_id')::uuid and space_id=p_space and kind='recurring' and not deleted) then raise exception 'INVALID_RECURRENCE'; end if;
   if exists(select 1 from public.ledger_couple_entities where id<>p_id and space_id=p_space and kind='expense' and not deleted and payload->>'recurring_id'=p_payload->>'recurring_id' and payload->>'occurrence'=p_payload->>'occurrence') then raise exception 'DUPLICATE_OCCURRENCE'; end if;
  end if;
 end if;
 if e.id is null then
  insert into public.ledger_couple_entities(id,space_id,kind,payload,created_by,updated_by) values(p_id,p_space,p_kind,p_payload,auth.uid(),auth.uid()) returning to_jsonb(ledger_couple_entities.*) into result;
 else
  update public.ledger_couple_entities set payload=case when p_delete then payload else p_payload end,deleted=p_delete,revision=revision+1,updated_at=now(),updated_by=auth.uid() where id=p_id returning to_jsonb(ledger_couple_entities.*) into result;
 end if;
 insert into public.ledger_couple_activity(space_id,actor,action,entity_id,revision) values(p_space,auth.uid(),case when p_delete then 'deleted' when p_revision=0 then 'created' else 'updated' end,p_id,(result->>'revision')::int);
 insert into ledger_private.operations(id,actor,space_id,request,result) values(p_operation,auth.uid(),p_space,req,result);
 return result;
end $$;
create function public.ledger_couple_leave(p_space uuid) returns void
language plpgsql security definer set search_path='' as $$ begin
 perform 1 from public.ledger_couple_spaces where id=p_space for update;
 if not ledger_private.member(p_space) then raise exception 'ACCESS_DENIED' using errcode='42501'; end if;
 update public.ledger_couple_members set active=false,left_at=now() where space_id=p_space and user_id=auth.uid();
 update public.ledger_couple_spaces set status='closed' where id=p_space;
 update public.ledger_couple_invites set revoked=true where space_id=p_space;
 insert into public.ledger_couple_activity(space_id,actor,action) values(p_space,auth.uid(),'left');
end $$;
revoke all on all functions in schema ledger_private from public;
revoke all on function public.ledger_couple_create(text,text,text),public.ledger_couple_invite(uuid),public.ledger_couple_join(text,text),public.ledger_couple_apply(uuid,uuid,text,jsonb,integer,boolean,uuid),public.ledger_couple_leave(uuid) from public,anon;
grant execute on function public.ledger_couple_create(text,text,text),public.ledger_couple_invite(uuid),public.ledger_couple_join(text,text),public.ledger_couple_apply(uuid,uuid,text,jsonb,integer,boolean,uuid),public.ledger_couple_leave(uuid) to authenticated;
-- Realtime subscribers must still pass SELECT RLS. Do not include personal tables.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.ledger_couple_spaces,public.ledger_couple_members,public.ledger_couple_entities;
 end if;
end $$;
commit;
