export async function generateDeepSeekSummary(productName: string, specs: string): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY environment variable is missing.");
    }

    const prompt = `You are an expert tech reviewer for UAEDISCOUNTHUB, an affiliate electronics deals site targeting the GCC (UAE, KSA, Qatar). 
Write a highly engaging, SEO-friendly 2-3 sentence product summary for the following product.
Focus on its realistic pros/cons and value proposition. Do not use generic corporate language. 
Be concise and factual.

Product Name: ${productName}
Technical Specs: ${specs}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "You are an honest consumer tech reviewer for UAE shoppers." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("DeepSeek API Error:", err);
        throw new Error(`Failed to generate AI summary: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "No summary generated.";
}
