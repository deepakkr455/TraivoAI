import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/* =======================
   Environment variables
======================= */
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:3000";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/* =======================
   HTTP Server
======================= */
serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        /* -----------------------
           Parse trigger payload
        ------------------------ */
        const payload = await req.json();
        console.log("Received payload:", payload);

        if (!payload?.record) {
            throw new Error("Invalid payload: missing record");
        }

        /* -----------------------
           Extract record fields
        ------------------------ */
        const {
            id: invitationId,
            plan_id,
            email,
            invited_email,
            invitee_email
        } = payload.record;

        const recipientEmail =
            email || invited_email || invitee_email;

        if (!recipientEmail) {
            console.error("Email missing in record:", payload.record);
            throw new Error("Missing invited email");
        }

        if (!invitationId || !plan_id) {
            throw new Error("Missing invitationId or plan_id");
        }

        /* -----------------------
           Supabase client
        ------------------------ */
        const supabase = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY
        );

        /* -----------------------
           Fetch plan
        ------------------------ */
        const { data: plan, error: planError } = await supabase
            .from("plans")
            .select("*")
            .eq("id", plan_id)
            .single();

        if (planError || !plan) {
            console.error("Plan fetch error:", planError);
            throw new Error("Plan not found");
        }

        /* -----------------------
           Fetch invitation token
        ------------------------ */
        const { data: tokenData, error: tokenError } = await supabase
            .from("invitation_tokens")
            .select("token")
            .eq("invitation_id", invitationId)
            .single();

        if (tokenError || !tokenData?.token) {
            console.error("Token fetch error:", tokenError);
            throw new Error("Invitation token not found");
        }

        const invitationToken = tokenData.token;
        // FIX: Use correctly formatted URL including hash router and /user/ prefix
        // The previous format was missing '#/user/' prefix
        const invitationLink = `${APP_URL.endsWith('/') ? APP_URL : APP_URL + '/'}#/user/trip/${invitationToken}`;

        /* -----------------------
           Trip info
        ------------------------ */
        const planJson =
            typeof plan.plan_json === "string"
                ? JSON.parse(plan.plan_json)
                : plan.plan_json;

        const tripTitle = planJson?.title || "Your Trip";
        const destination = extractDestination(planJson);

        /* -----------------------
           Send email via Resend
        ------------------------ */
        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "TraivoAI <noreply@wanderai.in>", // Note: Rebranded name from previous context if applicable
                to: recipientEmail,
                subject: `You're invited to join a trip: ${tripTitle}`,
                html: generateEmailHTML(
                    tripTitle,
                    destination,
                    invitationLink,
                    recipientEmail
                )
            })
        });

        if (!emailResponse.ok) {
            const err = await emailResponse.json();
            console.error("Resend API error:", err);
            throw new Error(`Resend failed: ${JSON.stringify(err)}`);
        }

        const emailResult = await emailResponse.json();
        console.log("Email sent:", emailResult);

        /* -----------------------
           Optional: mark sent
        ------------------------ */
        await supabase
            .from("invitations")
            .update({ status: "sent" })
            .eq("id", invitationId);

        return new Response(
            JSON.stringify({ success: true, emailId: emailResult.id }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("send-invitation error:", error);

        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

/* =======================
   Helpers
======================= */
function extractDestination(planJson: any): string {
    if (!planJson) return "an exciting destination";

    const title = planJson.title || "";

    if (title.includes("to ")) {
        return title.split("to ")[1]?.split(" ")[0] || "an exciting destination";
    }

    return "an exciting destination";
}

function generateEmailHTML(
    tripTitle: string,
    destination: string,
    invitationLink: string,
    invitedEmail: string
): string {
    return `
<!DOCTYPE html> <html lang="en"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Trip Invitation</title> </head> <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;"> <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;"> <tr> <td align="center"> <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"> <!-- Header --> <tr> <td style="background: #0d9488; padding: 40px 30px; text-align: center;"> <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;"> ✈️ TraivoAI </h1> <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;"> Trip Invitation </p> </td> </tr> <!-- Content --> <tr> <td style="padding: 40px 30px;"> <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: bold;"> You're Invited! 🎉 </h2> <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;"> You've been invited to join an exciting trip: </p> <!-- Trip Details Card --> <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin: 0 0 30px 0;"> <tr> <td style="padding: 25px;"> <h3 style="margin: 0 0 15px 0; color: #0d9488; font-size: 20px; font-weight: bold;"> ${tripTitle} </h3> <p style="margin: 0; color: #6b7280; font-size: 14px;"> 📍 Destination: <strong>${destination}</strong> </p> </td> </tr> </table> <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;"> Click the button below to view the full itinerary and accept or decline the invitation. </p> <!-- CTA Button --> <table width="100%" cellpadding="0" cellspacing="0"> <tr> <td align="center"> <a href="${invitationLink}" style="display: inline-block; padding: 16px 40px; background-color: #0d9488; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.3);"> View Trip & Respond </a> </td> </tr> </table> <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;"> Or copy and paste this link into your browser:<br> <a href="${invitationLink}" style="color: #0d9488; word-break: break-all;"> ${invitationLink} </a> </p> </td> </tr> <!-- Footer --> <tr> <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;"> <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;"> This invitation was sent to <strong>${invitedEmail}</strong> </p> <p style="margin: 0; color: #9ca3af; font-size: 12px;"> © 2024 TraivoAI. All rights reserved. </p> </td> </tr> </table> </td> </tr> </table> </body> </html>
`;
}
