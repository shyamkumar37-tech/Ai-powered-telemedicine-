import { create } from 'zustand';

interface PharmacistState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: 'all' | 'pending' | 'verified';
  setActiveFilter: (filter: 'all' | 'pending' | 'verified') => void;
}

export const usePharmacistStore = create<PharmacistState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  activeFilter: 'all',
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}));
