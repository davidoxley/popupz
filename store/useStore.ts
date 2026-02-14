import { create } from 'zustand';

export interface StorefrontConfig {
    // New Schema Fields
    input?: {
        businessName: string | null;
        businessDescription: string | null;
        products: Array<{
            name: string;
            category?: string;
            price?: number;
            description?: string;
            imageUrl?: string;
        }> | null;
    };

    marketResearch?: {
        inferredCategory: string;
        inferredCustomer: string;
        inferredPricePosition: "budget" | "mid" | "premium";
        keyDifferentiators: string[];
        commonHomepagePatterns: string[];
        trustSignalsToUse: string[];
        competitorStyleArchetypes: Array<{ archetype: string; notes: string }>;
    } | null;

    phases?: {
        objective: PhaseInfo;
        brandPositioning: PhaseInfo;
        tone: PhaseInfo;
        colourSystem: PhaseInfo;
        typography: PhaseInfo;
        navigationModel: PhaseInfo;
        animationRules: PhaseInfo;
        scrollBehaviour: PhaseInfo;
    } | null;

    topSelections?: {
        objective: string;
        brandPositioning: string;
        tone: string;
        colourSystem: string;
        typography: string;
        navigationModel: string;
        animationRules: string;
        scrollBehaviour: string;
    } | null;

    homepageDraft?: {
        /** The complete, self-contained HTML string for the homepage. This is what gets rendered. */
        html: string;
        /** Optional structured metadata for logging/debugging */
        seo?: { title: string; metaDescription: string; h1: string };
    } | null;
}

interface PhaseInfo {
    options: Array<{ id: string; label: string; rationale: string; implementationNotes: string[] }>;
    topPickId: string;
    topPickWhy: string;
}

interface StoreState {
    query: string;
    config: StorefrontConfig;
    isComplete: boolean;
    htmlVersions: string[];
    activeVersionIndex: number;
    setQuery: (query: string) => void;
    updateConfig: (delta: Partial<StorefrontConfig> | ((prev: StorefrontConfig) => StorefrontConfig)) => void;
    setComplete: (complete: boolean) => void;
    addVersion: (html: string) => void;
    setActiveVersion: (index: number) => void;
}

const initialConfig: StorefrontConfig = {};

export const useStore = create<StoreState>((set) => ({
    query: '',
    config: initialConfig,
    isComplete: false,
    htmlVersions: [],
    activeVersionIndex: -1,
    setQuery: (query) => set({ query }),
    updateConfig: (delta) => set((state) => ({
        config: typeof delta === 'function' ? delta(state.config) : { ...state.config, ...delta }
    })),
    setComplete: (isComplete) => set({ isComplete }),
    addVersion: (html) => set((state) => {
        const newVersions = [...state.htmlVersions, html];
        return { htmlVersions: newVersions, activeVersionIndex: newVersions.length - 1 };
    }),
    setActiveVersion: (index) => set({ activeVersionIndex: index }),
}));
