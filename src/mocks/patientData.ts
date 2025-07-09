import { Patient } from '../types/Patient';

export const mockPatients: Patient[] = [
    {
        id: "140c1833-affc-42ed-aabb-683081bd3621",
        first_name: "Ali",
        last_name: "Nasri",
        date_of_birth: "1995-01-05",
        gender: "male",
        email: "ali.nasri@example.com",
        phone: "+216 50 987 654",
        street: "10 Rue du 14 Janvier",
        city: "Sidi Bouzid",
        state: "Sidi Bouzid",
        zip_code: "9100"
    },
    {
        id: "P002",
        first_name: "Jane",
        last_name: "Smith",
        date_of_birth: "1990-08-22",
        gender: "female",
        email: "jane.smith@email.com",
        phone: "(555) 987-6543",
        street: "456 Oak Avenue",
        city: "Springfield",
        state: "IL",
        zip_code: "62702"
    },
    {
        id: "P003",
        first_name: "Michael",
        last_name: "Johnson",
        date_of_birth: "1978-12-05",
        gender: "male",
        email: "michael.johnson@email.com",
        phone: "(555) 456-7890",
        street: "789 Pine Road",
        city: "Springfield",
        state: "IL",
        zip_code: "62703"
    },
    {
        id: "P004",
        first_name: "Sarah",
        last_name: "Williams",
        date_of_birth: "1992-06-18",
        gender: "female",
        email: "sarah.williams@email.com",
        phone: "(555) 321-0987",
        street: "321 Elm Street",
        city: "Springfield",
        state: "IL",
        zip_code: "62704"
    },
    {
        id: "P005",
        first_name: "David",
        last_name: "Brown",
        date_of_birth: "1983-11-30",
        gender: "male",
        email: "david.brown@email.com",
        phone: "(555) 654-3210",
        street: "654 Maple Drive",
        city: "Springfield",
        state: "IL",
        zip_code: "62705"
    }
];

// Helper function to get a single patient by ID
export const getPatientById = (id: string): Patient | undefined => {
    return mockPatients.find(patient => patient.id === id);
};

// Helper function to search patients by name
export const searchPatients = (query: string): Patient[] => {
    const lowercaseQuery = query.toLowerCase();
    return mockPatients.filter(patient =>
        patient.first_name.toLowerCase().includes(lowercaseQuery) ||
        patient.last_name.toLowerCase().includes(lowercaseQuery)
    );
};

// Helper function to get patient's full name
export const getPatientFullName = (patient: Patient): string => {
    return `${patient.first_name} ${patient.last_name}`;
};

// Helper function to get patient's age
export const getPatientAge = (patient: Patient): number => {
    const birthDate = new Date(patient.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};
