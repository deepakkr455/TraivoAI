-- Add media columns to inquiry_messages if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiry_messages' AND column_name = 'media_url') THEN
        ALTER TABLE inquiry_messages ADD COLUMN media_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiry_messages' AND column_name = 'media_type') THEN
        ALTER TABLE inquiry_messages ADD COLUMN media_type TEXT;
    END IF;
END $$;

-- Verify and ensure constraints match user requirements (idempotent checks)
-- This section ensures the foreign keys exist as expected
DO $$
BEGIN
    -- Check inquiry_id FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'inquiry_messages' AND constraint_name = 'inquiry_messages_inquiry_id_fkey'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'inquiry_messages' AND constraint_name = 'inquiry_messages_inquiry_id_fkey1'
    ) THEN
        ALTER TABLE inquiry_messages 
        ADD CONSTRAINT inquiry_messages_inquiry_id_fkey1 
        FOREIGN KEY (inquiry_id) REFERENCES customer_inquiries(id) ON DELETE CASCADE;
    END IF;
END $$;
