-- Add location_state to product_interactions
ALTER TABLE public.product_interactions ADD COLUMN IF NOT EXISTS location_state TEXT;

-- Update get_agent_lead_locations to use state and country
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
        CASE 
            WHEN pi.location_state IS NOT NULL AND pi.location_country IS NOT NULL 
            THEN pi.location_state || ', ' || pi.location_country
            ELSE COALESCE(pi.location_country, 'Unknown')
        END as label,
        COUNT(pi.id)::BIGINT as value
    FROM public.product_interactions pi
    JOIN public.listed_products lp ON lp.id = pi.product_id
    WHERE lp.business_id = p_agent_id
    AND pi.interaction_type IN ('view', 'click', 'inquiry')
    GROUP BY label
    ORDER BY value DESC;
END;
$$;
