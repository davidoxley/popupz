"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";

/**
 * Script injected into the AI-generated HTML inside the iframe.
 * Handles:
 *  1. Blocking all <a> navigation so clicking links doesn't load the parent app
 *  2. Blocking form submissions
 *  3. Enabling document.designMode for inline text editing (click-to-edit any text)
 *  4. Posting edited HTML back to the parent window via postMessage
 */
const INJECTED_SCRIPT = `
<script>
(function() {
    // 1. Block ALL link navigation inside the iframe
    document.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        if (link) {
            e.preventDefault();
            e.stopPropagation();
        }
        // Also block buttons that might trigger navigation
        var button = e.target.closest('button');
        if (button && button.type === 'submit') {
            e.preventDefault();
        }
    }, true);

    // 2. Block form submissions
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, true);

    // 3. Enable inline text editing — makes every piece of text click-to-edit
    document.designMode = 'on';

    // 4. Sync edits back to parent ONLY when the user clicks away (focusout)
    document.addEventListener('focusout', function() {
        // Small delay to let the browser finalize the edit
        setTimeout(function() {
            window.parent.postMessage({
                type: 'PREVIEW_HTML_EDIT',
                bodyHtml: document.body.innerHTML
            }, '*');
        }, 100);
    });

    // 5. Handle broken images — replace with styled placeholder
    document.addEventListener('error', function(e) {
        if (e.target && e.target.tagName === 'IMG') {
            var img = e.target;
            var placeholder = document.createElement('div');
            placeholder.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;background:linear-gradient(135deg,#f0f0f0,#e0e0e0);color:#a1a1aa;width:' + (img.width || 300) + 'px;height:' + (img.height || 200) + 'px;min-height:120px;border-radius:12px;font-size:12px;font-family:sans-serif;';
            placeholder.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Image unavailable</span>';
            if (img.parentNode) img.parentNode.replaceChild(placeholder, img);
        }
    }, true);
})();
</script>

<style>
    /* Subtle edit affordance: show a faint outline on hover */
    [contenteditable]:hover,
    *:hover {
        outline: 1px dashed rgba(59, 130, 246, 0.15) !important;
        outline-offset: 2px;
    }
    *:focus {
        outline: 2px solid rgba(59, 130, 246, 0.4) !important;
        outline-offset: 2px;
    }
    /* Remove default designMode caret styling on non-text elements */
    img, svg, video, iframe {
        pointer-events: none;
    }

</style>
`;

/**
 * Injects the edit/navigation scripts into the AI-generated HTML.
 * Inserts right before </body> if it exists, otherwise appends at the end.
 */
function injectScripts(html: string): string {
    if (!html) return html;

    // Insert before </body> for proper DOM timing
    const bodyCloseIndex = html.lastIndexOf('</body>');
    if (bodyCloseIndex !== -1) {
        return html.slice(0, bodyCloseIndex) + INJECTED_SCRIPT + html.slice(bodyCloseIndex);
    }

    // Fallback: append at the end
    return html + INJECTED_SCRIPT;
}


/**
 * The "Get ready to be wow-ed" loading screen.
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
 * Renders the AI-generated HTML inside an iframe with:
 *  - Navigation blocking (no clicking links loads the parent app)
 *  - designMode editing (click any text to edit it inline)
 *  - Edit sync (changes are saved back to the store)
 */
