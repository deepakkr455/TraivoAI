import { Template } from './types';

export const TEMPLATES: Template[] = [
    { id: 'luxury', name: 'Elite Voyage', description: 'Serif fonts with elegant overlays.', thumbnail: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=400', isMultiPage: true },
    { id: 'editorial', name: 'Globe Magazine', description: 'Clean, bold typography and white space.', thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400', isMultiPage: true },
    { id: 'adventure', name: 'Nomad Soul', description: 'Rugged, dynamic and vibrant.', thumbnail: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=400', isMultiPage: true },
    { id: 'mosaic', name: 'Picture Perfect', description: 'Focus on multi-image layouts.', thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=400', isMultiPage: true },
    { id: 'chronicle', name: 'Elite Chronicle', description: 'Sophisticated vertical timeline for high-density info.', thumbnail: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=400', isMultiPage: true },
];

export const DEFAULT_FLYER_DATA = {
    title: 'Breathtaking Santorini',
    subtitle: 'A 5-Day Journey Through the Aegean Pearl',
    images: [
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800'
    ],
    itinerary: [
        { day: 'Day 1', title: 'Arrival in Fira', description: 'Sunset dinner overlooking the caldera and exploring local boutiques.', price: '$250' },
        { day: 'Day 2', title: 'Oia Village Walk', description: 'Exploring the iconic blue domes and the marble-paved alleys of Oia.', price: '$120' },
        { day: 'Day 3', title: 'Volcano Boat Tour', description: 'Thermal springs and volcanic hikes across the Nea Kameni.', price: '$180' },
        { day: 'Day 4', title: 'Wine Tasting Tour', description: 'Visiting three traditional wineries with cliffside views.', price: '$150' },
        { day: 'Day 5', title: 'Black Sand Beach', description: 'Relaxation at Perissa Beach followed by a farewell dinner.', price: '$200' }
    ],
    contactEmail: 'hello@voyageflyer.com',
    contactPhone: '+1-555-WANDER',
    website: 'www.wanderhub.com',
    colorTheme: '#0f172a',
    fontFamily: 'serif' as const,
    bgStyle: 'clean' as const,
    layoutPattern: 'modern-collage' as const,
    priceTotal: 'Starting from $1,299'
};

export const THEME_COLORS = [
    { name: 'Midnight', value: '#0f172a' },
    { name: 'Royal Gold', value: '#92400e' },
    { name: 'Emerald Isle', value: '#064e3b' },
    { name: 'Sunset Rose', value: '#881337' },
    { name: 'Oceanic', value: '#0c4a6e' },
    { name: 'Slate', value: '#334155' },
];

export const FONTS = [
    { id: 'sans', name: 'Modern Sans', class: 'font-sans' },
    { id: 'serif', name: 'Elegant Serif', class: 'font-serif' },
    { id: 'display', name: 'Bold Display', class: 'font-black' },
];
