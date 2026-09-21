-- =========================================================================
-- Lock down function permissions.
--
-- Postgres gives EXECUTE on every new function to PUBLIC by default. That
-- let the anonymous (not-signed-in) role call helpers meant for signed-in
-- users, and let anyone call the auth trigger function directly. This takes
-- that default away and grants only what each caller really needs.
-- =========================================================================

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.record_activity(integer) from public, anon;
revoke execute on function public.record_weakness(text, real) from public, anon;
revoke execute on function public.set_user_level(integer) from public, anon;
revoke execute on function public.search_research(text, text[], content_kind[], integer)
  from public, anon;

-- Signed-in users keep exactly the four they need. Each one checks
-- `auth.uid()` itself, so a user can only ever change their own rows.
grant execute on function public.record_activity(integer)    to authenticated;
grant execute on function public.record_weakness(text, real) to authenticated;
grant execute on function public.set_user_level(integer)     to authenticated;
grant execute on function public.search_research(text, text[], content_kind[], integer)
  to authenticated, service_role;

-- New functions added later should not be world-executable either.
alter default privileges in schema public revoke execute on functions from public;
