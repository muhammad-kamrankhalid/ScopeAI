-- ScopeAI — Database Schema Migration
-- Run this in your Supabase SQL Editor

-- ─── Enable UUID extension ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade unique not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- ─── Projects ─────────────────────────────────────────────────────────────────
create table if not exists projects (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  client_name  text,
  brief        text not null,
  status       text default 'draft' check (status in ('draft','analyzing','awaiting_input','completed','error')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── Project Documents ────────────────────────────────────────────────────────
create table if not exists project_documents (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid references projects(id) on delete cascade not null,
  file_name     text not null,
  storage_path  text not null,
  uploaded_at   timestamptz default now()
);

-- ─── Requirements ─────────────────────────────────────────────────────────────
create table if not exists requirements (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid references projects(id) on delete cascade not null,
  title        text not null,
  description  text,
  type         text check (type in ('functional','non_functional')) not null,
  priority     text check (priority in ('high','medium','low')) default 'medium',
  status       text check (status in ('pending','approved','rejected')) default 'pending',
  source       text default 'ai',
  created_at   timestamptz default now()
);

-- ─── Clarification Questions ──────────────────────────────────────────────────
create table if not exists clarification_questions (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid references projects(id) on delete cascade not null,
  run_id        uuid not null,
  question_key  text not null,
  question      text not null,
  field_type    text check (field_type in ('text','checkbox','select')) default 'text',
  options       jsonb,
  created_at    timestamptz default now()
);

-- ─── Clarification Answers ────────────────────────────────────────────────────
create table if not exists clarification_answers (
  id           uuid primary key default uuid_generate_v4(),
  question_id  uuid references clarification_questions(id) on delete cascade not null,
  answer       text not null,
  answered_at  timestamptz default now()
);

-- ─── Architectures ────────────────────────────────────────────────────────────
create table if not exists architectures (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid references projects(id) on delete cascade not null,
  diagram_json  jsonb not null,
  description   text,
  status        text check (status in ('pending','approved','rejected')) default 'pending',
  created_at    timestamptz default now()
);

-- ─── Risks ───────────────────────────────────────────────────────────────────
create table if not exists risks (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid references projects(id) on delete cascade not null,
  title       text not null,
  description text,
  severity    text check (severity in ('high','medium','low')) not null,
  mitigation  text,
  status      text check (status in ('pending','approved','rejected')) default 'pending',
  created_at  timestamptz default now()
);

-- ─── Milestones ───────────────────────────────────────────────────────────────
create table if not exists milestones (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid references projects(id) on delete cascade not null,
  phase        integer not null,
  title        text not null,
  description  text,
  tasks_json   jsonb default '[]',
  status       text check (status in ('todo','in_progress','done')) default 'todo',
  created_at   timestamptz default now()
);

-- ─── Agent Runs ───────────────────────────────────────────────────────────────
create table if not exists agent_runs (
  id               uuid primary key,
  project_id       uuid references projects(id) on delete cascade not null,
  status           text check (status in ('running','awaiting_input','completed','error')) default 'running',
  graph_state_json jsonb,
  started_at       timestamptz default now(),
  completed_at     timestamptz
);

-- ─── Agent Events ─────────────────────────────────────────────────────────────
create table if not exists agent_events (
  id          uuid primary key default uuid_generate_v4(),
  run_id      uuid references agent_runs(id) on delete cascade not null,
  event_type  text not null,
  message     text not null,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_documents enable row level security;
alter table requirements enable row level security;
alter table clarification_questions enable row level security;
alter table clarification_answers enable row level security;
alter table architectures enable row level security;
alter table risks enable row level security;
alter table milestones enable row level security;
alter table agent_runs enable row level security;
alter table agent_events enable row level security;

-- Profiles: users manage their own
create policy "Users manage own profile"
  on profiles for all using (auth.uid() = user_id);

-- Projects: users manage their own
create policy "Users manage own projects"
  on projects for all using (auth.uid() = user_id);

-- All child tables: inherit access via project ownership
create policy "Project members access documents"
  on project_documents for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create policy "Project members access requirements"
  on requirements for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create policy "Project members access questions"
  on clarification_questions for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create policy "Project members access answers"
  on clarification_answers for all
  using (question_id in (
    select id from clarification_questions
    where project_id in (select id from projects where user_id = auth.uid())
  ));

create policy "Project members access architectures"
  on architectures for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create policy "Project members access risks"
  on risks for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create policy "Project members access milestones"
  on milestones for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create policy "Project members access agent runs"
  on agent_runs for all
  using (project_id in (select id from projects where user_id = auth.uid()));

create policy "Project members access agent events"
  on agent_events for all
  using (run_id in (
    select id from agent_runs
    where project_id in (select id from projects where user_id = auth.uid())
  ));

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
