// filepath: /home/imari/IdeaProjects/imari_fe2/src/types/Settings.ts

export interface Settings {
  // Localization
  language: string;
  country: string;
  city: string;
  timezone: string;
  
  // Clinic Information
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  
  // Appointment Settings
  appointmentDuration: number; // in minutes
  workingHoursStart: string; // HH:MM format
  workingHoursEnd: string; // HH:MM format
  workingDays: string[]; // ['monday', 'tuesday', etc.]
  
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  reminderTimeBefore: number; // in minutes
  
  // Display Settings
  dateFormat: string; // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h';
  currency: string;
  
  // Weather Settings
  showWeather: boolean;
  temperatureUnit: 'celsius' | 'fahrenheit';
}

export interface SettingsUpdate {
  [key: string]: any;
}

export interface Country {
  code: string;
  name: string;
  cities: string[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}
