import { create } from "zustand";

interface PharmacistState {
  statusFilter: string;
  sortBy: string;
  searchQuery: string;
  setStatusFilter: (filter: string) => void;
  setSortBy: (sort: string) => void;
  setSearchQuery: (query: string) => void;
}

export const usePharmacistStore = create<PharmacistState>((set) => ({
  statusFilter: "ALL",
  sortBy: "NEWEST",
  searchQuery: "",
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
