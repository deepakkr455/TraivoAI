import OpenAI from 'openai';
import { ChatMessage } from '../types';


// Initialize OpenAI client pointing to OpenRouter
const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    // Try process.env first (defined in vite.config.ts), then import.meta.env (standard Vite)
    apiKey: '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',
    dangerouslyAllowBrowser: true, // Client-side usage
    defaultHeaders: {
        "HTTP-Referer": window.location.origin,
        "X-Title": "AI Trip Lister",
    }
});

const model = "google/gemini-2.0-flash-001";

const affiliateSystemInstruction = `You are an AI assistant for affiliate partners on a travel listing platform.
Your role is to help affiliate partners list travel experiences using embed codes from platforms like GetYourGuide, TripAdvisor, Viator, etc.

When an affiliate partner provides an embed code (iframe, div, script) or a link:
1.  **Extract the FULL embed code EXACTLY as provided.** Do not alter the HTML structure.
    *   Look for <iframe> tags.
    *   Look for <div data-gyg-href="..."> or similar data-attribute based widgets (GetYourGuide uses these).
    *   Look for <script> tags associated with widgets.
2.  **Analyze the code/link for details.**
    *   Try to extract the title, location, or partner ID from the code/link if possible to pre-fill metadata.
3.  **Ask for missing metadata** (if you can't infer it):
    *   Title
    *   Description
    *   Location (Country, State, City)
    *   Tags
4.  **Once you have the code and metadata, call the 'createAffiliateListing' function.**

Be conversational and helpful. If the code looks like a GetYourGuide widget (e.g. div with data-gyg-href), accept it immediately.`;

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
    const formattedHistory = formatConversationHistory(history);

    const completion = await openai.chat.completions.create({
        model: model,
        messages: [
            { role: 'system', content: affiliateSystemInstruction },
            ...formattedHistory
        ],
        tools: tools,
    });

    const choice = completion.choices[0];
    const message = choice.message;

    const response: AppCompatibleResponse = {};

    if (message.tool_calls && message.tool_calls.length > 0) {
        response.functionCalls = message.tool_calls.map(tc => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments)
        }));
    }

    if (message.content) {
        response.text = message.content;
    }

    return response;
};
