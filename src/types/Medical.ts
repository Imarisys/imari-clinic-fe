export interface AppointmentMedicalData {
  diagnosis?: string | null;
  treatment_plan?: string | null;
  prescription?: string | null;
  vital_signs?: Record<string, any> | null;
  appointment_id: string;
  patient_id: string;
  date: string;
}

export interface AppointmentMedicalDataUpdate {
  diagnosis?: string | null;
  treatment_plan?: string | null;
  prescription?: string | null;
  vital_signs?: Record<string, any> | null;
}

export interface VitalSign {
  id: string;
  name: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
}

export interface PatientMedicalHistoryEntry {
  appointment_id: string;
  date: string;
  appointment_type_name?: string | null;
  diagnosis?: string | null;
  treatment_plan?: string | null;
  prescription?: string | null;
  vital_signs?: Record<string, any> | null;
}

export interface PatientMedicalHistory {
  patient_id: string;
  patient_first_name: string;
  patient_last_name: string;
  medical_history: PatientMedicalHistoryEntry[];
}
