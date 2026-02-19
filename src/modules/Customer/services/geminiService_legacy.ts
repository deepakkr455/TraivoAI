import { GoogleGenAI, Type, FunctionDeclaration, Content } from "@google/genai";
import { TripPlanData, Message, MessageContent, WeatherData, DayPlan } from '../../../types';
import { supabase } from '../../../services/supabaseClient';


// if (!process.env.API_KEY) {
//     throw new Error("API_KEY environment variable not set");
// }

// GoogleGenAI import removed to prevent client-side key usage
// const ai = new GoogleGenAI({ apiKey: '...' }); // REMOVED

const callGeminiEdgeFunction = async (params: { model: string, contents: any[], config?: any }) => {
    if (!supabase) throw new Error("Supabase not initialized");

    // console.log("Calling Gemini Edge Function with:", params);

    const { data, error } = await supabase.functions.invoke('gemini-api', {
        body: params
    });

    if (error) {
        console.error("Edge Function Error:", error);
        throw new Error(error.message || "Failed to call AI service");
    }

    // Adapt response to match what the client expects (text property)
    return data;
};

const tripPlanSchema = {
    type: Type.OBJECT,
    properties: {
        heroImageText: { type: Type.STRING, description: "A creative and concise phrase for a placeholder hero image, e.g., 'Scenic view of Lansdowne, Uttarakhand'" },
        title: { type: Type.STRING, description: "The main title for the trip plan, e.g., 'Your Lansdowne Retreat'" },
        dates: { type: Type.STRING, description: "The dates of the trip, e.g., 'Nov 08 - Nov 10, 2025'" },
        stats: {
            type: Type.OBJECT,
            properties: {
                duration: { type: Type.STRING },
                weather: { type: Type.STRING, description: "A brief weather forecast, e.g., '18°C, Clear'" },
                transport: { type: Type.STRING },
                stay: { type: Type.STRING },
                distance: { type: Type.STRING, description: "Total estimated travel distance for the trip, e.g., 'Approx. 600 km'" },
            },
            required: ['duration', 'weather', 'transport', 'stay', 'distance']
        },
        dailyItinerary: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                time: { type: Type.STRING },
                                activity: { type: Type.STRING },
                                description: { type: Type.STRING },
                                icon: { type: Type.STRING, description: "A relevant icon name from the Icons.tsx component, e.g., 'CarFront', 'Key', 'Sailboat', 'Route'" }
                            },
                            required: ['time', 'activity', 'description', 'icon']
                        },
                    },
                },
                required: ['day', 'title', 'items']
            },
        },
        bookings: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['Transport', 'Hotel'] },
                    title: { type: Type.STRING },
                    details: { type: Type.STRING },
                    bookingSite: { type: Type.STRING },
                    bookingUrl: { type: Type.STRING, default: "#" },
                    alternatives: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, url: { type: Type.STRING, default: "#" } } } },
                    imageUrl: { type: Type.STRING, description: "A placeholder image URL from placehold.co, e.g., 'https://placehold.co/400x400/34d399/ffffff?text=Cab'" }
                },
                required: ['type', 'title', 'details', 'bookingSite', 'bookingUrl', 'alternatives', 'imageUrl']
            },
        },
        recommendations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['Crucial Traveler Tip', 'Hidden Gem'] },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    icon: { type: Type.STRING, description: "A relevant icon name from Icons.tsx, e.g., 'WifiOff', 'Lightbulb'" }
                },
                required: ['type', 'title', 'description', 'icon']
            },
        },
    },
    required: ['heroImageText', 'title', 'dates', 'stats', 'dailyItinerary', 'bookings', 'recommendations']
};

const functionDeclarations: FunctionDeclaration[] = [
    {
        name: 'create_trip_plan',
        description: 'Generates a detailed, day-by-day travel itinerary based on user specifications. Asks clarifying questions if destination or duration is missing.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                destination: { type: Type.STRING, description: 'The city or country for the trip.' },
                duration: { type: Type.STRING, description: 'The total duration of the trip, e.g., "5 days".' },
                interests: { type: Type.STRING, description: 'User interests like "hiking", "museums", "foodie".' },
            },
            required: ['destination', 'duration'],
        },
    },
    {
        name: 'search_internet',
        description: 'Searches the internet for up-to-date information on a given query. Use this for general questions, news, and current events.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING, description: 'The search query.' },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_weather_forecast',
        description: 'Gets the weather forecast for a specific location.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                location: { type: Type.STRING, description: 'The city and country, e.g., "Paris, France".' },
            },
            required: ['location'],
        },
    },
    {
        name: 'generate_day_plan',
        description: 'Generates a detailed 1-day travel itinerary with map coordinates for a specific location.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                location: { type: Type.STRING, description: 'The location to plan a day for, e.g., "Kyoto, Japan".' },
            },
            required: ['location'],
        },
    },
];

