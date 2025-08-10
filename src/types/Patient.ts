import { Appointment } from './Appointment';

// Base Patient interface matching simplified API schema
export interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string; // ISO date string
    gender: 'male' | 'female';
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
    preconditions?: any; // JSON field for medical preconditions
}

// For creating new patients (without id)
export interface PatientCreate {
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth?: string;
    gender?: 'male' | 'female';
    email?: string;
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    preconditions?: any; // JSON field for medical preconditions
}

// For updating patients (all fields optional)
export interface PatientUpdate {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female';
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    preconditions?: any; // JSON field for medical preconditions
}

// For API responses (matches PatientRead from OpenAPI)
export interface PatientRead extends Patient {}

// Patient with appointments (matches PatientReadWithAppointments from OpenAPI)
export interface PatientWithAppointments extends Patient {
    appointments?: Appointment[] | null;
}

// Paginated response for patient list
export interface PatientListResponse {
    data: Patient[];
    total: number;
    limit: number;
    offset: number;
}

// Patient summary statistics
export interface PatientSummary {
    total_patients: number;
    new_patients: number;
    patients_with_follow_up: number;
    patients_with_email: number;
}
