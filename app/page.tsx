"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/build?query=${encodeURIComponent(query)}`);
    }
  };


  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white dark:bg-[#030303] flex flex-col items-center justify-center p-6">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-4xl text-center space-y-8"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-4"
          >
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span>The future of e-commerce is here</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1]">
            Launch Your E-Commerce <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Empire in 60 Seconds.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Chat with our AI, watch your store build itself in real-time, and start selling today.
            No coding required.
          </p>
        </div>

        <form
          onSubmit={handleGenerate}
          className="relative max-w-2xl mx-auto group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
          <div className="relative flex flex-col md:flex-row gap-3 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
            <Input
              name="store-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to sell today?"
              className="flex-1 h-14 bg-transparent border-none text-lg focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
            />
            <Button
              type="submit"
              size="lg"
              className="h-14 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Generate My Store
            </Button>
          </div>
        </form>

        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex justify-center items-center">Shopify Connect</div>
          <div className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex justify-center items-center">Stripe Ready</div>
          <div className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex justify-center items-center">AI Powered</div>
          <div className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex justify-center items-center">Mobile First</div>
        </div>
      </motion.div>
    </div>
  );
}
