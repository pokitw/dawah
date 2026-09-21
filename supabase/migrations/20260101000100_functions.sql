-- =========================================================================
-- Helper functions the app calls.
--
-- These run as `security definer` so the maths (XP, streaks, averages)
-- happens in one place on the server and cannot be faked from the browser.
-- Each one still checks `auth.uid()`, so a user can only change their own row.
-- =========================================================================

-- ---------------------------------------------------- search_research ----
-- Simple keyword + tag search used by the Q&A retriever.
-- Ranked by: exact tag match first, then full-text rank, then title match.
create or replace function public.search_research(
  p_query  text,
  p_tags   text[] default '{}',
  p_kinds  content_kind[] default null,
  p_limit  integer default 8
)
returns setof research_content
language sql
stable
security definer
set search_path = public
as $$
  with q as (
    select
      plainto_tsquery('english', coalesce(p_query, '')) as tsq,
      lower(coalesce(p_query, ''))                      as raw
  )
  select rc.*
  from research_content rc, q
  where (p_kinds is null or rc.kind = any (p_kinds))
    and (
      -- match on tags the caller asked for
      (cardinality(p_tags) > 0 and rc.tags && p_tags)
      -- or on the words of the question
      or (q.tsq is not null
          and to_tsvector('english', rc.title || ' ' || rc.body_md) @@ q.tsq)
      -- or a plain substring of the title / slug (helps with ids like "ARG-2")
      or (q.raw <> '' and lower(rc.title) like '%' || q.raw || '%')
      or (q.raw <> '' and q.raw like '%' || lower(rc.slug) || '%')
    )
  order by
    (cardinality(p_tags) > 0 and rc.tags && p_tags) desc,
    ts_rank(to_tsvector('english', rc.title || ' ' || rc.body_md), q.tsq) desc,
    rc.slug
  limit greatest(1, least(coalesce(p_limit, 8), 30));
$$;

grant execute on function public.search_research(text, text[], content_kind[], integer)
  to authenticated, service_role;

-- ------------------------------------------------------ record_activity --
-- Adds XP and keeps the daily streak honest:
--   * same day again  -> streak unchanged
--   * yesterday       -> streak + 1
--   * older or never  -> streak resets to 1
create or replace function public.record_activity(p_xp integer default 0)
returns profiles
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me      uuid := auth.uid();
  today   date := current_date;
  row_out profiles;
begin
  if me is null then
    raise exception 'not signed in';
  end if;

  insert into profiles (id) values (me) on conflict (id) do nothing;

  update profiles p
  set
    xp = p.xp + greatest(0, coalesce(p_xp, 0)),
    streak_count = case
      when p.last_active_date = today              then p.streak_count
      when p.last_active_date = today - 1          then p.streak_count + 1
      else 1
    end,
    last_active_date = today
  where p.id = me
  returning * into row_out;

  return row_out;
end;
$$;

grant execute on function public.record_activity(integer) to authenticated;

-- ------------------------------------------------------ record_weakness --
-- Keeps a running average score for one tag (0-5 scale), so the
-- Weakness Tracker can say "study this next".
create or replace function public.record_weakness(p_tag text, p_score real)
returns weakness_stats
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me      uuid := auth.uid();
  row_out weakness_stats;
begin
  if me is null then
    raise exception 'not signed in';
  end if;
  if p_tag is null or btrim(p_tag) = '' then
    raise exception 'tag is required';
  end if;

  insert into weakness_stats (user_id, tag, attempts, avg_score)
  values (me, btrim(p_tag), 1, greatest(0, p_score))
  on conflict (user_id, tag) do update
    set attempts   = weakness_stats.attempts + 1,
        -- new average = (old average * old count + new score) / new count
        avg_score  = ((weakness_stats.avg_score * weakness_stats.attempts)
                      + greatest(0, excluded.avg_score))
                     / (weakness_stats.attempts + 1),
        updated_at = now()
  returning * into row_out;

  return row_out;
end;
$$;

grant execute on function public.record_weakness(text, real) to authenticated;

-- ------------------------------------------------------- set_user_level --
-- The level a user is allowed to see is their own choice, but we cap it so
-- the value always stays inside the four levels from the learning path.
create or replace function public.set_user_level(p_level integer)
returns profiles
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me      uuid := auth.uid();
  row_out profiles;
begin
  if me is null then
    raise exception 'not signed in';
  end if;

  update profiles
  set level = least(4, greatest(1, coalesce(p_level, 1)))
  where id = me
  returning * into row_out;

  return row_out;
end;
$$;

grant execute on function public.set_user_level(integer) to authenticated;
