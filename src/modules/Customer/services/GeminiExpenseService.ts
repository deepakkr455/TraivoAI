import { supabase } from '../../../services/supabaseClient';
import { TripPlanData, Message, MessageContent, WeatherData, DayPlan } from '../../../types';

const callOpenRouterEdgeFunction = async (params: { mode: string, messages: any[], personalization?: any }) => {
    if (!supabase) throw new Error("Supabase not initialized");

    const { data, error } = await supabase.functions.invoke('openrouter-api', {
        body: params
    });

    if (error) {
        console.error("Edge Function Error:", error);
        throw new Error(error.message || "Failed to call AI service");
    }

    return data;
};

// JSON Schema for OpenRouter (compatible with structured output)
const expenseSchema = {
    type: "object",
    properties: {
        amount: {
            type: "number",
            description: "The total expense amount extracted from the message, e.g., 70.00 for '$50 on lunch and $20 on taxi'. Sum multiple amounts if present."
        },
        description: {
            type: "string",
            description: "A concise, natural language description of the expense, e.g., 'Lunch and taxi ride'."
        },
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Specific item or category, e.g., 'lunch', 'taxi'." },
                    subAmount: { type: "number", description: "Individual amount for this item if specified, otherwise 0." }
                },
                required: ['name']
            },
            description: "List of extracted items or categories from the message."
        },
        categories: {
            type: "array",
            items: { type: "string" },
            description: "Suggested categories like 'food', 'transport', 'accommodation'. Infer from items."
        }
    },
    required: ['amount', 'description', 'items']
};

export interface ExtractedExpense {
    amount: number;
    description: string;
    items: Array<{ name: string; subAmount?: number }>;
    categories?: string[];
    isCorrection?: boolean;
    originalItemName?: string; // If it's a correction, what item is being replaced/updated
}

// Helper to clean AI JSON response
const cleanJsonResponse = (text: string): string => {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
    }
    return cleaned.trim();
};

const geminiExtractExpense = async (
    message: string,
    history: { role: 'user' | 'model', content: string }[] = [],
    planId?: string,
    userId?: string,
    userName?: string
): Promise<ExtractedExpense | null> => {
    // Debug log to verify dynamic values are received
    console.log("geminiExtractExpense called with INR focus and context:", { message, historyCount: history.length });

    if (!message.trim()) return null;

    const chatHistorySnippet = history.slice(-5).map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

    const prompt = `Extract expense details from this message: "${message}". 
    
    Context (Previous Chat):
    ${chatHistorySnippet || 'No previous history.'}

    Output strictly as JSON following the schema. 
    Currency is INR (Indian Rupees). If no valid amount (₹/count) is mentioned, return null. 
    Sum amounts if multiple. Categorize intelligently (food, transport, etc.).
    
    CORRECTION LOGIC:
    - If the user is correcting a previous amount (e.g., "Actually lunch was 400", "No, taxi was 200"), set "isCorrection" to true.
    - If "isCorrection" is true, provide the NEW correct details in the main fields.
    - Identify the name of the original item being corrected in "originalItemName".

    JSON Schema:
    {
      "amount": number,
      "description": "concise description",
      "items": [{"name": "string", "subAmount": number}],
      "categories": ["string"],
      "isCorrection": boolean,
      "originalItemName": "string or null"
    }`;

    try {
        const response = await callOpenRouterEdgeFunction({
            mode: 'expense',
            messages: [{ role: 'user', content: prompt }]
        });

        const content = response.choices?.[0]?.message?.content;
        if (content) {
            const cleanedText = cleanJsonResponse(content);
            const extracted = JSON.parse(cleanedText) as ExtractedExpense;

            // Ensure items is always an array to prevent "map" errors
            if (!extracted.items) {
                extracted.items = [];
            }

            if (extracted.amount > 0 || extracted.isCorrection) {
                // Return extracted data without saving (Component handles saving)
                return extracted;
            }
        }
    } catch (error) {
        console.error('Error in geminiExtractExpense:', error);
    }

    return null;
};

export default { geminiExtractExpense };