"use client";

import { create } from "zustand";

interface ClientsSearchStore {
    search: string;
    setSearch: (search: string) => void;
}

export const useClientsSearch = create<ClientsSearchStore>((set) => ({
    search: "",
    setSearch: (search: string) => set({ search }),
}));
