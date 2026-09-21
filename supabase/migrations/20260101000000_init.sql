-- =========================================================================
-- Dawah Trainer - initial schema
--
-- Rules used here:
--   * Every table that holds a person's own work has Row Level Security
--     (RLS) so a user can only read and write their OWN rows.
--   * research_content and flashcards are shared study material, so every
--     signed-in user may READ them, but nobody may write them from the
--     browser. Only the seed script (service_role key) writes them.
-- =========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums --
create type content_kind as enum
  ('argument', 'objection', 'source', 'qa', 'persona', 'glossary');

create type difficulty_level as enum ('easy', 'medium', 'hard', 'expert');

create type debate_side as enum ('muslim', 'atheist');

create type message_role as enum ('user', 'ai', 'coach');

create type review_result as enum ('right', 'wrong');

-- -------------------------------------------------------------- profiles --
create table profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text,
  xp               integer not null default 0 check (xp >= 0),
  streak_count     integer not null default 0 check (streak_count >= 0),
  last_active_date date,
  level            integer not null default 1 check (level between 1 and 4),
  created_at       timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "read own profile" on profiles
  for select using (auth.uid() = id);
create policy "insert own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Give every new user a profile row automatically.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Friend'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------- research_content --
create table research_content (
  id         uuid primary key default gen_random_uuid(),
  kind       content_kind not null,
  slug       text not null unique,
  title      text not null,
  tags       text[] not null default '{}',
  body_md    text not null,
  difficulty difficulty_level not null default 'medium',
  -- Machine-readable extras: persona data, premises, urls, linked ids.
  meta       jsonb,
  updated_at timestamptz not null default now()
);

create index research_content_kind_idx on research_content (kind);
create index research_content_tags_idx on research_content using gin (tags);
-- Full-text index so the Q&A retriever can find rows fast.
create index research_content_fts_idx on research_content
  using gin (to_tsvector('english', title || ' ' || body_md));

alter table research_content enable row level security;

create policy "anyone signed in can read research" on research_content
  for select to authenticated using (true);

-- ------------------------------------------------------------- flashcards --
create table flashcards (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null unique,
  front text not null,
  back  text not null,
  tags  text[] not null default '{}'
);

create index flashcards_tags_idx on flashcards using gin (tags);

alter table flashcards enable row level security;

create policy "anyone signed in can read flashcards" on flashcards
  for select to authenticated using (true);

-- ---------------------------------------------------------------- debates --
create table debates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  persona_id      text not null,               -- slug, e.g. 'p2-rick'
  difficulty      difficulty_level not null default 'medium',
  topic           text,                        -- 'ARG-2', 'OBJ-1', or null
  user_plays_side debate_side not null default 'muslim',
  created_at      timestamptz not null default now(),
  ended_at        timestamptz
);

create index debates_user_idx on debates (user_id, created_at desc);

alter table debates enable row level security;

create policy "own debates select" on debates
  for select using (auth.uid() = user_id);
create policy "own debates insert" on debates
  for insert with check (auth.uid() = user_id);
create policy "own debates update" on debates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own debates delete" on debates
  for delete using (auth.uid() = user_id);

-- -------------------------------------------------------- debate_messages --
create table debate_messages (
  id         uuid primary key default gen_random_uuid(),
  debate_id  uuid not null references debates (id) on delete cascade,
  role       message_role not null,
  content    text not null,
  created_at timestamptz not null default now()
);

create index debate_messages_debate_idx on debate_messages (debate_id, created_at);

alter table debate_messages enable row level security;

create policy "own debate messages select" on debate_messages
  for select using (
    exists (select 1 from debates d
            where d.id = debate_messages.debate_id and d.user_id = auth.uid())
  );
create policy "own debate messages insert" on debate_messages
  for insert with check (
    exists (select 1 from debates d
            where d.id = debate_messages.debate_id and d.user_id = auth.uid())
  );
create policy "own debate messages delete" on debate_messages
  for delete using (
    exists (select 1 from debates d
            where d.id = debate_messages.debate_id and d.user_id = auth.uid())
  );

