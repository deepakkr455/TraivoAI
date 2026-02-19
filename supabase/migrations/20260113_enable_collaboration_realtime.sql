-- Migration: Enable Realtime for Collaboration Tables
-- Enables Supabase Realtime for proposals, likes, and doubts to allow for instant updates in the collaboration hub.

-- 1. Add tables to the supabase_realtime publication
-- This allows the publication to broadcast changes for these specific tables.

-- First, check if the publication already exists (it usually does in Supabase)
-- Then add the tables to it if they are not already there.

DO $$
BEGIN
  -- Enable realtime for 'proposals'
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'proposals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
  END IF;

  -- Enable realtime for 'likes'
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
  END IF;

  -- Enable realtime for 'doubts'
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'doubts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.doubts;
  END IF;
END $$;

-- 2. Set REPLICA IDENTITY to FULL
-- This ensures that DELETE events include ALL columns (like plan_id, proposal_id),
-- which is necessary for filtered real-time subscriptions to correctly match deleted items.
ALTER TABLE public.proposals REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.doubts REPLICA IDENTITY FULL;
