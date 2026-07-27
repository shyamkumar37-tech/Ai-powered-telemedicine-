import { User } from './auth';

export interface Patient {
  id: string;
  user: User;
  dateOfBirth: string;
  bloodType?: string;
  medicalHistory?: string[];
  allergies?: string[];
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  prescription?: string;
  date: string;
  notes?: string;
}
