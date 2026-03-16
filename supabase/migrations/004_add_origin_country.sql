-- Add origin_country to profiles
alter table profiles add column if not exists origin_country text default null;
