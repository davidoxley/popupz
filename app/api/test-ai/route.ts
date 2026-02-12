import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function GET() {
    try {
        const { text } = await generateText({
            model: google('gemini-1.5-flash'),
            prompt: 'Hello',
        });
        return new Response(JSON.stringify({ text }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
