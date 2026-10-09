-- Business conflicts must return HTTP 409, not trigger PostgREST serialization retries.
create or replace function public.ledger_couple_apply(p_space uuid,p_id uuid,p_kind text,p_payload jsonb,p_revision integer,p_delete boolean,p_operation uuid) returns jsonb
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
  if e.revision<>p_revision or e.deleted or e.kind<>p_kind then raise exception 'EDIT_CONFLICT' using errcode='PT409'; end if;
 else
  if p_revision<>0 or p_delete then raise exception 'EDIT_CONFLICT' using errcode='PT409'; end if;
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
