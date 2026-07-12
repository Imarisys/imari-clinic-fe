import { PatientService } from '../patientService';
import { Patient, PatientListResponse, PatientSummary } from '../../types/Patient';

const mockPatient: Patient = {
  id: 'pat-123',
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1990-01-01',
  gender: 'male',
  email: 'john@example.com',
  phone: '1234567890',
  street: '123 Main St',
  city: 'Test City',
  state: 'TS',
  zip_code: '12345',
};

describe('PatientService', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('listPatients', () => {
    it('should return a paginated patient list', async () => {
      const response: PatientListResponse = {
        data: [mockPatient],
        total: 1,
        limit: 20,
        offset: 0,
      };

      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response,
      });

      const result = await PatientService.listPatients(0, 20);
      expect(result.data).toEqual([mockPatient]);
      expect(result.total).toBe(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=0&limit=20'),
        expect.any(Object)
      );
    });

    it('should throw an error when fetch fails', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: 'Internal error' }),
      });

      await expect(PatientService.listPatients()).rejects.toThrow('Internal error');
    });
  });

  describe('searchPatients', () => {
    it('should search patients by term', async () => {
      const response: PatientListResponse = {
        data: [mockPatient],
        total: 1,
        limit: 100,
        offset: 0,
      };

      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response,
      });

      const result = await PatientService.searchPatients('John');
      expect(result.data).toEqual([mockPatient]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('term=John'),
        expect.any(Object)
      );
    });
  });

  describe('getPatient', () => {
    it('should fetch a single patient', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      });

      const result = await PatientService.getPatient('pat-123');
      expect(result).toEqual(mockPatient);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/patients/pat-123'),
        expect.any(Object)
      );
    });

    it('should throw on 404', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Patient not found' }),
      });

      await expect(PatientService.getPatient('bad-id')).rejects.toThrow('Patient not found');
    });
  });

  describe('createPatient', () => {
    it('should create a patient', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatient,
      });

      const result = await PatientService.createPatient({
        first_name: 'John',
        last_name: 'Doe',
        phone: '1234567890',
        email: 'john@example.com',
      });
      expect(result).toEqual(mockPatient);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/patients'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('updatePatient', () => {
    it('should update a patient', async () => {
      const updated = { ...mockPatient, first_name: 'Jane' };
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updated,
      });

      const result = await PatientService.updatePatient('pat-123', {
        first_name: 'Jane',
      });
      expect(result.first_name).toBe('Jane');
    });
  });

  describe('deletePatient', () => {
    it('should delete a patient', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Patient deleted successfully' }),
      });

      const result = await PatientService.deletePatient('pat-123');
      expect(result).toBe('Patient deleted successfully');
    });

    it('should throw on error', async () => {
      (global as any).fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' }),
      });

      await expect(PatientService.deletePatient('bad-id')).rejects.toThrow('Not found');
    });
  });

  describe('getPatientSummary', () => {
    it('should return summary stats', async () => {
      const summary: PatientSummary = {
        total_patients: 100,
        new_patients: 10,
        patients_with_follow_up: 30,
        patients_with_email: 80,
      };

      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => summary,
      });

      const result = await PatientService.getPatientSummary();
      expect(result.total_patients).toBe(100);
      expect(result.new_patients).toBe(10);
    });
  });

  describe('getPatientMedicalHistory', () => {
    it('should fetch medical history', async () => {
      const history = {
        patient_id: 'pat-123',
        patient_first_name: 'John',
        patient_last_name: 'Doe',
        medical_history: [],
      };

      (global as any).fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => history,
      });

      const result = await PatientService.getPatientMedicalHistory('pat-123');
      expect(result.patient_id).toBe('pat-123');
      expect(result.medical_history).toEqual([]);
    });
  });
});
