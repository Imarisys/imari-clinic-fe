import { API_CONFIG, buildApiUrl } from '../config/api';
import { Settings, SettingsUpdate, SettingsFieldValues } from '../types/Settings';
import { authService } from './authService';

export class SettingsService {
  /**
   * Get current settings for the authenticated doctor
   */
  static async getSettings(): Promise<Settings> {
    try {
      const doctorId = authService.getDoctorId();
      console.log('Doctor ID retrieved:', doctorId); // Debug log

      if (!doctorId) {
        throw new Error('Doctor ID not found. Please log in again.');
      }

      const url = buildApiUrl(`/api/v1/settings/${doctorId}`);
      console.log('Making request to:', url); // Debug log

      const response = await fetch(url);
      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }

      const data: Settings = await response.json();
      console.log('Settings data received:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  /**
   * Get field values for settings options
   */
  static async getSettingsFieldValues(): Promise<SettingsFieldValues> {
    try {
      const url = buildApiUrl('/api/v1/settings/fields/values');
      console.log('Making request to:', url); // Debug log

      const response = await fetch(url);
      console.log('Field values response status:', response.status); // Debug log

      if (!response.ok) {
        throw new Error(`Failed to fetch settings field values: ${response.status} ${response.statusText}`);
      }

      const data: SettingsFieldValues = await response.json();
      console.log('Field values data received:', data); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching settings field values:', error);
      throw error;
    }
  }

  /**
   * Update settings
   */
  static async updateSettings(updates: SettingsUpdate): Promise<Settings> {
    try {
      const doctorId = authService.getDoctorId();
      if (!doctorId) {
        throw new Error('Doctor ID not found. Please log in again.');
      }

      const response = await fetch(buildApiUrl(`/api/v1/settings/${doctorId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data: Settings = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Export settings as a JSON file blob
   */
  static async exportSettings(): Promise<Blob> {
    try {
      const settings = await this.getSettings();
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        settings: settings
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from a JSON file
   */
  static async importSettings(file: File): Promise<{ data: Settings }> {
    try {
      const fileContent = await this.readFileAsText(file);
      const importData = JSON.parse(fileContent);

      // Validate the imported data structure
      if (!importData.settings) {
        throw new Error('Invalid settings file format');
      }

      // Update the settings via API
      const updatedSettings = await this.updateSettings(importData.settings);

      return { data: updatedSettings };
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Helper method to read file as text
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
