-- Policies call the guarded member function; schema usage gives no table access.
grant usage on schema ledger_private to authenticated;
revoke all on ledger_private.identities,ledger_private.identity_limits from public,anon,authenticated;
