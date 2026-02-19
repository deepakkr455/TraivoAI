-- Add interaction counts to blogs table
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unlikes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Function to safely increment counters
CREATE OR REPLACE FUNCTION increment_blog_counter(p_blog_id uuid, p_counter_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_counter_type = 'like' THEN
    UPDATE public.blogs SET likes_count = likes_count + 1 WHERE id = p_blog_id;
  ELSIF p_counter_type = 'unlike' THEN
    UPDATE public.blogs SET unlikes_count = unlikes_count + 1 WHERE id = p_blog_id;
  ELSIF p_counter_type = 'share' THEN
    UPDATE public.blogs SET shares_count = shares_count + 1 WHERE id = p_blog_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated and anon users (if public blogs are allowed)
GRANT EXECUTE ON FUNCTION increment_blog_counter(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_blog_counter(uuid, text) TO anon;
