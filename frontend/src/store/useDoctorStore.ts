import { create } from 'zustand';

interface DoctorState {
  activeTab: 'overview' | 'patients' | 'appointments';
  setActiveTab: (tab: 'overview' | 'patients' | 'appointments') => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
}

export const useDoctorStore = create<DoctorState>((set) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedPatientId: null,
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
}));
