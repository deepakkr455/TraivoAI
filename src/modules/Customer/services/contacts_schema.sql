-- Run this script in your Supabase SQL Editor to create the contacts table

-- 1. Create the table
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text default 'new' -- 'new', 'read', 'replied'
);

-- 2. Enable Row Level Security (RLS)
alter table public.contacts enable row level security;

-- 3. Create a policy to allow anyone (public) to insert messages
create policy "Allow public inserts"
on public.contacts for insert
to public
with check (true);

-- 4. Create a policy to allow only authenticated users (admins) to view/update? 
-- For now, we might want to restrict viewing to service_role or specific users.
-- This policy allows full access to service_role (used by backend/edge functions)
create policy "Enable full access for service role"
on public.contacts
to service_role
using (true)
with check (true);
