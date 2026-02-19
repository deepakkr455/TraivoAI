-- Add media columns to inquiry_messages table
ALTER TABLE inquiry_messages
ADD COLUMN media_url text,
ADD COLUMN media_type text; -- 'image', 'video', 'pdf', etc.

-- Optional: Add size or name if needed, but url and type are minimum for now.
