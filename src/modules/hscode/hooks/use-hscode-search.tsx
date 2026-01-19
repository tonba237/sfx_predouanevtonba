"use client";

import { create } from "zustand";

interface HscodeSearchStore {
    search: string;
    setSearch: (search: string) => void;
}

export const useHscodeSearch = create<HscodeSearchStore>((set) => ({
    search: "",
    setSearch: (search: string) => set({ search }),
}));
