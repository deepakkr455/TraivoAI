// 1. Create a function: supabase functions new send-contact-email
// 2. Add resource to file: supabase/functions/send-contact-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    try {
        const payload = await req.json()
        console.log("Webhook Payload Received:", JSON.stringify(payload, null, 2)) // DEBUGGING LOG

        // Check if payload has the expected structure
        if (!payload.record) {
            console.error("Payload missing 'record' property. Full payload:", payload)
            return new Response(JSON.stringify({ error: "Invalid payload: missing 'record'" }), {
                headers: { "Content-Type": "application/json" },
                status: 400,
            })
        }

        const { name, email, message, subject } = payload.record

        // Example using Resend (https://resend.com)
        // You can use direct SMTP or any other provider here
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev', // Update with your verify domain
                to: ADMIN_EMAIL,
                subject: `New Contact: ${subject || 'Support Request'}`,
                html: `
          <h3>New Message from ${name}</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `
            })
        })

        const data = await res.json()
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (error) {
        console.error("Function Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        })
    }
})