const saveInteraction = async (
    userId: string,
    sessionId: string,
    query: string,
    agentResponse: MessageContent,
    responseCategory: string
) => {
    // ... logic of saveInteraction stays same, just ensuring function signature above matches
    // Wait, I shouldn't be overwriting saveInteraction.
    // I need to update ORCHESTRATE RESPONSE.
    // Let me target orchestrateResponse signature and body specifically.

    if (!supabase) return;
    try {
        const { error } = await supabase.from('user_queries').insert({
            userid: userId,
            session_id: sessionId,
            query: query,
            agent_response: JSON.stringify(agentResponse),
            response_category: responseCategory,
        });
        if (error) throw error;
    } catch (error) {
        console.error("Error saving interaction to Supabase:", error);
    }
};

export const fetchHistory = async (userId: string): Promise<Message[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('user_queries')
            .select('query, agent_response')
            .eq('userid', userId)
            .order('datetime', { ascending: true })
            .limit(20);

        if (error) throw error;

        const messages: Message[] = [];
        let idCounter = 0;
        data.forEach(row => {
            messages.push({
                id: `hist-${idCounter++}`,
                role: 'user',
                content: { text: row.query }
            });
            messages.push({
                id: `hist-${idCounter++}`,
                role: 'model',
                content: JSON.parse(row.agent_response)
            });
        });
        return messages;
    } catch (error) {
        console.error("Error fetching history from Supabase:", error);
        return [];
    }
};

const toGeminiHistory = (messages: Message[]): Content[] => {
    const history: Content[] = [];
    for (const msg of messages) {
        const role = msg.role === 'user' ? 'user' : 'model';
        let text = '';
        if (msg.content.text) {
            text = msg.content.text;
        } else if (msg.content.plan) {
            text = `[A trip plan for ${msg.content.plan.title} was generated and shown to the user as a card.]`;
        } else if (msg.content.imageUrl) {
            text = '[The user was shown a generated image]';
        }
        if (text) {
            history.push({ role, parts: [{ text }] });
        }
    }
    return history;
};

// Security: Input validation to prevent prompt injection and DoS
const validateInput = (input: string, maxLength: number): boolean => {
    if (!input || typeof input !== 'string') return false;
    if (input.length > maxLength) return false;

    // Check for common prompt injection patterns
    const suspiciousPatterns = [
        /ignore\s+(all\s+)?previous\s+instructions?/i,
        /system\s+prompt/i,
        /you\s+are\s+now/i,
        /forget\s+everything/i,
        /new\s+instructions?:/i
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(input));
};


