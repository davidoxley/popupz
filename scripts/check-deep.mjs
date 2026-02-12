import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function check() {
    const result = streamText({
        model: google('gemini-1.5-flash'),
        messages: [{ role: 'user', content: 'hi' }]
    });

    console.log('Result constructor:', result.constructor.name);

    let proto = Object.getPrototypeOf(result);
    while (proto) {
        console.log('--- Prototype:', proto.constructor.name);
        console.log(Object.getOwnPropertyNames(proto).filter(m => !m.startsWith('_')));
        proto = Object.getPrototypeOf(proto);
    }
}

check();
