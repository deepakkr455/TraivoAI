-- Optimize RLS policies for remaining tables by dynamically dropping ALL existing policies first.
-- This ensures no duplicate policies remain regardless of their original names.

DO $$
DECLARE
  pol record;
  tables_to_optimize text[] := ARRAY[
    'profiles', 
    'affiliate_listings', 
    'chat_sessions', 
    'plans', 
    'plan_members', 
    'user_queries', 
    'trip_feedback', 
    'customer_chat_sessions', 
    'blogs', 
    'customer_inquiries', 
    'inquiry_messages', 
    'payment_history', 
    'blog_interactions', 
    'affiliate_daily_analytics',
    'b2b_conversations',
    'listed_products',
    'invitations',
    'proposals',
    'user_subscriptions',
    'contacts',
    'inquiry_messages_old'
  ];
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = ANY(tables_to_optimize)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 1. profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- 2. affiliate_listings
CREATE POLICY "Users can manage their own affiliate listings" ON public.affiliate_listings FOR ALL USING ((select auth.uid()) = user_id);

-- 3. chat_sessions (Business side)
CREATE POLICY "Users can manage their own chat sessions" ON public.chat_sessions FOR ALL USING ((select auth.uid()) = business_id);

-- 4. plans
CREATE POLICY "Users can manage their own plans" ON public.plans FOR ALL USING ((select auth.uid()) = owner_id);

-- 5. plan_members
CREATE POLICY "Users can manage their own plan memberships" ON public.plan_members FOR ALL USING ((select auth.uid()) = user_id);

-- 6. user_queries
CREATE POLICY "Users can manage their own queries" ON public.user_queries FOR ALL USING ((select auth.uid()) = userid);

-- 7. trip_feedback
CREATE POLICY "Users can manage their own feedback" ON public.trip_feedback FOR ALL USING ((select auth.uid()) = user_id);

-- 8. customer_chat_sessions
CREATE POLICY "Users can manage their own customer chat sessions" ON public.customer_chat_sessions FOR ALL USING ((select auth.uid()) = user_id);

-- 9. blogs
-- Split into separate policies to valid "Multiple Permissive Policies" warning
CREATE POLICY "Users can modify their own blogs" ON public.blogs FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own blogs" ON public.blogs FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own blogs" ON public.blogs FOR DELETE USING ((select auth.uid()) = user_id);

-- Combined SELECT policy
CREATE POLICY "Users can view blogs" ON public.blogs FOR SELECT 
USING (
  (select auth.uid()) = user_id 
  OR 
  status = 'published'
);

-- 10. customer_inquiries
CREATE POLICY "Participants can manage inquiries" ON public.customer_inquiries FOR ALL 
USING ((select auth.uid()) = customer_id OR (select auth.uid()) = agent_id);

-- 11. inquiry_messages
CREATE POLICY "Senders can manage messages" ON public.inquiry_messages FOR ALL USING ((select auth.uid()) = sender_id);

-- 12. payment_history
CREATE POLICY "Users can view own payment history" ON public.payment_history FOR SELECT USING ((select auth.uid()) = user_id);

-- 13. blog_interactions
CREATE POLICY "Users can manage their own blog interactions" ON public.blog_interactions FOR ALL USING ((select auth.uid()) = user_id);

-- 14. affiliate_daily_analytics
CREATE POLICY "Users can view own affiliate analytics" 
ON public.affiliate_daily_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_listings
    WHERE id = listing_id AND user_id = (SELECT auth.uid())
  )
);

-- 15. inquiry_messages_old (Legacy)
-- This table appears unused in the current codebase (checked messageService.ts).
-- We replace the old slow policy with a secure "deny all" policy to resolve the performance warning.
-- Note: Existing policies are dropped by the dynamic block above.
CREATE POLICY "Legacy table - access disabled" 
ON public.inquiry_messages_old 
FOR ALL 
USING (false);
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR SELECT USING ((select auth.uid()) = user_id);

-- 17. invitations
CREATE POLICY "Plan owners can view invitations"
ON public.invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Plan owners can create invitations"
ON public.invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Plan owners can delete invitations"
ON public.invitations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

-- 18. proposals
CREATE POLICY "Plan owners can insert proposals"
ON public.proposals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Plan owners can update proposals"
ON public.proposals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Plan owners can delete proposals"
ON public.proposals
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.plans
    WHERE id = plan_id AND owner_id = (SELECT auth.uid())
  )
);

-- 19. b2b_conversations
-- Split to avoid multiple permissive policies on SELECT
CREATE POLICY "Users can modify their own conversations"
ON public.b2b_conversations
FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.b2b_conversations
FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.b2b_conversations
FOR DELETE
USING ((SELECT auth.uid()) = user_id);

-- Combined SELECT policy
CREATE POLICY "Users and business owners can view conversations"
ON public.b2b_conversations
FOR SELECT
USING (
  (SELECT auth.uid()) = user_id 
  OR 
  (SELECT auth.uid()) = business_id
);

-- 20. listed_products
CREATE POLICY "Business owners can insert their own products"
ON public.listed_products
FOR INSERT
WITH CHECK ((SELECT auth.uid()) = business_id);

-- 21. contacts
CREATE POLICY "Allow public contact form submissions"
ON public.contacts
FOR INSERT
WITH CHECK ((SELECT auth.role()) = 'anon');
