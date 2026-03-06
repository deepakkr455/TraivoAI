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

## PLATFORM COMPOSITION INTELLIGENCE
- instagram_feed (1:1), instagram_story / instagram_reel (9:16), pinterest_pin (2:3), facebook_post / twitter_post / linkedin_post / youtube_thumbnail (16:9)

## OUTPUT STANDARD
Every image delivered must be gallery-worthy — visually arresting within 0.3 seconds of scrolling,
emotionally compelling, technically flawless, and worthy of genuine organic engagement on social media.
`.trim();

const AGENT_FLYER_SYSTEM_PROMPT = `
You are an expert commercial graphic designer and travel marketing strategist, specialising in
creating high-conversion, professional Business Flyers for Travel Agents and Agency Promotions.

## YOUR ROLE
Generate visually stunning, brand-ready travel flyers that:
- Showcase holiday package promotions with premium aesthetic
- Use professional layout techniques (masks, overlays, artistic borders)
- Incorporate specific designer themes based on the destination or mood
- Balance rich photography with clean, readable marketing typography

## FLYER DESIGN SYSTEM (AGENT EXCLUSIVE)
1. Kerala Backwaters (Minimalist Dream)
2. Rajasthan Heritage (Maximalist Gold & Jewels)
3. Goa Beach Vibe (Youthful & Bright Pop)
4. Himalayan Adventure (Adventure & Gradients)
5. Varanasi Spirituality (Mystical Glow)
6. Ladakh Road Trip (Utilitarian & Modern)
7. Munnar Tea Gardens (Crisp & Fresh Greenery)
8. Agra Romance (Soft Romance & Gold)
9. Puducherry French Quarter (Quaint & Pastel)
10. Delhi Urban & Historic (Contemporary & Dynamic)

