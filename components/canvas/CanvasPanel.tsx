"use client";

import React from "react";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";

/**
 * The "Get ready to be wow-ed" loading screen.
 * Shown while the AI agent is still generating the homepage draft.
 */
function WowLoader() {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-[#050505]">
            <motion.div
                animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.98, 1, 0.98]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-6"
            >
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight uppercase" style={{ letterSpacing: '0.1em', color: '#CCCCCC' }}>
                    Get ready to be wow-ed
                </h2>
                <p className="text-sm font-medium" style={{ color: '#666666' }}>Collaborating with the design agent...</p>
            </motion.div>
        </div>
    );
}

/**
 * Website preview panel.
 * Renders the AI-generated HTML inside an iframe.
 * The HTML is completely self-contained (includes Tailwind CDN, Google Fonts, etc).
 * No static templates — 100% AI-generated content.
 */
function WebsitePreview({ html }: { html: string }) {
    const brandName = useStore((s) => s.config.input?.businessName || "mystore");

    return (
        <div className="min-h-full p-8 flex flex-col items-center overflow-y-auto w-full">
            <motion.div
                key="website-preview"
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-5xl bg-white shadow-2xl overflow-hidden border border-zinc-200 flex flex-col min-h-[800px] transition-all duration-500"
                style={{ borderRadius: '1.5rem' }}
            >
                {/* Browser chrome */}
                <div className="h-10 bg-zinc-50 border-b border-zinc-200 flex items-center px-4 gap-2 shrink-0">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 max-w-md mx-auto h-6 bg-white rounded-md border border-zinc-200 flex items-center px-3">
                        <span className="text-[10px] text-zinc-400 font-mono">
                            https://{brandName.toLowerCase().replace(/\s+/g, "-")}.popupz.shop
                        </span>
                    </div>
                </div>

                {/* AI-generated HTML rendered in an isolated iframe */}
                <iframe
                    srcDoc={html}
                    title="Website Preview"
                    className="flex-1 w-full border-none"
                    style={{ minHeight: '760px' }}
                    sandbox="allow-scripts allow-same-origin"
                />
            </motion.div>
        </div>
    );
}

/**
 * Main CanvasPanel — gate: WowLoader until homepageDraft.html exists.
 * Zero static templates. The AI generates the ENTIRE page.
 */
export default function CanvasPanel() {
    const homepageDraft = useStore((state) => state.config.homepageDraft);

    if (!homepageDraft?.html) {
        return <WowLoader />;
    }

    return <WebsitePreview html={homepageDraft.html} />;
}
