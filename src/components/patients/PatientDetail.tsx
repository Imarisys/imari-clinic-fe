import React, { useState, useEffect } from 'react';
import { Patient } from '../../types/Patient';
import { Appointment, AppointmentCreate, AppointmentUpdate, AppointmentStatus } from '../../types/Appointment';
import { Button } from '../common/Button';
import { AppointmentService } from '../../services/appointmentService';
import { AppointmentBookingForm } from './AppointmentBookingForm';
import { AppointmentDetail } from './AppointmentDetail';
import { useNotification } from '../../hooks/useNotification';
import { Notification } from '../common/Notification';

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patientId: string) => void;
  onPatientUpdated?: (updatedPatient: Patient) => void;
  isLoading?: boolean;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  onBack,
  onEdit,
  onDelete,
  onPatientUpdated,
  isLoading: propsIsLoading,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);
  const { notification, hideNotification, showError, showSuccess } = useNotification();

  useEffect(() => {
    loadPatientAppointments();
  }, [patient.id]);

  const loadPatientAppointments = async () => {
    setIsLoading(true);
    try {
      const appointmentsData = await AppointmentService.getPatientAppointments(patient.id);
      setAppointments(appointmentsData);
    } catch (error: any) {
      console.error('Error loading patient appointments:', error);
      showError('Failed to Load Appointments', error?.message || 'Unable to load patient appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async (appointmentData: AppointmentCreate) => {
    setIsBookingLoading(true);
    try {
      // Call the appointment service to create a new appointment
      const newAppointment = await AppointmentService.createAppointment(appointmentData);

      // Update the local state to include the new appointment
      setAppointments(prev => [...prev, newAppointment]);

      // Show success notification
      showSuccess('Appointment Booked', 'The appointment has been successfully booked.');

      // Close the booking form
      setShowBookingForm(false);
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      showError('Booking Failed', error?.message || 'Unable to book the appointment');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleViewAppointmentDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetail(true);
  };

  const handleCloseAppointmentDetail = () => {
    setSelectedAppointment(null);
    setShowAppointmentDetail(false);
  };

  const handleEditAppointment = async (appointmentData: AppointmentUpdate) => {
    if (!selectedAppointment) return;

    try {
      const updatedAppointment = await AppointmentService.updateAppointment(selectedAppointment.id, appointmentData);

      // Update the appointments list with the edited appointment
      setAppointments(prev => prev.map(apt =>
        apt.id === selectedAppointment.id ? updatedAppointment : apt
      ));

      // Update the selected appointment
      setSelectedAppointment(updatedAppointment);

      showSuccess('Appointment Updated', 'The appointment has been successfully updated.');
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      showError('Update Failed', error?.message || 'Unable to update the appointment');
      throw error; // Re-throw to handle in the component
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      // Update appointment status to 'Cancelled'
      const cancelledAppointment = await AppointmentService.updateAppointment(selectedAppointment.id, {
        status: 'Cancelled'
      });

      // Update the appointments list
      setAppointments(prev => prev.map(apt =>
        apt.id === selectedAppointment.id ? cancelledAppointment : apt
      ));

      // Close the appointment detail modal
      setShowAppointmentDetail(false);
      setSelectedAppointment(null);

      showSuccess('Appointment Cancelled', 'The appointment has been successfully cancelled.');
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      showError('Cancellation Failed', error?.message || 'Unable to cancel the appointment');
      throw error; // Re-throw to handle in the component
    }
  };

  const handleUpdateStatus = async (newStatus: AppointmentStatus) => {
    if (!selectedAppointment) return;

    try {
      const updatedAppointment = await AppointmentService.updateAppointment(selectedAppointment.id, {
        status: newStatus
      });

      // Update the appointments list
      setAppointments(prev => prev.map(apt =>
        apt.id === selectedAppointment.id ? updatedAppointment : apt
      ));

      // Update the selected appointment
      setSelectedAppointment(updatedAppointment);

      showSuccess('Status Updated', `Appointment status has been updated to ${newStatus}.`);
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      showError('Update Failed', error?.message || 'Unable to update appointment status');
      throw error;
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await AppointmentService.deleteAppointment(selectedAppointment.id);

      // Remove the appointment from the list
      setAppointments(prev => prev.filter(apt => apt.id !== selectedAppointment.id));

      // Close the appointment detail modal
      setShowAppointmentDetail(false);
      setSelectedAppointment(null);

      showSuccess('Appointment Deleted', 'The appointment has been permanently deleted.');
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      showError('Deletion Failed', error?.message || 'Unable to delete the appointment');
      throw error;
    }
  };

  const getAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string): string => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Booked':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'No Show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'Consultation':
        return 'bg-purple-100 text-purple-800';
      case 'Follow Up':
        return 'bg-yellow-100 text-yellow-800';
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'Routine Check':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isUpcoming = (dateString: string): boolean => {
    return new Date(dateString) > new Date();
  };

  const upcomingAppointments = appointments.filter(apt => isUpcoming(apt.date));
  const previousAppointments = appointments.filter(apt => !isUpcoming(apt.date));

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="secondary" onClick={onBack}>
            ← Back to Patients
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Patient Details
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            onClick={() => setShowBookingForm(true)}
            className="flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Book Appointment
          </Button>
          <Button variant="secondary" onClick={() => onEdit(patient)}>
            Edit Patient
          </Button>
        </div>
      </div>

      {/* Patient Information Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {patient.first_name} {patient.last_name}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Age: {getAge(patient.date_of_birth)} years
            </span>
            <span className="text-sm text-gray-500 capitalize">
              {patient.gender}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-sm text-gray-900">{patient.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Phone:</span>
                <p className="text-sm text-gray-900">{patient.phone}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                <p className="text-sm text-gray-900">{formatDate(patient.date_of_birth)}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Street:</span>
                <p className="text-sm text-gray-900">{patient.street}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">City:</span>
                <p className="text-sm text-gray-900">{patient.city}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">State:</span>
                <p className="text-sm text-gray-900">{patient.state}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Zip Code:</span>
                <p className="text-sm text-gray-900">{patient.zip_code}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="space-y-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Appointments ({upcomingAppointments.length})
          </h3>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming appointments</p>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  onClick={() => handleViewAppointmentDetail(appointment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{appointment.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(appointment.type)}`}>
                          {appointment.type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{formatDate(appointment.date)}</span>
                        <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Previous Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Previous Appointments ({previousAppointments.length})
          </h3>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : previousAppointments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No previous appointments</p>
          ) : (
            <div className="space-y-4">
              {previousAppointments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    onClick={() => handleViewAppointmentDetail(appointment)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{appointment.title}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(appointment.type)}`}>
                            {appointment.type}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{formatDate(appointment.date)}</span>
                          <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <AppointmentBookingForm
          patient={patient}
          onSubmit={handleBookAppointment}
          onCancel={() => setShowBookingForm(false)}
          isLoading={isBookingLoading}
        />
      )}

      {/* Appointment Detail Modal */}
      {showAppointmentDetail && selectedAppointment && (
        <AppointmentDetail
          appointment={selectedAppointment}
          patient={patient}
          onEdit={handleEditAppointment}
          onCancel={handleCancelAppointment}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteAppointment}
          onClose={handleCloseAppointmentDetail}
        />
      )}
    </div>
  );
};
