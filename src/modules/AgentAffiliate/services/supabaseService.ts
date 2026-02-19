// supabaseService.ts – centralised Supabase client and helper functions
import { Product, ChatMessage, MediaUpload } from '../types';
import { supabase } from '../../../services/supabaseClient';

export { supabase };

// ---------------------------------------------------------------------------
// Helper: add a chat conversation message
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helper: add a chat conversation message
// ---------------------------------------------------------------------------
export const addConversationMessage = async (message: ChatMessage, businessId: string, userId?: string, sessionId?: string) => {
    // Log the message payload before we send it to Supabase
    console.log('🗨️ Sending conversation message to Supabase:', message);

    const { data, error } = await supabase
        .from('b2b_conversations')
        .insert([
            {
                business_id: businessId,
                user_id: userId || businessId, // Fallback to businessId if userId not provided (assuming 1:1 for now)
                session_id: sessionId,
                sender: message.sender,
                content: message.content,
                product_id: message.productCard?.id || null,
                media_urls: message.media ? message.media.map(m => m.url) : [],
            },
        ]);

    if (error) {
        console.error('Error saving conversation message:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Conversation message saved. Returned data:', data);
    }
    return data;
};

// ---------------------------------------------------------------------------
// Saved Deals (customer_saved_deals)
// ---------------------------------------------------------------------------

export const saveDeal = async (userId: string, productId: string) => {
    const { error } = await supabase
        .from('customer_saved_deals')
        .insert([{ user_id: userId, product_id: productId }]);

    if (error) {
        console.error('Error saving deal:', error);
        throw error;
    }
};

export const unsaveDeal = async (userId: string, productId: string) => {
    const { error } = await supabase
        .from('customer_saved_deals')
        .delete()
        .match({ user_id: userId, product_id: productId });

    if (error) {
        console.error('Error unsaving deal:', error);
        throw error;
    }
};

export const getSavedDeals = async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from('customer_saved_deals')
        .select('product_id')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching saved deals:', error);
        return [];
    }
    return data.map((d: any) => d.product_id);
};

export const getPublicProfile = async (userId: string) => {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('full_name, created_at, avatar_url')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching public profile:', error);
        return null;
    }
    return data;
};

// ---------------------------------------------------------------------------
// Helper: upload media to Supabase Storage bucket "media"
// ---------------------------------------------------------------------------
export const uploadMedia = async (file: File, businessId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${businessId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage.from('media').upload(fileName, file);

    if (error) {
        console.error('Error uploading media:', error);
        return null;
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.path);
    return publicUrl;
};

// ---------------------------------------------------------------------------
// Helper: add a product listing
// ---------------------------------------------------------------------------
export const addProductListing = async (product: Product) => {
    // Transform data to match Supabase schema
    // theme_tags is defined as string (comma-separated) in types.ts but text[] in DB
    const productData = {
        ...product,
        theme_tags: typeof product.theme_tags === 'string'
            ? (product.theme_tags as string).split(',').map((tag: string) => tag.trim())
            : product.theme_tags
    };

    if (!productData.business_id) {
        console.error('❌ Error: Missing business_id in product data. Cannot save to DB.', productData);
        return null;
    }

    console.log('📝 Adding/Updating product listing DB. Business ID:', productData.business_id); // Enhanced log

    const { data, error } = await supabase.from('listed_products').upsert([productData]);

    if (error) {
        console.error('Error saving product listing:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Product listing saved. Returned data:', data);
    }
    return data;
};
// ---------------------------------------------------------------------------
// Helper: get all listed products
// ---------------------------------------------------------------------------
export const getListedProducts = async (businessId?: string): Promise<Product[]> => {
    let query = supabase
        .from('listed_products')
        .select('*');

    // If businessId is provided, show ALL their products (active or inactive) 
    // Otherwise show only active ones (e.g. for public gallery)
    if (businessId) {
        query = query.eq('business_id', businessId);
    } else {
        query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching listed products:', error);
        return [];
    }

    console.log(`✅ getListedProducts matched ${data?.length} rows`);

    // Transform data back to match Product interface if needed
    return (data || []).map((p: any) => ({
        ...p,
        // If types.ts defines theme_tags as string, join the array from DB
        theme_tags: Array.isArray(p.theme_tags) ? p.theme_tags.join(', ') : p.theme_tags
    }));
};

// ---------------------------------------------------------------------------
// Helper: get conversation messages
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Helper: get conversation messages (Updated to handle both B2B and Customer)
// ---------------------------------------------------------------------------
export const getConversationMessages = async (businessId: string, sessionId?: string): Promise<ChatMessage[]> => {
    let query = supabase
        .from('b2b_conversations')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false }) // Get latest messages first for limiting
        .limit(50); // Requirement: load last 50 chats

    if (sessionId) {
        query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching conversation messages:', error);
        return [];
    }

    // Reverse to return in chronological order
    return (data || []).reverse().map((msg: any) => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        media: msg.media_urls ? msg.media_urls.map((url: string) => ({ url, type: 'image', name: 'Image' })) : undefined,
        productCard: msg.product_id ? { id: msg.product_id } as Product : undefined
    }));
};

