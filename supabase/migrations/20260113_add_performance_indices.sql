-- Add Primary Key to blog_interactions (Composite Key)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'blog_interactions'
    ) THEN
        -- Check if PK exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
            AND table_name = 'blog_interactions' 
            AND constraint_type = 'PRIMARY KEY'
        ) THEN
            ALTER TABLE public.blog_interactions ADD PRIMARY KEY (user_id, blog_id);
        END IF;
    END IF;
END $$;

-- Remove duplicate/redundant indexes to fix "identical indexes" warning
DROP INDEX IF EXISTS idx_inquiries_customer;
DROP INDEX IF EXISTS idx_inquiries_agent;

-- Dynamic Index Creation Block
DO $$
DECLARE
    -- Change to text[] for array slice iteration
    idx_target text[];
    -- Array of index definitions: table_name, column_name, index_name
    indices_to_create text[][] := ARRAY[
        ['b2b_conversations', 'user_id', 'idx_b2b_conversations_user_id'],
        ['b2b_conversations', 'business_id', 'idx_b2b_conversations_business_id'],
        ['blog_interactions', 'blog_id', 'idx_blog_interactions_blog_id'],
        ['blogs', 'user_id', 'idx_blogs_user_id'],
        ['bookings', 'user_id', 'idx_bookings_user_id'],
        ['bookings', 'plan_id', 'idx_bookings_plan_id'],
        ['customer_inquiries', 'product_id', 'idx_customer_inquiries_product_id'],
        ['customer_inquiries', 'trip_id', 'idx_customer_inquiries_trip_id'],
        ['customer_inquiries', 'customer_id', 'idx_customer_inquiries_customer_id'],
        ['customer_inquiries', 'agent_id', 'idx_customer_inquiries_agent_id'],
        ['customer_saved_deals', 'user_id', 'idx_customer_saved_deals_user_id'],
        ['doubts', 'user_id', 'idx_doubts_user_id'],
        ['expenses', 'user_id', 'idx_expenses_user_id'],
        ['expenses', 'trip_id', 'idx_expenses_trip_id'],
        ['inquiry_messages', 'inquiry_id', 'idx_inquiry_messages_inquiry_id'],
        ['inquiry_messages', 'sender_id', 'idx_inquiry_messages_sender_id'],
        ['inquiry_messages_old', 'inquiry_id', 'idx_inquiry_messages_old_inquiry_id'],
        ['likes', 'user_id', 'idx_likes_user_id'],
        ['likes', 'blog_id', 'idx_likes_blog_id'],
        ['plan_members', 'user_id', 'idx_plan_members_user_id'],
        ['plan_members', 'plan_id', 'idx_plan_members_plan_id'],
        ['plans', 'owner_id', 'idx_plans_owner_id'],
        ['listed_products', 'business_id', 'idx_listed_products_business_id'],
        ['proposals', 'plan_id', 'idx_proposals_plan_id'],
        ['trip_feedback', 'user_id', 'idx_trip_feedback_user_id'],
        ['trip_feedback', 'trip_id', 'idx_trip_feedback_trip_id'],
        ['user_subscriptions', 'user_id', 'idx_user_subscriptions_user_id']
    ];
    target_table text;
    target_col text;
    idx_name text;
BEGIN
    -- Added SLICE 1 to iterate over rows (sub-arrays)
    FOREACH idx_target SLICE 1 IN ARRAY indices_to_create LOOP
        target_table := idx_target[1];
        target_col := idx_target[2];
        idx_name := idx_target[3];

        -- Check if table and column exist in information_schema
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = target_table 
            AND column_name = target_col
        ) THEN
            -- Safe to safe create index
            EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(%I)', idx_name, target_table, target_col);
            RAISE NOTICE 'Created index % on %.%', idx_name, target_table, target_col;
        ELSE
            RAISE NOTICE 'Skipping index %: Table % or column % does not exist.', idx_name, target_table, target_col;
        END IF;
    END LOOP;
END $$;
