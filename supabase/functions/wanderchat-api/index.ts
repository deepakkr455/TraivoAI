import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENROUTER_MODEL_SYNTHESIS = "google/gemini-2.0-flash-001";
const OPENROUTER_MODEL_IMAGE = "google/gemini-2.5-flash-preview-05-20";

const IMAGE_SYSTEM_PROMPT = `
You are an elite travel photography director and social media visual strategist, specialising in
creating high-impact, platform-optimised images for Travelers, Bloggers, and Travel Agents.

## YOUR ROLE
Generate visually stunning, emotionally resonant travel images that:
- Inspire genuine wanderlust and desire to explore
- Are perfectly composed and cropped for the specified social media platform
- Authentically and respectfully represent destinations, people, and cultures
- Match the creator's persona — from personal storytelling to professional marketing

## VISUAL EXCELLENCE STANDARDS
Every image must achieve:
- Magazine-quality or award-winning travel photography aesthetics
- Technically correct and intentional composition
- Lighting that elevates the scene: golden hour, blue hour, dramatic natural or soft ambient light
- Rich, purposeful colour grading aligned with the requested mood and palette
- Cultural authenticity in costumes, environments, food presentation, and cultural symbols

## CATEGORY GUIDELINES

### ASPIRATIONAL — Dream & Wonder
Goal: Breathtaking panoramas, iconic landmarks at their most dramatic, pristine natural beauty.
Lighting: Golden hour, blue hour, dramatic clouds, star-filled skies, first light at dawn.
Feel: Awe-inspiring, larger-than-life, deeply share-worthy.

### EMOTIONAL — Connection & Feeling
Goal: Genuine human moments, authentic cultural encounters, joyful and relatable expressions.
Lighting: Soft, warm, natural — flattering and intimate.
Feel: Heartwarming, relatable, authentic, diverse.

### PRACTICAL — Information & Comfort
Goal: Travel logistics shown beautifully, comfort and ease of the journey, preparation and curation.
Lighting: Clean, bright, inviting, aspirational-practical.
Feel: Reassuring, trustworthy, still aspirational.

### PROMOTIONAL — Marketing & Business
Goal: Polished branded visuals, clear messaging hierarchy, professional layouts with strong CTAs.
Lighting: Clean, commercial-grade, high contrast.
Feel: Professional, compelling, action-driving, trustworthy.

## PLATFORM COMPOSITION INTELLIGENCE
- instagram_feed (1:1): Bold centred or rule-of-thirds, high visual impact, everything readable at thumbnail
- instagram_story / instagram_reel (9:16): Strong vertical flow, subject naturally in upper two-thirds, action or text-safe zone below
- pinterest_pin (2:3): Rich vertical composition, layered detail, text-safe lower zone for titles
- facebook_post / twitter_post / linkedin_post / youtube_thumbnail (16:9): Wide establishing shot, strong horizon, bold focal point readable at small display sizes

## PHOTOGRAPHY & STYLE EXECUTION
Apply requested styles with precision and craft:
- photorealistic: Indistinguishable from a real photograph — accurate lens physics, real-world lighting
- cinematic_lighting: Dramatic film-like colour grading, motivated key and fill light, cinematic aspect feel
- aerial_view / drone_shot: True bird's-eye perspective revealing geography and scale
- vintage_travel_poster: Retro illustrated style — bold flat colour blocking, limited palette, graphic appeal
- watercolor_illustration: Soft translucent painted edges, visible brushwork, artistic interpretation
- bokeh_effect: Tack-sharp subject, creamy smooth background with natural circular bokeh
- hdr: Extended tonal range, brilliant detail preserved in both deep shadows and bright highlights
- low_light: Beautiful ambient illumination, visible grain acceptable, mood-forward

## MOOD & ATMOSPHERE EXECUTION
- vibrant: Saturated, energetic, full of life and movement
- serene: Quiet, still, meditative — muted saturation, open sky or water
- adventurous: Bold, daring, dynamic angles — sense of motion and discovery
- romantic: Warm golden light, soft edges, intimate framing
- luxurious: Refined materials, polished surfaces, architectural elegance
- cozy: Intimate scale, warm tungsten light, textures of wool, wood, firelight
- festive: Colourful, crowded, joyful — lights, decorations, celebration energy
- dreamy: Soft haze, slightly desaturated highlights, ethereal and otherworldly
- energetic: Motion blur, dynamic composition, high shutter-speed frozen action

## CULTURAL SENSITIVITY & GUARDRAILS
### ALWAYS
- Represent destinations, peoples, and cultures with dignity, nuance, and authenticity
- Use diverse, inclusive, and realistic representation of travelers and local communities
- Ensure culturally accurate attire, customs, food, and architectural context
- Portray locals as hosts and participants in their culture, not props or exotic backgrounds

### NEVER GENERATE
- Stereotypical, demeaning, or reductive portrayals of any ethnicity, nationality, or culture
- Caricatures, exaggerated features, or mockery of cultural dress or traditions
- Sexualised or exploitative imagery of any person, adult or minor
- Violent, disturbing, graphic, or gore-adjacent imagery of any kind
- Content that could incite discrimination, hatred, or fear of any group

## TEXT OVERLAY EXECUTION
- subtle_caption: Small, elegant, semi-transparent lowercase typography
- bold_banner: High-contrast full-width or partial banner strip
- minimal_tag: Short phrase or hashtag integrated organically
- none: Pure visual, no text whatsoever

## OUTPUT STANDARD
Every image delivered must be gallery-worthy — visually arresting within 0.3 seconds of scrolling,
emotionally compelling, technically flawless, and worthy of genuine organic engagement on social media.
`.trim();

