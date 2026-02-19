
-- Tables for Customer-to-Agent Inquiries (Simple Conversation-Focused Schema)

-- 1. Inquiry Thread (The "Conversation")
CREATE TABLE IF NOT EXISTS customer_inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL, -- References auth.users(id)
    product_id UUID REFERENCES listed_products(id) ON DELETE SET NULL, -- Context: Which trip?
    trip_id UUID REFERENCES plans(id) ON DELETE SET NULL, -- Context: Which AI Plan?
    agent_id UUID NOT NULL, -- The Agent/Business being contacted
    
    customer_name TEXT, -- Essential for Agent to identify the chatter
    customer_avatar TEXT, -- For list view
    
    last_message TEXT, -- Preview of the last message sent
    status TEXT DEFAULT 'open', -- 'open', 'closed', etc.
    
    unread_agent BOOLEAN DEFAULT true,
    unread_customer BOOLEAN DEFAULT false,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for fast retrieval
CREATE INDEX IF NOT EXISTS idx_inquiries_customer ON customer_inquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_agent ON customer_inquiries(agent_id);

-- 2. Inquiry Messages (The "Free-Text Conversations")
CREATE TABLE IF NOT EXISTS inquiry_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inquiry_id UUID REFERENCES customer_inquiries(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_role TEXT NOT NULL, -- 'customer' or 'agent'
    message_text TEXT NOT NULL, -- The actual text of the conversation
    
    media_url TEXT,
    media_type TEXT, -- 'image', 'video', 'pdf'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_messages ENABLE ROW LEVEL SECURITY;

-- Policies: Only involved parties can see the messages
CREATE POLICY "Users can manage own inquiries"
ON customer_inquiries FOR ALL TO authenticated
USING (auth.uid() = customer_id OR auth.uid() = agent_id);

CREATE POLICY "Users can access messages for their inquiries"
ON inquiry_messages FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM customer_inquiries
        WHERE customer_inquiries.id = inquiry_messages.inquiry_id
        AND (customer_inquiries.customer_id = auth.uid() OR customer_inquiries.agent_id = auth.uid())
    )
);

-- Update Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_customer_inquiries_updated_at ON customer_inquiries;
CREATE TRIGGER update_customer_inquiries_updated_at
    BEFORE UPDATE ON customer_inquiries
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
