"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import ChatPanel from "@/components/chat/ChatPanel";
import CanvasPanel from "@/components/canvas/CanvasPanel";

export default function BuildPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get("query") || "";
    const setQuery = useStore((state) => state.setQuery);

    useEffect(() => {
        if (query) {
            setQuery(query);
        }
    }, [query, setQuery]);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-black">
            {/* Left Panel: Chat (30%) */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-[30%] border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-20"
            >
                <ChatPanel />
            </motion.div>

            {/* Right Panel: Canvas (70%) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-y-auto"
            >
                <CanvasPanel />
            </motion.div>
        </div>
    );
}