// Agent Flyer prompt moved to agent-listing-api

const getSystemInstruction = (mode?: string, personalization?: any) => {
    const now = new Date();
    const dateTimeContext = `Current System Time: ${now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`;

    // Agent and Affiliate modes moved to agent-listing-api

    let personalizationContext = "";
    if (personalization) {
        personalizationContext = `
USER PERSONALIZATION (Travel DNA):
- Interests/Trip Types: ${Array.isArray(personalization.interests) ? personalization.interests.join(', ') : (personalization.interests || 'Not specified')}
- Base Location: ${personalization.city || 'Not specified'}, ${personalization.state || 'India'}
- Travel Frequency: ${personalization.travel_frequency || 'Not specified'}
- Travel Habits: ${personalization.travel_habits || 'Not specified'}
- Budget Level: ${personalization.budget || 'Not specified'}
- Source: ${personalization.referral_source || 'Not specified'}

Use this information to tailor your suggestions and itineraries automatically. Be proactive and mention these preferences when relevant (e.g., "Since you love adventure...", "Based on your budget...").
`;
    }

    return `
${dateTimeContext}
${personalizationContext}

You are TraivoAI, an intelligent, proactive travel companion embedded inside a multi-feature travel application. Your primary goal is to understand the user’s intent, collect only the required information, and automatically route the conversation to the most relevant feature once sufficient details are available.

--------------------------------
AVAILABLE FEATURES & WHEN TO USE THEM
--------------------------------
1. Trip Plan (Required: Destination, duration/dates, style, PAX)
2. Day Plan (Required: City, date)
3. Weather Forecast (Required: Location)
4. Search Internet (General travel questions)
5. Social Media Post (Required: Prompt/topic)

--------------------------------
CONVERSATION FLOW RULES
--------------------------------
PHASE 1: Detect Intent
PHASE 2: Collect Missing Details
PHASE 3: Feature Redirection

Once all required inputs are collected, clearly switch to the relevant feature and immediately generate the result.
`.trim();
};

// ── Social Media Image Generation Helpers ───────────────────
const FORMAT_ASPECT_RATIO: Record<string, string> = {
    instagram_feed: "1:1",
    instagram_story: "9:16",
    instagram_reel: "9:16",
    pinterest_pin: "2:3",
    facebook_post: "16:9",
    twitter_post: "16:9",
    linkedin_post: "16:9",
    youtube_thumbnail: "16:9",
};

const PHOTO_STYLES: Record<string, string> = {
    photorealistic: "hyper-photorealistic — indistinguishable from a real photograph",
    cinematic_lighting: "cinematic film-like lighting — dramatic motivated light sources",
    candid_shot: "candid documentary photography — unposed, spontaneous",
    documentary_style: "documentary travel photography — raw, unfiltered, authentic reportage",
    aerial_view: "overhead aerial perspective revealing geography and scale",
    drone_shot: "professional drone photography from an elevated angle",
    wide_angle: "wide-angle lens perspective showing expansive environment",
    close_up: "intimate close-up shot revealing subject texture and fine detail",
    macro_photography: "extreme macro — extraordinary detail of small subjects",
    low_light: "low-light photography with beautiful ambient illumination",
    backlit: "backlit photography with glowing rim light or silhouette",
    hdr: "high dynamic range with brilliant detail in shadows and highlights",
    watercolor_illustration: "artistic watercolor illustration — translucent layered washes",
    vector_art: "clean vector graphic art — bold flat colours, crisp geometric shapes",
    minimalist_design: "minimalist aesthetic — generous negative space, restrained palette",
    vintage_travel_poster: "vintage retro travel poster style — bold flat colours",
    cartoon_style: "stylised cartoon illustration — clean outlines, vibrant palette",
};

