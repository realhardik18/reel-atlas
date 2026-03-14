-- 001: Create scripts table for UGC script ideation
-- Run this in the Supabase SQL Editor

create table if not exists scripts (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists scripts_user_id_idx on scripts(user_id);

alter table scripts enable row level security;

create policy "Users can read own scripts"
  on scripts for select
  using (auth.uid()::text = user_id);
