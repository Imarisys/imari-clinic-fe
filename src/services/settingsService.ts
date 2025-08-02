import { API_CONFIG, buildApiUrl } from '../config/api';
import { Settings, SettingsUpdate, SettingsFieldValues } from '../types/Settings';
import { authService } from './authService';

// Event dispatcher for settings updates
class SettingsEventDispatcher extends EventTarget {
  dispatchSettingsUpdate(settings: Settings) {
    this.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
  }
}

export const settingsEventDispatcher = new SettingsEventDispatcher();

export class SettingsService {
  private static cachedSettings: Settings | null = null;
  private static cacheTimestamp: number | null = null;
  private static cachedDoctorId: string | null = null; // Track which doctor's settings are cached
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Check if cached settings are still valid for the current doctor
   */
  private static isCacheValid(): boolean {
    const currentDoctorId = authService.getDoctorId();
    return this.cachedSettings !== null &&
           this.cacheTimestamp !== null &&
           this.cachedDoctorId === currentDoctorId &&
           (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Clear the settings cache
   */
  static clearCache(): void {
    this.cachedSettings = null;
    this.cacheTimestamp = null;
    this.cachedDoctorId = null;
  }

  /**
   * Get current settings for the authenticated doctor (with caching)
   */
  static async getSettings(forceRefresh: boolean = false): Promise<Settings> {
    const currentDoctorId = authService.getDoctorId();

    // Clear cache if doctor changed
    if (this.cachedDoctorId && this.cachedDoctorId !== currentDoctorId) {
      this.clearCache();
    }

    // Return cached settings if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      return this.cachedSettings!;
    }

    try {
      console.log('Doctor ID retrieved:', currentDoctorId); // Debug log

      if (!currentDoctorId) {
        throw new Error('Doctor ID not found. Please log in again.');
      }

      const url = buildApiUrl(`/api/v1/settings/${currentDoctorId}`);
      console.log('Making request to:', url); // Debug log

      const response = await fetch(url);
      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }

      const data: Settings = await response.json();
      console.log('Settings data received:', data); // Debug log

      // Cache the settings with doctor ID
      this.cachedSettings = data;
      this.cacheTimestamp = Date.now();
      this.cachedDoctorId = currentDoctorId;

      return data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  /**
   * Get clinic name from cached settings (fast access)
   */
  static getClinicName(): string | null {
    const currentDoctorId = authService.getDoctorId();

    // Return null if cache is for a different doctor
    if (this.cachedDoctorId !== currentDoctorId) {
      return null;
    }

    return this.cachedSettings?.clinic_name || null;
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

      // Update cache with new settings
      this.cachedSettings = data;
      this.cacheTimestamp = Date.now();
      this.cachedDoctorId = doctorId;

      // Dispatch settings update event
      settingsEventDispatcher.dispatchSettingsUpdate(data);

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
