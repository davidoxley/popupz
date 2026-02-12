"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, CheckCircle2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function ChatPanel() {
    const {
        query,
        setBrandName,
        setAesthetic,
        setPrice,
        setComplete,
        isComplete
    } = useStore();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // DEBUG: Monitor useChat return values
    const chat = useChat({
        api: '/api/chat',
        initialMessages: query ? [
            { id: 'initial-user', role: 'user', content: `I want to sell: ${query}` }
        ] : [],
        maxSteps: 5,
        onToolCall: ({ toolCall }) => {
            console.log('Gemini 3 Tool Call:', toolCall.toolName, toolCall.args);
            if (toolCall.toolName === 'updateBrandName') {
                const args = toolCall.args as { name: string };
                setBrandName(args.name);
            } else if (toolCall.toolName === 'updateAesthetic') {
                const args = toolCall.args as { aesthetic: string };
                setAesthetic(args.aesthetic);
            } else if (toolCall.toolName === 'updatePrice') {
                const args = toolCall.args as { price: string };
                setPrice(args.price);
            } else if (toolCall.toolName === 'completeStore') {
                setComplete(true);
            }
        }
    });

    const { messages, input, handleInputChange, handleSubmit, isLoading } = chat;

    useEffect(() => {
        console.log('✅ Chat Hook Initialized - handleInputChange:', typeof handleInputChange);
    }, [handleInputChange]);

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


    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Popupz AI 3.0</h2>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Gemini 3 Pro Preview</span>
                    </div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.filter(m => m.content).map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className="flex flex-col gap-1 max-w-[85%]">
                                <div
                                    className={`rounded-2xl px-4 py-2.5 text-sm ${m.role === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
                                        }`}
                                >
                                    {m.content}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-2.5 flex gap-1">
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-md">
                {!isComplete ? (
                    <form
                        onSubmit={handleSubmit}
                        className="flex gap-2"
                    >
                        <Input
                            name="chat-input"
                            value={input ?? ""}
                            onChange={handleInputChange}
                            placeholder="Collaborate with Gemini 3..."
                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 h-12 rounded-xl"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" className="h-12 w-12 bg-blue-600 hover:bg-blue-700 shrink-0 rounded-xl" disabled={isLoading || !input?.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-3">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-blue-500/20">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Launch Your Store
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden">
                                <div className="relative p-8 text-center space-y-6">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
                                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold text-center">Claim Your Store</DialogTitle>
                                        </DialogHeader>
                                        <DialogDescription className="text-zinc-600 dark:text-zinc-400 text-base text-center">
                                            Claim this design and connect your domain to start accepting payments. Create your Popupz account.
                                        </DialogDescription>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-left">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-semibold">Popupz Pro Plan</span>
                                                <span className="text-sm font-bold">$29/mo</span>
                                            </div>
                                            <p className="text-xs text-zinc-500">Unlimited products, custom domain, and AI optimization.</p>
                                        </div>
                                        <Button className="w-full h-12 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold rounded-xl transition-transform active:scale-95">
                                            Continue to Payment
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </div>
    );
}
