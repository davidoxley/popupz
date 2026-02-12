import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        const result = await streamText({
            model: google('models/gemini-3-pro-preview'),
            messages,
            maxSteps: 5,
            system: `You are the Popupz AI storefront architect. Your goal is to help the user build their e-commerce store.
        
        ACTION PLAN:
        1. IMMEDIATELY call 'updateBrandName' to give the store a name based on the user's initial query.
        2. IMMEDIATELY call 'updateAesthetic' to set a visual style that matches the product (e.g., earthy for plants, cyberpunk for tech).
        3. Greet the user, tell them the brand name and style you've chose, and then ask for the price of their core product. Use 'updatePrice' once they provide it.
        4. Once all 3 (Brand, Aesthetic, Price) are set, call 'completeStore'.
        
        GUIDELINES:
        - ALWAYS use tools. Do not just chat.
        - Be enthusiastic and creative.`,
            tools: {
                updateBrandName: tool({
                    description: 'Update the name of the e-commerce brand',
                    parameters: z.object({
                        name: z.string().describe('The name of the brand'),
                    }),
                    execute: async ({ name }) => ({ name }),
                }),
                updateAesthetic: tool({
                    description: 'Update the visual aesthetic of the store',
                    parameters: z.object({
                        aesthetic: z.string().describe('The aesthetic style (e.g., minimalist, bold, cyberpunk, earthy)'),
                    }),
                    execute: async ({ aesthetic }) => ({ aesthetic }),
                }),
                updatePrice: tool({
                    description: 'Update the average price of the core product',
                    parameters: z.object({
                        price: z.string().describe('The price as a string (e.g., "150")'),
                    }),
                    execute: async ({ price }) => ({ price }),
                }),
                completeStore: tool({
                    description: 'Mark the store as complete and ready for launch',
                    parameters: z.object({}),
                    execute: async () => ({ status: 'complete' }),
                }),
            },
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('❌ Chat API Error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
