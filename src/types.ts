export interface UserPersonalization {
  referral_source: string;
  city: string;
  state: string;
  interests: string[];
  travel_frequency: string;
  budget: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  sessionId: string;
  personalization?: UserPersonalization;
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  content: string;
  imageUrl?: string;
  location?: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  comments: Comment[];
}

export interface Activity {
  time: string;
  description: string;
  details?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: Activity[];
}

export interface TravelPlan {
  destination: string;
  duration: string;
  budget: string;
  itinerary: ItineraryDay[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  sources?: GroundingSource[];
}

export interface GroundingSource {
  uri: string;
  title: string;
}

// Types for Group Planner (matching Supabase schema)
export interface PlanMember {
  id: string;
  plan_id: string;
  user_id: string;
  user_name: string; // Denormalized for display
  created_at: string;
}

export interface Invitation {
  id: string;
  plan_id: string;
  invited_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface Vote {
  id: string;
  proposal_id: string;
  user_id: string;
  created_at: string;
}

export interface Proposal {
  id: string;
  plan_id: string;
  user_id: string;
  user_name: string;
  category: 'DATES' | 'PLACES' | 'ACCOMMODATION';
  title: string;
  created_at: string;
  votes: Vote[]; // Joined data
}

export interface Expense {
  id: string;
  plan_id: string;
  user_id: string;
  user_name: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface Doubt {
  id: string;
  plan_id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export interface GroupPlan {
  id: string;
  owner_id: string;
  destination: string;
  dates: string;
  description: string;
  status: 'planning' | 'ongoing' | 'completed' | 'invite' | 'collaboration' | 'journey-started' | 'expense' | 'concluded';
  created_at: string;
  // These are joined from other tables
  plan_members: PlanMember[];
  invitations: Invitation[];
  proposals: Proposal[];
  expenses: Expense[];
  doubts: Doubt[];
}

// DB row types (used only inside the page)
export interface DbPost {
  id: number;
  user_id: string;
  content: string;
  image_url: string | null;
  location: string | null;
  created_at: string;
}
export interface DbLike {
  id: number;
  post_id: number;
  user_id: string;
  created_at: string;
}
export interface DbComment {
  id: number;
  post_id: number;
  user_id: string;
  text: string;
  created_at: string;
}

// FIX: Add type definitions for Vite environment variables to resolve TypeScript errors.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_SUPABASE_URL: string;
      readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
      readonly DEV: boolean;
      readonly MODE: string;
    };
  }
}
// ###########################################################################

import type { ReactNode } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: MessageContent;
}

export interface SuggestionChipProps {
  onChipClick: (prompt: string) => void;
}

export interface ChatInputProps {
  onSend: (prompt: string) => void;
  isLoading: boolean;
  onAction?: (action: 'plan' | 'weather' | 'map' | 'flyer') => void;
  forcedTool?: string | null;
  onSetForcedTool?: (tool: string | null) => void;
  value?: string;
  onChange?: (value: string) => void;
  limitMessage?: string | null;
}

export interface DailyItineraryItem {
  time: string;
  activity: string;
  description: string;
  icon: string;
}

export interface Booking {
  type: 'Transport' | 'Hotel';
  title: string;
  details: string;
  bookingSite: string;
  bookingUrl: string;
  alternatives: { name: string; url: string }[];
  imageUrl: string;
  price?: string; // Real price if available
}

export interface Recommendation {
  type: 'Crucial Traveler Tip' | 'Hidden Gem';
  title: string;
  description: string;
  icon: string;
}

export interface TripPlanData {
  heroImageText: string;
  heroImageUrl?: string;
  title: string;
  dates: string;
  confirmedDates?: boolean;
  budget?: {
    total: string;
    perPerson: string;
    currency: string;
  };
  participants?: number;
  departureCity?: string;
  departureDate?: string;
  stats: {
    duration: string;
    weather: string;
    transport: string;
    stay: string;
    distance: string;
  };
  dailyItinerary: {
    day: number;
    title: string;
    items: {
      time: string;
      activity: string;
      description: string;
      icon: string;
    }[];
  }[];
  bookings: Booking[];
  recommendations: {
    type: 'Crucial Traveler Tip' | 'Hidden Gem';
    title: string;
    description: string;
    icon: string;
  }[];
}
export interface MessageContent {
  text?: string;
  plan?: TripPlanData;
  dayPlan?: DayPlan;
  weather?: WeatherData;
  imageUrl?: string;
  sources?: { uri: string; title: string; }[];
  isLimit?: boolean;
}

