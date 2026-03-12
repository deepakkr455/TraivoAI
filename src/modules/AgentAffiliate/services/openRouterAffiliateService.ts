import { ChatMessage } from '../types';
import supabase from '../../../services/supabaseClient';

// OpenAI client removed. Now using Supabase Edge Function 'openrouter-api' for security.



// Tool Definition in OpenAI JSON Schema format
const tools = [
    {
        type: "function" as const,
        function: {
            name: "createAffiliateListing",
            description: "Creates a new affiliate listing with embed code and metadata.",
            parameters: {
                type: "object",
                properties: {
                    embed_code: {
                        type: "string",
                        description: 'The full embed code (iframe or div) from the affiliate platform'
                    },
                    source_url: {
                        type: "string",
                        description: 'The original URL of the listing on the affiliate platform'
                    },
                    affiliate_source: {
                        type: "string",
                        description: 'The affiliate platform name (e.g., getyourguide, tripadvisor, viator)'
                    },
                    title: {
                        type: "string",
                        description: 'A descriptive title for the listing'
                    },
                    description: {
                        type: "string",
                        description: 'A brief description of what this listing offers'
                    },
                    tags: {
                        type: "array",
                        items: { type: "string" },
                        description: 'Relevant tags (e.g., adventure, culture, food, sightseeing)'
                    },
                    country: {
                        type: "string",
                        description: 'The country where this experience takes place'
                    },
                    state: {
                        type: "string",
                        description: 'The state/region where this experience takes place'
                    },
                    city: {
                        type: "string",
                        description: 'The city where this experience takes place'
                    },
                    banner_type: {
                        type: "string",
                        enum: ['horizontal-banner', 'vertical-banner', 'square-banner'],
                        description: 'Categorize this banner based on its dimensions in the embed code.'
                    },
                    package_type: {
                        type: "string",
                        description: 'The type of package (e.g., cars, hotels, trips, tours, flights).'
                    }
                },
                required: ['embed_code', 'title', 'country', 'city', 'banner_type', 'package_type']
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "generate_social_image",
            description: "Generates a stunning, platform-optimized social media image for travel content.",
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
                    image_quality: { type: "string", enum: ["standard", "high", "ultra"] }
                },
                required: ['prompt'],
            }
        }
    }
];

// Export to match App.tsx imports.
export const createAffiliateLinkFunctionDeclaration = {
    name: 'createAffiliateListing'
};

// Interface matching what App.tsx expects from the response object
interface AppCompatibleResponse {
    text?: string;
    functionCalls?: {
        name: string;
        args: any;
    }[];
}

const formatConversationHistory = (history: ChatMessage[]) => {
    return history.map(msg => {
        let content = msg.productCard
            ? `[Product Card for ${msg.productCard.title} displayed to user]`
            : msg.content;

        const mediaContent = msg.media?.map(m => `[User uploaded file: ${m.name}, type: ${m.type}, url: ${m.url}]`).join('\n') || '';
        const fullContent = `${content} ${mediaContent}`.trim();

        return {
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: fullContent
        } as const;
    });
};

export const getAffiliateResponse = async (history: ChatMessage[]): Promise<AppCompatibleResponse> => {
    if (!supabase) {
        throw new Error("Supabase client not initialized");
    }

    const formattedHistory = formatConversationHistory(history);

    const { data, error } = await supabase.functions.invoke('agent-listing-api', {
        body: {
            mode: 'affiliate',
            messages: formattedHistory,
            tools: tools
        }
    });

    if (error) {
        console.error("Edge Function Error:", error);
        throw new Error(error.message || "Failed to get AI response from Edge Function");
    }

    if (!data || (!data.choices && !data.text)) {
        console.error("Invalid AI response format:", data);
        throw new Error("Received an empty or invalid response from the AI service.");
    }

    const response: AppCompatibleResponse = {};

    // Handle standard choices format
    if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0];
        const message = choice.message;

        if (message.tool_calls && message.tool_calls.length > 0) {
            response.functionCalls = message.tool_calls.map((tc: any) => ({
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments)
            }));
        }

        if (message.content) {
            response.text = message.content;
        }
    }

    // Handle direct text format (often used by Edge Function proxies)
    if (data.text && !response.text) {
        response.text = data.text;
    }

    return response;
};
