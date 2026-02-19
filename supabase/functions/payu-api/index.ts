import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Check for Form Data (PayU Redirect/Callback)
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await req.formData();
            const params = new URLSearchParams();
            const data: Record<string, string> = {};

            for (const [key, value] of formData.entries()) {
                const val = value.toString();
                params.append(key, val);
                data[key] = val;
            }

            const redirectBase = formData.get("udf1")?.toString();

            // Perform Background Verification & Recording
            try {
                const { txnid, amount, productinfo, firstname, email, status, hash: responseHash, udf1, udf2, udf3, udf4, udf5, mihpayid } = data;

                // Retrieve secrets again for the bridge block scope
                const mKey = Deno.env.get("PAYU_MERCHANT_KEY");
                const mSalt = Deno.env.get("PAYU_MERCHANT_SALT");

                if (mKey && mSalt && txnid && status && responseHash) {
                    const u1 = udf1 || "";
                    const u2 = udf2 || "";
                    const u3 = udf3 || "";
                    const u4 = udf4 || "";
                    const u5 = udf5 || "";
                    const f_email = email || "";
                    const f_firstname = firstname || "";
                    const f_productinfo = productinfo || "";
                    const f_amount = amount || "0.00";

                    const hashString = `${mSalt}|${status}||||||${u5}|${u4}|${u3}|${u2}|${u1}|${f_email}|${f_firstname}|${f_productinfo}|${f_amount}|${txnid}|${mKey}`;
                    const hashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(hashString));
                    const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

                    if (hashHex === responseHash) {
                        const isAffiliate = u4 === 'affiliate';
                        const historyTable = isAffiliate ? 'agent_subscription_payment_history' : 'payment_history';
                        const subscriptionTable = isAffiliate ? 'agent_user_subscriptions' : 'user_subscriptions';

                        // 1. Record History
                        const { error: histErr } = await supabaseClient.from(historyTable).upsert({
                            user_id: u2,
                            plan_name: u3,
                            amount: parseFloat(f_amount),
                            status: status,
                            payu_id: mihpayid,
                            txnid: txnid,
                            raw_response: data
                        }, { onConflict: 'txnid' });

                        if (histErr) console.error(`Error recording history in ${historyTable}:`, histErr.message, histErr.details);

                        // 2. Update Subscriptions
                        if (status === 'success') {
                            const subUpdateData: any = {
                                user_id: u2,
                                status: 'active',
                                current_period_start: new Date().toISOString()
                            };

                            if (isAffiliate) {
                                subUpdateData.tier_name = u3;
                            } else {
                                subUpdateData.plan_name = u3;
                            }

                            const { error: subErr } = await supabaseClient.from(subscriptionTable).upsert(subUpdateData, { onConflict: 'user_id' });
                            if (subErr) console.error(`Error updating subscription in ${subscriptionTable}:`, subErr.message, subErr.details);
                        }
                    } else {
                        console.error("Hash mismatch for payload:", txnid);
                    }
                }
            } catch (err) {
                console.error("Bridge verification/recording failed:", err);
            }

            if (redirectBase) {
                // Ensure the hash is correctly preserved in the redirect
                return Response.redirect(`${redirectBase}?${params.toString()}`, 303);
            } else {
                const surl = formData.get("surl")?.toString();
                if (surl) {
                    return Response.redirect(`${surl}?${params.toString()}`, 303);
                }
                return new Response("Missing redirect URL (udf1 or surl)", { status: 400 });
            }
        }

        const { action, ...data } = await req.json();

        // Retrieve secrets
        const merchantKey = Deno.env.get("PAYU_MERCHANT_KEY");
        const merchantSalt = Deno.env.get("PAYU_MERCHANT_SALT");

        if (!merchantKey || !merchantSalt) {
            throw new Error("Missing PayU Configuration");
        }

        if (action === "generate-hash") {
            const { txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5 } = data;

            if (!txnid || !amount || !productinfo || !firstname || !email) {
                throw new Error("Missing required fields for hash generation");
            }

            const u1 = udf1 || "";
            const u2 = udf2 || "";
            const u3 = udf3 || "";
            const u4 = udf4 || "";
            const u5 = udf5 || "";

            // Format amount: PayU trace shows no decimals for whole numbers
            const formattedAmount = Number(amount) % 1 === 0 ? Math.floor(Number(amount)).toString() : amount.toString();

            // Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT) (16 pipes)
            const hashString = `${merchantKey}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${u1}|${u2}|${u3}|${u4}|${u5}||||||${merchantSalt}`;

            const hashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(hashString));
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

            return new Response(JSON.stringify({ hash: hashHex, key: merchantKey }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });

        } else if (action === "verify-hash") {
            const { txnid, amount, productinfo, firstname, email, status, hash: responseHash, udf1, udf2, udf3, udf4, udf5, mihpayid } = data;

            // Define required fields for hash verification (status and responseHash are essential)
            if (!txnid || !status || !responseHash) {
                throw new Error("Critical fields missing for hash verification (txnid, status, or hash)");
            }

            // PayU response hash calculation needs these even if they are empty
            const u1 = udf1 || "";
            const u2 = udf2 || "";
            const u3 = udf3 || "";
            const u4 = udf4 || "";
            const u5 = udf5 || "";
            const f_email = email || "";
            const f_firstname = firstname || "";
            const f_productinfo = productinfo || "";

            // Normalize amount: PayU response usually has 2 decimals, but hash might expect exactly what was in the response param
            const f_amount = amount || "0.00";

            // Formula: sha512(SALT|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key) (17 pipes)
            const hashString = `${merchantSalt}|${status}||||||${u5}|${u4}|${u3}|${u2}|${u1}|${f_email}|${f_firstname}|${f_productinfo}|${f_amount}|${txnid}|${merchantKey}`;

            const hashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(hashString));
            const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

            const isValid = hashHex === responseHash;

            if (isValid) {
                const isAffiliate = u4 === 'affiliate';
                const historyTable = isAffiliate ? 'agent_subscription_payment_history' : 'payment_history';
                const subscriptionTable = isAffiliate ? 'agent_user_subscriptions' : 'user_subscriptions';

                // 1. Record in payment history
                const { error: histErr } = await supabaseClient.from(historyTable).upsert({
                    user_id: u2,
                    plan_name: u3,
                    amount: parseFloat(f_amount),
                    status: status,
                    payu_id: mihpayid,
                    txnid: txnid,
                    raw_response: data
                }, { onConflict: 'txnid' });

                if (histErr) console.error(`Error recording history in ${historyTable}:`, histErr.message, histErr.details);

                // 2. Update subscriptions if success
                if (status === 'success') {
                    const subUpdateData: any = {
                        user_id: u2,
                        status: 'active',
                        current_period_start: new Date().toISOString()
                    };

                    if (isAffiliate) {
                        subUpdateData.tier_name = u3;
                    } else {
                        subUpdateData.plan_name = u3;
                    }

                    const { error: subErr } = await supabaseClient.from(subscriptionTable).upsert(subUpdateData, { onConflict: 'user_id' });
                    if (subErr) console.error(`Error updating subscription in ${subscriptionTable}:`, subErr.message, subErr.details);

                    // 4. Trigger Personalized Confirmation Email only for customers
                    if (!isAffiliate) {
                        const resendApiKey = Deno.env.get("RESEND_API_KEY");

                        if (resendApiKey && email) {
                            try {
                                // a. Fetch User Profile for "Travel DNA"
                                const { data: profile } = await supabaseClient
                                    .from('profiles')
                                    .select('personalization')
                                    .eq('id', u2)
                                    .single();

                                const userDNA = profile?.personalization || {};
                                const userInterests = [
                                    userDNA.tripTypes,
                                    userDNA.excitement,
                                    ...(Array.isArray(userDNA.tripTypes) ? userDNA.tripTypes : [])
                                ].filter(Boolean).map(t => t.toLowerCase());

                                // b. Fetch Recommended Products
                                const { data: produkter } = await supabaseClient
                                    .from('listed_products')
                                    .select('*')
                                    .eq('is_active', true)
                                    .limit(20);

                                // c. Match Products
                                const recommendations = (produkter || [])
                                    .map(p => {
                                        const tags = Array.isArray(p.theme_tags) ? p.theme_tags : (p.theme_tags?.split(',') || []);
                                        const matchCount = tags.filter(t => userInterests.includes(t.trim().toLowerCase())).length;
                                        return { ...p, matchCount };
                                    })
                                    .sort((a, b) => b.matchCount - a.matchCount)
                                    .slice(0, 3);

                                // d. Build Recommendations HTML
                                const baseUrl = udf1 ? new URL(udf1).origin : "https://wanderhub.ai";
                                let recsHtml = '';
                                if (recommendations.length > 0) {
                                    recsHtml = `
                                        <div style="margin-top: 40px; border-top: 2px solid #f1f5f9; padding-top: 30px;">
                                            <h3 style="color: #0f172a; font-size: 18px; margin-bottom: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Selected for Your DNA</h3>
                                            <div style="display: grid; gap: 20px;">
                                                ${recommendations.map(r => `
                                                    <a href="${baseUrl}/user/deals?id=${r.id}" style="text-decoration: none; display: block; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; background: #f8fafc;">
                                                        <div style="width: 120px; min-width: 120px;">
                                                            <img src="${r.media_urls?.[0] || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=300'}" style="width: 100%; height: 100%; object-fit: cover;" />
                                                        </div>
                                                        <div style="padding: 15px; flex: 1;">
                                                            <h4 style="margin: 0 0 5px; font-size: 15px; color: #1e293b; font-weight: 700;">${r.title}</h4>
                                                            <p style="font-size: 12px; color: #64748b; margin: 0;">${r.location}</p>
                                                            <div style="margin-top: 10px; color: #0d9488; font-weight: 800; font-size: 14px;">₹${r.pricing?.[0]?.cost || 'Exclusive'}</div>
                                                        </div>
                                                    </a>
                                                `).join('')}
                                            </div>
                                        </div>`;
                                }

                                // e. Dispatch Email
                                await fetch("https://api.resend.com/emails", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${resendApiKey}`,
                                    },
                                    body: JSON.stringify({
                                        from: "TraivoAI <info@traivoai.com>",
                                        to: [email],
                                        subject: `Activation Confirmed: Welcome to WanderHub ${u3.toUpperCase()} 🚀`,
                                        html: `
                                            <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: auto; background: #ffffff;">
                                                <div style="background: #0f172a; padding: 50px 20px; text-align: center; border-radius: 0 0 40px 40px;">
                                                    <div style="background: #0d9488; width: 60px; height: 60px; line-height: 60px; border-radius: 18px; display: inline-block; margin-bottom: 20px; font-size: 30px;">🚀</div>
                                                    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; font-style: italic;">WanderHub</h1>
                                                    <p style="color: #94a3b8; margin: 10px 0 0; text-transform: uppercase; font-size: 11px; letter-spacing: 3px; font-weight: 700;">Intelligence for Modern Travelers</p>
                                                </div>

                                                <div style="padding: 40px 30px;">
                                                    <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-top: 0;">Great to have you, ${firstname}!</h2>
                                                    <p style="color: #64748b; line-height: 1.7; font-size: 15px;">Your <b>${u3.toUpperCase()}</b> plan is now globally active. We've unlocked all premium AI engines and collaborative toolkits for your account.</p>

                                                    <div style="background: #f1f5f9; padding: 25px; border-radius: 20px; margin: 35px 0; border: 1px dashed #cbd5e1;">
                                                        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                                                            <tr>
                                                                <td style="color: #64748b; font-weight: 700; padding: 5px 0;">MERCHANT ID</td>
                                                                <td style="text-align: right; color: #1e293b; font-weight: 800;">WHub-${txnid.split('_').pop()?.toUpperCase()}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style="color: #64748b; font-weight: 700; padding: 5px 0;">GATEWAY REF</td>
                                                                <td style="text-align: right; color: #1e293b; font-weight: 800;">${mihpayid || 'N/A'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style="color: #64748b; font-weight: 700; padding: 5px 0;">AMOUNT</td>
                                                                <td style="text-align: right; color: #0d9488; font-weight: 900;">₹${amount}</td>
                                                            </tr>
                                                        </table>
                                                    </div>

                                                    <div style="text-align: center; margin: 40px 0;">
                                                        <a href="${baseUrl}/user/wanderchat" style="background: #0d9488; color: white; padding: 20px 40px; border-radius: 18px; text-decoration: none; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(13, 148, 136, 0.3);">START YOUR NEXT JOURNEY</a>
                                                    </div>

                                                    ${recsHtml}

                                                    <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;">
                                                        <p style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0;">WanderHub v1.0 | Travel with Intelligence</p>
                                                        <p style="color: #cbd5e1; font-size: 10px; margin-top: 10px;">This email confirms your subscription. For support, reach out to help@wanderhub.ai</p>
                                                    </div>
                                                </div>
                                            </div>
                                        `,
                                    }),
                                });
                            } catch (emailErr) {
                                console.error("Email Error:", emailErr);
                            }
                        }
                    }
                }

                return new Response(JSON.stringify({
                    verified: isValid,
                    status: status,
                    generated_hash: hashHex,
                    received_hash: responseHash
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        const err = error as any;
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
