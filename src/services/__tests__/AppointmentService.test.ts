import { AppointmentService } from '../appointmentService';
import { Appointment, AppointmentCreate } from '../../types/Appointment';

const mockAppointment: Appointment = {
  id: 'apt-123',
  patient_id: 'pat-456',
  date: '2025-07-10',
  start_time: '10:30:00',
  end_time: '11:00:00',
  type: 'Consultation',
  appointment_type_name: 'Consultation',
  status: 'Booked',
  title: 'Test Appointment',
  notes: 'Test notes',
  patient_first_name: 'John',
  patient_last_name: 'Doe',
  actual_start_time: null,
  actual_end_time: null,
};

describe('AppointmentService', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listAppointments', () => {
    it('should return a list of appointments', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockAppointment],
      });

      const result = await AppointmentService.listAppointments();
      expect(result).toEqual([mockAppointment]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/appointments'),
        expect.any(Object)
      );
    });

    it('should throw an error when the request fails', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Server error' }),
      });

      await expect(AppointmentService.listAppointments()).rejects.toThrow('Server error');
    });
  });

  describe('createAppointment', () => {
    it('should create an appointment and return it', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointment,
      });

      const data: AppointmentCreate = {
        patient_id: 'pat-456',
        date: '2025-07-10',
        start_time: '10:30',
        end_time: '11:00',
        appointment_type_name: 'Consultation',
        title: 'Test Appointment',
      };

      const result = await AppointmentService.createAppointment(data);
      expect(result).toEqual(mockAppointment);
    });

    it('should throw an error on server error during creation', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Time slot conflict' }),
      });

      const data: AppointmentCreate = {
        patient_id: 'pat-456',
        date: '2025-07-10',
        start_time: '10:30',
        end_time: '11:00',
        appointment_type_name: 'Consultation',
        title: 'Test Appointment',
      };

      await expect(AppointmentService.createAppointment(data)).rejects.toThrow('Time slot conflict');
    });
  });

  describe('getAppointment', () => {
    it('should return a single appointment by id', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppointment,
      });

      const result = await AppointmentService.getAppointment('apt-123');
      expect(result).toEqual(mockAppointment);
    });

    it('should throw on 404', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Appointment not found' }),
      });

      await expect(AppointmentService.getAppointment('bad-id')).rejects.toThrow('Appointment not found');
    });
  });

  describe('deleteAppointment', () => {
    it('should delete an appointment', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await AppointmentService.deleteAppointment('apt-123');
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('listAppointmentsByRange', () => {
    it('should fetch appointments by date range', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockAppointment],
      });

      const result = await AppointmentService.listAppointmentsByRange('2025-07-10', 7);
      expect(result).toEqual([mockAppointment]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2025-07-10'),
        expect.any(Object)
      );
    });
  });

  describe('startAppointment', () => {
    it('should start an appointment', async () => {
      const inProgress = { ...mockAppointment, status: 'In Progress' as const };
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => inProgress,
      });

      const result = await AppointmentService.startAppointment('apt-123');
      expect(result.status).toBe('In Progress');
    });
  });

  describe('endAppointment', () => {
    it('should end an appointment', async () => {
      const completed = { ...mockAppointment, status: 'Completed' as const };
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => completed,
      });

      const result = await AppointmentService.endAppointment('apt-123');
      expect(result.status).toBe('Completed');
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment fields', async () => {
      const updated = { ...mockAppointment, title: 'Updated Title' };
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updated,
      });

      const result = await AppointmentService.updateAppointment('apt-123', { title: 'Updated Title' });
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('getPatientAppointments', () => {
    it('should get appointments for a patient', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockAppointment],
      });

      const result = await AppointmentService.getPatientAppointments('pat-456');
      expect(result).toEqual([mockAppointment]);
    });
  });
});
