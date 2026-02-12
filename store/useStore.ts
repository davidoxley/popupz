import { create } from 'zustand';

interface StoreState {
    query: string;
    brandName: string;
    aesthetic: string;
    price: string;
    isComplete: boolean;
    setQuery: (query: string) => void;
    setBrandName: (name: string) => void;
    setAesthetic: (aesthetic: string) => void;
    setPrice: (price: string) => void;
    setComplete: (complete: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
    query: '',
    brandName: '',
    aesthetic: '',
    price: '',
    isComplete: false,
    setQuery: (query) => set({ query }),
    setBrandName: (brandName) => set({ brandName }),
    setAesthetic: (aesthetic) => set({ aesthetic }),
    setPrice: (price) => set({ price }),
    setComplete: (isComplete) => set({ isComplete }),
}));
