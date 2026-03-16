-- ReelAtlas Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables

-- Profiles table: stores user onboarding state
create table if not exists profiles (
  user_id text primary key,
  onboarding_complete boolean default false,
  origin_country text default null,
  created_at timestamptz default now()
);

-- Brand images table: stores generated brand image data
create table if not exists brand_images (
  id uuid default gen_random_uuid() primary key,
  user_id text references profiles(user_id) on delete cascade,
  brand_url text not null,
  brand_name text,
  brand_voice text,
  target_audience text,
  content_style text,
  full_brand_image jsonb,
  created_at timestamptz default now()
);

-- Index for fast lookups by user
create index if not exists idx_brand_images_user_id on brand_images(user_id);

-- RLS policies (optional — the app uses service role key which bypasses RLS,
-- but these are good practice if you ever switch to anon key access)

alter table profiles enable row level security;
alter table brand_images enable row level security;

-- Allow users to read their own profile
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid()::text = user_id);

-- Allow users to read their own brand images
create policy "Users can read own brand images"
  on brand_images for select
  using (auth.uid()::text = user_id);
