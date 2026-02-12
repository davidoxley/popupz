"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { ShoppingBag, Search, Menu, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CanvasPanel() {
    const { brandName, aesthetic, price, query } = useStore();

    const getAestheticOverlay = () => {
        const a = aesthetic.toLowerCase();
        if (a.includes("cyberpunk")) return "bg-pink-500/10 border-pink-500/20";
        if (a.includes("minimalist")) return "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
        if (a.includes("bold")) return "bg-orange-500/10 border-orange-500/20";
        if (a.includes("earthy")) return "bg-emerald-500/10 border-emerald-500/20";
        return "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800";
    };

    const getAccentColor = () => {
        const a = aesthetic.toLowerCase();
        if (a.includes("cyberpunk")) return "text-pink-500 bg-pink-500";
        if (a.includes("minimalist")) return "text-zinc-900 bg-zinc-900 dark:text-zinc-50 dark:bg-zinc-50";
        if (a.includes("bold")) return "text-orange-600 bg-orange-600";
        if (a.includes("earthy")) return "text-emerald-700 bg-emerald-700";
        return "text-blue-600 bg-blue-600";
    };

    const accentClass = getAccentColor();

    return (
        <div className="min-h-full p-8 flex flex-col items-center">
            {/* Laptop Frame Simulation */}
            <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[800px]">
                {/* Browser Bar */}
                <div className="h-10 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 max-w-md mx-auto h-6 bg-white dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-700 flex items-center px-3">
                        <span className="text-[10px] text-zinc-400 font-mono">https://{brandName.toLowerCase().replace(/\s+/g, '-') || 'mystore'}.popupz.shop</span>
                    </div>
                </div>

                {/* Store UI */}
                <div className={`flex-1 overflow-y-auto ${getAestheticOverlay()} transition-all duration-700`}>
                    {/* Header */}
                    <header className="px-6 py-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between sticky top-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md z-10">
                        <div className="flex items-center gap-8">
                            <h1 className="text-xl font-black uppercase tracking-tighter">
                                {brandName || "Brand Name"}
                            </h1>
                            <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-500">
                                <span className="hover:text-zinc-900 dark:hover:text-zinc-50 cursor-pointer">Shop</span>
                                <span className="hover:text-zinc-900 dark:hover:text-zinc-50 cursor-pointer">Collections</span>
                                <span className="hover:text-zinc-900 dark:hover:text-zinc-50 cursor-pointer">Story</span>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <Search className="w-5 h-5 text-zinc-400" />
                            <div className="relative">
                                <ShoppingBag className="w-5 h-5 text-zinc-400" />
                                <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center text-white ${accentClass.split(' ')[1]}`}>0</span>
                            </div>
                            <Menu className="w-5 h-5 text-zinc-400 md:hidden" />
                        </div>
                    </header>

                    <main className="p-6 space-y-12">
                        {/* Hero Section */}
                        {!brandName ? (
                            <div className="h-[400px] w-full rounded-3xl bg-zinc-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
                                <p className="text-zinc-400 font-medium">Generating your brand aesthetic...</p>
                            </div>
                        ) : (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative h-[500px] w-full rounded-3xl overflow-hidden"
                            >
                                <div className={`absolute inset-0 ${accentClass.split(' ')[1]} opacity-20`} />
                                <img
                                    src={`https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=2000`}
                                    alt="Hero"
                                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay grayscale"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-12 text-white">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <span className="text-sm font-bold uppercase tracking-widest mb-4 block text-zinc-300">New Collection</span>
                                        <h2 className="text-6xl font-black mb-6 leading-[0.9]">
                                            Define Your <br /> {brandName.split(' ')[0] || "Style"}
                                        </h2>
                                        <Button size="lg" className={`${accentClass.split(' ')[1]} text-white border-none rounded-full px-8 h-14 font-bold active:scale-95 transition-transform`}>
                                            Explore The Drop
                                        </Button>
                                    </motion.div>
                                </div>
                            </motion.section>
                        )}

                        {/* Product Grid */}
                        <section className="space-y-6">
                            <div className="flex justify-between items-end">
                                <h3 className="text-2xl font-bold tracking-tight">Featured {query.split(' ')[0] || "Products"}</h3>
                                <span className={`text-sm font-semibold underline cursor-pointer ${accentClass.split(' ')[0]}`}>View All</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 * i }}
                                    >
                                        <Card className="border-none shadow-none bg-transparent group">
                                            <CardContent className="p-0 space-y-4">
                                                <div className="aspect-[4/5] rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden relative border border-zinc-100 dark:border-zinc-800/50">
                                                    {!price ? (
                                                        <div className="w-full h-full animate-pulse flex items-center justify-center">
                                                            <ShoppingBag className="w-8 h-8 text-zinc-200" />
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={`https://images.unsplash.com/photo-${1523275335684 + i}?auto=format&fit=crop&q=80&w=800`}
                                                            alt="Product"
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                    )}
                                                    <Button size="icon" className={`absolute bottom-4 right-4 rounded-full w-10 h-10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black hover:bg-zinc-100`}>
                                                        <Plus className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                                <div className="px-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-bold text-zinc-900 dark:text-zinc-50">Premium {query.split(' ')[0] || "Item"} #{i}</h4>
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                            <span className="text-xs font-bold">5.0</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-lg font-black">{price ? `$${price}` : "$..."}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </main>

                    <footer className="p-12 bg-zinc-50 dark:bg-zinc-950 mt-12 border-t border-zinc-200 dark:border-zinc-800 text-center space-y-4">
                        <h4 className="font-bold text-lg">{brandName}</h4>
                        <p className="text-sm text-zinc-500">© 2026 {brandName}. Built with Popupz AI.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