const MOODS: Record<string, string> = {
    vibrant: "vibrant and energetic atmosphere — saturated colours",
    serene: "serene and peaceful atmosphere — calm, still, meditative",
    adventurous: "adventurous spirit — bold, daring, dynamic angles",
    romantic: "romantic and intimate — warm golden light, soft edges",
    luxurious: "luxury and opulence — refined surfaces, premium quality",
    cozy: "cosy and warm — intimate scale, soft tungsten light",
    festive: "festive and celebratory — colourful, joyful, filled with lights",
    dreamy: "dreamy and ethereal — soft haze, magical quality",
    energetic: "high energy and dynamic — motion, excitement, frozen action",
};

const COLOR_PALETTES: Record<string, string> = {
    warm_tones: "warm colour palette — golden ambers, burnt terracottas",
    cool_tones: "cool colour palette — crisp ocean blues, grey teals",
    pastel_palette: "soft pastel palette — gentle blush pinks, sky blue",
    monochromatic: "monochromatic treatment — single dominant hue with variation",
    colorful: "boldly colourful — full rich spectrum of saturated tones",
    earthy_hues: "earthy natural hues — warm ochre, forest green, desert sandstone",
};

const COMPOSITIONS: Record<string, string> = {
    rule_of_thirds: "rule of thirds — key subject positioned at grid intersections",
    leading_lines: "strong leading lines drawing the eye toward the main subject",
    depth_of_field: "intentional depth of field — clear foreground/background separation",
    bokeh_effect: "beautiful bokeh — sharp subject against creamy blurred background",
    symmetrical: "perfect symmetry — reflective balance",
    asymmetrical_balance: "dynamic asymmetrical balance across the frame",
};

const CREATOR_VOICES: Record<string, string> = {
    traveler: "authentic personal travel photography — raw, storytelling-first",
    blogger: "editorial travel blog visual — aspirational, curated",
    travel_agent: "professional travel industry quality — polished, trustworthy",
    brand: "high-end travel brand marketing visual — premium, refined",
};

const QUALITY_MAP: Record<string, string> = {
    standard: "1K",
    high: "2K",
    ultra: "4K",
};

function buildEnrichedPrompt(req: any): string {
    const parts: string[] = [];

    const categoryFraming: Record<string, string> = {
        aspirational: "ASPIRATIONAL — breathtaking, awe-inspiring imagery",
        emotional: "EMOTIONAL — genuine human connection, authentic moments",
        practical: "PRACTICAL — beautiful travel logistics or comfort",
        promotional: "PROMOTIONAL — polished travel marketing visual",
    };

    if (req.category && categoryFraming[req.category]) {
        parts.push(`[INTENT] ${categoryFraming[req.category]}`);
    }

    if (req.creator_type && CREATOR_VOICES[req.creator_type]) {
        parts.push(`[CREATOR VOICE] ${CREATOR_VOICES[req.creator_type]}`);
    }

    parts.push(`[SCENE] ${req.prompt}`);

    if (req.destination) parts.push(`[DESTINATION] ${req.destination}`);
    if (req.landmark) parts.push(`[LANDMARK] ${req.landmark}`);
    if (req.subjects) parts.push(`[SUBJECTS] ${req.subjects}`);
    if (req.activity) parts.push(`[ACTIVITY] ${req.activity}`);
    if (req.food_culture) parts.push(`[FOOD & CULTURE] ${req.food_culture}`);

    if (req.photography_style && PHOTO_STYLES[req.photography_style]) {
        parts.push(`[PHOTOGRAPHY STYLE] ${PHOTO_STYLES[req.photography_style]}`);
    }

    if (req.mood && MOODS[req.mood]) {
        parts.push(`[MOOD & ATMOSPHERE] ${MOODS[req.mood]}`);
    }

    if (req.color_palette && COLOR_PALETTES[req.color_palette]) {
        parts.push(`[COLOUR PALETTE] ${COLOR_PALETTES[req.color_palette]}`);
    }

    if (req.composition && COMPOSITIONS[req.composition]) {
        parts.push(`[COMPOSITION] ${COMPOSITIONS[req.composition]}`);
    }

    if (req.social_format && FORMAT_ASPECT_RATIO[req.social_format]) {
        parts.push(`[FORMAT] Optimised for ${req.social_format} (${FORMAT_ASPECT_RATIO[req.social_format]})`);
    }

    if (req.overlay_text) {
        parts.push(`[TEXT OVERLAY] "${req.overlay_text}" rendered as ${req.overlay_style || 'subtle_caption'}`);
    }

    if (req.promotional_message) {
        parts.push(`[PROMOTIONAL MESSAGE] "${req.promotional_message}" integrated professionally`);
    }

    if (req.infographic_type) {
        parts.push(`[INFOGRAPHIC ELEMENT] ${req.infographic_type}`);
    }

    const qualityDirectives: Record<string, string> = {
        standard: "high-quality social media photography",
        high: "professional high-resolution travel photography — magazine quality",
        ultra: "ultra-high-resolution, pixel-perfect travel photography",
    };
    parts.push(`[OUTPUT QUALITY] ${qualityDirectives[req.image_quality || "high"]}`);

    if (req.additional_context) {
        parts.push(`[ADDITIONAL CONTEXT] ${req.additional_context}`);
    }

    parts.push(`[CONTENT GUARDRAILS] Ensure the image is culturally respectful, dignified, and inclusive. No inappropriate content.`);

    return parts.join("\n\n");
}

