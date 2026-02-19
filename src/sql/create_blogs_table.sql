-- Create a table for Blogs
create table if not exists blogs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  trip_id uuid references plans(id) on delete set null,
  title text not null,
  content text not null, -- Markdown content
  hero_image_url text,
  status text default 'published' check (status in ('published', 'draft', 'archived')),
  tags text[],
  linked_products jsonb default '[]'::jsonb, -- Array of product IDs that are mentioned/linked
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table blogs enable row level security;

-- Allow anyone to read published blogs
create policy "Public blogs are viewable by everyone"
  on blogs for select
  using ( status = 'published' );

-- Allow users to CRUD their own blogs
create policy "Users can manage their own blogs"
  on blogs for all
  using ( auth.uid() = user_id );

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_blogs_updated_at
before update on blogs
for each row
execute procedure update_updated_at_column();
