-- RPC to get aggregated metrics for an agent's products
-- Returns total views and unique visitors per product for the last 30 days (default) or all time if desired

CREATE OR REPLACE FUNCTION get_agent_product_metrics(p_agent_id UUID)
RETURNS TABLE (
    product_id UUID,
    total_views BIGINT,
    unique_visitors BIGINT,
    avg_views NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.product_id,
        COUNT(*) FILTER (WHERE pi.interaction_type = 'view')::BIGINT as total_views,
        COUNT(DISTINCT pi.user_id)::BIGINT as unique_visitors,
        CASE 
            WHEN COUNT(DISTINCT pi.user_id) > 0 THEN 
                TRUNC(COUNT(*) FILTER (WHERE pi.interaction_type = 'view')::NUMERIC / COUNT(DISTINCT pi.user_id), 1)
            ELSE 0 
        END as avg_views
    FROM public.product_interactions pi
    JOIN public.listed_products lp ON lp.id = pi.product_id
    WHERE lp.business_id = p_agent_id
    GROUP BY pi.product_id;
END;
$$;