export interface WeatherData {
  location: string;
  current: {
    temp: number;
    condition: string;
    high: number;
    low: number;
    feelsLike: number;
    humidity: string;
    wind: string;
    uvIndex: string;
    visibility: string;
    pressure: string;
    airQuality: string;
    precipitation: string;
    localTime: string;
  };
  forecast: {
    day: string;
    temp: number;
    condition: string;
  }[];
  projection: string;
  travelRecommendations: {
    place: string;
    description: string;
    reason: string;
  }[];
  news: {
    title: string;
    url: string;
    source: string;
  }[];
  groundingUrls: string[];
}

export interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
}

export type ItineraryEvent = {
  type: 'activity' | 'travel';
  time?: string;
  name?: string;
  description?: string;
  duration?: string;
  latitude?: number;
  longitude?: number;
  from?: string;
  to?: string;
  mode?: 'driving' | 'walking';
};

export interface ActivityEvent extends ItineraryEvent {
  type: 'activity';
  latitude: number;
  longitude: number;
  name: string;
}

export interface WeatherInfo {
  description: string;
  temperature: string;
  icon: 'sunny' | 'cloudy' | 'rainy' | 'partly-cloudy' | 'snowy' | 'windy';
}

export interface DayPlan {
  locationName: string;
  weather: WeatherInfo;
  itinerary: ItineraryEvent[];
}


// ####################################


export interface MediaUpload {
  name: string;
  type: 'image' | 'video';
  url: string; // This would be the Supabase Storage URL
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  media?: MediaUpload[];
  productCard?: Product;
}

export interface ItineraryItem {
  day: number;
  title: string;
  description: string;
}

export interface PricingOption {
  type: string; // e.g., "Quad Sharing", "Triple Sharing"
  cost: number;
}

export interface Product {
  id: string;
  created_at: string;
  business_id: string;
  title: string;
  description: string; // Package Overview
  start_date: string;
  duration: string;
  location: string;
  package_type: string; // e.g., "Specific Tour"
  theme_tags: string; // Comma-separated tags
  media_urls: string[];
  itinerary: ItineraryItem[];
  pricing: PricingOption[];
  group_size: string;
  languages: string[];
  reviews: {
    count: number;
    source: string;
  };
  status: 'pending' | 'confirmed' | 'rejected' | 'draft';

  // Standard Terminologies & Policies
  inclusions: string[];
  exclusions: string[];
  cancellation_policy: string[];
  terms_conditions: string[];
  things_to_pack: string[];
  things_to_do: string[]; // Key Highlights

  // Financials
  tax_rate: number; // e.g., 5 for 5% GST
  advance_payment_percentage: number; // e.g., 30 for 30%

  // Analytics
  views?: number;
  clicks?: number;
  recommended_count?: number; // How often AI recommended it
  bounce_count?: number; // Visitors who left without action

  // Agent Controls
  is_active?: boolean;
  is_boosted?: boolean;
}

export interface Booking {
  id: string;
  customer_name: string;
  customer_avatar?: string;
  product_title: string;
  date: string; // Travel date
  booking_date: string; // Date booking was made
  amount: number; // Total booking value
  status: 'confirmed' | 'pending' | 'cancelled';
  pax: number;
  // Commission Logic
  commission_rate: number; // e.g., 5 for 5%
  commission_amount: number;
  commission_status: 'paid' | 'unpaid';
}

export interface CustomerInquiry {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar: string;
  product: string;
  product_id?: string;
  trip_id?: string;
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

export interface AffiliateListing {
  id: string;
  created_at: string;
  user_id: string;

  // Embed Link
  embed_code: string;
  source_url?: string;
  affiliate_source?: string;

  // Metadata
  title: string;
  description?: string;
  tags?: string[];

  // Location
  country?: string;
  state?: string;
  city?: string;

  // Status
  is_active: boolean;

  // Analytics
  views?: number;
  clicks?: number;
  platform_ranking?: number;
  personal_ranking?: number;
  link_health?: 'active' | 'broken' | 'inactive';
}

export interface AffiliateAnalytics {
  id: string;
  listing_id: string;
  date: string;
  impressions: number;
  clicks: number;
  unique_visitors: number;
  metrics: {
    device_split?: Record<string, number>;
    geo_data?: Record<string, number>;
    heatmaps?: any;
    engagement?: {
      avg_time_seconds?: number;
      return_visitor_rate?: number;
    };
    ai_insights?: string[];
  };
}

export interface Subscription {
  id: string;
  name: string;
  daily_quota: number | null;
  monthly_quota: number | null;
  monthly_price: number | null;
  quarterly_price: number | null;
  created_at: string;
}

export interface FeatureUsageControl {
  id: string;
  plan_name: string;
  feature_key: string;
  feature_label: string;
  control_value: string;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
  created_at: string;
}
