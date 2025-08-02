import { api } from '../config/api';
import { Appointment } from '../types/Appointment';
import { Patient } from '../types/Patient';

export interface ReportMetrics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowRate: number;
  averageWaitTime: number;
  patientSatisfaction: number;
  revenue: number;
  newPatients: number;
}

export interface AppointmentAnalytics {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface PatientDemographic {
  ageGroup: string;
  count: number;
  percentage: number;
}

export interface RevenueData {
  date: string;
  amount: number;
  appointmentType: string;
}

class ReportService {
  async getReportData(reportType: string, startDate: string, endDate: string) {
    try {
      switch (reportType) {
        case 'appointments':
          return await this.getAppointmentAnalytics(startDate, endDate);
        case 'patients':
          return await this.getPatientInsights(startDate, endDate);
        case 'revenue':
          return await this.getRevenueAnalytics(startDate, endDate);
        case 'performance':
          return await this.getPerformanceMetrics(startDate, endDate);
        default:
          throw new Error('Invalid report type');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Return mock data for development
      return this.getMockData(reportType);
    }
  }

  private async getAppointmentAnalytics(startDate: string, endDate: string) {
    // In a real implementation, this would fetch from your API
    const appointments = await this.fetchAppointments(startDate, endDate);

    // Process appointment data for analytics
    const analytics = this.processAppointmentData(appointments);

    return {
      appointments: analytics,
      summary: this.calculateAppointmentSummary(appointments)
    };
  }

  private async getPatientInsights(startDate: string, endDate: string) {
    const patients = await this.fetchPatients(startDate, endDate);

    return {
      patients: this.processPatientDemographics(patients),
      insights: this.calculatePatientInsights(patients)
    };
  }

  private async getRevenueAnalytics(startDate: string, endDate: string) {
    const revenue = await this.fetchRevenueData(startDate, endDate);

    return {
      revenue: this.processRevenueData(revenue),
      summary: this.calculateRevenueSummary(revenue)
    };
  }

  private async getPerformanceMetrics(startDate: string, endDate: string) {
    const metrics = await this.fetchPerformanceData(startDate, endDate);

    return {
      metrics: this.processPerformanceData(metrics)
    };
  }

  private async fetchAppointments(startDate: string, endDate: string): Promise<Appointment[]> {
    const response = await api.get(`/appointments?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  }

  private async fetchPatients(startDate: string, endDate: string): Promise<Patient[]> {
    const response = await api.get(`/patients?created_after=${startDate}&created_before=${endDate}`);
    return response.data;
  }

  private async fetchRevenueData(startDate: string, endDate: string): Promise<RevenueData[]> {
    const response = await api.get(`/reports/revenue?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  }

  private async fetchPerformanceData(startDate: string, endDate: string): Promise<ReportMetrics> {
    const response = await api.get(`/reports/performance?start_date=${startDate}&end_date=${endDate}`);
    // Type assertion to handle mock API response
    const data = response.data as ReportMetrics;

    // Validate that we have a proper ReportMetrics object
    if (data && typeof data === 'object' && 'totalAppointments' in data) {
      return data;
    }

    // Return default ReportMetrics if data is invalid
    return {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      noShowRate: 0,
      averageWaitTime: 0,
      patientSatisfaction: 0,
      revenue: 0,
      newPatients: 0
    };
  }

  private processAppointmentData(appointments: Appointment[]): AppointmentAnalytics[] {
    const groupedByDate = appointments.reduce((acc, appointment) => {
      const date = appointment.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, total: 0, completed: 0, cancelled: 0, noShow: 0 };
      }

      acc[date].total++;
      switch (appointment.status) {
        case 'Completed':
          acc[date].completed++;
          break;
        case 'Cancelled':
          acc[date].cancelled++;
          break;
        case 'No Show':
          acc[date].noShow++;
          break;
      }

      return acc;
    }, {} as Record<string, AppointmentAnalytics>);

    return Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date));
  }

  private processPatientDemographics(patients: Patient[]): PatientDemographic[] {
    const ageGroups = patients.reduce((acc, patient) => {
      const age = this.calculateAge(patient.date_of_birth);
      const ageGroup = this.getAgeGroup(age);
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = patients.length;
    return Object.entries(ageGroups).map(([ageGroup, count]) => ({
      ageGroup,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  private processRevenueData(revenue: RevenueData[]): RevenueData[] {
    return revenue.sort((a, b) => a.date.localeCompare(b.date));
  }

  private processPerformanceData(metrics: ReportMetrics): ReportMetrics {
    return metrics;
  }

  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return '0-17';
    if (age < 30) return '18-29';
    if (age < 45) return '30-44';
    if (age < 60) return '45-59';
    if (age < 75) return '60-74';
    return '75+';
  }

  private calculateAppointmentSummary(appointments: Appointment[]) {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'Completed').length;
    const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
    const noShow = appointments.filter(a => a.status === 'No Show').length;

    return {
      total,
      completed,
      cancelled,
      noShow,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0
    };
  }

  private calculatePatientInsights(patients: Patient[]) {
    const genderDistribution = patients.reduce((acc, patient) => {
      acc[patient.gender] = (acc[patient.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: patients.length,
      genderDistribution,
      averageAge: this.calculateAverageAge(patients)
    };
  }

  private calculateRevenueSummary(revenue: RevenueData[]) {
    const total = revenue.reduce((sum, item) => sum + item.amount, 0);
    const average = revenue.length > 0 ? total / revenue.length : 0;

    return {
      total,
      average: Math.round(average * 100) / 100,
      count: revenue.length
    };
  }

  private calculateAverageAge(patients: Patient[]): number {
    if (patients.length === 0) return 0;

    const totalAge = patients.reduce((sum, patient) => {
      return sum + this.calculateAge(patient.date_of_birth);
    }, 0);

    return Math.round(totalAge / patients.length);
  }

  async exportReport(reportType: string, format: 'pdf' | 'excel' | 'csv', startDate: string, endDate: string) {
    try {
      const response = await api.post('/reports/export', {
        reportType,
        format,
        startDate,
        endDate
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data || '']));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportType}_${startDate}_${endDate}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  // Mock data for development
  private getMockData(reportType: string) {
    switch (reportType) {
      case 'appointments':
        return {
          appointments: this.generateMockAppointmentData(),
          summary: {
            total: 150,
            completed: 135,
            cancelled: 10,
            noShow: 5,
            completionRate: 90,
            cancellationRate: 7,
            noShowRate: 3
          }
        };
      case 'patients':
        return {
          patients: [
            { ageGroup: '0-17', count: 25, percentage: 15 },
            { ageGroup: '18-29', count: 40, percentage: 24 },
            { ageGroup: '30-44', count: 45, percentage: 27 },
            { ageGroup: '45-59', count: 35, percentage: 21 },
            { ageGroup: '60-74', count: 18, percentage: 11 },
            { ageGroup: '75+', count: 4, percentage: 2 }
          ],
          insights: {
            total: 167,
            genderDistribution: { male: 78, female: 89 },
            averageAge: 42
          }
        };
      case 'revenue':
        return {
          revenue: this.generateMockRevenueData(),
          summary: {
            total: 45000,
            average: 300,
            count: 150
          }
        };
      case 'performance':
        return {
          metrics: {
            totalAppointments: 150,
            completedAppointments: 135,
            cancelledAppointments: 10,
            noShowRate: 3.3,
            averageWaitTime: 12,
            patientSatisfaction: 4.7,
            revenue: 45000,
            newPatients: 23
          }
        };
      default:
        return {};
    }
  }

  private generateMockAppointmentData(): AppointmentAnalytics[] {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const total = Math.floor(Math.random() * 10) + 2;
      const completed = Math.floor(total * 0.85);
      const cancelled = Math.floor((total - completed) * 0.6);
      const noShow = total - completed - cancelled;

      data.push({
        date: date.toISOString().split('T')[0],
        total,
        completed,
        cancelled,
        noShow
      });
    }

    return data;
  }

  private generateMockRevenueData(): RevenueData[] {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      data.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 2000) + 500,
        appointmentType: 'Consultation'
      });
    }

    return data;
  }
}

export const reportService = new ReportService();
