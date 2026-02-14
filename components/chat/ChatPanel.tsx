"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDesignAgent } from "@/lib/useDesignAgent";
import { Send, Sparkles, CheckCircle2, Upload } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";


/**
 * A modern pulsing-dots preloader.
 * Three dots that animate in sequence with a subtle scale + opacity effect.
 */
function PulsingDots({ color = '#3b82f6' }: { color?: string }) {
    return (
        <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{
                        scale: [1, 1.4, 1],
                        opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.2,
                    }}
                />
            ))}
        </div>
    );
}


export default function ChatPanel() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showLogoUpload, setShowLogoUpload] = useState(false);
    const [showTextLogo, setShowTextLogo] = useState(false);
    const [textLogoValue, setTextLogoValue] = useState('');

    const chat = useDesignAgent();
    const { messages, input, handleInputChange, handleSubmit, isLoading, isComplete, reload, error, append, setInput, loadingStatus, loadingDetail } = chat;

    useEffect(() => {
        if (messages.length === 1 && messages[0].role === 'user' && !isLoading && !error) {
            reload();
        }
    }, [messages.length, isLoading, reload, error]);

    useEffect(() => {
        if (isComplete) {
            setIsDialogOpen(true);
        }
    }, [isComplete]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // CRITICAL FIX: Only consider assistant messages that have actual text content.
    // Tool-call-only messages have role='assistant' but empty content — we must skip those.
    const latestAssistantMessage = messages
        .filter(m => m.role === 'assistant' && typeof m.content === 'string' && m.content.trim().length > 0)
        .pop();

    // Split the message into question (before list) and options (the list itself)
    // Find the start of a markdown list — supports both - and * markers
    const findListStart = (text: string): number => {
        const candidates = [
            text.indexOf('\n- '),
            text.indexOf('\n* '),
            text.indexOf('\n\n- '),
            text.indexOf('\n\n* '),
        ].filter(i => i > -1);
        return candidates.length > 0 ? Math.min(...candidates) : -1;
    };

    const messageContent = latestAssistantMessage?.content || '';
    const listStartIndex = findListStart(messageContent);
    const questionPart = listStartIndex > -1 ? messageContent.slice(0, listStartIndex).trim() : messageContent.trim();
    const optionsPart = listStartIndex > -1 ? messageContent.slice(listStartIndex).trim() : '';

    // Dynamic placeholder — extracts the topic from the AI's question
    // e.g. "What is the primary goal of your website?" → "or specify your own primary goal..."
    const getPlaceholder = () => {
        if (!questionPart || !optionsPart) return "Describe your business, products, or services...";

        // Find the last sentence (the question) — it's on its own paragraph or after a period
        const sentences = questionPart.split(/[.!]\s+/);
        const lastSentence = sentences[sentences.length - 1]?.trim() || '';

        // Extract the core topic from the question
        const match = lastSentence.match(/(?:what|which|how)\s+(?:is |should |will |would |best |)(?:the |your |a |)(.+?)\??$/i);
        if (match && match[1]) {
            const topic = match[1].replace(/^(be|feel|look)\s+/i, '').trim().toLowerCase();
            return `or specify your own ${topic}...`;
        }

        return "or type your own preference...";
    };

    // State machine:
    // State: show analyzing when loading (clears previous content)
    // This ensures the panel clears when user clicks an option or submits input
    const isAgentAnalyzing = isLoading;
    const showInput = !isLoading && !isComplete && latestAssistantMessage;

    return (
        <div
            className="flex flex-col h-full font-sans"
            style={{ background: '#0a0a0b', color: '#e4e4e7' }}
        >
            {/* Header */}
            <div
                className="px-8 py-6 flex items-center justify-between shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)' }}
                    >
                        <Sparkles className="w-4 h-4" style={{ color: '#60a5fa' }} />
                    </div>
                    <span
                        className="text-[11px] font-bold uppercase"
                        style={{ letterSpacing: '0.15em', color: '#52525b' }}
                    >
                        Design Agent
                    </span>
                </div>
                <div className="flex items-center gap-1.5" style={{ opacity: 0.4 }}>
                    <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: '#3b82f6' }}
                    />
                    <span className="text-[10px] font-bold" style={{ color: '#a1a1aa' }}>LIVE</span>
                </div>
            </div>

            {/* Content Area — uses position:relative + absolute children for true centering */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ position: 'relative' }}>
                <AnimatePresence mode="wait">
                    {/* ─── STATE 1: Agent is analyzing — full-panel centered animated status ─── */}
                    {isAgentAnalyzing ? (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '24px',
                            }}
                        >
                            {/* Pulsing dots preloader */}
                            <PulsingDots />

                            {/* Primary status — 14px, bold, centered */}
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={loadingStatus}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        color: '#71717a',
                                        letterSpacing: '0.2em',
                                        textTransform: 'uppercase',
                                        textAlign: 'center',
                                    }}
                                >
                                    {loadingStatus || "THINKING..."}
                                </motion.span>
                            </AnimatePresence>

                            {/* Sub-detail — rotates to keep things alive */}
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={loadingDetail}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.6 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        fontSize: '11px',
                                        color: '#52525b',
                                        letterSpacing: '0.1em',
                                        fontWeight: 500,
                                        textAlign: 'center',
                                    }}
                                >
                                    {loadingDetail}
                                </motion.span>
                            </AnimatePresence>
                        </motion.div>

                        /* ─── STATE 2: Assistant has a text message — show content ─── */
                    ) : latestAssistantMessage ? (
                        <motion.div
                            key={latestAssistantMessage.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="px-8 md:px-10"
                        >
                            <div className="w-full max-w-lg mx-auto py-12">
                                {/* Question — rendered as markdown so paragraph breaks are preserved */}
                                <div className="mb-6">
                                    <ReactMarkdown
                                        components={{
                                            p: ({ children }) => (
                                                <p
                                                    className="leading-relaxed mb-4 last:mb-0"
                                                    style={{
                                                        fontSize: '16px',
                                                        fontWeight: 600,
                                                        color: '#fafafa',
                                                        lineHeight: 1.5,
                                                    }}
                                                >
                                                    {children}
                                                </p>
                                            ),
                                        }}
                                    >
                                        {questionPart}
                                    </ReactMarkdown>
                                </div>

                                {/* Option Pills */}
                                {optionsPart && (
                                    <div className="flex flex-col gap-3 mb-8" style={{ marginTop: '10px' }}>
                                        <ReactMarkdown
                                            components={{
                                                ul: ({ children }) => <>{children}</>,
                                                ol: ({ children }) => <>{children}</>,
                                                li: ({ node, children }) => {
                                                    const firstChild = node?.children?.[0];
                                                    const isOption = firstChild && firstChild.type === 'element' && firstChild.tagName === 'strong';

                                                    if (isOption) {
                                                        // Extract ALL text from the entire node to detect (current) anywhere
                                                        const extractText = (n: any): string => {
                                                            if (n.type === 'text') return n.value || '';
                                                            if (n.children) return n.children.map(extractText).join('');
                                                            return '';
                                                        };
                                                        const fullText = node ? extractText(node) : '';
                                                        const isCurrent = /\(current\)/i.test(fullText);

                                                        const strongNode = firstChild as any;
                                                        const rawTitle = strongNode?.children?.[0]?.value || '';
                                                        const titleText = rawTitle.replace(/\s*\(current\)\s*/i, '').trim();
                                                        const isSkip = titleText.toLowerCase() === 'skip';

                                                        return (
                                                            <motion.button
                                                                initial={{ opacity: 0, y: 8 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.25 }}
                                                                className="w-full text-left transition-all duration-200 active:scale-[0.98] group"
                                                                style={{
                                                                    background: isCurrent ? 'rgba(59,130,246,0.06)' : isSkip ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                                                                    border: isCurrent ? '1px solid rgba(59,130,246,0.2)' : isSkip ? '1px dashed rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.08)',
                                                                    borderRadius: '16px',
                                                                    padding: '0',
                                                                    overflow: 'hidden',
                                                                    position: 'relative',
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = isCurrent ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.06)';
                                                                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                                                                    e.currentTarget.style.boxShadow = '0 0 0 1px rgba(59,130,246,0.1)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = isCurrent ? 'rgba(59,130,246,0.06)' : isSkip ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)';
                                                                    e.currentTarget.style.borderColor = isCurrent ? 'rgba(59,130,246,0.2)' : isSkip ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.08)';
                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                }}
                                                                onClick={() => {
                                                                    if (titleText.toLowerCase().includes('upload logo') || titleText.toLowerCase().includes('upload my logo')) {
                                                                        setShowLogoUpload(true);
                                                                        return;
                                                                    }
                                                                    if (titleText.toLowerCase().includes('text logo')) {
                                                                        setShowTextLogo(true);
                                                                        setTextLogoValue('');
                                                                        return;
                                                                    }
                                                                    append({ role: 'user', content: isCurrent || isSkip ? 'Skip' : titleText });
                                                                }}
                                                            >
                                                                <div style={{ padding: '16px 20px' }}>
                                                                    {children}
                                                                </div>
                                                                {isCurrent && (
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: '12px',
                                                                        right: '14px',
                                                                        fontSize: '10px',
                                                                        fontWeight: 600,
                                                                        letterSpacing: '0.08em',
                                                                        textTransform: 'uppercase',
                                                                        color: '#93c5fd',
                                                                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.12))',
                                                                        border: '1px solid rgba(96,165,250,0.2)',
                                                                        borderRadius: '20px',
                                                                        padding: '4px 12px',
                                                                        backdropFilter: 'blur(8px)',
                                                                        WebkitBackdropFilter: 'blur(8px)',
                                                                        boxShadow: '0 0 12px rgba(59,130,246,0.08), inset 0 0.5px 0 rgba(255,255,255,0.06)',
                                                                    }}>
                                                                        Current
                                                                    </div>
                                                                )}
                                                            </motion.button>
                                                        );
                                                    }
                                                    return null;
                                                },
                                                strong: ({ children }) => {
                                                    // Strip (current) from displayed title
                                                    const text = typeof children === 'string' ? children :
                                                        Array.isArray(children) ? children.map(c => typeof c === 'string' ? c : '').join('') : '';
                                                    const cleanText = text.replace(/\s*\(current\)\s*/i, '').trim();
                                                    return (
                                                        <span
                                                            className="block"
                                                            style={{
                                                                fontSize: '14px',
                                                                fontWeight: 700,
                                                                color: '#fafafa',
                                                                marginBottom: '4px',
                                                            }}
                                                        >
                                                            {cleanText || children}
                                                        </span>
                                                    );
                                                },
                                                p: ({ children }) => {
                                                    // Strip (current) from description text too
                                                    const stripCurrent = (child: any): any => {
                                                        if (typeof child === 'string') return child.replace(/\s*\(current\)\s*/gi, '').trim();
                                                        return child;
                                                    };
                                                    const cleaned = Array.isArray(children) ? children.map(stripCurrent) : stripCurrent(children);
                                                    return (
                                                        <span
                                                            className="block"
                                                            style={{
                                                                fontSize: '12px',
                                                                fontWeight: 400,
                                                                color: '#71717a',
                                                                lineHeight: 1.5,
                                                            }}
                                                        >
                                                            {cleaned}
                                                        </span>
                                                    );
                                                },
                                            }}
                                        >
                                            {optionsPart}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {/* Inline loading status (when agent processes after a prior response) */}
                                {isLoading && loadingStatus && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '16px',
                                            padding: '40px 0',
                                        }}
                                    >
                                        <PulsingDots />
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={loadingStatus}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.3 }}
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.2em',
                                                    color: '#71717a',
                                                    textTransform: 'uppercase',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {loadingStatus}
                                            </motion.span>
                                        </AnimatePresence>
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={loadingDetail}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.5 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.4 }}
                                                style={{
                                                    fontSize: '11px',
                                                    color: '#52525b',
                                                    letterSpacing: '0.1em',
                                                    fontWeight: 500,
                                                    textAlign: 'center',
                                                }}
                                            >
                                                {loadingDetail}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Input — ONLY visible when not loading and user input is needed */}
                                {/* Logo Upload Zone — shown when user clicks 'Upload logo' option */}
                                {showLogoUpload && !isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                        style={{ marginTop: '32px' }}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="logo-upload"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                    const dataUri = reader.result as string;
                                                    setShowLogoUpload(false);
                                                    append({
                                                        role: 'user',
                                                        content: `Here is my logo image as a data URI. Please embed it in the header replacing the text brand name. Then continue with Phase 1: ${dataUri}`,
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                                e.target.value = '';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('logo-upload')?.click()}
                                            style={{
                                                width: '100%',
                                                padding: '32px 20px',
                                                borderRadius: '16px',
                                                border: '2px dashed rgba(59,130,246,0.3)',
                                                background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.04))',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '14px',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.04))';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <div style={{
                                                width: '52px',
                                                height: '52px',
                                                borderRadius: '16px',
                                                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.12))',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <Upload className="w-6 h-6" style={{ color: '#60a5fa' }} />
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    color: '#e4e4e7',
                                                    marginBottom: '6px',
                                                }}>
                                                    Drop your logo here
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#52525b',
                                                }}>
                                                    PNG, SVG, or JPG — any size
                                                </div>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowLogoUpload(false)}
                                            style={{
                                                display: 'block',
                                                margin: '14px auto 0',
                                                background: 'none',
                                                border: 'none',
                                                color: '#52525b',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                padding: '4px 12px',
                                                borderRadius: '8px',
                                                transition: 'color 0.15s ease',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b'; }}
                                        >
                                            Cancel
                                        </button>
                                    </motion.div>
                                )}

                                {/* Text Logo Input Zone — shown when user clicks 'Text logo' option */}
                                {showTextLogo && !isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                        style={{ marginTop: '32px' }}
                                    >
                                        <div style={{
                                            padding: '28px 24px',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(168,85,247,0.2)',
                                            background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(99,102,241,0.04))',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '16px',
                                        }}>
                                            <div style={{
                                                width: '52px',
                                                height: '52px',
                                                borderRadius: '16px',
                                                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.12))',
                                                border: '1px solid rgba(168,85,247,0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '22px',
                                            }}>
                                                ✨
                                            </div>
                                            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                                                <div style={{
                                                    fontSize: '15px',
                                                    fontWeight: 600,
                                                    color: '#e4e4e7',
                                                    marginBottom: '6px',
                                                }}>
                                                    Enter your logo text
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#52525b',
                                                }}>
                                                    This will be styled as a premium text logo
                                                </div>
                                            </div>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (!textLogoValue.trim()) return;
                                                    setShowTextLogo(false);
                                                    append({
                                                        role: 'user',
                                                        content: `Use this as my text logo in the header: "${textLogoValue.trim()}". Style it with premium typography. Then continue with Phase 1.`,
                                                    });
                                                }}
                                                className="flex items-center gap-2 w-full rounded-xl px-4"
                                                style={{
                                                    background: 'rgba(255,255,255,0.06)',
                                                    border: '1px solid rgba(168,85,247,0.2)',
                                                }}
                                            >
                                                <input
                                                    autoFocus
                                                    value={textLogoValue}
                                                    onChange={(e) => setTextLogoValue(e.target.value)}
                                                    placeholder="e.g. LUXE COFFEE"
                                                    className="flex-1 outline-none"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#e4e4e7',
                                                        fontSize: '15px',
                                                        fontWeight: 600,
                                                        padding: '14px 0',
                                                        caretColor: '#a78bfa',
                                                        letterSpacing: '0.02em',
                                                    }}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!textLogoValue.trim()}
                                                    className="transition-colors duration-200"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: textLogoValue.trim() ? '#a78bfa' : '#3f3f46',
                                                        cursor: textLogoValue.trim() ? 'pointer' : 'default',
                                                        padding: '4px',
                                                    }}
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowTextLogo(false)}
                                            style={{
                                                display: 'block',
                                                margin: '14px auto 0',
                                                background: 'none',
                                                border: 'none',
                                                color: '#52525b',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                padding: '4px 12px',
                                                borderRadius: '8px',
                                                transition: 'color 0.15s ease',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b'; }}
                                        >
                                            Cancel
                                        </button>
                                    </motion.div>
                                )}

                                {/* Regular text input — hidden when logo upload or text logo zone is shown */}
                                {showInput && !showLogoUpload && !showTextLogo && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                        style={{ marginTop: '48px' }}
                                    >
                                        <form
                                            onSubmit={handleSubmit}
                                            className="flex items-center gap-2 rounded-2xl px-4 transition-all duration-300"
                                            style={{
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                            }}
                                            onFocus={(e) => {
                                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.35)';
                                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                                            }}
                                            onBlur={(e) => {
                                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                                            }}
                                        >
                                            <input
                                                name="chat-input"
                                                value={input ?? ""}
                                                onChange={handleInputChange}
                                                placeholder={getPlaceholder()}
                                                disabled={isLoading}
                                                autoComplete="off"
                                                className="flex-1 outline-none"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#e4e4e7',
                                                    fontSize: '14px',
                                                    padding: '12px 0',
                                                    caretColor: '#3b82f6',
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={isLoading || !input?.trim()}
                                                className="transition-colors duration-200"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: input?.trim() ? '#a1a1aa' : '#3f3f46',
                                                    cursor: input?.trim() ? 'pointer' : 'default',
                                                    padding: '4px',
                                                }}
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                        <p
                                            className="mt-3 px-1"
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 500,
                                                color: '#3f3f46',
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase',
                                                textAlign: 'center',
                                            }}
                                        >
                                            Select an option or type any request
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        /* ─── STATE 3: Empty — no messages yet ─── */
                    ) : (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.15,
                            }}
                        >
                            <Sparkles className="w-10 h-10" style={{ color: '#a1a1aa' }} />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Launch CTA */}
            {isComplete && (
                <div
                    className="px-7 py-6 shrink-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0b' }}
                >
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <button
                                className="w-full rounded-2xl font-bold transition-all active:scale-[0.98] hover:opacity-90"
                                style={{
                                    background: '#fafafa',
                                    color: '#0a0a0b',
                                    height: '52px',
                                    fontSize: '15px',
                                }}
                            >
                                Launch Store
                            </button>
                        </DialogTrigger>
                        <DialogContent
                            className="rounded-3xl"
                            style={{
                                background: '#0a0a0b',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#fafafa',
                                padding: '40px',
                            }}
                        >
                            <div className="text-center space-y-6">
                                <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: '#3b82f6' }} />
                                <DialogTitle className="text-2xl font-bold" style={{ color: '#fafafa' }}>
                                    Design Perfected
                                </DialogTitle>
                                <DialogDescription style={{ color: '#71717a', fontSize: '15px' }}>
                                    Your digital storefront is staged and ready for deployment.
                                </DialogDescription>
                                <button
                                    className="w-full rounded-xl font-bold transition-all active:scale-[0.98]"
                                    style={{
                                        background: '#3b82f6',
                                        color: '#fff',
                                        height: '48px',
                                        fontSize: '15px',
                                    }}
                                >
                                    Deploy Now
                                </button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
}
