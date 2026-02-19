
-- Update get_agent_time_spent_stats to handle tagged 'view' interactions
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
    AND (pi.interaction_type = 'time_spent' OR pi.metadata->>'original_type' = 'time_spent');
END;
$$;

-- Update get_product_analytics_trend to optionally separate views from time_spent tags
-- In this version, we count 'view' as a view ONLY if it's not a tagged 'time_spent' event
-- if we want to distinguish them. But for now, let's keep it inclusive of all views
-- but maybe add a filter if needed. Actually, let's update it to be more precise.

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
        COUNT(CASE WHEN pi.interaction_type = 'view' AND (pi.metadata->>'original_type' IS NULL OR pi.metadata->>'original_type' != 'time_spent') THEN 1 END)::BIGINT as views,
        COUNT(CASE WHEN pi.interaction_type = 'click' THEN 1 END)::BIGINT as clicks,
        COUNT(CASE WHEN pi.interaction_type = 'inquiry' THEN 1 END)::BIGINT as inquiries
    FROM date_series ds
    LEFT JOIN public.listed_products lp ON lp.business_id = p_agent_id
    LEFT JOIN public.product_interactions pi ON pi.product_id = lp.id AND pi.created_at::date = ds.d
    GROUP BY ds.d
    ORDER BY ds.d;
END;
$$;
