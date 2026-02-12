import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGemini() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey || apiKey === 'your_api_key_here') {
        console.error('❌ Error: Gemini API Key is not set or is still the placeholder.');
        return;
    }

    console.log(`Testing Gemini with key prefix: ${apiKey.substring(0, 8)}`);

    try {
        console.log('Sending request to Gemini...');
        const result = await generateText({
            model: google('gemini-1.5-flash'),
            prompt: 'Hi, are you working? Just say "YES".',
        });

        console.log('✅ AI Response:', result.text);
    } catch (error) {
        console.error('❌ AI connection failed!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.cause) console.error('Error Cause:', error.cause);
    }
}

testGemini();
