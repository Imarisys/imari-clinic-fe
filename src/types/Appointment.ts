// Appointment status and type enums matching OpenAPI schema
export type AppointmentStatus = 'Booked' | 'Cancelled' | 'Completed' | 'No Show' | 'In Progress' | 'IN_PROGRESS';
export type AppointmentType = 'Consultation' | 'Follow Up' | 'Emergency' | 'Routine Check';

// Base Appointment interface matching API schema
export interface Appointment {
    id: string;
    patient_id: string;
    date: string; // ISO datetime string
    start_time: string; // Time format with microseconds
    end_time: string; // Time format with microseconds
    type: AppointmentType;
    appointment_type_name: string; // Added for API mapping
    status: AppointmentStatus;
    title: string;
    notes: string | null;
    patient_first_name: string;
    patient_last_name: string;
    actual_start_time: string | null; // ISO datetime string
    actual_end_time: string | null; // ISO datetime string
}

// For creating new appointments (without id, patient names)
export interface AppointmentCreate {
    patient_id: string;
    date: string; // ISO datetime string
    start_time: string; // Time format with microseconds
    end_time: string; // Time format with microseconds
    appointment_type_name: string;
    type?: AppointmentType; // Keeping for backward compatibility
    status?: AppointmentStatus; // Optional, defaults to 'Booked'
    title: string;
    notes?: string | null;
}

// For updating appointments (all fields optional)
export interface AppointmentUpdate {
    date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    type?: AppointmentType | null;
    status?: AppointmentStatus | null;
    title?: string | null;
    notes?: string | null;
}
