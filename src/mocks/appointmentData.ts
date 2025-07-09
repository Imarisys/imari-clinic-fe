import { Appointment, AppointmentStatus, AppointmentType } from '../types/Appointment';

export const mockAppointments: Appointment[] = [
    {
        id: "05709097-6186-4c14-b41d-259d850c05b1",
        patient_id: "140c1833-affc-42ed-aabb-683081bd3621",
        date: "2025-07-07T21:04:00.882000",
        start_time: "21:04:00.882000",
        end_time: "21:04:00.882000",
        type: "Consultation",
        status: "Booked",
        title: "Firstt time",
        notes: null,
        patient_first_name: "Ali",
        patient_last_name: "Nasri"
    },
    {
        id: "A002",
        patient_id: "P002",
        date: "2025-07-06T10:00:00.000000",
        start_time: "10:00:00.000000",
        end_time: "10:30:00.000000",
        type: "Consultation",
        status: "Booked",
        title: "Initial Consultation",
        notes: "New patient consultation",
        patient_first_name: "Jane",
        patient_last_name: "Smith"
    },
    {
        id: "A003",
        patient_id: "P003",
        date: "2025-07-06T14:00:00.000000",
        start_time: "14:00:00.000000",
        end_time: "15:00:00.000000",
        type: "Follow Up",
        status: "Completed",
        title: "Follow-up Visit",
        notes: "Post-surgery follow-up",
        patient_first_name: "Michael",
        patient_last_name: "Johnson"
    },
    {
        id: "A004",
        patient_id: "P004",
        date: "2025-07-07T11:00:00.000000",
        start_time: "11:00:00.000000",
        end_time: "11:30:00.000000",
        type: "Emergency",
        status: "Booked",
        title: "Emergency Visit",
        notes: "Urgent care needed",
        patient_first_name: "Sarah",
        patient_last_name: "Williams"
    },
    {
        id: "A005",
        patient_id: "P005",
        date: "2025-07-07T15:30:00.000000",
        start_time: "15:30:00.000000",
        end_time: "16:00:00.000000",
        type: "Consultation",
        status: "Cancelled",
        title: "Specialist Consultation",
        notes: "Patient cancelled due to scheduling conflict",
        patient_first_name: "David",
        patient_last_name: "Brown"
    }
];

// Helper function to get appointments by date
export const getAppointmentsByDate = (date: string): Appointment[] => {
    return mockAppointments.filter(appointment => appointment.date.startsWith(date));
};

// Helper function to get appointments by patient ID
export const getAppointmentsByPatientId = (patientId: string): Appointment[] => {
    return mockAppointments.filter(appointment => appointment.patient_id === patientId);
};

// Helper function to get appointments by status
export const getAppointmentsByStatus = (status: AppointmentStatus): Appointment[] => {
    return mockAppointments.filter(appointment => appointment.status === status);
};

// Helper function to get appointments within a date range
export const getAppointmentsInRange = (startDate: string, endDate: string): Appointment[] => {
    return mockAppointments.filter(appointment =>
        appointment.date >= startDate && appointment.date <= endDate
    );
};

// Helper function to add a new appointment
export const addAppointment = (appointment: Appointment): void => {
    mockAppointments.push(appointment);
};

// Helper function to update appointment status
export const updateAppointmentStatus = (appointmentId: string, newStatus: AppointmentStatus): void => {
    const appointment = mockAppointments.find(a => a.id === appointmentId);
    if (appointment) {
        appointment.status = newStatus;
    }
};