const tools: any[] = [
    {
        type: "function",
        function: {
            name: 'create_trip_plan',
            description: 'Generates a detailed, day-by-day travel itinerary based on user specifications.',
            parameters: {
                type: "object",
                properties: {
                    destination: { type: "string", description: 'The city or state in India for the trip.' },
                    departureCity: { type: "string", description: 'The city the user is starting from.' },
                    duration: { type: "string", description: 'The total duration of the trip, e.g., "5 days".' },
                    pax: { type: "integer", description: 'Number of people traveling.' },
                    interests: { type: "string", description: 'User interests.' },
                },
                required: ['destination', 'departureCity', 'duration', 'pax'],
            },
        }
    },
    {
        type: "function",
        function: {
            name: 'search_internet',
            description: 'Searches the internet for up-to-date information.',
            parameters: {
                type: "object",
                properties: { query: { type: "string" } },
                required: ['query'],
            },
        }
    },
    {
        type: "function",
        function: {
            name: 'get_weather_forecast',
            description: 'Get current weather and 3-day forecast for a location. Use this ONLY for direct weather queries.',
            parameters: {
                type: "object",
                properties: { location: { type: "string" } },
                required: ['location'],
            },
        }
    },
    {
        type: "function",
        function: {
            name: 'generate_day_plan',
            description: 'Generate a 1-day itinerary with exact coordinates for a map. Use this for "Day Plans", "What to do today", or "Show me a map of X".',
            parameters: {
                type: "object",
                properties: { location: { type: "string" } },
                required: ['location'],
            },
        }
    },
    {
        type: "function",
        function: {
            name: 'generate_social_image',
            description: 'Generates a stunning, platform-optimized social media image for travel content.',
            parameters: {
                type: "object",
                properties: {
                    prompt: { type: "string", description: 'Detailed visual description (e.g. "sunset in Bali").' },
                    category: { type: "string", enum: ["aspirational", "emotional", "practical", "promotional"] },
                    creator_type: { type: "string", enum: ["traveler", "blogger", "travel_agent", "brand"] },
                    social_format: { type: "string", enum: ["instagram_feed", "instagram_story", "instagram_reel", "pinterest_pin", "facebook_post", "twitter_post", "linkedin_post", "youtube_thumbnail"] },
                    photography_style: { type: "string", enum: ["photorealistic", "cinematic_lighting", "candid_shot", "documentary_style", "aerial_view", "drone_shot", "wide_angle", "close_up", "macro_photography", "fisheye_lens", "low_light", "backlit", "hdr", "watercolor_illustration", "vector_art", "minimalist_design", "vintage_travel_poster", "cartoon_style"] },
                    mood: { type: "string", enum: ["vibrant", "serene", "adventurous", "romantic", "luxurious", "cozy", "festive", "dreamy", "energetic"] },
                    color_palette: { type: "string", enum: ["warm_tones", "cool_tones", "pastel_palette", "monochromatic", "colorful", "earthy_hues"] },
                    composition: { type: "string", enum: ["rule_of_thirds", "leading_lines", "depth_of_field", "bokeh_effect", "symmetrical", "asymmetrical_balance"] },
                    destination: { type: "string" },
                    landmark: { type: "string" },
                    subjects: { type: "string" },
                    activity: { type: "string" },
                    food_culture: { type: "string" },
                    overlay_text: { type: "string" },
                    overlay_style: { type: "string", enum: ["subtle_caption", "bold_banner", "minimal_tag", "none"] },
                    promotional_message: { type: "string" },
                    infographic_type: { type: "string" },
                    image_quality: { type: "string", enum: ["standard", "high", "ultra"] },
                    additional_context: { type: "string" }
                },
                required: ['prompt'],
            },
        }
    }
];