// New function specifically for Customer Chat
export const getCustomerConversationMessages = async (userId: string, sessionId?: string): Promise<ChatMessage[]> => {
    let query = supabase
        .from('user_queries')
        .select('*')
        .eq('userid', userId)
        .order('datetime', { ascending: true }); // user_queries uses 'datetime'

    if (sessionId) {
        query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching customer conversation messages:', error);
        return [];
    }

    // Transform user_queries (turn-based) into flat messages list
    const messages: ChatMessage[] = [];

    (data || []).forEach((row: any, index: number) => {
        // 1. User Message
        messages.push({
            id: row.id + '-user', // Derive distinct ID
            sender: 'user',
            content: row.query, // query is text
            // timestamp: row.datetime 
        });

        // 2. Agent Message
        let agentContent: any;
        try {
            agentContent = JSON.parse(row.agent_response);
        } catch {
            agentContent = { text: row.agent_response };
        }

        messages.push({
            id: row.id + '-agent',
            sender: 'model', // Map to what CustomerPage expects (it maps 'model' -> 'model')
            content: agentContent,
            productCard: undefined // Add mapping if needed later
        });
    });

    return messages;
};

// New function to add customer message
export const addCustomerMessage = async (message: ChatMessage, userId: string, sessionId?: string) => {
    // WARN: The new schema 'user_queries' is turn-based (query + response). 
    // We cannot insert partial messages easily.
    // Since 'geminiService' orchestrates the full turn and saves it, this function is likely obsolete 
    // for the main chat flow. 
    console.warn('addCustomerMessage is deprecated for user_queries schema. Use geminiService.orchestrateResponse instead.');
    return null;
};

// ---------------------------------------------------------------------------
// B2B Session Management Functions (chat_sessions table)
// ---------------------------------------------------------------------------

export const createChatSession = async (userId: string, title: string, businessId?: string, id?: string) => {
    console.log("CreateB2BChatSession: Requested for Business/User:", userId);

    const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{
            id: id || crypto.randomUUID(),
            title: title || 'New Chat',
            business_id: userId // Use business_id from user's id
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating B2B chat session:', JSON.stringify(error, null, 2));
        return null;
    }
    return data;
};

export const getChatSessions = async (userId: string) => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('business_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching B2B chat sessions:', error);
        return [];
    }
    return data;
};

export const updateChatSessionTitle = async (sessionId: string, title: string) => {
    const { error } = await supabase
        .from('chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

    if (error) {
        console.error('Error updating B2B chat session title:', error);
    }
};

export const deleteChatSession = async (sessionId: string) => {
    const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        console.error('Error deleting B2B chat session:', error);
    }
};

// ---------------------------------------------------------------------------
// Customer Session Management Functions (customer_chat_sessions table)
// ---------------------------------------------------------------------------

