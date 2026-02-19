import { supabase } from '../../../services/supabaseClient';
import { TripPlanData } from '../../../types';
import { getListedProducts } from '../../AgentAffiliate/services/supabaseService';
import { Product } from '../../AgentAffiliate/types';

// Reusing the OpenRouter adapter from geminiService pattern (simplified)
const callOpenRouter = async (params: {
    mode?: string,
    messages: any[],
    response_format?: any
}) => {
    if (!supabase) throw new Error("Supabase not initialized");

    const { data, error } = await supabase.functions.invoke('openrouter-api', {
        body: params
    });

    if (error) {
        console.error("OpenRouter Edge Function Error:", error);
        throw new Error(error.message || "Failed to call AI service");
    }

    return data;
};

// Models
const OPENROUTER_MODEL_WRITER = "google/gemini-3-flash-preview"; // Good for long form text

export interface BlogPost {
    id: string;
    title: string;
    content: string;
    hero_image_url: string;
    linked_products: string[]; // Product IDs
    created_at: string;
    user_id: string;
    trip_id?: string;
    tags?: string[];
    likes_count?: number;
    unlikes_count?: number;
    shares_count?: number;
}

export const blogService = {
    /**
     * Generates a blog post based on a trip plan.
     * Uses Tavily findings (via listed products if possible) and Trip context.
     */
    async generateBlogFromTrip(trip: { id: string, planData: TripPlanData }, userId: string): Promise<BlogPost | null> {
        try {
            // 1. Fetch products
            const allProducts = await getListedProducts();

            // SEMANTIC SIMILARITY LOGIC: 
            // We pass the top 40 products to the AI and ask it to rank them by geographic and thematic similarity.
            // We also provide the Trip Location explicitly to the AI for better context.
            // TripPlanData doesn't have a direct location field, so we derive it from the title.
            const tripLocation = trip.planData.title.split(' to ')[1] || trip.planData.title.split(' in ')[1] || trip.planData.title;

            const candidateProducts = allProducts.slice(0, 40);

            // 2. Prepare Context
            const dealsContext = candidateProducts.map(p =>
                `- Product: "${p.title}" (ID: ${p.id})\n  Location: ${p.location}\n  Category: ${p.package_type || 'General'}\n  Desc: ${p.description.substring(0, 120)}...`
            ).join('\n');

            const planContext = JSON.stringify(trip.planData, null, 2);

            const prompt = `
            You are a Senior Editor at a world-class travel publication (Nat Geo Travel, Condé Nast).
            Your mission is to produce a definitive, SEO-optimized, and visually evocative travel guide/blog post.

            **TRIP CONTEXT:**
            ${planContext}
            **TRIP LOCATION:** ${tripLocation}

            **DEALS CATALOG (For Similarity Ranking):**
            ${dealsContext}

            **INSTRUCTIONS FOR "SIMILARITY SEARCH" DEALS:**
            -   Analyze the TRIP LOCATION and THEME (e.g., Adventure, Spiritual, Luxury).
            -   From the "DEALS CATALOG", identify the most similar deals.
            -   **MOST SIMILAR** = Geographically closest (e.g. Rishikesh -> Haridwar/Dehradun) or Thematically identical (e.g. Scuba in Goa -> Scuba in Andaman).
            -   Rank them from **MOST to LEAST** similar.
            -   Select the top 4-6 IDs for the "linked_product_ids" field.

            **PREMIUM CONTENT FORMATTING & ENCODING:**
            1.  **Rich Markdown:** You MUST use a variety of Markdown features to make the content "jump" off the page.
                -   Use **Tables** for budget breakdowns or itineraries.
                -   Use **Bold** and *Italic* for emphasis.
                -   Use **Blockquotes** for expert tips.
                -   Use **Horizontal Rules** (---)[ADD A NEW LINE ABOVE AND BELOW THE RULE] to separate major sections.
            2.  **Blue Citations & References:**
                -   When referencing facts or external info, use blue-colored links. NOTE: Ensure Hyperlinks are properly loaded on the page.
                -   Format: <a href="/user/best-deals?product_id=ID" style="color: #2563eb; font-weight: 600; text-decoration: underline;">[Ref: Description]</a>
                -   ENSURE that the hyperlinks are clickable and load the page.
            3.  **SEO & Discovery:** 
                -   Naturally weave in keywords.
                -   Create a "Key Takeaways" section at the end.
            4.  **Formatting:** Ensure proper line spacing. Use \\n\\n between every section and paragraph.
            5.  **Language:** Use sophisticated, sensory Language. Describe the "mist on the mountains" or the "crackling of the wood fire".
            6.  **No Code like junk on the blog content:**
                -   Do not include any code, html, or other technical content.

            **REQUIRED BLOG LENGTH:**
            -   800-1500 words.
            -   Ensure the blog is engaging and easy to read.
            
            **REQUIRED STRUCTURE:**
            -   # Catchy Journey Title
            -   Immersive Introduction
            -   ---
            -   ## The Daily Narrative
            -   (Narrative content with embedded blue citations)
            -   ---
            -   ## Practical Travel Info
            -   | Item | Detail | 
                |------|--------|
                | Best Time | Oct - Mar |
                | Budget | ₹₹ |
            -   ---
            -   ## Expert Recommendations
            -   (Use your "Similarity Search" results here to recommend deals)
            -   ---
            -   ## Conclusion & Final Thoughts

            **OUTPUT FORMAT:**
            ---METADATA---
            {
                "title": "Rich Metadata Title",
                "tags": ["travel", "luxury", "adventure"],
                "linked_product_ids": ["ID1", "ID2"]
            }
            ---CONTENT---
            (Your Rich Markdown content starting here)
            `;

            // 3. Call AI
            const response = await callOpenRouter({
                mode: 'writer',
                messages: [{ role: 'user', content: prompt }],
                // response_format: { type: "json_object" } // REMOVE JSON enforcement to allow custom format
            });

            let rawContent = response.choices[0].message.content;

            // 4. Parse Custom Format
            const parts = rawContent.split('---CONTENT---');
            if (parts.length < 2) {
                console.error("AI response did not contain content delimiter:", rawContent);
                // Fallback attempt: maybe it just returned JSON?
                try {
                    const jsonRes = JSON.parse(rawContent);
                    return await this.saveBlog(userId, trip, jsonRes.title, jsonRes.content, jsonRes.tags, jsonRes.linked_product_ids);
                } catch (e) {
                    throw new Error("Failed to parse AI response format");
                }
            }

            const metadataRaw = parts[0].replace('---METADATA---', '').trim();
            // Clean markdown blocks if present in metadata
            const cleanMetadata = metadataRaw.replace(/```json/g, '').replace(/```/g, '').trim();

            let metadata;
            try {
                metadata = JSON.parse(cleanMetadata);
            } catch (e) {
                console.error("Failed to parse metadata JSON:", cleanMetadata);
                throw new Error("Invalid metadata format from AI");
            }

            const content = parts[1].trim();

            return await this.saveBlog(userId, trip, metadata.title, content, metadata.tags, metadata.linked_product_ids);

        } catch (error) {
            console.error("Analysis Failed:", error);
            // Optional: return a partial error object or retry logic could go here
            return null;
        }
    },

    // Helper to save blog
    async saveBlog(userId: string, trip: any, title: string, content: string, tags: string[], linkedProducts: string[]) {
        const { data, error } = await supabase
            .from('blogs')
            .insert({
                user_id: userId,
                trip_id: trip.id,
                title: title,
                content: content,
                hero_image_url: trip.planData.heroImageUrl || "https://placehold.co/1200x600?text=Travel+Blog",
                tags: tags,
                linked_products: linkedProducts || []
            })
            .select()
            .single();

        if (error) throw error;
        return data as BlogPost;
    },

    async getBlogByTripId(tripId: string): Promise<BlogPost | null> {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('trip_id', tripId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching blog:", error);
            return null;
        }
        return data as BlogPost;
    },

    async getBlogById(id: string): Promise<BlogPost | null> {
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data as BlogPost;
    },

    async toggleInteraction(blogId: string, userId: string, type: 'like' | 'unlike'): Promise<void> {
        const { error } = await supabase.rpc('toggle_blog_interaction', {
            p_blog_id: blogId,
            p_user_id: userId,
            p_interaction_type: type
        });

        if (error) {
            console.error(`Failed to toggle ${type}:`, error);
            throw error;
        }
    },

    async incrementShare(blogId: string): Promise<void> {
        const { error } = await supabase.rpc('increment_blog_counter', {
            p_blog_id: blogId,
            p_counter_type: 'share'
        });
        if (error) console.error("Share increment failed", error);
    },

    async getUserInteraction(blogId: string, userId: string): Promise<'like' | 'unlike' | null> {
        const { data, error } = await supabase
            .from('blog_interactions')
            .select('interaction_type')
            .eq('blog_id', blogId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) return null;
        return data?.interaction_type as 'like' | 'unlike' | null;
    }
};
