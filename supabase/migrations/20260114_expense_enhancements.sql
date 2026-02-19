-- Migration: Add Expense Chat and Itemized Expenses

-- 1. Create expense_chats table
CREATE TABLE IF NOT EXISTS expense_chats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id uuid REFERENCES plans(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    user_name text,
    message text,
    is_system boolean DEFAULT false,
    extracted_data jsonb, -- { amount: number, items: [], categories: [], isCorrection: boolean }
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Add columns to expenses table if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='items') THEN
        ALTER TABLE expenses ADD COLUMN items jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='chat_id') THEN
        ALTER TABLE expenses ADD COLUMN chat_id uuid REFERENCES expense_chats(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Enable RLS on expense_chats
ALTER TABLE expense_chats ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for expense_chats
CREATE POLICY "Users can view chats for trips they are members of"
ON expense_chats FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM plan_members
        WHERE plan_members.plan_id = expense_chats.plan_id
        AND plan_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM plans
        WHERE plans.id = expense_chats.plan_id
        AND plans.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can insert chats for trips they are members of"
ON expense_chats FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM plan_members
        WHERE plan_members.plan_id = expense_chats.plan_id
        AND plan_members.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM plans
        WHERE plans.id = expense_chats.plan_id
        AND plans.owner_id = auth.uid()
    )
);

-- Ensure expense_chats is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE expense_chats;
