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

    // 5. Handle broken images — hide and apply gradient fallback to parent
    document.addEventListener('error', function(e) {
        if (e.target && e.target.tagName === 'IMG') {
            e.target.style.display = 'none';
            if (e.target.parentElement) {
                e.target.parentElement.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
                e.target.parentElement.style.minHeight = e.target.parentElement.style.minHeight || '120px';
            }
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
 * A single version thumbnail with a custom tooltip.
 */
function VersionThumbnail({ index, label, isActive, onClick }: {
    index: number;
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={onClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
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
            >
                {index + 1}
            </button>

            {/* Modern glassmorphism tooltip */}
            {hovered && (
                <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginTop: '8px',
                        width: '200px',
                        pointerEvents: 'none',
                        zIndex: 50,
                    }}
                >
                    {/* Tooltip arrow */}
                    <div style={{
                        position: 'absolute',
                        top: '-4px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: '8px',
                        height: '8px',
                        background: 'rgba(15,15,20,0.92)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderBottom: 'none',
                        borderRight: 'none',
                    }} />
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(15,15,20,0.92), rgba(25,25,35,0.88))',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
                    }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 400,
                            color: '#a1a1aa',
                            lineHeight: 1.4,
                        }}>
                            {label}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
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
        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '-10px', marginBottom: '10px' }}>
            {versions.map((v, i) => (
                <VersionThumbnail
                    key={i}
                    index={i}
                    label={v.label}
                    isActive={i === activeIndex}
                    onClick={() => setActiveVersion(i)}
                />
            ))}
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

    // If user clicked an older version thumbnail, show that version.
    // Otherwise, always show the latest homepageDraft.html (the live source of truth).
    const isViewingOldVersion = activeIndex >= 0
        && activeIndex < versions.length
        && activeIndex < versions.length - 1;

    const displayHtml = isViewingOldVersion
        ? versions[activeIndex].html
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
