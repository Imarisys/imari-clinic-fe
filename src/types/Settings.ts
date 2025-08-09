// filepath: /home/imari/IdeaProjects/imari_fe2/src/types/Settings.ts

export interface Settings {
  // Clinic Information
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email: string;

  // Appointment Settings
  appointments_start_time: string; // HH:MM format
  appointments_end_time: string; // HH:MM format
  appointments_working_days: string[]; // ['Monday', 'Tuesday', etc.]

  // Notification Settings
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_appointment_reminder: boolean;
  notifications_reminder_time: number; // in minutes

  // Display Settings
  display_date_format: string; // 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  display_time_format: string; // '12h' | '24h'
  display_currency: string;
  display_temperature_unit: string; // 'celsius' | 'fahrenheit'
  display_language: string;
  layout_position: 'sidebar' | 'header'; // New layout preference

  // IDs
  id: string;
  doctor_id: string;
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

export interface SettingsFieldValues {
  weekDays: string[];
  dateFormats: string[];
  timeFormats: string[];
  currencies: string[];
  temperatureUnits: string[];
  languages: string[];
}