export const createCustomerChatSession = async (userId: string, title: string, id?: string) => {
    const { data, error } = await supabase
        .from('customer_chat_sessions')
        .insert([{
            id: id || crypto.randomUUID(),
            title,
            user_id: userId
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating customer chat session:', JSON.stringify(error, null, 2));
        return null;
    }
    return data;
};

export const getCustomerChatSessions = async (userId: string) => {
    const { data, error } = await supabase
        .from('customer_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching customer chat sessions:', error);
        return [];
    }
    return data;
};

export const updateCustomerChatSessionTitle = async (sessionId: string, title: string) => {
    const { error } = await supabase
        .from('customer_chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

    if (error) {
        console.error('Error updating customer chat session title:', error);
    }
};

export const deleteCustomerChatSession = async (sessionId: string) => {
    const { error } = await supabase
        .from('customer_chat_sessions')
        .delete()
        .eq('id', sessionId);

    if (error) {
        console.error('Error deleting customer chat session:', error);
    }
};

// ---------------------------------------------------------------------------
// Travel Deals (listed_products) Tracking
// ---------------------------------------------------------------------------

// Track which products have already been "viewed" in this session
const viewedProductIds = new Set<string>();

// Increment view count for a product
// Product Analytics (Granular Tracking Only)
export const incrementProductView = async (id: string, metadata: any = {}) => {
    // We are now using granular tracking via the 'product_interactions' table.
    // The legacy 'increment_product_view' RPC caused 404s, and direct updates caused 400s due to RLS.
    // This new approach is cleaner and provides more data (metadata, location, etc).
    trackProductInteraction(id, 'view', metadata);
};

// Track last click time per product to prevent double-counting
const lastProductClickTimes = new Map<string, number>();

// Increment click count for a product
export const incrementProductClick = async (id: string, metadata: any = {}) => {
    // console.log(`👆 Attempting click increment for product: ${id}`);

    const now = Date.now();
    const lastClick = lastProductClickTimes.get(id) || 0;

    if (now - lastClick < 1000) {
        // console.log(`ℹ️ Click debounced for: ${id}`);
        return;
    }
    lastProductClickTimes.set(id, now);

    // We are now using granular tracking via the 'product_interactions' table.
    // The legacy 'increment_product_click' RPC caused 404s, and direct updates caused 400s or constraint errors.
    trackProductInteraction(id, 'click', metadata);
};

// ---------------------------------------------------------------------------
// Affiliate Listings Functions
// ---------------------------------------------------------------------------

// Add a new affiliate listing
export const addAffiliateListing = async (listing: Omit<import('../types').AffiliateListing, 'id' | 'created_at'>) => {
    console.log('📝 Adding affiliate listing to DB:', listing); // Enhanced log

    const { data, error } = await supabase
        .from('affiliate_listings')
        .insert([listing])
        .select();

    if (error) {
        console.error('Error adding affiliate listing:', error);
        throw error;
    }

    console.log('✅ Affiliate listing added:', data);
    return data?.[0];
};

// Get affiliate listings (optionally filtered by user_id)
export const getAffiliateListings = async (userId?: string): Promise<import('../types').AffiliateListing[]> => {
    let query = supabase
        .from('affiliate_listings')
        .select('*')
        .eq('is_active', true) // Default to active listings
        .order('personal_ranking', { ascending: false }) // Prioritize personal ranking
        .order('platform_ranking', { ascending: false }) // Then platform ranking
        .order('created_at', { ascending: false });

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching affiliate listings:', error);
        return [];
    }

    return data || [];
};

export const getAffiliateBanners = async (bannerType: string, limit: number = 5): Promise<import('../types').AffiliateListing[]> => {
    const { data, error } = await supabase
        .from('affiliate_listings')
        .select('*')
        // .eq('link_health', true)
        .eq('banner_type', bannerType)
        .order('platform_ranking', { ascending: false }) // Prioritize platform ranking for these
        .limit(limit);

    if (error) {
        console.error(`Error fetching affiliate banners (${bannerType}):`, error);
        return [];
    }

    return data || [];
};

// Track which listings have already been "viewed" in this session to prevent double-counting
const viewedIds = new Set<string>();

// Increment view count for a listing
export const incrementAffiliateView = async (id: string) => {
    // Only increment once per session/page-load to prevent spam
    if (viewedIds.has(id)) return;
    viewedIds.add(id);

    const { error } = await supabase.rpc('increment_affiliate_view', { row_id: id });
    if (error) {
        // Fallback: Fetch current, then update (not atomic, but works)
        const { data: current, error: fetchError } = await supabase
            .from('affiliate_listings')
            .select('views')
            .eq('id', id)
            .single();

        if (fetchError) return;

        if (current) {
            await supabase
                .from('affiliate_listings')
                .update({ views: (current.views || 0) + 1 })
                .eq('id', id);
        }
    }
};

// Track last click time per listing to prevent double-counting (e.g. blur + click events)
const lastClickTimes = new Map<string, number>();

// Increment click count for a listing
export const incrementAffiliateClick = async (id: string) => {
    const now = Date.now();
    const lastClick = lastClickTimes.get(id) || 0;

    // Prevent multiple increments within 1 second for the same listing
    if (now - lastClick < 1000) return;
    lastClickTimes.set(id, now);

    const { error } = await supabase.rpc('increment_affiliate_click', { row_id: id });
    if (error) {
        // Fallback: Fetch current, then update
        const { data: current, error: fetchError } = await supabase
            .from('affiliate_listings')
            .select('clicks')
            .eq('id', id)
            .single();

        if (fetchError) return;

        if (current) {
            await supabase
                .from('affiliate_listings')
                .update({ clicks: (current.clicks || 0) + 1 })
                .eq('id', id);
        }
    }
};

// Update an affiliate listing
export const updateAffiliateListing = async (id: string, updates: Partial<import('../types').AffiliateListing>) => {
    const { data, error } = await supabase
        .from('affiliate_listings')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error updating affiliate listing:', error);
        throw error;
    }

    return data?.[0];
};


