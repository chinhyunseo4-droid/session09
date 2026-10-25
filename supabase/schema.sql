-- Session 09 에이전트 실습용 스키마
-- 새 Supabase 프로젝트의 SQL Editor에서 먼저 실행하세요. 기존 테이블은 변경하지 않습니다.
begin;

create table if not exists public.ideas (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  tags text[] not null default '{}'
);

create table if not exists public.market_signals (
  id text primary key,
  category text not null,
  title text not null,
  insight text not null,
  source_label text not null,
  sample_as_of date not null
);

create table if not exists public.agent_reports (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  title text not null,
  summary text not null,
  findings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ideas enable row level security;
alter table public.market_signals enable row level security;
alter table public.agent_reports enable row level security;

revoke all on public.ideas, public.market_signals, public.agent_reports from public, anon, authenticated;
grant usage on schema public to anon;
grant select on public.ideas, public.market_signals to anon;
grant insert (prompt, title, summary, findings) on public.agent_reports to anon;

drop policy if exists "Workshop can read ideas" on public.ideas;
create policy "Workshop can read ideas" on public.ideas for select to anon using (true);
drop policy if exists "Workshop can read market signals" on public.market_signals;
create policy "Workshop can read market signals" on public.market_signals for select to anon using (true);
drop policy if exists "Workshop can save reports" on public.agent_reports;
create policy "Workshop can save reports" on public.agent_reports for insert to anon with check (true);

commit;
