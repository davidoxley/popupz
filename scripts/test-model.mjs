import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGemini() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    try {
        console.log('Requesting Gemini 3...');
        const result = await generateText({
            model: google('gemini-3-pro-preview'),
            prompt: 'Please say "GEMINI 3 IS ACTIVE".',
        });
        console.log('✅ AI Response:', result.text);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testGemini();
