create index couple_activity_space_time on public.ledger_couple_activity(space_id,occurred_at);
create index couple_activity_actor on public.ledger_couple_activity(actor);
create index couple_entities_created_by on public.ledger_couple_entities(created_by);
create index couple_entities_updated_by on public.ledger_couple_entities(updated_by);
create index couple_invites_space on public.ledger_couple_invites(space_id);
create index couple_invites_author_time on public.ledger_couple_invites(created_by,created_at);
create index couple_invites_consumed_by on public.ledger_couple_invites(consumed_by);
create index couple_spaces_author_time on public.ledger_couple_spaces(created_by,created_at);
