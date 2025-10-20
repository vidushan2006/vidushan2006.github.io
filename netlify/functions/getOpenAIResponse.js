// This is your secure, server-side Netlify Function.
// It acts as a middleman between your website and the OpenAI API.

export const handler = async (event) => {
    // We only want to accept POST requests to this function
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ error: 'This function only accepts POST requests.' }),
        };
    }

    // Securely access the API key from Netlify's environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    // Safety check: If the key isn't set on Netlify, stop here.
    if (!OPENAI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'The OPENAI_API_KEY is not configured on the server.' }),
        };
    }

    try {
        // Get the user's question from the request sent by your website
        const { prompt } = JSON.parse(event.body);
        if (!prompt) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ error: 'A "prompt" is required in the request body.' }),
            };
        }

        // Prepare and send the request to the official OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`, // Your key is used securely here
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo', // A powerful and cost-effective model
                messages: [
                    {
                        role: 'system',
                        content: 'You are a friendly and helpful assistant integrated into the VIDU website. Keep your answers concise and engaging.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 150, // Limit response length to manage costs
            }),
        });

        // Handle any errors from the OpenAI API itself
        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error:', errorData);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `OpenAI API Error: ${errorData.error.message}` }),
            };
        }

        // Extract the useful part of the answer from OpenAI's response
        const data = await response.json();
        const aiMessage = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response. Please try again.";

        // Send the clean answer back to your website's chatbot
        return {
            statusCode: 200,
            body: JSON.stringify({ response: aiMessage }),
        };

    } catch (error) {
        // Catch any other unexpected errors
        console.error('Serverless function execution error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal server error occurred.' }),
        };
    }
};
