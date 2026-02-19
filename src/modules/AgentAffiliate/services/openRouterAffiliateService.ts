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
                    }
                },
                required: ['embed_code', 'title', 'country', 'city']
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

    const { data, error } = await supabase.functions.invoke('openrouter-api', {
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

    if (message.content) {
        response.text = message.content;
    }

    return response;
};
