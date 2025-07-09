// Base Patient interface matching simplified API schema
export interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string; // ISO date string
    gender: 'male' | 'female' | 'other';
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
}

// For creating new patients (without id)
export interface PatientCreate {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other';
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
}

// For updating patients (all fields optional)
export interface PatientUpdate {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
}

// For API responses (matches PatientRead from OpenAPI)
export interface PatientRead extends Patient {}
