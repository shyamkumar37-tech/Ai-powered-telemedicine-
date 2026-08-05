import { create } from "zustand";

interface DoctorState {
  statusFilter: string;
  searchQuery: string;
  selectedAppointmentId: string | null;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedAppointmentId: (id: string | null) => void;
}

export const useDoctorStore = create<DoctorState>((set) => ({
  statusFilter: "ALL",
  searchQuery: "",
  selectedAppointmentId: null,
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedAppointmentId: (id) => set({ selectedAppointmentId: id }),
}));
