import { API_CONFIG, buildApiUrl } from '../config/api';
import { Settings, SettingsUpdate } from '../types/Settings';

export class SettingsService {
  /**
   * Get current settings
   */
  static async getSettings(): Promise<{ data: Settings }> {
    try {
      const response = await fetch(buildApiUrl('/api/v1/settings'));
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Return default settings for now
      return {
        data: {
          // Localization
          language: 'en',
          country: 'US',
          city: 'New York',
          timezone: 'UTC-05:00',

          // Clinic Information
          clinicName: 'Imarisys Clinic',
          clinicAddress: '123 Medical Center Dr, New York, NY 10001',
          clinicPhone: '+1 (555) 123-4567',
          clinicEmail: 'info@imarisys.com',

          // Appointment Settings
          appointmentDuration: 30,
          workingHoursStart: '09:00',
          workingHoursEnd: '17:00',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],

          // Notification Settings
          emailNotifications: true,
          smsNotifications: false,
          appointmentReminders: true,
          reminderTimeBefore: 60,

          // Display Settings
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          currency: 'USD',

          // Weather Settings
          showWeather: true,
          temperatureUnit: 'fahrenheit'
        }
      };
    }
  }

  /**
   * Update settings
   */
  static async updateSettings(settings: SettingsUpdate): Promise<{ data: Settings }> {
    try {
      const response = await fetch(buildApiUrl('/api/v1/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings to default
   */
  static async resetSettings(): Promise<{ data: Settings }> {
    try {
      const response = await fetch(buildApiUrl('/api/v1/settings/reset'), {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset settings');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Get available countries and cities
   */
  static async getCountriesAndCities(): Promise<{
    data: {
      countries: Array<{ code: string; name: string; cities: string[] }>
    }
  }> {
    try {
      const response = await fetch(buildApiUrl('/api/v1/settings/countries'));
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching countries:', error);
      // Return default countries for now
      return {
        data: {
          countries: [
            {
              code: 'US',
              name: 'United States',
              cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']
            },
            {
              code: 'CA',
              name: 'Canada',
              cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa']
            },
            {
              code: 'FR',
              name: 'France',
              cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice']
            },
            {
              code: 'MA',
              name: 'Morocco',
              cities: ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier']
            }
          ]
        }
      };
    }
  }

  /**
   * Export settings as JSON
   */
  static async exportSettings(): Promise<Blob> {
    try {
      const response = await fetch(buildApiUrl('/api/v1/settings/export'));

      if (!response.ok) {
        throw new Error('Failed to export settings');
      }

      return response.blob();
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from JSON
   */
  static async importSettings(file: File): Promise<{ data: Settings }> {
    try {
      const formData = new FormData();
      formData.append('settings', file);

      const response = await fetch(buildApiUrl('/api/v1/settings/import'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to import settings');
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }
}