-- ------------------------------------------------------------- scorecards --
create table scorecards (
  id                uuid primary key default gen_random_uuid(),
  debate_id         uuid not null unique references debates (id) on delete cascade,
  logic             smallint not null check (logic between 0 and 5),
  sources           smallint not null check (sources between 0 and 5),
  understanding     smallint not null check (understanding between 0 and 5),
  clarity           smallint not null check (clarity between 0 and 5),
  adab              smallint not null check (adab between 0 and 5),
  overclaim         smallint not null check (overclaim between 0 and 5),
  total             smallint not null check (total between 0 and 30),
  strengths_md      text not null default '',
  weaknesses_md     text not null default '',
  better_answer_md  text not null default '',
  sources_to_review text[] not null default '{}',
  created_at        timestamptz not null default now()
);

alter table scorecards enable row level security;

create policy "own scorecards select" on scorecards
  for select using (
    exists (select 1 from debates d
            where d.id = scorecards.debate_id and d.user_id = auth.uid())
  );
create policy "own scorecards insert" on scorecards
  for insert with check (
    exists (select 1 from debates d
            where d.id = scorecards.debate_id and d.user_id = auth.uid())
  );

-- ------------------------------------------------------------ qa_sessions --
create table qa_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  question   text not null,
  answer_md  text not null,
  -- [{ id, label, url }] - every entry must come from research_content.
  citations  jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index qa_sessions_user_idx on qa_sessions (user_id, created_at desc);

alter table qa_sessions enable row level security;

create policy "own qa select" on qa_sessions
  for select using (auth.uid() = user_id);
create policy "own qa insert" on qa_sessions
  for insert with check (auth.uid() = user_id);
create policy "own qa delete" on qa_sessions
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------ flashcard_reviews --
create table flashcard_reviews (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  flashcard_id     uuid not null references flashcards (id) on delete cascade,
  -- How many correct answers in a row. 0 = new or just got it wrong.
  streak           smallint not null default 0 check (streak >= 0),
  ease             real not null default 2.5 check (ease >= 1.3),
  next_review_date date not null default current_date,
  last_result      review_result,
  updated_at       timestamptz not null default now(),
  unique (user_id, flashcard_id)
);

create index flashcard_reviews_due_idx on flashcard_reviews (user_id, next_review_date);

alter table flashcard_reviews enable row level security;

create policy "own reviews select" on flashcard_reviews
  for select using (auth.uid() = user_id);
create policy "own reviews insert" on flashcard_reviews
  for insert with check (auth.uid() = user_id);
create policy "own reviews update" on flashcard_reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------- quiz_results --
create table quiz_results (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  module     text not null,               -- e.g. '1.2'
  score      smallint not null check (score >= 0),
  total      smallint not null check (total > 0),
  created_at timestamptz not null default now()
);

create index quiz_results_user_idx on quiz_results (user_id, created_at desc);

alter table quiz_results enable row level security;

create policy "own quiz select" on quiz_results
  for select using (auth.uid() = user_id);
create policy "own quiz insert" on quiz_results
  for insert with check (auth.uid() = user_id);

-- -------------------------------------------------------- weakness_stats --
create table weakness_stats (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  tag        text not null,               -- 'ARG-2', 'OBJ-1', 'adab', ...
  attempts   integer not null default 0 check (attempts >= 0),
  avg_score  real not null default 0 check (avg_score >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, tag)
);

create index weakness_stats_user_idx on weakness_stats (user_id, avg_score);

alter table weakness_stats enable row level security;

create policy "own weakness select" on weakness_stats
  for select using (auth.uid() = user_id);
create policy "own weakness insert" on weakness_stats
  for insert with check (auth.uid() = user_id);
create policy "own weakness update" on weakness_stats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------------ notes --
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null default '',
  body_md     text not null default '',
  linked_slug text,                        -- a research_content.slug
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index notes_user_idx on notes (user_id, created_at desc);

alter table notes enable row level security;

create policy "own notes select" on notes
  for select using (auth.uid() = user_id);
create policy "own notes insert" on notes
  for insert with check (auth.uid() = user_id);
create policy "own notes update" on notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notes delete" on notes
  for delete using (auth.uid() = user_id);
