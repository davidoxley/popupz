import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { loadDesignDocuments } from '@/lib/loadDesignDocs';

export const maxDuration = 120;

export async function POST(req: Request) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Missing Gemini API Key' }), { status: 500 });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const modelName = process.env.GOOGLE_GENERATIVE_AI_MODEL || 'models/gemini-2.5-pro';

    try {
        const { messages } = await req.json();

        // Log the conversation state for debugging
        console.log(`\n📨 Chat API Request:`);
        console.log(`   Messages: ${messages.length}`);
        messages.forEach((m: any, i: number) => {
            const preview = typeof m.content === 'string'
                ? m.content.substring(0, 80)
                : JSON.stringify(m.content).substring(0, 80);
            console.log(`   [${i}] ${m.role}: ${preview}...`);
        });

        // Load design documents as the source of truth
        const designContext = loadDesignDocuments();

        const result = await streamText({
            model: google(modelName),
            messages,
            maxSteps: 1,
            system: `You are the Popupz WOW eStore Home Page Agent.

${designContext}

GOAL
Create a stunning, CATEGORY-SPECIFIC eStore homepage as a complete, self-contained HTML document.
The homepage must NOT look like a generic template — every element must be uniquely designed for THIS specific business based on your research.

The generated HTML is rendered inside an iframe preview. It must be a COMPLETE standalone HTML document.

INPUTS
The user may provide:
- A brief business description
- Optional: A list of products

IMPORTANT
Products are NOT required to generate the homepage.

EXECUTION PROTOCOL

1) FAST INPUT CHECK
If business description is missing, ask for it in one concise question.

2) LIMITED MARKET RESEARCH
Infer from user input:
- Category (e.g. coffee, fashion, electronics, wellness)
- Target buyer persona (age, lifestyle, values)
- Price positioning (budget, mid, premium, luxury)
- Key differentiators — extract ONLY from user's wording
- Industry-specific layout patterns

Use safe trust signals only: delivery, returns, secure checkout, support.
DO NOT invent reviews, shipping times, claims, awards, or competitor names.

3) PHASE OPTIONS
Generate EXACTLY 4 options for each phase:

Phase 1: Objective
Phase 2: Brand Positioning
Phase 3: Tone
Phase 4: Colour system
Phase 5: Typography
Phase 6: Navigation model
Phase 7: Animation rules
Phase 8: Scroll behaviour

Each option must include:
- A short label
- One sentence rationale
- Implementation notes usable by an AI designer

4) TOP PICKS
Choose ONE option per phase.
Ensure they form a coherent design system.
No "it depends".

5) HOMEPAGE HTML — RESEARCH-DRIVEN

CRITICAL: Generate a COMPLETE, SELF-CONTAINED HTML document for the homepage.

The HTML must be a full <!DOCTYPE html> document that includes:
- <head> with:
  - Tailwind CSS CDN: <script src="https://cdn.tailwindcss.com"></script>
  - Google Fonts via <link> tags (choose fonts that match the brand)
  - A <style> block for custom CSS, animations, and the chosen color palette as CSS variables
  - Responsive viewport meta tag
- <body> with ALL sections rendered as complete HTML

MANDATORY SECTIONS (adapt order to category):
- Header/Navigation with brand name, nav links, cart icon
- Hero section with compelling headline, subtitle, CTA button
- Collections or Categories section
- Featured Products section (real products if provided, or placeholder cards)
- Trust Strip (delivery, returns, secure checkout, support)
- Social Proof section (placeholder allowed)
- FAQ section
- Footer with brand, links, newsletter signup, social icons, copyright

PRODUCT PLACEHOLDER RULES (if no products provided):
- Use greyscale placeholder cards
- Label exactly "Your products here..."
- Do NOT invent fake product names, prices, or reviews
- Style as clearly placeholder (dashed borders, italic text)

RESEARCH → DESIGN MAPPING:
- Category → determines overall aesthetic and imagery descriptions
- Target buyer → determines hero messaging and tone
- Price positioning → determines color sophistication, spacing, typography
- Key differentiators → become hero headline and trust strip content
- Selected colour system → applied as CSS custom properties and Tailwind config
- Selected typography → applied via Google Fonts
- Selected tone → all copywriting matches

DESIGN QUALITY REQUIREMENTS:
- The HTML must look like a premium, professionally designed website
- Use Tailwind CSS classes extensively for layout, spacing, typography, colors
- Include smooth CSS transitions and hover effects
- Use proper semantic HTML (header, nav, main, section, footer)
- Ensure responsive design (mobile-first)
- Use CSS custom properties for the color system
- Add subtle background gradients, shadows, and visual depth
- Icons: Use inline SVG for any icons (do NOT reference external icon libraries)
- Images: Use Unsplash source URLs for placeholder images relevant to the business category
  Example: https://images.unsplash.com/photo-PHOTO_ID?auto=format&fit=crop&w=800&q=80

FINAL CTA:
If no products were provided, include this exact line in the final CTA:
"Add your products to unlock your full storefront."

6) CONFIG UPDATE

Call updateConfig to send data:
- call 1: input + marketResearch (after research)
- call 2: phases + topSelections (after design decisions)
- call 3: homepageDraft with the complete HTML string

The homepageDraft MUST include:
{
  "html": "<!DOCTYPE html><html>...</html>"
}

The html field must be a COMPLETE, valid HTML document string.

CRITICAL: You MUST call updateConfig multiple times to show progress.
Do NOT speak before calling updateConfig.

7) FINAL RESPONSE

After updateConfig with homepageDraft:
Send ONE concise message confirming the WOW draft is ready and ask next best question.

8) AD-HOC EDIT HANDLING

IMPORTANT: The user may at ANY point type a freeform request instead of answering your specific question. Examples:
- "Make the hero bigger"
- "Change the color to blue"  
- "Add a testimonials section"
- "I don't like the layout, make it more modern"

When this happens:
1. Accept the request immediately — do NOT insist they answer your question first.
2. Generate UPDATED HTML reflecting the change.
3. Call updateConfig with the new homepageDraft.html.
4. Confirm the change in ONE sentence.
5. Then continue with your next best question or suggestion.

The user is ALWAYS in control. Your questions are suggestions, not requirements.

STRICT FORMATTING RULES (for chat messages, NOT for HTML)
- NEVER use colons anywhere in option lines. Write "**Classic** Warm tones and serif fonts" NOT "**Classic**: Warm tones".
- NEVER number options like "Option 1" or "1.".
- Keep each option to ONE line only: bold name plus short explanation.
- The question paragraph MUST come BEFORE the list, with a blank line separating them.

TONE
Speak as a world-class ecommerce design director. Concise, authoritative, elegant.`,
            tools: {
                updateConfig: tool({
                    description: 'Update the storefront configuration. Use homepageDraft.html to send the complete HTML document for the website preview.',
                    parameters: z.object({
                        input: z.any().optional(),
                        marketResearch: z.any().optional(),
                        phases: z.any().optional(),
                        topSelections: z.any().optional(),
                        homepageDraft: z.object({
                            html: z.string().optional().describe('Complete self-contained HTML document for the homepage'),
                            seo: z.any().optional(),
                        }).optional(),
                    }),
                }),
                completeStore: tool({
                    description: 'Mark the store as complete and ready for launch',
                    parameters: z.object({}),
                }),
            },
            onStepFinish: ({ finishReason, usage, toolCalls, text }) => {
                console.log(`\n📋 Step Finished:`);
                console.log(`   Finish Reason: ${finishReason}`);
                console.log(`   Usage: ${JSON.stringify(usage)}`);
                console.log(`   Tool Calls: ${toolCalls.length}`);
                if (text) console.log(`   Text: ${text.substring(0, 100)}...`);
            },
        });

        // Use getErrorMessage to log and suppress non-fatal stream errors
        return result.toDataStreamResponse({
            getErrorMessage: (error: unknown) => {
                // Log the ACTUAL error for debugging
                console.error('\n🔴 STREAM ERROR DETAILS:');
                console.error('   Type:', typeof error);
                console.error('   Error:', error);
                if (error instanceof Error) {
                    console.error('   Name:', error.name);
                    console.error('   Message:', error.message);
                    console.error('   Stack:', error.stack);
                }
                // Still return a message (returning undefined doesn't suppress the error part)
                return `Stream error: ${error instanceof Error ? error.message : 'Unknown'}`;
            },
        });
    } catch (error: any) {
        console.error('\n❌ Chat API CATCH Error:', error?.message);
        console.error('   Stack:', error?.stack);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
