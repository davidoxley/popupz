import fs from 'fs';
import path from 'path';

/**
 * Loads all design documents from /docs/design/ and returns them
 * as a single string block for injection into the system prompt.
 * 
 * Each document is wrapped with its filename as a header so the AI
 * can reference specific sections.
 * 
 * Cached in memory after first load (per server cold start).
 */

let cachedDesignContext: string | null = null;

export function loadDesignDocuments(): string {
    if (cachedDesignContext) return cachedDesignContext;

    const designDir = path.join(process.cwd(), 'docs', 'design');

    if (!fs.existsSync(designDir)) {
        console.warn('⚠️ Design documents directory not found:', designDir);
        return '';
    }

    const files = fs.readdirSync(designDir)
        .filter(f => f.endsWith('.md'))
        .sort(); // Alphabetical = consistent ordering

    const sections = files.map(file => {
        const filePath = path.join(designDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const label = file.replace('.md', '').replace(/-/g, ' ').toUpperCase();
        return `### ${label}\n${content}`;
    });

    cachedDesignContext = `
═══════════════════════════════════════════════════════════
DESIGN SOURCE OF TRUTH — MANDATORY REFERENCE
═══════════════════════════════════════════════════════════

The following design documents are your ABSOLUTE source of truth.
You MUST follow every rule, pattern, and constraint defined below.
If your design output contradicts any of these documents, the documents win.
Do NOT deviate from these specifications under any circumstances.

${sections.join('\n\n---\n\n')}

═══════════════════════════════════════════════════════════
END OF DESIGN SOURCE OF TRUTH
═══════════════════════════════════════════════════════════
`;

    console.log(`📐 Loaded ${files.length} design documents (${cachedDesignContext.length} chars)`);
    return cachedDesignContext;
}
