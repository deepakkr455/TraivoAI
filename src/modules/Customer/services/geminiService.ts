import { TripPlanData, Message, MessageContent, WeatherData, DayPlan } from '../../../types';
import { ItineraryItem } from '../components/TravelFlyer/types';
import { supabase } from '../../../services/supabaseClient';

// OpenRouter models are now handled by the backend wanderchat-api Edge Function for security

// Tavily and Weather domains are now handled by the backend

const THOUGHTS = {
    PLANNING: [
        "Analyzing your travel parameters...",
        "Crafting the perfect route...",
        "Optimizing for your preferences...",
        "Structuring the itinerary logic...",
        "Balancing activity and relaxation...",
        "Designing your daily flow..."
    ],
    SEARCHING: [
        "Scouring real-time sources...",
        "Verifying current availability...",
        "Consulting travel databases...",
        "Cross-referencing reviews...",
        "Finding the best rated spots...",
        "Looking for hidden gems..."
    ],
    SYNTHESIZING: [
        "Weaving data into a plan...",
        "Polishing the itinerary details...",
        "Checking logical consistency...",
        "Finalizing your travel blueprint...",
        "Ensuring everything fits together...",
        "Adding personal touches..."
    ],
    IMAGING: [
        "Visualizing your destination...",
        "Designing a custom cover image...",
        "Generating preview assets...",
        "Capturing the vibe...",
        "Painting the scene..."
    ],
    WEATHER: [
        "Consulting meteorological data...",
        "Checking forecast models...",
        "Analyzing climate patterns..."
    ],
    TOOL_EXECUTION: [
        "Coordinating specialized agents...",
        "Running background tasks...",
        "Accessing external tools..."
    ]
};

const getRandomThought = (category: keyof typeof THOUGHTS, context?: string) => {
    const options = THOUGHTS[category];
    const baseThought = options[Math.floor(Math.random() * options.length)];
    return context ? `${baseThought} (${context})` : baseThought;
};

/**
 * Calls the new WanderChat Edge Function (centralized backend logic)
 */
const callWanderChat = async (params: {
    action?: 'chat' | 'generate_image' | 'parse_itinerary',
    prompt?: string,
    messages?: any[],
    personalization?: any,
    forcedTool?: string | null
}) => {
    if (!supabase) throw new Error("Supabase not initialized");

    const { data, error } = await supabase.functions.invoke('wanderchat-api', {
        body: params
    });

    if (error) {
        console.error("WanderChat Edge Function Error:", error);
        throw new Error(error.message || "Failed to call AI service");
    }

    return data;
};

/**
 * Migration helper (generic caller)
 */
const callOpenRouter = async (params: any) => {
    return await callWanderChat({ action: 'chat', ...params });
};

/**
 * Converts internal Message history to OpenRouter/OpenAI message format
 */
const toOpenRouterHistory = (messages: Message[]): any[] => {
    return messages.map(msg => {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        let content = '';
        if (msg.content.text) {
            content = msg.content.text;
        } else if (msg.content.plan) {
            content = `[A trip plan for ${msg.content.plan.title} was generated and shown to the user as a card.]`;
        } else if (msg.content.imageUrl) {
            content = '[The user was shown a generated image]';
        }
        return { role, content };
    });
};

/**
 * Validates input to prevent prompt injection and DoS
 */
const validateInput = (input: string, maxLength: number): boolean => {
    if (!input || typeof input !== 'string') return false;
    if (input.length > maxLength) return false;
    const suspiciousPatterns = [
        /ignore\s+(all\s+)?previous\s+instructions?/i,
        /system\s+prompt/i,
        /you\s+are\s+now/i,
        /forget\s+everything/i,
        /new\s+instructions?:/i
    ];
    return !suspiciousPatterns.some(pattern => pattern.test(input));
};

// getSystemInstruction has been moved to the backend

/**
 * Helper to strip markdown code blocks
 */
const stripMarkdown = (text: string): string => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

/**
 * Helper to extract numeric value from strings like "16°C" or "72F"
 */
const extractNum = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    const match = val.match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
};