// Delete an affiliate listing
export const deleteAffiliateListing = async (id: string) => {
    const { error } = await supabase
        .from('affiliate_listings')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting affiliate listing:', error);
        throw error;
    }
};

// ---------------------------------------------------------------------------
// Product Listing Management (Delete)
// ---------------------------------------------------------------------------

export const deleteProductListing = async (productId: string) => {
    console.log('🗑️ Deleting product listing:', productId);
    const { error } = await supabase
        .from('listed_products')
        .delete()
        .eq('id', productId);

    if (error) {
        console.error('Error deleting product listing:', error);
        throw error;
    }
    console.log('✅ Product listing deleted:', productId);
};


// Get aggregated affiliate analytics
export const getAffiliateAnalytics = async (userId: string, range: string) => {
    // Determine date range filter
    const now = new Date();
    let startDate = new Date();
    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else if (range === '1y') startDate.setFullYear(now.getFullYear() - 1);

    // Fetch analytics data joined with listings
    const { data, error } = await supabase
        .from('affiliate_daily_analytics')
        .select(`
            *,
            listing:listing_id (
                id,
                title,
                user_id
            )
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching affiliate analytics:', error);
        return {
            impressions: 0,
            clicks: 0,
            unique_visitors: 0,
            top_links: [],
            chart_data: []
        };
    }

    // Filter by user_id (since RLS might not filter joined table automatically if not set up perfectly, double check)
    // Actually RLS on affiliate_daily_analytics checks for listing ownership, so data should be correct.

    // Aggregate Data
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalUniqueVisitors = 0;
    const linkPerformance: Record<string, { id: string, title: string, impressions: number, clicks: number }> = {};

    data.forEach((record: any) => {
        totalImpressions += record.impressions || 0;
        totalClicks += record.clicks || 0;
        totalUniqueVisitors += record.unique_visitors || 0;

        // Aggregate per link
        if (record.listing) {
            if (!linkPerformance[record.listing.id]) {
                linkPerformance[record.listing.id] = {
                    id: record.listing.id,
                    title: record.listing.title,
                    impressions: 0,
                    clicks: 0
                };
            }
            linkPerformance[record.listing.id].impressions += record.impressions || 0;
            linkPerformance[record.listing.id].clicks += record.clicks || 0;
        }
    });

    // Sort Top Links by Clicks
    const topLinks = Object.values(linkPerformance)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5); // Top 5

    return {
        impressions: totalImpressions,
        clicks: totalClicks,
        unique_visitors: totalUniqueVisitors,
        top_links: topLinks,
        chart_data: data // Pass raw data for charts if needed
    };
};

// ---------------------------------------------------------------------------
// Granular Product Analytics Tracking
// ---------------------------------------------------------------------------

/**
 * Tracks a granular product interaction (view, click, etc.)
 */
export const trackProductInteraction = async (
    productId: string,
    type: 'view' | 'click' | 'save' | 'inquiry' | 'time_spent',
    metadata: any = {},
    userId?: string
) => {
    try {
        let finalUserId = userId;

        // If no userId provided, attempt to get it from current session
        if (!finalUserId) {
            const { data: { session } } = await supabase.auth.getSession();
            finalUserId = session?.user?.id;
        }

        // Detect basic device info if in browser
        const deviceType = typeof navigator !== 'undefined' ?
            (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop') :
            'unknown';
        const browser = typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'unknown';

        // Fetch Location Data (Client-side)
        let location_country = null;
        let location_city = null;

        try {
            // Use db-ip.com as primary (reliable for client-side HTTPS/HTTP)
            const response = await fetch('https://api.db-ip.com/v2/free/self');
            if (response.ok) {
                const data = await response.json();
                location_country = data.countryName;
                location_city = data.city;
            }
        } catch (e) {
            // console.warn('Location service failed', e);
        }

        console.log(`📊 Tracking interaction [${type}]:`, { productId, type, metadata, location: `${location_city}, ${location_country}` });

        const { error } = await supabase
            .from('product_interactions')
            .insert({
                product_id: productId,
                user_id: finalUserId,
                interaction_type: type,
                device_type: deviceType,
                browser: browser,
                location_country: location_country,
                location_city: location_city,
                metadata: metadata
            });

        if (error) {
            // Fallback for strict database constraints (e.g. if 'click' or 'time_spent' is not allowed)
            if (error.message.includes('check constraint') || error.code === '23514') {
                console.warn(`Constraint violation for type '${type}'. Retrying as 'view'.`);
                await supabase
                    .from('product_interactions')
                    .insert({
                        product_id: productId,
                        user_id: finalUserId,
                        interaction_type: 'view', // Fallback to a known valid type
                        device_type: deviceType,
                        browser: browser,
                        location_country: location_country,
                        location_city: location_city,
                        metadata: { ...metadata, original_type: type }
                    });
            } else {
                console.error('Error tracking product interaction:', error.message);
            }
        }
    } catch (e) {
        // Silent failure for tracking to not impact UX
    }
};

/**
 * Tracks time spent on a product page, including metadata like scroll depth
 */
export const trackProductTimeSpent = async (productId: string, durationSeconds: number, userId?: string, additionalMetadata: any = {}) => {
    // DB Constraint on 'interaction_type' might not include 'time_spent' yet.
    // To prevent 400 errors in console, we log as 'view' but tag it.
    return trackProductInteraction(productId, 'view', {
        duration_seconds: durationSeconds,
        original_type: 'time_spent',
        ...additionalMetadata
    }, userId);
};

/**
 * Fetches aggregated analytics for the agent dashboard
 */
export const getProductAnalytics = async (agentId: string, range: number = 30) => {
    try {
        // 1. Fetch Trend Data via RPC (efficient for time-series)
        const { data: trendData, error: trendError } = await supabase
            .rpc('get_product_analytics_trend', {
                p_agent_id: agentId,
                p_days: range
            });

        if (trendError) throw trendError;

        // 2. Fetch Listing Metrics (Heatmap/List) via RPC
        const { data: visitStats, error: visitError } = await supabase
            .rpc('get_listing_visit_stats', { p_agent_id: agentId });

        if (visitError) console.warn('Error fetching listing visit stats:', visitError);

        // 3. Fetch all interactions for the last 30 days for unified processing
        // This avoids multiple round-trips for device, location, time, and mapping
        const { data: allInteractions, error: interactionError } = await supabase
            .from('product_interactions')
            .select(`
                *,
                listed_products!inner (
                    title,
                    location,
                    business_id
                )
            `)
            .eq('listed_products.business_id', agentId)
            .gte('created_at', new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString());

        if (interactionError) throw interactionError;

        // --- Processing derived metrics from allInteractions ---

        const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
        const locationCounts: Record<string, number> = {};
        const userInteractions: Record<string, number> = {};
        const mappingMap: Record<string, { customerLoc: string, tripLoc: string, leads: number }> = {};
        const heatmapRaw: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

        let totalSeconds = 0;
        let timeSpentEvents = 0;

        (allInteractions || []).forEach((pi: any) => {
            // Meta robust parsing
            const meta = typeof pi.metadata === 'string' ? JSON.parse(pi.metadata) : pi.metadata;

            // Device
            if (pi.device_type) {
                const type = pi.device_type.toLowerCase();
                deviceCounts[type] = (deviceCounts[type] || 0) + 1;
            }

            // Location
            const locLabel = pi.location_city && pi.location_country
                ? `${pi.location_city}, ${pi.location_country}`
                : (pi.location_country || 'Unknown');
            if (locLabel !== 'Unknown') {
                locationCounts[locLabel] = (locationCounts[locLabel] || 0) + 1;
            }

            // Time Spent calculation
            const isTimeSpent = pi.interaction_type === 'time_spent' || meta?.original_type === 'time_spent';
            if (isTimeSpent && meta?.duration_seconds) {
                totalSeconds += Number(meta.duration_seconds);
                timeSpentEvents += 1;
            }

            // Retention
            if (pi.user_id) {
                userInteractions[pi.user_id] = (userInteractions[pi.user_id] || 0) + 1;
            }

            // Mapping (leads)
            if (pi.interaction_type === 'inquiry') {
                const customerCity = pi.location_city || pi.location_country || 'Unknown';
                const tripLocation = pi.listed_products?.location || 'Unknown';
                if (customerCity !== 'Unknown' && tripLocation !== 'Unknown') {
                    const key = `${customerCity}-${tripLocation}`;
                    if (!mappingMap[key]) {
                        mappingMap[key] = { customerLoc: customerCity, tripLoc: tripLocation, leads: 0 };
                    }
                    mappingMap[key].leads += 1;
                }
            }

            // Heatmap
            const date = new Date(pi.created_at);
            heatmapRaw[date.getDay()][date.getHours()] += 1;
        });

        // --- Finalising formats ---

        const totalInteracts = (allInteractions || []).length || 1;
        const deviceBreakdown = Object.entries(deviceCounts).map(([label, count]) => ({
            label: label.charAt(0).toUpperCase() + label.slice(1),
            value: Math.round((count / totalInteracts) * 100)
        })).filter(d => d.value > 0);

        const locationData = Object.entries(locationCounts)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const totalMinutes = totalSeconds / 60;
        const avgMinutes = timeSpentEvents > 0 ? totalMinutes / timeSpentEvents : 0;
        const timeStats = { avg_minutes: Number(avgMinutes.toFixed(1)), total_minutes: Number(totalMinutes.toFixed(1)) };

        const returningUsersCount = Object.values(userInteractions).filter(count => count > 1).length;
        const totalUsersWithId = Object.keys(userInteractions).length || 1;
        const retentionData = [
            { label: 'New Customers', value: Math.round(((totalUsersWithId - returningUsersCount) / totalUsersWithId) * 100), color: 'bg-teal-500' },
            { label: 'Returning Customers', value: Math.round((returningUsersCount / totalUsersWithId) * 100), color: 'bg-indigo-500' },
        ];

        const mappingData = Object.values(mappingMap).sort((a, b) => b.leads - a.leads).slice(0, 3);

        const activityHeatmap = heatmapRaw.map((dayData, dayIdx) => ({
            day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIdx],
            hours: dayData
        }));

        // Actionable Insights
        const actionableInsights: any[] = [];
        if (locationData.length > 0) {
            actionableInsights.push({
                title: 'High Demand Peak',
                description: `Search volume from ${locationData[0].label} is high. Boost packages for this region!`,
                iconType: 'rocket'
            });
        }
        const mobileShare = deviceBreakdown.find(d => d.label === 'Mobile')?.value || 0;
        if (mobileShare > 50) {
            actionableInsights.push({
                title: 'Optimise Mobile Images',
                description: `${mobileShare}% of traffic is Mobile. Use vertical (9:16) media for better conversion.`,
                iconType: 'lightning'
            });
        }
        const returningShare = retentionData.find(d => d.label === 'Returning Customers')?.value || 0;
        if (returningShare > 20) {
            actionableInsights.push({
                title: 'Returning Customer Opportunity',
                description: `${returningShare}% of users are returning. Launch a "Loyalty Discount"!`,
                iconType: 'star'
            });
        }
        if (actionableInsights.length < 3) {
            actionableInsights.push({
                title: 'Complete Your Profile',
                description: 'Add more details to your agent profile to build trust and increase inquiries.',
                iconType: 'star'
            });
        }

        return {
            trends: trendData || [],
            deviceBreakdown,
            locationData,
            timeStats,
            visitStats: visitStats || [],
            retentionData,
            mappingData: mappingData.length > 0 ? mappingData : null,
            activityHeatmap,
            actionableInsights: actionableInsights.slice(0, 3)
        };
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        return null;
    }
};

/**
 * Fetches metrics for all products of an agent (Total Views, Unique Visitors, Avg Views)
 */
export const getAgentProductMetrics = async (agentId: string) => {
    const { data, error } = await supabase
        .rpc('get_agent_product_metrics', { p_agent_id: agentId });

    if (error) {
        console.error('Error fetching agent product metrics:', error);
        return [];
    }

    return data || [];
};

/**
 * Fetches detailed performance metrics (clicks, time spent) for all products of an agent
 */
export const getAgentDetailedProductMetrics = async (agentId: string) => {
    try {
        const { data, error } = await supabase
            .from('product_interactions')
            .select('product_id, interaction_type, metadata')
            .in('product_id', (
                await supabase.from('listed_products').select('id').eq('business_id', agentId)
            ).data?.map(p => p.id) || []);

        if (error) throw error;

        const metrics: Record<string, { clicks: number, total_time_spent: number }> = {};

        (data || []).forEach((row: any) => {
            if (!metrics[row.product_id]) {
                metrics[row.product_id] = { clicks: 0, total_time_spent: 0 };
            }

            // Check for click
            if (row.interaction_type === 'click') {
                metrics[row.product_id].clicks += 1;
            }

            // Robust check for time spent (either as native type or tagged view)
            // Handle metadata if it comes back as string (some supabase clients/configs)
            let meta = row.metadata;
            if (typeof meta === 'string') {
                try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
            }

            const isTimeSpent = row.interaction_type === 'time_spent' || meta?.original_type === 'time_spent';
            if (isTimeSpent && meta?.duration_seconds) {
                metrics[row.product_id].total_time_spent += Number(meta.duration_seconds);
            }
        });

        return metrics;
    } catch (error) {
        console.error('Error fetching detailed product metrics:', error);
        return {};
    }
};

// ---------------------------------------------------------------------------
// User Personalization Management
// ---------------------------------------------------------------------------

/**
 * Saves or updates user personalization data
 */
export const saveUserPersonalization = async (userId: string, data: any) => {
    try {
        const { error } = await supabase
            .from('user_personalizations')
            .upsert({
                user_id: userId,
                referral_source: data.referral_source,
                city: data.city,
                state: data.state,
                interests: data.interests,
                travel_frequency: data.travel_frequency,
                travel_habits: data.travel_habits,
                budget: data.budget,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error saving user personalization:', error);
        return false;
    }
};

/**
 * Fetches user personalization data
 */
export const getUserPersonalization = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('user_personalizations')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching user personalization:', error);
        return null;
    }
};
