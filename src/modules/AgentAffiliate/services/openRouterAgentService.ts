import { ChatMessage } from '../types';
import supabase from '../../../services/supabaseClient';

// OpenAI client removed. Now using Supabase Edge Function 'openrouter-api' for security.



// Tool Definition in OpenAI JSON Schema format
const tools = [
    {
        type: "function" as const,
        function: {
            name: "createTripListing",
            description: "Creates a new trip product listing based on the provided details.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: 'A catchy title for the trip. e.g., "Majestic Manali Mountain Escape"' },
                    description: { type: "string", description: 'Package Overview. A detailed, engaging paragraph about the tour.' },
                    start_date: { type: "string", description: 'The starting date of the trip in YYYY-MM-DD format.' },
                    duration: { type: "string", description: 'The total duration of the trip. e.g., "3D/2N + Travel"' },
                    location: { type: "string", description: 'The primary location of the trip.' },
                    package_type: { type: "string", description: 'The type of package. e.g., "Specific Tour", "Backpacking Trip"' },
                    theme_tags: { type: "string", description: 'Comma-separated tags describing the trip theme.' },
                    media_urls: { type: "array", items: { type: "string" }, description: 'URLs for media.' },
                    itinerary: {
                        type: "array",
                        description: 'A day-by-day plan for the trip.',
                        items: {
                            type: "object",
                            properties: {
                                day: { type: "integer" },
                                title: { type: "string" },
                                description: { type: "string" }
                            },
                            required: ['day', 'title', 'description']
                        }
                    },
                    pricing: {
                        type: "array",
                        description: 'Pricing options based on room sharing.',
                        items: {
                            type: "object",
                            properties: {
                                type: { type: "string" },
                                cost: { type: "number" }
                            },
                            required: ['type', 'cost']
                        }
                    },
                    group_size: { type: "string" },
                    languages: { type: "array", items: { type: "string" } },
                    reviews: {
                        type: "object",
                        properties: {
                            count: { type: "number" },
                            source: { type: "string" }
                        },
                        required: ['count', 'source']
                    },
                    inclusions: { type: "array", items: { type: "string" }, description: 'List of things included in the package (Meals, Stay, Transport).' },
                    exclusions: { type: "array", items: { type: "string" }, description: 'List of things excluded (Personal expenses, Flights).' },
                    cancellation_policy: { type: "array", items: { type: "string" }, description: 'Standard cancellation terms.' },
                    terms_conditions: { type: "array", items: { type: "string" }, description: 'General terms and conditions.' },
                    things_to_pack: { type: "array", items: { type: "string" }, description: 'Checklist of items to carry.' },
                    things_to_do: { type: "array", items: { type: "string" }, description: 'Key highlights or activities.' },
                    tax_rate: { type: "number", description: 'GST Percentage, default to 5.' },
                    advance_payment_percentage: { type: "number", description: 'Advance booking percentage, default to 30.' }
                },
                required: ['title', 'description', 'start_date', 'duration', 'location', 'package_type', 'theme_tags', 'itinerary', 'media_urls', 'pricing', 'inclusions', 'exclusions']
            }
        }
    }
];

// Export to match App.tsx imports. App.tsx checks .name property.
export const createTripListingFunctionDeclaration = {
    name: 'createTripListing'
};

// Interface matching what App.tsx expects from the response object
// It looks for .text and .functionCalls
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
            role: msg.sender === 'user' ? 'user' : 'assistant', // OpenAI uses 'assistant' not 'model'
            content: fullContent
        } as const;
    });
};

export const getAgentResponse = async (history: ChatMessage[]): Promise<AppCompatibleResponse> => {
    if (!supabase) {
        throw new Error("Supabase client not initialized");
    }

    const formattedHistory = formatConversationHistory(history);

    const { data, error } = await supabase.functions.invoke('openrouter-api', {
        body: {
            mode: 'agent_listing',
            messages: formattedHistory,
            tools: tools
        }
    });

    if (error) {
        console.error("Edge Function Error:", error);
        throw new Error(error.message || "Failed to get AI response from Edge Function");
    }

    // The Edge Function returns the full OpenAI-style completion object
    const choice = data.choices[0];
    const message = choice.message;

    const response: AppCompatibleResponse = {};

    if (message.tool_calls && message.tool_calls.length > 0) {
        response.functionCalls = message.tool_calls.map((tc: any) => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments)
        }));
    }

    // If there is content, include it. 
    if (message.content) {
        response.text = message.content;
    }

    return response;
};