const handleTripPlan = async (args: any, history: Content[], addAgentThought: (thought: string) => void): Promise<MessageContent> => {
    // Validate inputs
    if (!validateInput(args.destination, 100)) {
        return { text: "Invalid destination provided. Please enter a valid location (max 100 characters)." };
    }
    if (!validateInput(args.duration, 50)) {
        return { text: "Invalid duration provided. Please enter a valid duration (e.g., '5 days')." };
    }

    addAgentThought(`Okay, planning a trip to ${args.destination} for ${args.duration}.`);
    addAgentThought("Crafting a personalized itinerary...");

    const prompt = `Generate a detailed trip plan for a ${args.duration} trip to ${args.destination}. Interests: ${args.interests || 'general sightseeing'}. The output must be a JSON object that strictly follows the provided schema. Ensure all fields are filled with high-quality, realistic, and helpful information. Icons must be valid names from the Icons.tsx component.`;
    // alert(788)
    // var response=null;
    // try{
    //     response = await ai.models.generateContent({
    //     model: 'gemini-2.5-flash',
    //     contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
    //     config: {
    //         responseMimeType: 'application/json',
    //         responseSchema: tripPlanSchema,
    //     }
    // });
    // }
    // catch{
    //     response = await ai.models.generateContent({
    //     model: 'gemini-2.5-flash',
    //     contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
    //     config: {
    //         responseMimeType: 'application/json',
    //         responseSchema: tripPlanSchema,
    //     }
    // });
    // }


    const response = await callGeminiEdgeFunction({
        model: 'gemini-2.5-flash',
        contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
        config: {
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: tripPlanSchema,
            }
        }
    });

    // return {"plan":{"heroImageText":"Cherry blossoms framing ancient temples and modern cityscapes","title":"A Culinary & Cultural Journey through Japan","dates":"Oct 15 - Oct 21, 2024","stats":{"duration":"7 Days","weather":"Mild, 15-20°C","transport":"Shinkansen, Subway, Local Trains, Walking","stay":"Mid-range Hotels in Tokyo, Kyoto, Osaka","distance":"Approx. 1000 km (inter-city)"},"dailyItinerary":[{"day":1,"title":"Arrival in Tokyo & Shinjuku Exploration","items":[{"time":"Afternoon","activity":"Arrive at Narita (NRT) or Haneda (HND) Airport","description":"Take the Narita Express or Limousine Bus to your hotel in Tokyo.","icon":"Plane"},{"time":"Evening","activity":"Check-in and Shinjuku Gyoen National Garden","description":"Settle into your hotel. Enjoy a serene walk through the beautiful Shinjuku Gyoen National Garden.","icon":"Key"},{"time":"Dinner","activity":"Shinjuku Golden Gai & Omoide Yokocho","description":"Experience the vibrant nightlife of Golden Gai's tiny bars and savor yakitori and local dishes in the atmospheric Omoide Yokocho (Piss Alley).","icon":"Beer"}]},{"day":2,"title":"Traditional Tokyo & Imperial Grandeur","items":[{"time":"Morning","activity":"Asakusa: Senso-ji Temple & Nakamise-dori","description":"Visit Tokyo's oldest temple, Senso-ji, and browse the traditional stalls of Nakamise-dori for souvenirs and snacks.","icon":"Temple"},{"time":"Lunch","activity":"Local Ramen in Asakusa","description":"Indulge in a hearty bowl of ramen at a highly-rated local eatery.","icon":"UtensilsCrossed"},{"time":"Afternoon","activity":"Imperial Palace East Garden & Ginza","description":"Stroll through the tranquil East Garden of the Imperial Palace. Afterwards, explore the upscale shopping and department stores of Ginza.","icon":"Leaf"},{"time":"Dinner","activity":"Sushi Dinner in Ginza","description":"Enjoy an exquisite sushi dinner at one of Ginza's renowned sushi restaurants.","icon":"UtensilsCrossed"}]},{"day":3,"title":"Pop Culture, Seafood & Shibuya Glamour","items":[{"time":"Morning","activity":"Tsukiji Outer Market","description":"Explore the bustling Tsukiji Outer Market for fresh seafood breakfast, street food, and culinary goods.","icon":"Store"},{"time":"Late Morning","activity":"Harajuku: Takeshita Street & Meiji Jingu Shrine","description":"Dive into Tokyo's youth culture on Takeshita Street, then find serenity at the tranquil Meiji Jingu Shrine.","icon":"ShoppingBag"},{"time":"Afternoon","activity":"Shibuya Crossing & Hachiko Statue","description":"Experience the iconic Shibuya Scramble Crossing and visit the famous Hachiko statue.","icon":"Route"},{"time":"Dinner","activity":"Izakaya Experience in Shibuya","description":"Savor a variety of small dishes and drinks at a lively Japanese izakaya.","icon":"Beer"}]},{"day":4,"title":"Bullet Train to Kyoto & Geisha District","items":[{"time":"Morning","activity":"Travel to Kyoto via Shinkansen (Bullet Train)","description":"Take the Nozomi Shinkansen to Kyoto, enjoying scenic views of the Japanese countryside.","icon":"TrainFront"},{"time":"Lunch","activity":"Kyoto Station Lunch","description":"Grab a quick and delicious lunch at Kyoto Station upon arrival.","icon":"UtensilsCrossed"},{"time":"Afternoon","activity":"Kiyomizu-dera Temple & Higashiyama District","description":"Visit the iconic Kiyomizu-dera Temple with its stunning wooden stage. Explore the charming, traditional streets of the Higashiyama District.","icon":"Temple"},{"time":"Evening","activity":"Gion District Exploration & Dinner","description":"Wander through Kyoto's historic geisha district, Gion. Enjoy a traditional dinner and perhaps spot a geisha or maiko.","icon":"Book"}]},{"day":5,"title":"Kyoto's Temples, Gardens & Tea Ceremony","items":[{"time":"Morning","activity":"Arashiyama Bamboo Grove & Tenryu-ji Temple","description":"Explore the breathtaking Arashiyama Bamboo Grove and the serene gardens of Tenryu-ji Temple.","icon":"Leaf"},{"time":"Lunch","activity":"Shojin Ryori (Buddhist Vegetarian Cuisine)","description":"Experience a traditional vegetarian lunch near Arashiyama.","icon":"UtensilsCrossed"},{"time":"Afternoon","activity":"Kinkaku-ji (Golden Pavilion) & Ryoan-ji Temple","description":"Visit the stunning Kinkaku-ji Golden Pavilion and the minimalist Zen rock garden of Ryoan-ji Temple.","icon":"Temple"},{"time":"Late Afternoon","activity":"Traditional Tea Ceremony","description":"Participate in an authentic Japanese tea ceremony, a profound cultural experience.","icon":"Coffee"}]},{"day":6,"title":"Osaka Foodie Adventure & Dotonbori","items":[{"time":"Morning","activity":"Travel to Osaka & Hotel Check-in","description":"Take a short train ride to Osaka and check into your hotel near Namba or Umeda.","icon":"TrainFront"},{"time":"Lunch","activity":"Kuromon Ichiba Market","description":"Explore Osaka's 'Kitchen' market, trying various street foods and fresh seafood.","icon":"Store"},{"time":"Afternoon","activity":"Osaka Castle (Exterior) & Shinsekai","description":"View the magnificent Osaka Castle from the outside and explore the retro charm of the Shinsekai district.","icon":"Book"},{"time":"Evening","activity":"Dotonbori: Street Food & Nightlife","description":"Immerse yourselves in the dazzling lights and vibrant atmosphere of Dotonbori. Indulge in local specialties like takoyaki, okonomiyaki, and kushikatsu.","icon":"UtensilsCrossed"}]},{"day":7,"title":"Departure from Osaka","items":[{"time":"Morning","activity":"Last-minute souvenir shopping or relaxation","description":"Enjoy a leisurely breakfast and perhaps some last-minute souvenir shopping in Osaka.","icon":"ShoppingBag"},{"time":"Afternoon","activity":"Departure from Kansai International Airport (KIX)","description":"Travel from your hotel to Kansai International Airport (KIX) for your flight home.","icon":"Plane"}]}],"bookings":[{"type":"Transport","title":"International Flights to Japan","details":"Round-trip flights to Tokyo (NRT/HND) and from Osaka (KIX).","bookingSite":"Skyscanner","bookingUrl":"https://www.skyscanner.com","alternatives":[{"name":"Google Flights","url":"https://www.google.com/flights"},{"name":"Expedia","url":"https://www.expedia.com"}],"imageUrl":"https://placehold.co/400x400/8d8d8d/ffffff?text=Flights"},{"type":"Transport","title":"Japan Rail Pass or Individual Tickets","details":"Consider a 7-day Japan Rail Pass for unlimited Shinkansen and JR line travel, or purchase individual tickets for flexibility.","bookingSite":"JR Pass Official","bookingUrl":"https://www.japanrailpass-gorail.com/","alternatives":[{"name":"Klook (JR Pass)","url":"https://www.klook.com"},{"name":"Japan Rail Online (Individual Tickets)","url":"https://www.japanrailpass-reservation.net/japanrailpassonline/"}],"imageUrl":"https://placehold.co/400x400/8d8d8d/ffffff?text=JR+Pass"},{"type":"Hotel","title":"Hotel in Tokyo (e.g., Shinjuku, Shibuya)","details":"3 nights in a comfortable hotel in a central Tokyo district.","bookingSite":"Booking.com","bookingUrl":"https://www.booking.com/city/jp/tokyo.html","alternatives":[{"name":"Agoda","url":"https://www.agoda.com/city/tokyo-jp.html"},{"name":"Marriott Bonvoy","url":"https://www.marriott.com/destinations/travel-guide/tyo-tokyo.mi"}],"imageUrl":"https://placehold.co/400x400/34d399/ffffff?text=Tokyo+Hotel"},{"type":"Hotel","title":"Hotel in Kyoto (e.g., Downtown, Gion)","details":"2 nights in a traditional or modern hotel in Kyoto.","bookingSite":"Hotels.com","bookingUrl":"https://www.hotels.com/de1633513/hotels-kyoto-japan/","alternatives":[{"name":"Trip.com","url":"https://www.trip.com/hotels/kyoto-hotel-list-108/"},{"name":"Rihga Royal Hotel Kyoto","url":"https://www.rihgaroyal.com/kyoto/"}],"imageUrl":"https://placehold.co/400x400/34d399/ffffff?text=Kyoto+Hotel"},{"type":"Hotel","title":"Hotel in Osaka (e.g., Namba, Umeda)","details":"1 night in a convenient hotel in Osaka.","bookingSite":"Expedia","bookingUrl":"https://www.expedia.com/Osaka-Hotels.s2559.Travel-Guide-Filter-Hotels","alternatives":[{"name":"Jalan.net","url":"https://www.jalan.net/en/japan/osaka/"},{"name":"Swissôtel Nankai Osaka","url":"https://www.swissotel-osaka.com/"}],"imageUrl":"https://placehold.co/400x400/34d399/ffffff?text=Osaka+Hotel"}],"recommendations":[{"type":"Crucial Traveler Tip","title":"Get a Suica/Pasmo Card","description":"These rechargeable IC cards are essential for seamless travel on subways and local trains across most major Japanese cities. You can also use them for purchases at convenience stores and vending machines.","icon":"Wallet"},{"type":"Crucial Traveler Tip","title":"Learn Basic Japanese Phrases","description":"Even a few phrases like 'Arigato gozaimasu' (Thank you), 'Sumimasen' (Excuse me/Sorry), and 'Konnichiwa' (Hello) can go a long way in showing respect and enhancing your interactions with locals.","icon":"Book"},{"type":"Hidden Gem","title":"Depachika (Department Store Food Basements)","description":"Explore the food halls in the basements of major department stores (like Isetan, Takashimaya). They offer an incredible array of gourmet foods, bentos, pastries, and regional delicacies. Perfect for grabbing a high-quality, delicious picnic or dinner.","icon":"Store"},{"type":"Crucial Traveler Tip","title":"Pocket Wi-Fi or eSIM","description":"Staying connected is crucial for navigation, translation, and finding local recommendations. Rent a pocket Wi-Fi device or purchase an eSIM for reliable internet access throughout your trip.","icon":"Wifi"},{"type":"Hidden Gem","title":"Local Supermarkets and Convenience Stores","description":"Don't underestimate the quality and variety of food in Japanese supermarkets and convenience stores (konbini like 7-Eleven, FamilyMart, Lawson). They offer fresh bento boxes, onigiri, sandwiches, and hot snacks perfect for budget-friendly meals.","icon":"ShoppingBag"}]}}

    // Helper to strip markdown code blocks
    const stripMarkdown = (text: string): string => {
        return text.replace(/```json/g, '').replace(/```/g, '').trim();
    };

    try {
        // alert(1)
        const cleanText = stripMarkdown(response.text);
        const planData = JSON.parse(cleanText) as TripPlanData;

        addAgentThought("Personalized itinerary created. Now generating a hero image...");

        // const imagePrompt = `A 3D Pixar style animated image of ${planData.heroImageText}`;
        // const imageResponse = await ai.models.generateImages({
        //     model: 'gemini-2.5-flash-image',
        //     // model: 'imagen-4.0-generate-001',
        //     // model: 'imagen-4.0-ultra-generate-001',
        //     // model: 'gemini-2.5-flash-image',
        //     prompt: imagePrompt,
        //     config: {
        //         numberOfImages: 1,
        //         outputMimeType: 'image/jpeg',
        //         aspectRatio: '16:9',
        //     },
        // });

        // const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
        // const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        // planData.heroImageUrl = imageUrl;

        return { plan: planData };

    } catch (e) {
        console.error("Failed to parse trip plan JSON or generate image:", e);
        return { text: "Sorry, I couldn't generate the trip plan correctly. Let's try again." };
    }
};