const normalizeWeatherData = (parsedData: any, location: string): WeatherData => {
    const getVal = (obj: any, keys: string[]) => {
        const foundKey = Object.keys(obj || {}).find(k => keys.includes(k.toLowerCase()));
        return foundKey ? obj[foundKey] : undefined;
    };

    return {
        location: parsedData.location || location,
        current: {
            temp: extractNum(parsedData.current?.temp),
            condition: parsedData.current?.condition || "Unknown",
            high: extractNum(parsedData.current?.high),
            low: extractNum(parsedData.current?.low),
            feelsLike: extractNum(parsedData.current?.feelsLike),
            humidity: parsedData.current?.humidity || "0%",
            wind: parsedData.current?.wind || "Unknown",
            uvIndex: parsedData.current?.uvIndex || "Unknown",
            visibility: parsedData.current?.visibility || "Unknown",
            pressure: parsedData.current?.pressure || "Unknown",
            airQuality: parsedData.current?.airQuality || "Unknown",
            precipitation: parsedData.current?.precipitation || "0%",
            localTime: parsedData.current?.localTime || new Date().toLocaleTimeString()
        },
        forecast: (parsedData.forecast || []).map((f: any) => ({
            day: f.day || "Unknown",
            temp: extractNum(f.temp),
            condition: f.condition || "Unknown"
        })),
        projection: getVal(parsedData, ['projection', 'summary', 'overview']) || "No forecast available.",
        travelRecommendations: getVal(parsedData, ['travelrecommendations', 'recommendations', 'travel_recommendations']) || [],
        news: getVal(parsedData, ['news', 'alerts', 'updates']) || [],
        groundingUrls: parsedData.groundingUrls || []
    };
};

const normalizeDayPlan = (data: any): DayPlan => {
    return {
        locationName: data.locationName || "Unknown Location",
        weather: {
            description: data.weather?.description || "No weather details",
            temperature: data.weather?.temperature || "N/A",
            icon: data.weather?.icon || "sunny"
        },
        itinerary: (data.itinerary || []).map((item: any) => ({
            ...item,
            latitude: typeof item.latitude === 'string' ? parseFloat(item.latitude) : (item.latitude || undefined),
            longitude: typeof item.longitude === 'string' ? parseFloat(item.longitude) : (item.longitude || undefined),
            type: item.type || 'activity'
        }))
    };
};

// Tool and schema definitions have been moved to the backend

