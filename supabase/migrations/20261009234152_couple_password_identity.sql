-- Server-only credentials and abuse counters. No personal finance data.
create schema if not exists ledger_private;
revoke all on schema ledger_private from public, anon, authenticated;
create table ledger_private.identities (
 username text primary key check (username ~ '^[a-z0-9_]{4,32}$'),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 recovery_hash text not null,
 created_at timestamptz not null default now()
);
alter table ledger_private.identities enable row level security;
create table ledger_private.identity_limits (
 bucket text primary key, hits int not null, expires_at timestamptz not null
);
alter table ledger_private.identity_limits enable row level security;
create or replace function public.ledger_identity_limit(p_bucket text, p_max int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
 delete from ledger_private.identity_limits where expires_at < now();
 insert into ledger_private.identity_limits values(p_bucket,1,now()+interval '1 hour')
 on conflict(bucket) do update set hits=ledger_private.identity_limits.hits+1 returning hits into n;
 return n<=p_max;
end $$;
create or replace function public.ledger_identity_register(p_username text,p_user uuid,p_hash text)
returns void language sql security definer set search_path = '' as $$
 insert into ledger_private.identities(username,user_id,recovery_hash) values(p_username,p_user,p_hash);
$$;
create or replace function public.ledger_identity_recover(p_username text,p_hash text,p_new_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare u uuid;
begin
 if p_hash=p_new_hash then raise exception 'El código debe rotarse'; end if;
 update ledger_private.identities set recovery_hash=p_new_hash
 where username=p_username and recovery_hash=p_hash returning user_id into u;
 if u is null then raise exception 'Credenciales de recuperación inválidas'; end if;
 -- Existing JWTs must stop satisfying Ledger live-session guards immediately.
 delete from auth.sessions where user_id=u;
 return u;
end $$;
revoke all on function public.ledger_identity_limit(text,int) from public,anon,authenticated;
revoke all on function public.ledger_identity_register(text,uuid,text) from public,anon,authenticated;
revoke all on function public.ledger_identity_recover(text,text,text) from public,anon,authenticated;
grant execute on function public.ledger_identity_limit(text,int) to service_role;
grant execute on function public.ledger_identity_register(text,uuid,text) to service_role;
grant execute on function public.ledger_identity_recover(text,text,text) to service_role;

create or replace function public.ledger_identity_finish_recovery(p_username text,p_hash text)
returns void language sql security definer set search_path = '' as $$
 delete from auth.sessions where user_id=(select user_id from ledger_private.identities where username=p_username and recovery_hash=p_hash);
$$;
revoke all on function public.ledger_identity_finish_recovery(text,text) from public,anon,authenticated;
grant execute on function public.ledger_identity_finish_recovery(text,text) to service_role;