function WebsitePreview({ html }: { html: string }) {
    const brandName = useStore((s) => s.config.input?.businessName || "mystore");
    const updateConfig = useStore((s) => s.updateConfig);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const editFromIframe = useRef(false);
    const stableHtmlRef = useRef<string>("");
    const lastExternalHtmlRef = useRef<string>("");

    // Only recompute the iframe srcDoc when:
    //  - The html prop genuinely changed (new AI-generated content)
    //  - AND the change was NOT triggered by an iframe edit
    // This prevents flash/reload when the user edits text inline.
    if (html !== lastExternalHtmlRef.current) {
        if (!editFromIframe.current) {
            // External change (AI sent new HTML) — update the iframe
            stableHtmlRef.current = injectScripts(html);
        }
        lastExternalHtmlRef.current = html;
        editFromIframe.current = false;
    }

    const enhancedHtml = stableHtmlRef.current;

    // Listen for edit messages from the iframe
    const handleMessage = useCallback((event: MessageEvent) => {
        if (event.data?.type === 'PREVIEW_HTML_EDIT' && event.data.bodyHtml) {
            console.log('✏️ Preview edited — syncing to store (no iframe reload)');
            editFromIframe.current = true;
            // Reconstruct the full HTML with the edited body
            updateConfig((prev) => {
                if (!prev.homepageDraft?.html) return prev;
                const currentHtml = prev.homepageDraft.html;

                // Replace the body content in the stored HTML
                const bodyOpenMatch = currentHtml.match(/<body[^>]*>/i);
                const bodyCloseIndex = currentHtml.lastIndexOf('</body>');

                if (bodyOpenMatch && bodyCloseIndex !== -1) {
                    const bodyOpenEnd = currentHtml.indexOf(bodyOpenMatch[0]) + bodyOpenMatch[0].length;
                    const newHtml =
                        currentHtml.slice(0, bodyOpenEnd) +
                        event.data.bodyHtml +
                        currentHtml.slice(bodyCloseIndex);
                    return {
                        ...prev,
                        homepageDraft: { ...prev.homepageDraft, html: newHtml },
                    };
                }
                return prev;
            });
        }
    }, [updateConfig]);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    return (
        <motion.div
            key="website-preview"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full bg-white shadow-2xl overflow-hidden border border-zinc-200 flex flex-col min-h-[800px] transition-all duration-500"
            style={{ borderRadius: '1.5rem' }}
        >
            {/* Browser chrome bar */}
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

            {/* AI-generated HTML in isolated iframe with editing + nav blocking */}
            <iframe
                ref={iframeRef}
                srcDoc={enhancedHtml}
                title="Website Preview"
                className="flex-1 w-full border-none"
                style={{ minHeight: '760px' }}
                sandbox="allow-scripts"
            />
        </motion.div>
    );
}


/**
 * Version history thumbnail strip.
 * Shows a 20x20 numbered square for each version of the rendered homepage.
 */
function VersionStrip() {
    const versions = useStore((s) => s.htmlVersions);
    const activeIndex = useStore((s) => s.activeVersionIndex);
    const setActiveVersion = useStore((s) => s.setActiveVersion);

    if (versions.length <= 1) return null;

    return (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {versions.map((_, i) => {
                const isActive = i === activeIndex;
                return (
                    <button
                        key={i}
                        onClick={() => setActiveVersion(i)}
                        title={`Version ${i + 1}`}
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            border: isActive ? '1.5px solid rgba(59,130,246,0.6)' : '1px solid rgba(255,255,255,0.08)',
                            background: isActive
                                ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))'
                                : 'rgba(255,255,255,0.04)',
                            color: isActive ? '#93c5fd' : '#52525b',
                            fontSize: '9px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: isActive ? '0 0 8px rgba(59,130,246,0.15)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                                e.currentTarget.style.color = '#a1a1aa';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.color = '#52525b';
                            }
                        }}
                    >
                        {i + 1}
                    </button>
                );
            })}
        </div>
    );
}


/**
 * Main CanvasPanel — gate: WowLoader until homepageDraft.html exists.
 * Zero static templates. The AI generates the ENTIRE page.
 */
export default function CanvasPanel() {
    const homepageDraft = useStore((state) => state.config.homepageDraft);
    const versions = useStore((state) => state.htmlVersions);
    const activeIndex = useStore((state) => state.activeVersionIndex);

    if (!homepageDraft?.html) {
        return <WowLoader />;
    }

    // Show the actively selected version, or latest if none selected
    const displayHtml = activeIndex >= 0 && activeIndex < versions.length
        ? versions[activeIndex]
        : homepageDraft.html;

    return (
        <div className="min-h-full p-8 flex flex-col items-center overflow-y-auto w-full" style={{ background: '#050505' }}>
            <div className="w-full max-w-5xl">
                <VersionStrip />
                <WebsitePreview html={displayHtml} />
            </div>
        </div>
    );
}
