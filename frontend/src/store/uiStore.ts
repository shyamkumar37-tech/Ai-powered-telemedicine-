import { create } from 'zustand';

export interface UIState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  isOfflineMode: boolean;
  setOfflineMode: (isOffline: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (isCollapsed: boolean) => set({ isSidebarCollapsed: isCollapsed }),
  
  isOfflineMode: false,
  setOfflineMode: (isOffline: boolean) => set({ isOfflineMode: isOffline }),
}));