const handleSearch = async (args: any, history: Content[], addAgentThought: (thought: string) => void, useSearch: boolean): Promise<MessageContent> => {
    addAgentThought(`Searching the internet for: "${args.query}"`);

    const response = await callGeminiEdgeFunction({
        model: 'gemini-2.5-flash',
        contents: [...history, { role: 'user', parts: [{ text: args.query }] }],
        config: useSearch ? { tools: [{ googleSearch: {} }] } : {},
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];

    return { text: response.text, sources };
};

const dayPlanSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: {
            type: Type.STRING,
            description: "The full name of the location, e.g., 'Spiti Valley, Himachal Pradesh, India'."
        },
        weather: {
            type: Type.OBJECT,
            description: "A brief weather forecast for the day.",
            properties: {
                description: { type: Type.STRING, description: "A short weather description, e.g., 'Sunny with a light breeze'." },
                temperature: { type: Type.STRING, description: "The average temperature, e.g., '15°C'." },
                icon: {
                    type: Type.STRING,
                    description: "An icon name representing the weather.",
                    enum: ['sunny', 'cloudy', 'rainy', 'partly-cloudy', 'snowy', 'windy']
                }
            },
            required: ["description", "temperature", "icon"]
        },
        itinerary: {
            type: Type.ARRAY,
            description: "A timeline of events for the day trip, including activities and travel between them. The events must be in chronological order.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        description: "The type of event.",
                        enum: ['activity', 'travel']
                    },
                    time: { type: Type.STRING, description: "The start time of the event in HH:MM format." },
                    name: { type: Type.STRING, description: "For 'activity' type, the name of the place or activity." },
                    description: { type: Type.STRING, description: "For 'activity' type, a brief description of the place or activity." },
                    duration: { type: Type.STRING, description: "The estimated duration of the event, e.g., '1 hour 30 minutes'." },
                    latitude: { type: Type.NUMBER, description: "For 'activity' type, the latitude of the location." },
                    longitude: { type: Type.NUMBER, description: "For 'activity' type, the longitude of the location." },
                    from: { type: Type.STRING, description: "For 'travel' type, the starting point." },
                    to: { type: Type.STRING, description: "For 'travel' type, the destination." },
                    mode: {
                        type: Type.STRING,
                        description: "For 'travel' type, the mode of transport.",
                        enum: ['driving', 'walking']
                    },
                },
                required: ['type', 'time', 'name', 'description']
            }
        }
    },
    required: ["locationName", "weather", "itinerary"]
};

