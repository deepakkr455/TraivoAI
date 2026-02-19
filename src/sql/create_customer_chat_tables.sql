-- Create Customer Chat Sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL, -- References auth.users(id) conceptually, or public.users
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for sessions
CREATE INDEX IF NOT EXISTS idx_customer_chat_sessions_user_id ON customer_chat_sessions(user_id);

-- Create Customer Chat Messages table
CREATE TABLE IF NOT EXISTS customer_chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES customer_chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- The user who owns this chat
    sender TEXT NOT NULL, -- 'user' or 'model' (or 'ai')
    content JSONB NOT NULL, -- Flexible content structure { text: "...", plan: {...} }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for messages
CREATE INDEX IF NOT EXISTS idx_customer_chat_messages_session_id ON customer_chat_messages(session_id);

-- Enable RLS (Row Level Security)
ALTER TABLE customer_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust based on your auth setup, assuming public.users or auth.uid())

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON customer_chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON customer_chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON customer_chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON customer_chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Users can view messages of their own sessions
CREATE POLICY "Users can view own messages" ON customer_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customer_chat_sessions
            WHERE customer_chat_sessions.id = customer_chat_messages.session_id
            AND customer_chat_sessions.user_id = auth.uid()
        )
    );

-- Policy: Users can insert messages to their own sessions
CREATE POLICY "Users can insert own messages" ON customer_chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customer_chat_sessions
            WHERE customer_chat_sessions.id = customer_chat_messages.session_id
            AND customer_chat_sessions.user_id = auth.uid()
        )
    );
