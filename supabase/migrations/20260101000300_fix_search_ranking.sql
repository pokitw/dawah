-- =========================================================================
-- BUG FIX for search_research.
--
-- The first version used plainto_tsquery, which joins every word with AND.
-- A natural question like "If God is good why is there so much evil and
-- suffering?" therefore required ONE row to contain ALL of those words, and
-- matched nothing at all. The Q&A got empty context and always answered
-- "I'm not fully sure".
--
-- Two changes:
--   1. Turn the AND query into an OR query, so a row matching ANY of the
--      words is found. ts_rank still puts the best one first.
--   2. When the caller asks for an id like ARG-2, put the row that IS ARG-2
--      above rows that merely reference it (they carry it as a tag too).
-- =========================================================================

create or replace function public.search_research(
  p_query  text,
  p_tags   text[] default '{}',
  p_kinds  content_kind[] default null,
  p_limit  integer default 8
)
returns setof research_content
language sql stable security definer set search_path = public
as $$
  with q as (
    select
      nullif(
        replace(plainto_tsquery('english', coalesce(p_query, ''))::text, '&', '|'),
        ''
      )::tsquery as tsq,
      lower(btrim(coalesce(p_query, ''))) as raw
  )
  select rc.*
  from research_content rc, q
  where (p_kinds is null or rc.kind = any (p_kinds))
    and (
      -- an exact id the caller asked for, e.g. ARG-2
      (cardinality(p_tags) > 0 and rc.tags && p_tags)
      -- or any word of the question
      or (q.tsq is not null
          and to_tsvector('english', rc.title || ' ' || rc.body_md) @@ q.tsq)
      -- or the question names the row directly
      or (q.raw <> '' and lower(rc.title) like '%' || q.raw || '%')
      or (q.raw <> '' and q.raw like '%' || lower(rc.slug) || '%')
    )
  order by
    -- 1. the row that IS the requested id
    (cardinality(p_tags) > 0 and upper(coalesce(rc.meta ->> 'code', '')) = any (
       select upper(t) from unnest(p_tags) as t)) desc,
    -- 2. a row that references it
    (cardinality(p_tags) > 0 and rc.tags && p_tags) desc,
    -- 3. plain relevance
    ts_rank(to_tsvector('english', rc.title || ' ' || rc.body_md), q.tsq) desc,
    rc.slug
  limit greatest(1, least(coalesce(p_limit, 8), 30));
$$;

revoke execute on function public.search_research(text, text[], content_kind[], integer)
  from public, anon;
grant execute on function public.search_research(text, text[], content_kind[], integer)
  to authenticated, service_role;
