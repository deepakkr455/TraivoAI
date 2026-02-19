export type TemplateId = string;

export interface ItineraryItem {
    day: string;
    title: string;
    description: string;
    price?: string;
}

export interface FlyerData {
    title: string;
    subtitle: string;
    website: string;
    contactEmail: string;
    contactPhone: string;
    priceTotal: string;
    images: string[];
    itinerary: ItineraryItem[];
    colorTheme: string;
    fontFamily: 'sans' | 'serif' | 'display';
    layoutPattern: 'diagonal-slice' | 'editorial' | 'modern-collage' | 'chronicle';
    bgStyle: 'clean' | 'gradient' | 'textured';
    labels?: Record<string, string>;
    duration?: string;
}