const handleDayPlanMap = async (args: any, history: Content[], addAgentThought: (thought: string) => void): Promise<MessageContent> => {
    // Validate input
    if (!validateInput(args.location, 100)) {
        return { text: "Invalid location provided. Please enter a valid location (max 100 characters)." };
    }

    addAgentThought(`Generating a day plan map for ${args.location}...`);

    const prompt = `Generate a detailed 1-day travel itinerary for "${args.location}". The plan should be realistic for a single day, starting around 8 AM. Include 4-5 interesting places or activities. Provide a short but engaging 1-sentence description for EACH activity and travel step. Also provide travel time between each location. The final event should be returning to the starting point. Provide coordinates for all activity locations. Also include a brief weather summary for the day.`;

    try {
        const response = await callGeminiEdgeFunction({
            model: 'gemini-2.5-flash',
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
            config: {
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: dayPlanSchema,
                }
            },
        });

        const text = response.text.trim();
        const plan = JSON.parse(text) as DayPlan;
        return { dayPlan: plan };
    } catch (error) {
        console.error("Error generating day plan:", error);
        return { text: "Sorry, I couldn't generate the day plan map. Please try again." };
    }
};

export const generateTripSummary = async (
    destination: string,
    duration: string,
    highlights: string[],
    totalExpense: number
): Promise<string> => {
    try {
        const prompt = `Write a short, engaging summary (max 3-4 sentences) for a trip to ${destination} that lasted ${duration}.
        Highlights included: ${highlights.join(', ')}.
        The total cost was $${totalExpense}.
        Focus on the memories and the vibe of the trip. Do not use markdown formatting.`;

        const response = await callGeminiEdgeFunction({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        alert(1)

        return response.text || "A wonderful journey filled with memories.";
    } catch (error) {
        console.error("Error generating trip summary:", error);
        return "An amazing trip to remember!";
    }
};

export const orchestrateResponse = async (
    prompt: string,
    userId: string,
    sessionId: string,
    addAgentThought: (thought: string) => void,
    onResult: (content: MessageContent) => void,
    forcedTool?: string | null
) => {

    addAgentThought("Accessing memory...");
    const conversationHistory = await fetchHistory(userId);
    const geminiHistory = toGeminiHistory(conversationHistory);

    // If a specific tool is forced, inject a system instruction to ensure compliance
    let finalPrompt = prompt;
    if (forcedTool) {
        finalPrompt = `SYSTEM COMMAND: The user has explicitly chosen to use the tool '${forcedTool}'. You must ignore other tools and use '${forcedTool}' to satisfy the request. If parameters are missing, infer them or ask, but do not switch tools.\n\nUser Query: ${prompt}`;
        addAgentThought(`User selected tool: ${forcedTool}. Enforcing usage.`);
    }

    addAgentThought("Analyzing your request...");
    const response = await callGeminiEdgeFunction({
        model: 'gemini-2.5-flash',
        contents: [...geminiHistory, { role: 'user', parts: [{ text: finalPrompt }] }], // Use finalPrompt here
        config: {
            tools: [{ functionDeclarations }],
        },
    });

    const functionCalls = response.functionCalls;
    let finalResult: MessageContent;
    let category: string;

    if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const { name, args } = call;
        category = name;

        switch (name) {
            case 'create_trip_plan':
                alert('create_trip_plan')
                alert(1)
                finalResult = await handleTripPlan(args, geminiHistory, addAgentThought);
                break;
            case 'search_internet':
                alert(2)
                finalResult = await handleSearch(args, geminiHistory, addAgentThought, true);
                break;
            case 'get_weather_forecast':
                alert(3)
                addAgentThought(`Checking the weather for ${args.location}...`);
                try {
                    const weatherData = await fetchWeatherFromGemini((args as any).location);
                    finalResult = {
                        // text: `Here is the current weather for ${args.location}.`,
                        weather: weatherData
                    };
                } catch (error) {
                    console.error("Weather fetch failed:", error);
                    finalResult = { text: `Sorty, I couldn't fetch the weather for ${args.location} at the moment.` };
                }
                break;
            case 'generate_day_plan':
                alert(4)
                finalResult = await handleDayPlanMap(args, geminiHistory, addAgentThought);
                break;
            default:
                alert(5)
                finalResult = await handleSearch({ query: prompt }, geminiHistory, addAgentThought, true);
        }
    } else {
        alert(5)
        category = 'general_query';
        const requiresSearch = !response.text || /latest|recent|news|current|who won|what is the score|weather/.test(prompt.toLowerCase());
        if (requiresSearch) {
            finalResult = await handleSearch({ query: prompt }, geminiHistory, addAgentThought, true);
        } else {
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const sources = groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];
            finalResult = { text: response.text, sources };
        }
    }

    onResult(finalResult);
    console.log(finalResult)
    await saveInteraction(userId, sessionId, prompt, finalResult, category);
};

