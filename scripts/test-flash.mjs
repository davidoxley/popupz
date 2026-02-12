import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGemini() {
    try {
        console.log('Requesting Gemini 1.5 Flash...');
        const result = await generateText({
            model: google('gemini-1.5-flash'),
            prompt: 'Say "FLASH IS ACTIVE".',
        });
        console.log('✅ AI Response:', result.text);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testGemini();
