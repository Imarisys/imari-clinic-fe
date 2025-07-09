// Appointment status and type enums matching OpenAPI schema
export type AppointmentStatus = 'Booked' | 'Cancelled' | 'Completed' | 'No Show';
export type AppointmentType = 'Consultation' | 'Follow Up' | 'Emergency' | 'Routine Check';

// Base Appointment interface matching API schema
export interface Appointment {
    id: string;
    patient_id: string;
    date: string; // ISO datetime string
    start_time: string; // Time format with microseconds
    end_time: string; // Time format with microseconds
    type: AppointmentType;
    status: AppointmentStatus;
    title: string;
    notes: string | null;
    patient_first_name: string;
    patient_last_name: string;
}

// For creating new appointments (without id, patient names)
export interface AppointmentCreate {
    patient_id: string;
    date: string; // ISO datetime string
    start_time: string; // Time format with microseconds
    end_time: string; // Time format with microseconds
    type: AppointmentType;
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

// For API responses (matches AppointmentRead from OpenAPI)
export interface AppointmentRead extends Appointment {}
