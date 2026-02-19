
export interface MediaUpload {
    url: string;
    type: 'image' | 'video';
    filename?: string;
    name?: string;
}

export interface PricingOption {
    type: string;
    cost: number;
}

export interface ItineraryItem {
    day: number;
    title: string;
    description: string;
}

export interface Product {
    id: string;
    created_at: string;
    business_id: string;
    status: 'pending' | 'confirmed' | 'rejected' | 'draft';
    views: number;
    clicks: number;
    title: string;
    description: string;
    start_date: string;
    duration: string;
    location: string;
    package_type: string;
    theme_tags: string;
    media_urls: string[];
    itinerary: ItineraryItem[];
    pricing: PricingOption[];
    group_size: string;
    languages: string[];
    reviews: { count: number; source: string };
    inclusions: string[];
    exclusions: string[];
    cancellation_policy: string[];
    terms_conditions: string[];
    things_to_pack: string[];
    things_to_do: string[];
    tax_rate: number;
    advance_payment_percentage: number;
    is_active: boolean;
    is_boosted: boolean;
    recommended_count: number;
    bounce_count: number;
    unique_visitors?: number;
    avg_views?: number;
    total_time_spent?: number;
}

export interface AffiliateListing {
    id: string;
    created_at: string;
    user_id: string;
    embed_code: string;
    source_url: string;
    affiliate_source: string;
    title: string;
    description: string;
    tags: string[];
    country: string;
    state: string;
    city: string;
    is_active: boolean;
    views?: number;
    clicks?: number;
    platform_ranking?: number;
    personal_ranking?: number;
    banner_type?: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai' | 'model' | 'system';
    content: string | any;
    media?: MediaUpload[];
    productCard?: Product;
}

export interface Booking {
    id: string;
    customer_name: string;
    customer_avatar: string;
    product_title: string;
    date: string;
    booking_date: string;
    amount: number;
    status: 'confirmed' | 'pending' | 'cancelled';
    pax: number;
    commission_rate: number;
    commission_amount: number;
    commission_status: 'paid' | 'pending' | 'unpaid';
}

export interface CustomerInquiry {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_avatar: string;
    product: string;
    product_id?: string;
    last_message: string;
    timestamp: string;
    unread: boolean;
    messages?: {
        id: string;
        sender: 'customer' | 'agent';
        text: string;
        time: string;
        media_url?: string;
        media_type?: 'image' | 'video' | 'pdf';
    }[];
    productData?: {
        id: string;
        title: string;
        media_urls: string[];
        location?: string;
        duration?: string;
        pricing?: { cost: number }[];
        group_size?: string;
    };
}

export interface AgentTier {
    id: string;
    name: string;
    daily_quota: number | null;
    query_daily_quota: number | null;
    listings_quota: number | null;
    leads_quota: number | null;
    monthly_price: number;
    quarterly_price: number | null;
    yearly_price: number;
    created_at: string;
}

export interface AgentFeature {
    id: string;
    tier_name: string;
    feature_key: string;
    feature_label: string;
    control_value: string;
    created_at: string;
}

export interface AgentUserSubscription {
    id: string;
    user_id: string;
    tier_name: string;
    status: string;
    current_period_start: string;
    current_period_end: string | null;
    created_at: string;
}