export const fetchWeatherFromGemini = async (location: string): Promise<WeatherData> => {
    // Validate input
    if (!validateInput(location, 100)) {
        throw new Error("Invalid location provided. Please enter a valid location (max 100 characters).");
    }

    const modelId = "gemini-2.5-flash";

    // Calculate relative dates for the prompt to ensure accuracy
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const next5Days = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i + 1);
        return days[d.getDay()];
    }).join(", ");

    const prompt = `
    I need real-time, highly accurate weather information for ${location}. 
    Please perform a Google Search to find the most up-to-date current weather, details, 5-day forecast, and any relevant weather news or alerts.
    
    After searching, synthesize the data into a strict JSON response.
    
    Requirements:
    1. **Current Weather**: 
       - Temperature (Celsius): Must be a NUMBER.
       - Condition (e.g., "Sunny", "Partly Cloudy")
       - High/Low temps: Must be NUMBERS.
       - Feels Like: Must be a NUMBER.
       - Humidity (%): String (e.g. "50%")
       - Wind (speed & direction): String
       - UV index: String (e.g. "3 Moderate")
       - Visibility: String
       - Pressure: String
       - **Air Quality**: AQI number and category (e.g., "45 (Good)").
       - **Precipitation**: Chance of rain/precipitation in % (e.g. "0%", "45%").
       - **Local Time**: The current day and time at the location (e.g., "Tuesday, 4:30 PM").
    2. **Forecast**: 5-day forecast starting from TOMORROW. The days should be: ${next5Days}.
       - **temp**: Must be a NUMBER (Celsius).
       - **condition**: Short text.
    3. **Projection**: A sophisticated, magazine-style weather narrative (2 sentences). Describe the *feeling*, the visual atmosphere, and the immediate outlook.
    4. **Travel Recommendations**: Suggest 3 "Best Indian Places to Visit" right now. 
       - **Logic**: You MUST base this on a combination of: 
         a) Excellent current weather in that specific Indian location.
         b) Recent travel trends/popularity (is it trending on social media?).
         c) Safety & News (avoid places with recent disasters/alerts).
       - Provide: Place Name, Description, and the specific "Why" (e.g. "Trending due to snow festival + clear skies").
    5. **News**: Find 2-3 recent news headlines specifically about weather, climate, or disasters for ${location}. **IMPORTANT**: Use ONLY real URLs found in the search. If no specific news found, return empty array. DO NOT hallucinate links.
    
    IMPORTANT: Return RAW JSON ONLY. Do not use Markdown formatting (no \`\`\`json blocks).
    
    Structure:
    {
      "location": "City, Country",
      "current": {
        "temp": 20,
        "condition": "Sunny",
        "high": 25,
        "low": 15,
        "feelsLike": 22,
        "humidity": "50%", 
        "wind": "10 km/h NW",
        "uvIndex": "3 Moderate",
        "visibility": "10 km",
        "pressure": "1012 hPa",
        "airQuality": "45 (Good)",
        "precipitation": "0%",
        "localTime": "Tuesday, 4:30 PM"
      },
      "forecast": [
        { "day": "Wednesday", "temp": 22, "condition": "Sunny" } 
      ],
      "projection": "string",
      "travelRecommendations": [
         { "place": "string", "description": "string", "reason": "string" }
      ],
      "news": [
        { "title": "string", "url": "string", "source": "string" }
      ]
    }
  `;

    try {
        const response = await callGeminiEdgeFunction({
            model: modelId,
            contents: [{ role: 'user', parts: [{ text: prompt }] }], // Fixed format for Edge Fn
            config: {
                tools: [{ googleSearch: {} }],
                // responseMimeType cannot be used with tools in this version
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");

        let parsedData: any;

        // Clean and parse JSON
        try {
            // Remove markdown code blocks if they exist (sometimes models ignore instructions)
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(cleanText);
        } catch (e) {
            console.warn("Direct JSON parse failed, attempting extraction", e);
            // Fallback: extract substring between first { and last }
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                parsedData = JSON.parse(match[0]);
            } else {
                throw new Error("Failed to parse weather data structure.");
            }
        }

        // Post-processing to ensure types are correct for components
        if (parsedData.current) {
            parsedData.current.temp = Number(parsedData.current.temp);
            parsedData.current.high = Number(parsedData.current.high);
            parsedData.current.low = Number(parsedData.current.low);
            parsedData.current.feelsLike = Number(parsedData.current.feelsLike);
        }

        if (Array.isArray(parsedData.forecast)) {
            parsedData.forecast = parsedData.forecast.map((f: any) => ({
                ...f,
                temp: Number(f.temp) // Ensure temp is a number for the chart
            }));
        } else {
            parsedData.forecast = [];
        }

        parsedData.travelRecommendations = Array.isArray(parsedData.travelRecommendations) ? parsedData.travelRecommendations : [];
        parsedData.news = Array.isArray(parsedData.news) ? parsedData.news : [];

        // Extract grounding URLs for the "Aggregator" view
        const groundingUrls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map((chunk: any) => chunk.web?.uri)
            .filter((uri: string | undefined) => !!uri) || [];

        const uniqueUrls = [...new Set(groundingUrls)];

        return {
            ...parsedData,
            groundingUrls: uniqueUrls
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to fetch weather data. Please try again.");
    }
};