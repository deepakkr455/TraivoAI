-- Create table to track user interactions
CREATE TABLE IF NOT EXISTS public.blog_interactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    blog_id uuid NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'unlike')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(blog_id, user_id)
);

-- RLS Policies
ALTER TABLE public.blog_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all interactions" ON public.blog_interactions
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own interactions" ON public.blog_interactions
    FOR ALL USING (auth.uid() = user_id);

-- Trigger Function to update counts
CREATE OR REPLACE FUNCTION update_blog_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.interaction_type = 'like' THEN
            UPDATE public.blogs SET likes_count = likes_count + 1 WHERE id = NEW.blog_id;
        ELSIF NEW.interaction_type = 'unlike' THEN
            UPDATE public.blogs SET unlikes_count = unlikes_count + 1 WHERE id = NEW.blog_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.interaction_type = 'like' THEN
            UPDATE public.blogs SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.blog_id;
        ELSIF OLD.interaction_type = 'unlike' THEN
            UPDATE public.blogs SET unlikes_count = GREATEST(0, unlikes_count - 1) WHERE id = OLD.blog_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Handle status change (e.g. like -> unlike)
        IF OLD.interaction_type = 'like' AND NEW.interaction_type = 'unlike' THEN
            UPDATE public.blogs SET 
                likes_count = GREATEST(0, likes_count - 1),
                unlikes_count = unlikes_count + 1
            WHERE id = NEW.blog_id;
        ELSIF OLD.interaction_type = 'unlike' AND NEW.interaction_type = 'like' THEN
            UPDATE public.blogs SET 
                unlikes_count = GREATEST(0, unlikes_count - 1),
                likes_count = likes_count + 1
            WHERE id = NEW.blog_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_blog_interaction_change ON public.blog_interactions;
CREATE TRIGGER on_blog_interaction_change
AFTER INSERT OR UPDATE OR DELETE ON public.blog_interactions
FOR EACH ROW EXECUTE FUNCTION update_blog_interaction_counts();

-- Helper RPC to toggle interaction safely
CREATE OR REPLACE FUNCTION toggle_blog_interaction(p_blog_id uuid, p_user_id uuid, p_interaction_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_interaction text;
BEGIN
    SELECT interaction_type INTO existing_interaction 
    FROM public.blog_interactions 
    WHERE blog_id = p_blog_id AND user_id = p_user_id;

    IF existing_interaction IS NOT NULL THEN
        IF existing_interaction = p_interaction_type THEN
            -- Same interaction: Remove it (Toggle OFF)
            DELETE FROM public.blog_interactions WHERE blog_id = p_blog_id AND user_id = p_user_id;
        ELSE
            -- Different interaction: Update it (Switch Vote)
            UPDATE public.blog_interactions 
            SET interaction_type = p_interaction_type 
            WHERE blog_id = p_blog_id AND user_id = p_user_id;
        END IF;
    ELSE
        -- No interaction: Insert it
        INSERT INTO public.blog_interactions (blog_id, user_id, interaction_type)
        VALUES (p_blog_id, p_user_id, p_interaction_type);
    END IF;
END;
$$;