const tripPlanSchema = {
    type: "object",
    properties: {
        heroImageText: { type: "string" },
        title: { type: "string" },
        dates: { type: "string" },
        departureCity: { type: "string" },
        stats: { type: "object", properties: { duration: { type: "string" }, weather: { type: "string" }, transport: { type: "string" }, stay: { type: "string" }, distance: { type: "string" } }, required: ['duration', 'weather', 'transport', 'stay', 'distance'] },
        dailyItinerary: { type: "array", items: { type: "object", properties: { day: { type: "integer" }, title: { type: "string" }, items: { type: "array", items: { type: "object", properties: { time: { type: "string" }, activity: { type: "string" }, description: { type: "string" }, cost: { type: "number" }, icon: { type: "string" } }, required: ['time', 'activity', 'description', 'icon', 'cost'] } } }, required: ['day', 'title', 'items'] } },
        bookings: { type: "array", items: { type: "object", properties: { type: { type: "string" }, title: { type: "string" }, details: { type: "string" }, bookingSite: { type: "string" }, bookingUrl: { type: "string" }, alternatives: { type: "array", items: { type: "object", properties: { name: { type: "string" }, url: { type: "string" } } } }, imageUrl: { type: "string" }, price: { type: "string" }, priceNum: { type: "number" } }, required: ['type', 'title', 'details', 'bookingSite', 'bookingUrl', 'alternatives', 'imageUrl', 'price', 'priceNum'] } },
        recommendations: { type: "array", items: { type: "object", properties: { type: { type: "string" }, title: { type: "string" }, description: { type: "string" }, icon: { type: "string" } }, required: ['type', 'title', 'description', 'icon'] } },
    },
    required: ['heroImageText', 'title', 'dates', 'stats', 'dailyItinerary', 'bookings', 'recommendations']
};

const weatherSchema = {
    type: "object",
    properties: {
        location: { type: "string" },
        current: {
            type: "object",
            properties: {
                temp: { type: "number" },
                condition: { type: "string" },
                high: { type: "number" },
                low: { type: "number" },
                feelsLike: { type: "number" },
                humidity: { type: "string" },
                wind: { type: "string" },
                uvIndex: { type: "string" },
                visibility: { type: "string" },
                pressure: { type: "string" },
                airQuality: { type: "string" },
                precipitation: { type: "string" },
                localTime: { type: "string" }
            },
            required: ['temp', 'condition', 'high', 'low']
        },
        forecast: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    day: { type: "string" },
                    temp: { type: "number" },
                    condition: { type: "string" }
                },
                required: ['day', 'temp', 'condition']
            }
        },
        projection: { type: "string" },
        travelRecommendations: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    place: { type: "string" },
                    description: { type: "string" },
                    reason: { type: "string" }
                },
                required: ['place', 'description', 'reason']
            }
        },
        news: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    url: { type: "string" },
                    source: { type: "string" }
                },
                required: ['title', 'url', 'source']
            }
        }
    },
    required: ['location', 'current', 'forecast']
};

const dayPlanSchema = {
    type: "object",
    properties: {
        locationName: { type: "string" },
        weather: { type: "object", properties: { description: { type: "string" }, temperature: { type: "string" }, icon: { type: "string" } }, required: ["description", "temperature", "icon"] },
        itinerary: { type: "array", items: { type: "object", properties: { type: { type: "string", enum: ["activity"] }, time: { type: "string" }, name: { type: "string" }, description: { type: "string" }, latitude: { type: "number" }, longitude: { type: "number" } }, required: ['type', 'time', 'name', 'description', 'latitude', 'longitude'] } }
    },
    required: ["locationName", "weather", "itinerary"]
};

const stripMarkdown = (text: string): string => text.replace(/```json/g, '').replace(/```/g, '').trim();

const callOpenRouter = async (apiKey: string, params: any) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://traivoai.com",
            "X-Title": "Traivo AI",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
    });
    return await response.json();
};

