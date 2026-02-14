import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface StockImage {
    id: string;
    filename: string;
    path: string;
    title: string;
    description: string;
    category: string;
    tags: string[];
}

interface Manifest {
    images: StockImage[];
}

let cachedManifest: Manifest | null = null;

function getManifest(): Manifest {
    if (cachedManifest) return cachedManifest;
    const manifestPath = path.join(process.cwd(), 'public', 'images', 'stock', 'manifest.json');
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    cachedManifest = JSON.parse(raw) as Manifest;
    return cachedManifest;
}

/**
 * Scores how well an image matches a search query.
 * Checks title, description, category, and tags.
 */
function scoreMatch(image: StockImage, query: string): number {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let score = 0;

    for (const term of terms) {
        // Title match (highest weight)
        if (image.title.toLowerCase().includes(term)) score += 3;
        // Tag exact match (high weight)
        if (image.tags.some(t => t === term)) score += 2;
        // Tag partial match
        if (image.tags.some(t => t.includes(term) || term.includes(t))) score += 1;
        // Description match
        if (image.description.toLowerCase().includes(term)) score += 1;
        // Category match
        if (image.category.toLowerCase().includes(term)) score += 2;
    }

    return score;
}

/**
 * GET /api/images/search?q=meeting+room&limit=3
 *
 * Searches local stock images by query string.
 * Returns the best matching images sorted by relevance score.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);
    const category = searchParams.get('category') || '';

    const manifest = getManifest();

    let images = manifest.images;

    // Filter by category if specified
    if (category) {
        images = images.filter(img => img.category.toLowerCase() === category.toLowerCase());
    }

    if (!query) {
        // No query — return all (or category-filtered) images
        return NextResponse.json({
            results: images.slice(0, limit).map(img => ({
                id: img.id,
                path: img.path,
                title: img.title,
                description: img.description,
                category: img.category,
                tags: img.tags,
            })),
            total: images.length,
        });
    }

    // Score and sort by relevance
    const scored = images
        .map(img => ({ image: img, score: scoreMatch(img, query) }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return NextResponse.json({
        query,
        results: scored.map(s => ({
            id: s.image.id,
            path: s.image.path,
            title: s.image.title,
            description: s.image.description,
            category: s.image.category,
            tags: s.image.tags,
            relevanceScore: s.score,
        })),
        total: scored.length,
    });
}
