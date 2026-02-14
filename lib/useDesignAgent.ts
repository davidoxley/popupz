"use client";

import { useChat } from "ai/react";
import { useStore, StorefrontConfig } from "@/store/useStore";
import { toast } from "sonner";
import { useRef, useState, useEffect } from "react";

/**
 * Rotating sub-status details to keep the UI feeling alive during each stage.
 */
// OPTIMIZATION: 2024-02-14 — Removed "SELECTING DESIGN DIRECTION" stage.
// To revert: uncomment the stage below and restore phases/topSelections checks in getLoadingStatus.
const STAGE_DETAILS: Record<string, string[]> = {
    "CONNECTING TO AI...": [
        "Establishing secure connection",
        "Initializing design engine",
        "Loading model parameters",
    ],
    "ANALYZING BUSINESS...": [
        "Parsing business description",
        "Identifying product categories",
        "Mapping value propositions",
        "Extracting key differentiators",
    ],
    "RESEARCHING MARKET...": [
        "Studying competitor layouts",
        "Analyzing industry patterns",
        "Identifying trust signals",
        "Evaluating pricing strategies",
        "Benchmarking design trends",
    ],
    // "SELECTING DESIGN DIRECTION...": [
    //     "Evaluating brand positioning",
    //     "Selecting typography pairings",
    //     "Curating color palettes",
    //     "Defining animation rules",
    //     "Choosing navigation model",
    // ],
    "BUILDING HOMEPAGE...": [
        "Selecting design direction",
        "Curating color palette",
        "Generating hero section",
        "Composing product grid layout",
        "Building section hierarchy",
        "Writing compelling copy",
        "Applying design tokens",
        "Optimizing for conversion",
    ],
    "UPDATING WEBSITE...": [
        "Applying design changes",
        "Syncing layout components",
        "Preparing preview render",
    ],
};

export function useDesignAgent() {
    const { query, updateConfig, setComplete, isComplete, config, addVersion } = useStore();
    const toolCallCount = useRef(0);
    const [subDetail, setSubDetail] = useState("");
    const subDetailIndex = useRef(0);
    const lastUserMsgRef = useRef<string>('');

    const chat = useChat({
        api: '/api/chat',
        initialMessages: query ? [
            { id: 'initial-user', role: 'user', content: `I want to sell: ${query}` }
        ] : [],
        maxSteps: 10,
        onError: (err) => {
            console.error('Chat Error:', err);
            if (toolCallCount.current === 0) {
                toast.error(`Model Failure: ${err.message || 'The specified model encountered an error.'}`, {
                    duration: 5000,
                });
            } else {
                console.warn(`⚠️ Non-fatal stream error after ${toolCallCount.current} tool calls. Suppressing toast.`);
            }
        },
        onToolCall: ({ toolCall }) => {
            toolCallCount.current += 1;
            console.log(`🔧 Tool Call #${toolCallCount.current}: ${toolCall.toolName}`, toolCall.args);

            if (toolCall.toolName === 'updateConfig') {
                const delta = toolCall.args as any;

                updateConfig((prev: StorefrontConfig) => {
                    console.log('🔄 Updating store with delta:', Object.keys(delta));

                    if (delta.homepageDraft) {
                        console.log('   📐 homepageDraft keys:', Object.keys(delta.homepageDraft));
                        console.log('   📝 HTML length:', delta.homepageDraft.html?.length || 0, 'chars');
                    }
                    if (delta.marketResearch) {
                        console.log('   🔬 market:', delta.marketResearch.inferredCategory, '/', delta.marketResearch.inferredPricePosition);
                    }

                    const newConfig = {
                        ...prev,
                        input: delta.input ? { ...prev.input, ...delta.input } : prev.input,
                        marketResearch: delta.marketResearch ? { ...prev.marketResearch, ...delta.marketResearch } : prev.marketResearch,
                        phases: delta.phases ? { ...prev.phases, ...delta.phases } : prev.phases,
                        topSelections: delta.topSelections ? { ...prev.topSelections, ...delta.topSelections } : prev.topSelections,
                        homepageDraft: delta.homepageDraft ? { ...prev.homepageDraft, ...delta.homepageDraft } : prev.homepageDraft,
                    };

                    return newConfig;
                });

                // Track version history AFTER updateConfig completes (avoid nested set() calls)
                if (delta.homepageDraft?.html) {
                    const versionCount = useStore.getState().htmlVersions.length;
                    let label: string;
                    if (versionCount === 0) {
                        label = 'Initial homepage draft';
                    } else {
                        const sel = lastUserMsgRef.current;
                        label = sel && sel.length > 0
                            ? (sel.length > 40 ? sel.slice(0, 37) + '...' : sel)
                            : `Design update #${versionCount + 1}`;
                    }
                    addVersion(delta.homepageDraft.html, label);
                }

                return { status: 'success', updated: Object.keys(delta) };
            } else if (toolCall.toolName === 'completeStore') {
                setComplete(true);
                return { status: 'acknowledged' };
            }
        },
        onFinish: () => {
            console.log(`✅ Chat finished. Total tool calls: ${toolCallCount.current}`);
        }
    });

    // Track the last user message for version labels
    useEffect(() => {
        const lastUser = chat.messages.filter(m => m.role === 'user').pop();
        if (lastUser && typeof lastUser.content === 'string') {
            lastUserMsgRef.current = lastUser.content;
        }
    }, [chat.messages]);

    const getLoadingStatus = () => {
        if (!chat.isLoading) return "";

        const lastMessage = chat.messages[chat.messages.length - 1];
        const isUserLast = lastMessage?.role === 'user';

        // OPTIMIZATION: 2024-02-14 — Simplified loading stages (no phases/topSelections step).
        // To revert: uncomment the two lines below and change marketResearch line.
        if (config.homepageDraft) return "UPDATING WEBSITE...";
        // if (config.topSelections) return "BUILDING HOMEPAGE...";
        // if (config.phases) return "SELECTING DESIGN DIRECTION...";
        if (config.marketResearch) return "BUILDING HOMEPAGE...";
        if (config.input?.businessDescription || isUserLast) return "ANALYZING BUSINESS...";
        if (chat.messages.length > 1) return "CONNECTING TO AI...";
        return "CONNECTING TO AI...";
    };

    const currentStatus = chat.isLoading ? getLoadingStatus() : "";

    // Rotate sub-detail messages every 2.5 seconds
    useEffect(() => {
        if (!currentStatus || !STAGE_DETAILS[currentStatus]) {
            setSubDetail("");
            subDetailIndex.current = 0;
            return;
        }

        const details = STAGE_DETAILS[currentStatus];
        setSubDetail(details[0]);
        subDetailIndex.current = 0;

        const interval = setInterval(() => {
            subDetailIndex.current = (subDetailIndex.current + 1) % details.length;
            setSubDetail(details[subDetailIndex.current]);
        }, 2500);

        return () => clearInterval(interval);
    }, [currentStatus]);

    return {
        ...chat,
        isComplete,
        loadingStatus: currentStatus,
        loadingDetail: subDetail,
        reload: chat.reload
    };
}