const fetchTavily = async (apiKey: string, query: string, maxResults: number = 5) => {
    console.log(`[WanderChat] Fetching Tavily for: ${query} (max: ${maxResults})`);
    if (!apiKey) {
        console.error("[WanderChat] Tavily API Key is missing in fetchTavily");
        return { results: [] };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: maxResults }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[WanderChat] Tavily API Error (${response.status}):`, errorText);
            return { results: [] };
        }

        const data = await response.json();
        console.log(`[WanderChat] Tavily Success: Found ${data.results?.length || 0} results`);
        return data;
    } catch (e: any) {
        clearTimeout(timeoutId);
        const isTimeout = e.name === 'AbortError';
        console.error(`[WanderChat] Tavily Fetch ${isTimeout ? 'Timeout' : 'Exception'}:`, e.message);
        return { results: [] };
    }
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const authHeader = req.headers.get('Authorization');
        const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader! } } });
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const body = await req.json();
        const { messages, personalization, prompt, action, mode, tools: bodyTools, forcedTool } = body;
        console.log(`[WanderChat] Action: ${action || 'chat'} - Mode: ${mode || 'default'}`);

        const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')?.trim();
        const tavilyApiKey = Deno.env.get('TAVILY_API_KEY')?.trim();

        if (!openRouterApiKey) throw new Error('OPENROUTER_API_KEY is not set in Supabase Secrets');
        if (!tavilyApiKey) throw new Error('TAVILY_API_KEY is not set in Supabase Secrets');

        if (action === 'generate_image') {
            console.log("[WanderChat] Action: generate_image");
            const systemPrompt = IMAGE_SYSTEM_PROMPT;
            const res = await callOpenRouter(openRouterApiKey, {
                model: OPENROUTER_MODEL_IMAGE,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: [{ type: "text", text: prompt }] }
                ],
                modalities: ["image", "text"]
            });
            return new Response(JSON.stringify(res), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'generate_social_image') {
            const { ...rest } = body;
            console.log("[WanderChat] Direct Action: generate_social_image");

            const enrichedPrompt = buildEnrichedPrompt({ prompt, personalization, ...rest });
            const aspectRatio = body.social_format ? (FORMAT_ASPECT_RATIO[body.social_format] || "1:1") : (body.aspect_ratio || "1:1");
            const imageSize = QUALITY_MAP[body.image_quality || 'high'] || "2K";

            const systemPrompt = IMAGE_SYSTEM_PROMPT;
            const imgRes = await callOpenRouter(openRouterApiKey, {
                model: OPENROUTER_MODEL_IMAGE,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: [{ type: "text", text: enrichedPrompt }] }
                ],
                modalities: ["image", "text"],
                image_config: { aspect_ratio: aspectRatio, image_size: imageSize }
            });

            const message = imgRes.choices?.[0]?.message;
            let imageUrl = '';
            if (message?.images?.[0]) {
                const img = message.images[0];
                imageUrl = typeof img === 'string' ? img : (img.url || img.image_url?.url || img.b64_json);
            } else if (typeof message?.content === 'string' && (message.content.startsWith('http') || message.content.startsWith('data:'))) {
                imageUrl = message.content;
            }

            return new Response(JSON.stringify({
                text: `Here is your social media image for "${prompt}".`,
                imageUrl,
                tool: 'generate_social_image'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'proxy_image') {
            const { bucket, path } = body;
            console.log(`[WanderChat] Action: proxy_image - Bucket: ${bucket}, Path: ${path}`);
            if (!bucket || !path) throw new Error('Bucket and Path are required for proxy_image');

            const { data, error } = await supabaseClient.storage.from(bucket).download(path);
            if (error) {
                console.error("[WanderChat] Proxy Image Error:", error);
                throw error;
            }

            const contentType = data.type || 'image/jpeg';
            return new Response(data, {
                headers: {
                    ...corsHeaders,
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable'
                }
            });
        }

        if (action === 'parse_itinerary') {
            console.log("[WanderChat] Action: parse_itinerary");
            const res = await callOpenRouter(openRouterApiKey, { model: OPENROUTER_MODEL_SYNTHESIS, response_format: { type: "json_object" }, messages: [{ role: 'system', content: "Extract itinerary JSON." }, { role: 'user', content: prompt }] });
            return new Response(JSON.stringify(res), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const systemInstruction = getSystemInstruction(mode, personalization);

        // Security: Filter out malicious system messages or instructions override Attempt
        const safeMessages = (messages || []).filter((m: any) => m.role !== 'system');

        // Security: Prevent instruction-overwrite patterns
        const injectionPatterns = [
            /ignore\s+(all\s+)?previous\s+instructions?/i,
            /forget\s+all\s+instructions/i,
            /system\s+prompt/i,
            /you\s+are\s+now/i
        ];

        const hasInjection = safeMessages.some((m: any) =>
            typeof m.content === 'string' && injectionPatterns.some(p => p.test(m.content))
        );

        if (hasInjection) {
            console.error("[WanderChat] Security: Injection pattern detected in messages.");
            return new Response(JSON.stringify({ error: "Suspicious activity detected. Request blocked." }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const currentMessages = [
            { role: 'system', content: systemInstruction },
            ...safeMessages,
            { role: 'user', content: prompt }
        ];

        const openRouterParams: any = {
            model: OPENROUTER_MODEL_SYNTHESIS,
            messages: currentMessages,
            tools: bodyTools || tools
        };

        if (forcedTool) {
            console.log(`[WanderChat] Forcing tool choice: ${forcedTool}`);
            openRouterParams.tool_choice = { type: "function", function: { name: forcedTool } };
        }

        console.log("[WanderChat] Calling OpenRouter Model:", OPENROUTER_MODEL_SYNTHESIS);
        const response = await callOpenRouter(openRouterApiKey, openRouterParams);

        if (!response.choices || response.choices.length === 0) {
            console.error("[WanderChat] OpenRouter Response Error:", JSON.stringify(response));
            throw new Error(response.error?.message || "Empty response from AI service");
        }

        const assistantMessage = response.choices[0].message;

        if (assistantMessage.tool_calls?.length > 0) {
            console.log(`[WanderChat] Tool Calls Detected: ${assistantMessage.tool_calls.map((tc: any) => tc.function.name).join(', ')}`);

            // Separate tools handled here from those to be handled by the frontend
            const backendTools = ['create_trip_plan', 'get_weather_forecast', 'generate_day_plan', 'search_internet', 'generate_social_image'];
            const needsBackendProcessing = assistantMessage.tool_calls.some((tc: any) => backendTools.includes(tc.function.name));

            if (!needsBackendProcessing) {
                console.log("[WanderChat] No backend tools detected, returning assistant message for frontend processing.");
                return new Response(JSON.stringify({ choices: [{ message: assistantMessage }] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const results = await Promise.all(assistantMessage.tool_calls.map(async (toolCall: any) => {
                const { name, arguments: argsJson } = toolCall.function;
                let args: any = {};
                try {
                    args = JSON.parse(argsJson);
                } catch (e) {
                    console.error(`[WanderChat] Failed to parse args for ${name}:`, argsJson);
                }
                console.log(`[WanderChat] Executing Tool: ${name} with args:`, argsJson);

                if (name === 'create_trip_plan') {
                    const searchResults = await fetchTavily(tavilyApiKey, `Hotels in ${args.destination} for ${args.pax} pax`).catch(() => ({ results: [] }));
                    console.log(`[WanderChat] Tavily Search results found: ${searchResults.results?.length || 0}`);

                    const planRes = await callOpenRouter(openRouterApiKey, { model: OPENROUTER_MODEL_SYNTHESIS, response_format: { type: "json_object" }, messages: [{ role: 'system', content: systemInstruction }, ...safeMessages, { role: 'user', content: `Plan ${args.duration} to ${args.destination}. Context: ${JSON.stringify(searchResults.results)}. Schema: ${JSON.stringify(tripPlanSchema)}` }] });

                    if (!planRes.choices?.[0]?.message?.content) throw new Error("Failed to generate plan content");

                    const planData = JSON.parse(stripMarkdown(planRes.choices[0].message.content));
                    console.log("[WanderChat] Plan generated, fetching hero image...");

                    let imgRes = await callOpenRouter(openRouterApiKey, { model: OPENROUTER_MODEL_IMAGE, messages: [{ role: 'user', content: `Hero image for ${planData.title}` }] });
                    console.log("[WanderChat] Hero image response (full):", JSON.stringify(imgRes));

                    const message = imgRes.choices?.[0]?.message;
                    let imageUrl = '';

                    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
                        const img = message.images[0];
                        imageUrl = typeof img === 'string' ? img : (img.url || img.image_url?.url || img.b64_json);
                    } else if (typeof message?.content === 'string' && (message.content.startsWith('http') || message.content.startsWith('data:'))) {
                        imageUrl = message.content;
                    }

                    if (imageUrl) {
                        planData.heroImageUrl = imageUrl;
                        console.log("[WanderChat] Hero image URL extracted:", imageUrl.substring(0, 100) + "...");
                    }

                    return { plan: planData, heroImage: message, tool: name };
                }

                if (name === 'get_weather_forecast') {
                    console.log(`[WanderChat] Fetching weather & AQI via Tavily for: ${args.location}`);
                    const searchResults = await fetchTavily(tavilyApiKey, `Current weather, 5-day forecast, AQI, and local travel news for ${args.location}`, 8).catch(() => ({ results: [] }));

                    const weatherRes = await callOpenRouter(openRouterApiKey, {
                        model: OPENROUTER_MODEL_SYNTHESIS,
                        response_format: { type: "json_object" },
                        messages: [
                            {
                                role: 'system', content: `
Generate a HIGH-FIDELITY weather report JSON.
STRICT REQUIREMENTS:
1. Provide a full 5-day forecast list.
2. Include a numeric AQI (Air Quality Index) value in 'current.airQuality'.
3. Populate 'travelRecommendations' with 3 specific places and reasons.
4. Populate 'news' with 2-3 real weather-related headlines or alerts from the context.
Schema: ${JSON.stringify(weatherSchema)}
`.trim()
                            },
                            { role: 'user', content: `Weather report for ${args.location}. Context: ${JSON.stringify(searchResults.results)}` }
                        ]
                    });
                    const finalWeather = JSON.parse(stripMarkdown(weatherRes.choices?.[0]?.message?.content || '{}'));
                    console.log("[WanderChat] Weather synthesis complete.");
                    return { weather: finalWeather, tool: name };
                }

                if (name === 'generate_day_plan') {
                    console.log(`[WanderChat] Fetching high-depth activities for: ${args.location}`);
                    const searchResults = await fetchTavily(tavilyApiKey, `Top attractions in ${args.location} for a 1-day trip with latitude and longitude`, 10).catch(() => ({ results: [] }));
                    console.log(`[WanderChat] Quality options found: ${searchResults.results?.length || 0}`);

                    const dayRes = await callOpenRouter(openRouterApiKey, {
                        model: OPENROUTER_MODEL_SYNTHESIS,
                        response_format: { type: "json_object" },
                        messages: [
                            {
                                role: 'system', content: `
You are a high-end travel concierge. Generate a realistic, grounded 1-day itinerary JSON.
STRICT NEGATIVE CONSTRAINTS:
- DO NOT generate "travel", "driving", "transit", or "break" stops.
- ONLY generate "activity" stops that represent specific, named landmarks or establishments.
- NEVER use generic labels like "Driving to Next Stop", "Previous Stop", "Lunch", "Break", or "Free Time".
- Every stop MUST be a specific, named landmark or establishment from the search results.
- DO NOT invent coordinates; use the most accurate ones you can find or infer for the specific landmark.

DATA EXTRACTION:
- Pull specific names and descriptions from the provided search context.
- If the context mentions "Gateway of India", use that exact name.

SCHEMA:
${JSON.stringify(dayPlanSchema)}

EXAMPLE OF GOOD ITEM:
{ "type": "activity", "time": "10:00 AM", "name": "The British Museum", "description": "Explore world history and culture...", "latitude": 51.5194, "longitude": -0.1270 }
`.trim()
                            },
                            { role: 'user', content: `Create a detailed Day Plan for ${args.location} using this context: ${JSON.stringify(searchResults.results)}` }
                        ]
                    });
                    const finalResult = JSON.parse(stripMarkdown(dayRes.choices?.[0]?.message?.content || '{}'));
                    console.log("[WanderChat] Day Plan Result JSON (RAW):", JSON.stringify(finalResult, null, 2));
                    console.log("[WanderChat] High-fidelity Day Plan generated.");
                    return { dayPlan: finalResult, tool: name };
                }

                if (name === 'search_internet') {
                    const searchResults = await fetchTavily(tavilyApiKey, args.query).catch(() => ({ results: [] }));
                    console.log(`[WanderChat] Internet Search results found: ${searchResults.results?.length || 0}`);

                    const res = await callOpenRouter(openRouterApiKey, {
                        model: OPENROUTER_MODEL_SYNTHESIS,
                        messages: [
                            { role: 'system', content: "Synthesize the following search results into a detailed, helpful answer. Include relevant links if available." },
                            { role: 'user', content: `Query: ${args.query}\nContext: ${JSON.stringify(searchResults.results)}` }
                        ]
                    });

                    const sources = (searchResults.results || []).map((r: any) => ({ uri: r.url, title: r.title }));
                    return { text: res.choices?.[0]?.message?.content || "No information found.", tool: name, sources };
                }

                if (name === 'generate_social_image') {
                    console.log(`[WanderChat] Generating social media image for: ${args.prompt}`);
                    const enrichedPrompt = buildEnrichedPrompt(args);
                    const aspectRatio = args.social_format ? (FORMAT_ASPECT_RATIO[args.social_format] || "1:1") : (args.aspect_ratio || "1:1");
                    const imageSize = QUALITY_MAP[args.image_quality || 'high'] || "2K";

                    const systemPrompt = IMAGE_SYSTEM_PROMPT;
                    const imgRes = await callOpenRouter(openRouterApiKey, {
                        model: OPENROUTER_MODEL_IMAGE,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: [{ type: "text", text: enrichedPrompt }] }
                        ],
                        modalities: ["image", "text"],
                        image_config: { aspect_ratio: aspectRatio, image_size: imageSize }
                    });

                    const message = imgRes.choices?.[0]?.message;
                    let imageUrl = '';

                    console.log("[WanderChat] Image Generation Response choices:", JSON.stringify(imgRes.choices));

                    if (message?.images?.[0]) {
                        const img = message.images[0];
                        imageUrl = typeof img === 'string' ? img : (img.url || img.image_url?.url || img.b64_json);
                    } else if (typeof message?.content === 'string' && (message.content.startsWith('http') || message.content.startsWith('data:'))) {
                        imageUrl = message.content;
                    }

                    if (!imageUrl && imgRes.error) {
                        console.error("[WanderChat] Image Generation Model Error:", imgRes.error);
                    }

                    console.log("[WanderChat] Final Extracted Image URL:", imageUrl ? (imageUrl.substring(0, 50) + "...") : "NONE");

                    return { text: `Here is your social media image for "${args.prompt}".`, imageUrl, tool: name };
                }

                // Fallback for tools not explicitly handled but registered as backend tools
                return { text: `Tool ${name} called but no specific handler implemented yet in backend.`, tool: name };
            }));
            const final = results.find(r => r?.plan || r?.dayPlan || r?.weather || r?.text) || results[0];
            console.log(`[WanderChat] Returning Tool Result: ${final?.tool}`);
            return new Response(JSON.stringify(final || { error: "No tool results produced" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }


        console.log("[WanderChat] Returning direct text response.");
        return new Response(JSON.stringify({ text: assistantMessage.content || "" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (e: any) {
        console.error("[WanderChat] Edge Function Exception:", e.message);
        return new Response(JSON.stringify({ error: e.message || "Internal Server Error" }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
