-- Create product_interactions table for granular tracking
CREATE TABLE IF NOT EXISTS public.product_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.listed_products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Track logged-in users
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'save', 'inquiry', 'time_spent')),
    device_type TEXT, -- mobile, desktop, tablet
    browser TEXT,
    location_country TEXT,
    location_city TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_interactions_product_id ON public.product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_interactions_user_id ON public.product_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_product_interactions_created_at ON public.product_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_product_interactions_type ON public.product_interactions(interaction_type);

-- Enable RLS
ALTER TABLE public.product_interactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous tracking)
CREATE POLICY "Allow anonymous interaction tracking" 
ON public.product_interactions 
FOR INSERT 
WITH CHECK (true);

-- Allow agents to view interactions for their own products
CREATE POLICY "Agents can view interactions for their products" 
ON public.product_interactions 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.listed_products lp
        WHERE lp.id = product_interactions.product_id
        AND lp.business_id = auth.uid()
    )
);

-- Function to aggregate daily analytics for agents
CREATE OR REPLACE FUNCTION get_product_analytics_trend(p_agent_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    interaction_date DATE,
    total_views BIGINT,
    total_clicks BIGINT,
    total_inquiries BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            current_date - (p_days - 1) * INTERVAL '1 day',
            current_date,
            '1 day'::interval
        )::date AS d
    )
    SELECT 
        ds.d,
        COUNT(CASE WHEN pi.interaction_type = 'view' THEN 1 END)::BIGINT as views,
        COUNT(CASE WHEN pi.interaction_type = 'click' THEN 1 END)::BIGINT as clicks,
        COUNT(CASE WHEN pi.interaction_type = 'inquiry' THEN 1 END)::BIGINT as inquiries
    FROM date_series ds
    LEFT JOIN public.listed_products lp ON lp.business_id = p_agent_id
    LEFT JOIN public.product_interactions pi ON pi.product_id = lp.id AND pi.created_at::date = ds.d
    GROUP BY ds.d
    ORDER BY ds.d;
END;
$$;

-- Function to get lead location distribution (Interactions + Personalizations)
CREATE OR REPLACE FUNCTION get_agent_lead_locations(p_agent_id UUID)
RETURNS TABLE (
    label TEXT,
    value BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(pi.location_city, pi.location_country, up.city, up.state, 'Unknown') as label,
        COUNT(pi.id)::BIGINT as value
    FROM public.product_interactions pi
    JOIN public.listed_products lp ON lp.id = pi.product_id
    LEFT JOIN public.user_personalizations up ON up.user_id = pi.user_id
    WHERE lp.business_id = p_agent_id
    AND pi.interaction_type IN ('view', 'click', 'inquiry')
    GROUP BY label
    ORDER BY value DESC;
END;
$$;

-- Function to get time spent stats
CREATE OR REPLACE FUNCTION get_agent_time_spent_stats(p_agent_id UUID)
RETURNS TABLE (
    avg_minutes NUMERIC,
    total_minutes NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG((pi.metadata->>'duration_seconds')::numeric / 60.0), 0)::numeric(10,1) as avg_minutes,
        COALESCE(SUM((pi.metadata->>'duration_seconds')::numeric / 60.0), 0)::numeric(10,1) as total_minutes
    FROM public.product_interactions pi
    JOIN public.listed_products lp ON lp.id = pi.product_id
    WHERE lp.business_id = p_agent_id
    AND pi.interaction_type = 'time_spent';
END;
$$;

-- Function to get listing visit stats for heatmap
CREATE OR REPLACE FUNCTION get_listing_visit_stats(p_agent_id UUID)
RETURNS TABLE (
    title TEXT,
    views BIGINT,
    relative_size NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_views BIGINT;
BEGIN
    SELECT COALESCE(SUM(views), 0) INTO v_total_views
    FROM public.listed_products
    WHERE business_id = p_agent_id;

    IF v_total_views = 0 THEN v_total_views := 1; END IF;

    RETURN QUERY
    SELECT 
        lp.title,
        lp.views::BIGINT,
        (lp.views::numeric / v_total_views::numeric * 100)::numeric(10,1) as relative_size
    FROM public.listed_products lp
    WHERE lp.business_id = p_agent_id
    ORDER BY lp.views DESC;
END;
$$;
