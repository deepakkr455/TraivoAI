
// Mock of the toOpenRouterHistory function from geminiService.ts
const toOpenRouterHistory = (messages) => {
    return messages.map(msg => {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        let content = '';

        // 1. Start with text content if available
        if (msg.content.text) {
            content = msg.content.text;
        }

        // 2. Append structured data block
        if (msg.role === 'model') {
            const { plan, weather, dayPlan } = msg.content;
            if (plan || weather || dayPlan) {
                const dataLabel = plan ? 'trip plan' : (weather ? 'weather report' : 'day plan');
                const data = plan || weather || dayPlan;

                const structuredBlock = `\n\n[SYSTEM: The following ${dataLabel} JSON was generated and displayed to the user as an interactive card:\n${JSON.stringify(data, null, 2)}\n]`;
                content += structuredBlock;
            }
        }

        // 3. Append image info
        if (msg.content.imageUrl) {
            content += (content ? '\n\n' : '') + '[The user was shown a generated image]';
        }

        // Fallback
        if (role === 'assistant' && !content.trim()) {
            content = '[System: Request processed successfully]';
        }

        return { role, content };
    });
};

// Test cases
const testMessages = [
    {
        role: 'user',
        content: { text: "What's the weather in Manali?" }
    },
    {
        role: 'model',
        role_id: 'model',
        role: 'model',
        content: {
            text: "It's cold in Manali.",
            weather: { location: "Manali", current: { temp: 1, condition: "Snow" } }
        }
    },
    {
        role: 'user',
        content: { text: "Plan a trip." }
    },
    {
        role: 'model',
        role_id: 'model',
        role: 'model',
        content: {
            plan: { title: "Adventure", dates: "Dec 1st" }
        }
    }
];

const result = toOpenRouterHistory(testMessages);
console.log(JSON.stringify(result, null, 2));

// Assertions
if (result[1].content.includes("weather report") && result[1].content.includes('"temp": 1')) {
    console.log("✅ Weather history test passed");
} else {
    console.error("❌ Weather history test failed");
}

if (result[3].content.includes("trip plan") && result[3].content.includes('"title": "Adventure"')) {
    console.log("✅ Trip plan history test passed");
} else {
    console.error("❌ Trip plan history test failed");
}

if (!result[1].content.trim().startsWith('[SYSTEM')) {
    console.log("✅ Text prefix preserved");
} else {
    console.error("❌ Text prefix lost");
}
