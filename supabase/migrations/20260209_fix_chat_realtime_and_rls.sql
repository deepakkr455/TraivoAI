-- Enable Realtime for Chat Tables
BEGIN;

-- 1. Enable Publication for Realtime
-- Check if tables are already in publication, if not add them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'customer_inquiries') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE customer_inquiries;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inquiry_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE inquiry_messages;
    END IF;
END
$$;

-- 2. Drop Existing Policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "Users can manage own inquiries" ON customer_inquiries;
DROP POLICY IF EXISTS "Users can access messages for their inquiries" ON inquiry_messages;
DROP POLICY IF EXISTS "Agents can view their inquiries" ON customer_inquiries;
DROP POLICY IF EXISTS "Customers can view their inquiries" ON customer_inquiries;
DROP POLICY IF EXISTS "Participants can view messages" ON inquiry_messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON inquiry_messages;

-- 3. Consolidated RLS for customer_inquiries
-- Allow Users (Agents or Customers) to SEE & UPDATE their own inquiries
CREATE POLICY "Users can view and update own inquiries"
ON customer_inquiries
FOR ALL
TO authenticated
USING (
    auth.uid() = customer_id OR auth.uid() = agent_id
)
WITH CHECK (
    auth.uid() = customer_id OR auth.uid() = agent_id
);

-- 4. Consolidated RLS for inquiry_messages
-- Allow Users to SELECT messages if they are part of the inquiry
CREATE POLICY "Participants can view messages"
ON inquiry_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM customer_inquiries
        WHERE customer_inquiries.id = inquiry_messages.inquiry_id
        AND (customer_inquiries.customer_id = auth.uid() OR customer_inquiries.agent_id = auth.uid())
    )
);

-- Allow Users to INSERT messages if they are part of the inquiry
CREATE POLICY "Participants can insert messages"
ON inquiry_messages
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM customer_inquiries
        WHERE customer_inquiries.id = inquiry_messages.inquiry_id
        AND (customer_inquiries.customer_id = auth.uid() OR customer_inquiries.agent_id = auth.uid())
    )
);

COMMIT;
