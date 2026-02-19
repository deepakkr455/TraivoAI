import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        const body = await req.json()
        const { model: requestedModel, contents, config, messages: directMessages } = body

        const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!openRouterApiKey) throw new Error('OPENROUTER_API_KEY is not set')

        // Convert Gemini contents to OpenRouter messages
        let finalMessages = directMessages;
        if (contents && Array.isArray(contents)) {
            finalMessages = contents.map((content: any) => ({
                role: content.role === 'model' ? 'assistant' : content.role,
                content: content.parts.map((part: any) => part.text).join('\n')
            }))
        }

        const requestBody: any = {
            model: "google/gemini-3-flash-preview", // Hardcoded as per user request
            messages: finalMessages,
            temperature: config?.generationConfig?.temperature ?? 0.1,
        }

        if (config?.generationConfig?.responseMimeType === 'application/json' || body.response_format?.type === 'json_object') {
            requestBody.response_format = { type: 'json_object' }
        }

        let attempts = 0;
        const maxAttempts = 3;
        let lastError: any;

        while (attempts < maxAttempts) {
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${openRouterApiKey}`,
                        "HTTP-Referer": "https://wanderhub.ai",
                        "X-Title": "WanderHub",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestBody)
                })

                const data = await response.json()

                if (!response.ok) {
                    if (response.status === 429 || response.status === 503) {
                        attempts++;
                        await delay(2000 * Math.pow(2, attempts));
                        continue;
                    }
                    throw new Error(data.error?.message || "Failed to call OpenRouter")
                }

                const text = data.choices?.[0]?.message?.content || ''

                return new Response(JSON.stringify({
                    text,
                    candidates: data.choices,
                    usage: data.usage
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })

            } catch (error: any) {
                lastError = error;
                if (error.message?.includes('429') || error.message?.includes('503')) {
                    attempts++;
                    await delay(2000 * Math.pow(2, attempts));
                    continue;
                }
                throw error;
            }
        }
        throw lastError;

    } catch (error: any) {
        console.error("Edge Function Error:", error)
        return new Response(JSON.stringify({ error: error.message || String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
