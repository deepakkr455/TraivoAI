-- Create a bucket for chat attachments if it doesn't exist
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

-- Allow public access to view files (so customers can see them)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'chat-attachments' );

-- Allow authenticated users (agents and customers) to upload files
create policy "Authenticated Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'chat-attachments' and auth.role() = 'authenticated' );

-- Allow users to update their own files (optional, but good for cleanup if needed)
create policy "Users can update own files"
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'chat-attachments' );
