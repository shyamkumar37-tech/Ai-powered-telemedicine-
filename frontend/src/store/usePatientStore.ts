import { create } from 'zustand';

interface PatientState {
  selectedAppointmentId: string | null;
  setSelectedAppointmentId: (id: string | null) => void;
  isBookingModalOpen: boolean;
  setBookingModalOpen: (isOpen: boolean) => void;
}

export const usePatientStore = create<PatientState>((set) => ({
  selectedAppointmentId: null,
  setSelectedAppointmentId: (id) => set({ selectedAppointmentId: id }),
  isBookingModalOpen: false,
  setBookingModalOpen: (isOpen) => set({ isBookingModalOpen: isOpen }),
}));