export const fetchHistory = async (userId: string, sessionId: string): Promise<Message[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('user_queries')
            .select('query, agent_response')
            .eq('userid', userId)
            .eq('session_id', sessionId)
            .order('datetime', { ascending: false })
            .limit(20);
        if (error) throw error;

        // Reverse to get chronological order (oldest to newest) from the fetch results (newest to oldest)
        const sortedData = (data || []).reverse();

        const messages: Message[] = [];
        let idCounter = 0;
        sortedData.forEach(row => {
            messages.push({
                id: `hist-${idCounter++}`,
                role: 'user',
                content: { text: row.query }
            });
            messages.push({
                id: `hist-${idCounter++}`,
                role: 'model',
                content: JSON.parse(row.agent_response)
            });
        });
        return messages;
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

const saveInteraction = async (
    userId: string,
    sessionId: string,
    query: string,
    agentResponse: MessageContent,
    responseCategory: string
) => {
    if (!supabase) return;
    try {
        // 1. Ensure chat session exists
        const { data: sessionExists } = await supabase
            .from('customer_chat_sessions')
            .select('id')
            .eq('id', sessionId)
            .maybeSingle();

        if (!sessionExists) {
            // Create a session using a random title if creating automatically
            const SESSION_TITLES = [
                "Adventure Awaits", "Dream Vacation", "City Explorer", "Beach Paradise",
                "Mountain Retreat", "Cultural Journey", "Foodie Tour", "Hidden Gems",
                "Road Trip", "Weekend Getaway", "Nature Escape", "Historic Wonders"
            ];
            const title = SESSION_TITLES[Math.floor(Math.random() * SESSION_TITLES.length)];
            await supabase.from('customer_chat_sessions').insert([{
                id: sessionId,
                title,
                user_id: userId
            }]);
        }

        // 2. Save to user_queries (legacy/analytics)
        await supabase.from('user_queries').insert({
            userid: userId,
            session_id: sessionId,
            query: query,
            agent_response: JSON.stringify(agentResponse),
            response_category: responseCategory,
        });

        // 3. Save to customer_chat_messages (the dedicated table we created)
        // REMOVED: Migrated to use `user_queries` exclusively as per new schema requirements.


    } catch (error) {
        console.error("Error saving interaction:", error);
    }
};

/**
 * Helper to simple track usage for non-chat features (Flyer, etc)
 */
const trackDataOnlyUsage = async (userId: string, category: string, query: string) => {
    if (!supabase || !userId) return;
    try {
        await supabase.from('user_queries').insert({
            userid: userId,
            session_id: 'flyer-mode', // Placeholder session for flyer actions
            query: query,
            agent_response: JSON.stringify({ text: "Action Completed" }),
            response_category: category,
        });
    } catch (e) {
        console.error("Failed to track usage:", e);
    }
};

/**
 * Helper to upload base64 image data to Supabase Storage
 */
const uploadBase64Image = async (base64Data: string, fileName: string): Promise<string | null> => {
    if (!supabase) return null;
    try {
        // Remove data:image/xxx;base64, prefix if present
        const base64Content = base64Data.includes('base64,')
            ? base64Data.split('base64,')[1]
            : base64Data;

        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const { data, error } = await supabase.storage
            .from('Itinerary_images')
            .upload(`ai-generated/${Date.now()}-${fileName}.jpg`, blob, {
                contentType: 'image/jpeg'
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('Itinerary_images').getPublicUrl(data.path);
        return publicUrl;
    } catch (error) {
        console.error("Error uploading base64 image:", error);
        return null;
    }
};

const handleTripPlan = async (args: any, messages: any[], addAgentThought: (thought: string) => void, personalization?: any): Promise<MessageContent> => {
    addAgentThought(getRandomThought('PLANNING', `${args.duration} to ${args.destination}`));
    addAgentThought(getRandomThought('SEARCHING', "Hotels & Transport"));

    try {
        const result = await callWanderChat({
            action: 'chat',
            prompt: `Plan a trip to ${args.destination}`,
            messages,
            personalization,
            forcedTool: 'create_trip_plan'
        });

        if (result.plan) {
            addAgentThought(getRandomThought('IMAGING'));
            // If the backend returned a heroImage, we might need to persist it
            if (result.heroImage) {
                const assistantMsg = result.heroImage;
                let extractedUrl = null;
                if (assistantMsg.images && assistantMsg.images.length > 0) {
                    extractedUrl = assistantMsg.images[0].url || assistantMsg.images[0].image_url?.url;
                } else if (typeof assistantMsg.content === 'string') {
                    const content = assistantMsg.content.trim();
                    if (content.startsWith('http') || content.startsWith('data:')) extractedUrl = content;
                }

                if (extractedUrl && extractedUrl.startsWith('data:')) {
                    const persistedUrl = await uploadBase64Image(extractedUrl, `hero-${args.destination}`);
                    result.plan.heroImageUrl = persistedUrl || extractedUrl;
                } else {
                    result.plan.heroImageUrl = extractedUrl;
                }
            }
            return { plan: result.plan };
        }
        return { text: result.text || "Failed to generate plan." };
    } catch (e) {
        console.error("Trip plan error:", e);
        return { text: "Sorry, I couldn't generate the trip plan. Let's try again." };
    }
};

const handleSearch = async (args: any, messages: any[], addAgentThought: (thought: string) => void, personalization?: any): Promise<MessageContent> => {
    addAgentThought(getRandomThought('SEARCHING', args.query));
    const result = await callWanderChat({
        action: 'chat',
        prompt: args.query,
        messages,
        personalization
    });
    return { text: result.text, sources: result.sources || [] };
};

const handleDayPlanMap = async (args: any, messages: any[], addAgentThought: (thought: string) => void, personalization?: any): Promise<MessageContent> => {
    addAgentThought(getRandomThought('PLANNING', `Day plan for ${args.location}`));
    const result = await callWanderChat({
        action: 'chat',
        prompt: `Day plan for ${args.location}`,
        messages,
        personalization,
        forcedTool: 'generate_day_plan'
    });
    console.log("[WanderChat] Frontend Day Plan Received:", JSON.stringify(result.dayPlan, null, 2));
    return { dayPlan: normalizeDayPlan(result.dayPlan) };
};

export const orchestrateResponse = async (
    prompt: string,
    userId: string,
    sessionId: string,
    addAgentThought: (thought: string) => void,
    onResult: (content: MessageContent) => void,
    forcedTool?: string | null,
    personalization?: any
) => {
    addAgentThought(getRandomThought('SYNTHESIZING', "Context & Intent"));
    const history = await fetchHistory(userId, sessionId);
    const openRouterMessages = toOpenRouterHistory(history);

    const result = await callWanderChat({
        prompt,
        messages: openRouterMessages,
        personalization,
        forcedTool
    });

    console.log("[WanderChat] orchestrateResponse RAW Result:", JSON.stringify(result, null, 2));

    if (result.weather) {
        result.weather = normalizeWeatherData(result.weather, prompt);
    }
    if (result.dayPlan) {
        result.dayPlan = normalizeDayPlan(result.dayPlan);
    }

    if (result.tool) {
        onResult(result);
        await saveInteraction(userId, sessionId, prompt, result, result.tool);
    } else {
        onResult(result);
        await saveInteraction(userId, sessionId, prompt, result, 'general_query');
    }
};

// Kept for backward compatibility and internal tool usage
export const fetchWeatherFromGemini = async (location: string): Promise<WeatherData> => {
    if (!validateInput(location, 100)) {
        throw new Error("Invalid location provided.");
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const next5Days = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i + 1);
        return days[d.getDay()];
    }).join(", ");

    const result = await callWanderChat({
        action: 'chat',
        prompt: `JSON weather for ${location}`,
    });

    try {
        let parsedData = result.weather || (typeof result.text === 'string' ? JSON.parse(stripMarkdown(result.text)) : result);

        if (Array.isArray(parsedData) && parsedData.length > 0) {
            parsedData = parsedData[0];
        }

        const normalized = normalizeWeatherData(parsedData, location);
        console.log("Weather Normalized Data:", normalized);
        return normalized;
    } catch (error) {
        console.error("Weather parse error:", error);
        throw new Error("Failed to fetch weather data.");
    }
};

// fetchTavily has been moved to the backend

/**
 * Generates a high-quality travel image using the OpenRouter Image model
 */
export async function generateTravelImage(prompt: string, userId: string = ''): Promise<string | null> {
    try {
        if (userId) await trackDataOnlyUsage(userId, 'image_generation', `Generate image: ${prompt}`);

        const response = await callWanderChat({
            action: 'generate_image',
            prompt: `A professional, high-quality cinematic travel photography shot of ${prompt}. Vibrant colors, realistic textures, wide angle.`
        });

        const assistantMsg = response.choices[0].message;
        let extractedUrl = null;

        if (assistantMsg.images && assistantMsg.images.length > 0) {
            extractedUrl = assistantMsg.images[0].url || assistantMsg.images[0].image_url?.url;
        } else if (typeof assistantMsg.content === 'string') {
            const content = assistantMsg.content.trim();
            if (content.startsWith('http') || content.startsWith('data:')) extractedUrl = content;
        }

        if (extractedUrl && extractedUrl.startsWith('data:')) {
            const persistedUrl = await uploadBase64Image(extractedUrl, `flyer-${prompt.substring(0, 10)}`);
            return persistedUrl || extractedUrl;
        }

        return extractedUrl;
    } catch (error) {
        console.error("Flyer image generation failed:", error);
        return null;
    }
}

/**
 * Parses a raw itinerary text into structured Day objects using AI
 */
export async function parseItineraryWithAI(rawText: string, userId: string = ''): Promise<{
    itinerary: ItineraryItem[];
    suggestedTitle?: string;
    suggestedSubtitle?: string;
}> {
    try {
        if (userId) await trackDataOnlyUsage(userId, 'itinerary_parsing', `Parse itinerary (len: ${rawText.length})`);

        const response = await callWanderChat({
            action: 'parse_itinerary',
            prompt: rawText
        });

        const cleanText = stripMarkdown(response.choices[0].message.content);
        const data = JSON.parse(cleanText);

        const rawItinerary = Array.isArray(data) ? data : (data.itinerary || data.items || []);

        const itinerary = rawItinerary.map((item: any) => ({
            day: item.day || "Day ?",
            title: item.title || "Untitled Activity",
            description: item.description || "",
            price: item.price
        }));

        return {
            itinerary,
            suggestedTitle: data.suggestedTitle,
            suggestedSubtitle: data.suggestedSubtitle
        };
    } catch (error) {
        console.error("AI Itinerary parsing failed:", error);
        return { itinerary: [] };
    }
}

export const fetchWeatherReport = async (location: string): Promise<WeatherData> => {
    if (!validateInput(location, 100)) throw new Error("Invalid location");
    const result = await callWanderChat({
        action: 'chat',
        prompt: `Weather report for ${location}`,
        forcedTool: 'get_weather_forecast'
    });
    if (result.weather) return normalizeWeatherData(result.weather, location);
    return fetchWeatherFromGemini(location);
};

export const generateTripSummary = async (destination: string, duration: string, highlights: string[], totalExpense: number): Promise<string> => {
    const prompt = `Summary of trip to ${destination} for ${duration}. Highlights: ${highlights.join(', ')}. Cost: $${totalExpense}.`;
    const result = await callWanderChat({
        action: 'chat',
        prompt: prompt
    });
    return result.text;
};