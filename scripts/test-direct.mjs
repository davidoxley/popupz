import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function directTest() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    console.log('Testing direct Google AI SDK connection...');
    try {
        const result = await model.generateContent('Say "PASS"');
        console.log('✅ Direct Response:', result.response.text());
    } catch (e) {
        console.error('❌ Direct Test Failed:', e.message);
    }
}

directTest();
