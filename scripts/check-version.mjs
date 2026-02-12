import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkMethods() {
    try {
        const result = streamText({
            model: google('gemini-1.5-flash'),
            messages: [{ role: 'user', content: 'hi' }]
        });

        console.log('Result properties:', Object.keys(result));
        console.log('Result prototype properties:', Object.keys(Object.getPrototypeOf(result)));

        if (result.toDataStreamResponse) console.log('✅ toDataStreamResponse exists');
        else console.log('❌ toDataStreamResponse MISSING');

        if (result.toTextStreamResponse) console.log('✅ toTextStreamResponse exists');
        else console.log('❌ toTextStreamResponse MISSING');

        if (result.toAIStreamResponse) console.log('✅ toAIStreamResponse exists');
        else console.log('❌ toAIStreamResponse MISSING');

    } catch (e) {
        console.error('Error during check:', e);
    }
}

checkMethods();
