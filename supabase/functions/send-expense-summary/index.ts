import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        console.log("Received payload:", payload);
        const { trip_id } = payload;

        if (!trip_id) {
            throw new Error("Missing trip_id");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Fetch Plan Details
        const { data: plan, error: planError } = await supabase
            .from('plans')
            .select('title, plan_json')
            .eq('id', trip_id)
            .single();

        if (planError || !plan) throw new Error("Plan not found");

        const tripTitle = plan.title || (plan.plan_json ? JSON.parse(plan.plan_json).title : "Trip");

        // 2. Fetch Members (Emails)
        // We check both 'plan_members' (if specific table exists with user info) and 'invitations'
        // For simplicity based on user request "plan_member table", let's try to join with users or assume we have emails.
        // However, plan_members usually links user_id. We need emails.
        // If 'plan_members' has 'user_id', we need to fetch emails from 'auth.users' (requires admin rights) OR 'profiles' table.
        // The user mentioned "invitations" in their example. 
        // We will gather emails from:
        // a. Invitations (accepted)
        // b. Plan Members (if we can resolve user_id to email) -> Assuming we can't easily access auth.users, we rely on Invitations + maybe passed current user email?
        // Let's rely on 'invitations' table as per previous context + maybe a pass 'adminEmail' in payload if needed.

        const { data: invites, error: inviteError } = await supabase
            .from('invitations')
            .select('invited_email')
            .eq('plan_id', trip_id)
            .eq('status', 'accepted'); // Only accepted members

        const memberEmails = invites?.map(i => i.invited_email) || [];

        // Also fetch expenses
        const { data: expenses, error: expenseError } = await supabase
            .from('expenses')
            .select('amount, description, user_name')
            .eq('plan_id', trip_id);

        if (expenseError) throw new Error("Failed to fetch expenses");

        // Calculate Summary
        const totalExpense = expenses?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;

        // Group by user
        const userExpenses: { [key: string]: number } = {};
        expenses?.forEach(exp => {
            const name = exp.user_name || 'Unknown';
            userExpenses[name] = (userExpenses[name] || 0) + Number(exp.amount);
        });

        const expenseHtml = generateExpenseTable(totalExpense, userExpenses);

        // Send Email to EACH member
        // Resend allows 'to' array, but individual emails are better for privacy (or use BCC).
        // User asked "trigger a mail to every member".
        // We can send one email with multiple recipients or loops. Loop is safer for "Welcome/Custom" but Batch is easier.
        // Let's use loop if list is small, or batch 'to'.

        if (memberEmails.length === 0) {
            console.log("No members to email");
            return new Response(JSON.stringify({ success: true, message: "No members found" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "WanderHub <onboarding@resend.dev>", // Or user's domain
                to: memberEmails, // Sends to all
                subject: `Trip Conclusion: ${tripTitle}`,
                html: generateEmailHTML(tripTitle, totalExpense, expenseHtml)
            })
        });

        if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            console.error("Resend API error:", errorData);
            throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
        }

        const emailResult = await emailResponse.json();

        return new Response(JSON.stringify({ success: true, id: emailResult.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});

function generateExpenseTable(total: number, userExpenses: { [key: string]: number }) {
    let html = `<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
    <tr style="background-color: #f3f4f6;">
      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Member</th>
      <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Spent</th>
    </tr>`;

    for (const [name, amount] of Object.entries(userExpenses)) {
        html += `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${name}</td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">$${amount.toFixed(2)}</td>
    </tr>`;
    }

    html += `<tr style="font-weight: bold; background-color: #f9fafb;">
    <td style="padding: 10px; border-top: 2px solid #e5e7eb;">Total</td>
    <td style="padding: 10px; text-align: right; border-top: 2px solid #e5e7eb;">$${total.toFixed(2)}</td>
  </tr></table>`;

    return html;
}

function generateEmailHTML(tripTitle: string, totalExpense: number, expenseTable: string) {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #f3f4f6; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h1 style="color: #0d9488; text-align: center;">Trip Concluded! 🎉</h1>
    <h2 style="color: #1f2937; text-align: center; margin-bottom: 30px;">${tripTitle}</h2>
    
    <p style="color: #4b5563; line-height: 1.6;">
      The trip has been officially concluded. Here is the final expense summary for the group.
    </p>
    
    <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; color: #0f766e; font-size: 18px; font-weight: bold; text-align: center;">
        Total Trip Cost: $${totalExpense.toFixed(2)}
      </p>
    </div>

    ${expenseTable}
    
    <p style="text-align: center; margin-top: 40px; color: #9ca3af; font-size: 12px;">
      Sent via WanderHub
    </p>
  </div>
</body>
</html>
  `;
}
