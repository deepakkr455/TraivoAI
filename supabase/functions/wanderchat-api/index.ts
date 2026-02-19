import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENROUTER_MODEL_SYNTHESIS = "google/gemini-3-flash-preview";
const OPENROUTER_MODEL_IMAGE = "google/gemini-2.5-flash-image-preview";

const getSystemInstruction = (personalization?: any) => {
    const now = new Date();
    const dateTimeContext = `Current System Time: ${now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`;

    let personalizationContext = "";
    if (personalization) {
        personalizationContext = `
USER PERSONALIZATION (Travel DNA):
- Preferred Trip Types: ${personalization.tripTypes || 'Not specified'}
- Base Location: ${personalization.location?.state || 'Not specified'}, ${personalization.location?.country || 'India'}
- Travel Vibe/Excitement: ${personalization.excitement || 'Not specified'}
- Daily Pace: ${personalization.pace || 'Not specified'}
- Budget Level: ${personalization.budget || 'Not specified'}

Use this information to tailor your suggestions and itineraries automatically.
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

--------------------------------
CONVERSATION FLOW RULES
--------------------------------
PHASE 1: Detect Intent
PHASE 2: Collect Missing Details
PHASE 3: Feature Redirection

Once all required inputs are collected, clearly switch to the relevant feature and immediately generate the result.
`.trim();
};

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
            "HTTP-Referer": "https://wanderhub.ai",
            "X-Title": "WanderHub",
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

        const { action, prompt, messages, personalization, forcedTool } = await req.json();
        console.log(`[WanderChat] Incoming Request - Action: ${action || 'chat'}, Prompt: ${prompt?.substring(0, 50)}...`);

        const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')?.trim();
        const tavilyApiKey = Deno.env.get('TAVILY_API_KEY')?.trim();

        if (!openRouterApiKey) throw new Error('OPENROUTER_API_KEY is not set in Supabase Secrets');
        if (!tavilyApiKey) throw new Error('TAVILY_API_KEY is not set in Supabase Secrets');

        if (action === 'generate_image') {
            console.log("[WanderChat] Action: generate_image");
            const res = await callOpenRouter(openRouterApiKey, { model: OPENROUTER_MODEL_IMAGE, messages: [{ role: 'user', content: prompt }] });
            return new Response(JSON.stringify(res), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'parse_itinerary') {
            console.log("[WanderChat] Action: parse_itinerary");
            const res = await callOpenRouter(openRouterApiKey, { model: OPENROUTER_MODEL_SYNTHESIS, response_format: { type: "json_object" }, messages: [{ role: 'system', content: "Extract itinerary JSON." }, { role: 'user', content: prompt }] });
            return new Response(JSON.stringify(res), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const systemInstruction = getSystemInstruction(personalization);

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
            tools: tools
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
            const results = await Promise.all(assistantMessage.tool_calls.map(async (toolCall: any) => {
                const { name, arguments: argsJson } = toolCall.function;
                const args = JSON.parse(argsJson);
                console.log(`[WanderChat] Executing Tool: ${name} with args:`, argsJson);

                if (name === 'create_trip_plan') {
                    const searchResults = await fetchTavily(tavilyApiKey, `Hotels in ${args.destination} for ${args.pax} pax`).catch(() => ({ results: [] }));
                    console.log(`[WanderChat] Tavily Search results found: ${searchResults.results?.length || 0}`);

                    const planRes = await callOpenRouter(openRouterApiKey, { model: OPENROUTER_MODEL_SYNTHESIS, response_format: { type: "json_object" }, messages: [{ role: 'system', content: systemInstruction }, ...safeMessages, { role: 'user', content: `Plan ${args.duration} to ${args.destination}. Context: ${JSON.stringify(searchResults.results)}. Schema: ${JSON.stringify(tripPlanSchema)}` }] });

                    if (!planRes.choices?.[0]?.message?.content) throw new Error("Failed to generate plan content");

                    const planData = JSON.parse(stripMarkdown(planRes.choices[0].message.content));
                    console.log("[WanderChat] Plan generated, fetching hero image...");

                    const imgRes = await callOpenRouter(openRouterApiKey, { model: OPENROUTER_MODEL_IMAGE, messages: [{ role: 'user', content: `Hero image for ${planData.title}` }] });
                    return { plan: planData, heroImage: imgRes.choices?.[0]?.message, tool: name };
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
            }));
            const final = results.find(r => r?.plan || r?.dayPlan || r?.weather || r?.text) || results[0];
            console.log(`[WanderChat] Returning Tool Result: ${final?.tool}`);
            return new Response(JSON.stringify(final), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        console.log("[WanderChat] Returning direct text response.");
        return new Response(JSON.stringify({ text: assistantMessage.content }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (e: any) {
        console.error("[WanderChat] Edge Function Exception:", e.message);
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
