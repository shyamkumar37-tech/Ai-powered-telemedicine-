import { create } from 'zustand';
import { DynamicStateObject } from "./../types/DynamicState";

export const useUIStore = create((set: DynamicStateObject) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state: DynamicStateObject) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (isCollapsed: boolean) => set({ isSidebarCollapsed: isCollapsed }),
  
  isOfflineMode: false,
  setOfflineMode: (isOffline: boolean) => set({ isOfflineMode: isOffline }),
}));
