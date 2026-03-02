-- Create a bucket for agent media (logos, documents, etc.)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Use unique names for policies to avoid conflicts with other migrations
-- Allow public access to view media
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Media Public Access') THEN
        CREATE POLICY "Media Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
    END IF;
END $$;

-- Allow authenticated agents to upload to their own folder
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agents can upload own media') THEN
        CREATE POLICY "Agents can upload own media" ON storage.objects FOR INSERT WITH CHECK ( 
            bucket_id = 'media' 
            and auth.role() = 'authenticated'
            and (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- Allow agents to update/delete their own media
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agents can manage own media') THEN
        CREATE POLICY "Agents can manage own media" ON storage.objects FOR UPDATE USING ( 
            bucket_id = 'media' 
            and auth.uid() = owner
        );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agents can delete own media') THEN
        CREATE POLICY "Agents can delete own media" ON storage.objects FOR DELETE USING ( 
            bucket_id = 'media' 
            and auth.uid() = owner
        );
    END IF;
END $$;
