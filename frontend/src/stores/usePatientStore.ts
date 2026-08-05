import { create } from "zustand";

interface PatientState {
  activeTab: string;
  isSosModalOpen: boolean;
  selectedDoctorId: string | null;
  setActiveTab: (tab: string) => void;
  setSosModalOpen: (open: boolean) => void;
  setSelectedDoctorId: (id: string | null) => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  activeTab: "OVERVIEW",
  isSosModalOpen: false,
  selectedDoctorId: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSosModalOpen: (open) => set({ isSosModalOpen: open }),
  setSelectedDoctorId: (id) => set({ selectedDoctorId: id }),
}));