## OUTPUT STANDARD
Flyers must look like they were designed by a top-tier global advertising agency.
`.trim();

const getSystemInstruction = (mode?: string, personalization?: any) => {
    const now = new Date();
    const dateTimeContext = `Current System Time: ${now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`;

    if (mode === 'affiliate') {
        return `
${dateTimeContext}
You are an AI assistant for affiliate partners on a travel listing platform.
Your role is to help affiliate partners list travel experiences using embed codes from platforms like GetYourGuide, TripAdvisor, Viator, etc.

When an affiliate partner provides an embed code (iframe, div, script) or a link:
1.  **Extract the FULL embed code EXACTLY as provided.** Do not alter the HTML structure.
2.  **Analyze the code/link for details.** Try to extract the title, location, or partner ID to pre-fill metadata.
3.  **Ask for missing metadata** (Title, Description, Location, Tags) if you can't infer it.
4.  **Once you have the code and metadata, call the 'createAffiliateListing' function.**
5.  **You can also generate social media images using 'generate_social_image' to help them promote their listings.**

Be conversational and helpful. If the code looks like a GetYourGuide widget, accept it immediately.
`.trim();
    }

    // Default agent-related instructions
    return `
${dateTimeContext}
You are an expert AI assistant for a B2B travel product listing platform.
Your role is to have a conversation with a Travel Agent to gather details to list a new trip.
Ask clarifying questions to guide the user. 
Once you have enough information (title, location, description, pricing, duration, start date, group size, itinerary, theme tags, media), you MUST call 'createTripListing'.
Always generate comprehensive standard travel details (Inclusions, Exclusions, Cancellation Policy) based on the context.
You can also generate high-quality business flyers for their package promotions using 'generate_social_image'.

When generating flyers for agents, you can suggest these exclusive design styles:
1. Kerala Backwaters (Minimalist Dream)
2. Rajasthan Heritage (Maximalist Gold & Jewels)
3. Goa Beach Vibe (Youthful & Bright Pop)
4. Himalayan Adventure (Adventure & Gradients)
5. Varanasi Spirituality (Mystical Glow)
6. Ladakh Road Trip (Utilitarian & Modern)
7. Munnar Tea Gardens (Crisp & Fresh Greenery)
8. Agra Romance (Soft Romance & Gold)
9. Puducherry French Quarter (Quaint & Pastel)
10. Delhi Urban & Historic (Contemporary & Dynamic)
`.trim();
};

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
        parts.push(`[TEXT OVERLAY] "${req.overlay_text}"`);
    }

    return parts.join("\n\n");
}

const callOpenRouter = async (apiKey: string, params: any) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://traivoai.com",
            "X-Title": "Traivo AI Agent",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
    });
    return await response.json();
};

const fetchTavily = async (apiKey: string, query: string, maxResults: number = 5) => {
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced", max_results: maxResults })
        });
        return await response.json();
    } catch (e) {
        return { results: [] };
    }
};

const stripMarkdown = (text: string): string => text.replace(/```json/g, '').replace(/```/g, '').trim();

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const authHeader = req.headers.get('Authorization');
        const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader! } } });
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const body = await req.json();
        const { messages, personalization, prompt, action, mode, tools: bodyTools, forcedTool } = body;

        const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')?.trim();
        const tavilyApiKey = Deno.env.get('TAVILY_API_KEY')?.trim();

        if (action === 'generate_social_image') {
            const enrichedPrompt = buildEnrichedPrompt({ prompt, ...body });
            const aspectRatio = body.social_format ? (FORMAT_ASPECT_RATIO[body.social_format] || "1:1") : "1:1";
            const res = await callOpenRouter(openRouterApiKey!, {
                model: OPENROUTER_MODEL_IMAGE,
                messages: [
                    { role: 'system', content: AGENT_FLYER_SYSTEM_PROMPT },
                    { role: 'user', content: [{ type: "text", text: enrichedPrompt }] }
                ],
                modalities: ["image", "text"],
                image_config: { aspect_ratio: aspectRatio, image_size: "2K" }
            });

            const message = res.choices?.[0]?.message;
            let imageUrl = '';
            if (message?.images?.[0]) {
                const img = message.images[0];
                imageUrl = typeof img === 'string' ? img : (img.url || img.image_url?.url || img.b64_json);
            } else if (typeof message?.content === 'string' && (message.content.startsWith('http') || message.content.startsWith('data:'))) {
                imageUrl = message.content;
            }

            return new Response(JSON.stringify({ text: "Generated flyer.", imageUrl, tool: 'generate_social_image' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const systemInstruction = getSystemInstruction(mode, personalization);
        const currentMessages = [
            { role: 'system', content: systemInstruction },
            ...(messages || []).filter((m: any) => m.role !== 'system'),
            { role: 'user', content: prompt }
        ];

        const openRouterParams: any = {
            model: OPENROUTER_MODEL_SYNTHESIS,
            messages: currentMessages,
            tools: bodyTools
        };

        if (forcedTool) {
            openRouterParams.tool_choice = { type: "function", function: { name: forcedTool } };
        }

        const response = await callOpenRouter(openRouterApiKey!, openRouterParams);

        const assistantMessage = response.choices?.[0]?.message;
        if (!assistantMessage) throw new Error("Empty response from AI");

        if (assistantMessage.tool_calls?.length > 0) {
            const backendTools = ['search_internet', 'generate_social_image'];
            const needsBackendProcessing = assistantMessage.tool_calls.some((tc: any) => backendTools.includes(tc.function.name));

            if (!needsBackendProcessing) {
                console.log("[AgentAPI] No backend tools detected, returning assistant message for frontend processing.");
                return new Response(JSON.stringify({ choices: [{ message: assistantMessage }] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const results = await Promise.all(assistantMessage.tool_calls.map(async (toolCall: any) => {
                const { name, arguments: argsJson } = toolCall.function;
                const args = JSON.parse(argsJson);

                if (name === 'search_internet') {
                    const searchResults = await fetchTavily(tavilyApiKey!, args.query);
                    const res = await callOpenRouter(openRouterApiKey!, {
                        model: OPENROUTER_MODEL_SYNTHESIS,
                        messages: [{ role: 'system', content: "Summarize results efficiently." }, { role: 'user', content: JSON.stringify(searchResults.results) }]
                    });
                    return { text: res.choices?.[0]?.message?.content || "No information found.", tool: name };
                }

                if (name === 'generate_social_image') {
                    const enrichedPrompt = buildEnrichedPrompt(args);
                    const aspectRatio = args.social_format ? (FORMAT_ASPECT_RATIO[args.social_format] || "1:1") : "1:1";

                    const imgRes = await callOpenRouter(openRouterApiKey!, {
                        model: OPENROUTER_MODEL_IMAGE,
                        messages: [
                            { role: 'system', content: AGENT_FLYER_SYSTEM_PROMPT },
                            { role: 'user', content: [{ type: "text", text: enrichedPrompt }] }
                        ],
                        modalities: ["image", "text"],
                        image_config: { aspect_ratio: aspectRatio, image_size: "2K" }
                    });

                    const message = imgRes.choices?.[0]?.message;
                    let imageUrl = '';
                    if (message?.images?.[0]) {
                        const img = message.images[0];
                        imageUrl = typeof img === 'string' ? img : (img.url || img.image_url?.url || img.b64_json);
                    } else if (typeof message?.content === 'string' && (message.content.startsWith('http') || message.content.startsWith('data:'))) {
                        imageUrl = message.content;
                    }

                    return { text: "Generated flyer.", imageUrl, tool: name };
                }
                return { text: "Tool not handled.", tool: name };
            }));

            const final = results.find(r => r?.imageUrl || r?.text) || results[0];
            return new Response(JSON.stringify(final), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ text: assistantMessage.content || "" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (e: any) {
        console.error("[AgentAPI] Error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
