import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useTranslation } from '../context/TranslationContext';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Settings as SettingsType, SettingsFieldValues, Country, Language } from '../types/Settings';
import { SettingsService } from '../services/settingsService';
import { authService } from '../services/authService';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [fieldValues, setFieldValues] = useState<SettingsFieldValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);

  // Cloud backup states
  const [cloudBackupEnabled, setCloudBackupEnabled] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState('weekly');
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Debug: Check if user is authenticated and doctor_id exists
      const isAuth = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();
      const doctorId = authService.getDoctorId();

      console.log('=== Settings Page Debug ===');
      console.log('Is authenticated:', isAuth);
      console.log('Current user:', currentUser);
      console.log('Doctor ID:', doctorId);
      console.log('========================');

      const [settingsData, fieldValuesData] = await Promise.all([
        SettingsService.getSettings(),
        SettingsService.getSettingsFieldValues()
      ]);
      setSettings(settingsData);
      setFieldValues(fieldValuesData);
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification('error', 'Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SettingsType, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const handleWorkingDayToggle = (day: string) => {
    if (!settings) return;
    const updatedDays = settings.appointments_working_days.includes(day)
      ? settings.appointments_working_days.filter(d => d !== day)
      : [...settings.appointments_working_days, day];

    handleInputChange('appointments_working_days', updatedDays);
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const updatedSettings = await SettingsService.updateSettings(settings);
      setSettings(updatedSettings);
      showNotification('success', 'Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('error', 'Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportSettings = async () => {
    try {
      const blob = await SettingsService.exportSettings();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinic-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showNotification('success', 'Success', 'Settings exported successfully');
    } catch (error) {
      showNotification('error', 'Error', 'Failed to export settings');
    }
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await SettingsService.importSettings(file);
      setSettings(response.data);
      showNotification('success', 'Success', 'Settings imported successfully');
    } catch (error) {
      showNotification('error', 'Error', 'Failed to import settings');
    }

    // Reset input
    event.target.value = '';
  };

  // Cloud backup handlers
  const handleCloudBackup = async () => {
    setIsBackingUp(true);
    try {
      // Simulate cloud backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastBackupDate(new Date().toISOString());
      showNotification('success', 'Success', 'Data backed up to cloud successfully');
    } catch (error) {
      showNotification('error', 'Error', 'Failed to backup data to cloud');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleCloudRestore = async () => {
    setIsRestoring(true);
    try {
      // Simulate cloud restore process
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification('success', 'Success', 'Data restored from cloud successfully');
    } catch (error) {
      showNotification('error', 'Error', 'Failed to restore data from cloud');
    } finally {
      setIsRestoring(false);
    }
  };

  const renderGeneralTab = () => {
    if (!settings) return null;

    return (
      <div className="space-y-6">
        {/* Clinic Information Section */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="material-icons-round text-primary-600 mr-2">local_hospital</span>
            {t('clinic_information')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label={t('clinic_name')}
                value={settings.clinic_name}
                onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                placeholder="Enter clinic name"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label={t('clinic_address')}
                value={settings.clinic_address}
                onChange={(e) => handleInputChange('clinic_address', e.target.value)}
                placeholder="Enter clinic address"
              />
            </div>

            <div>
              <Input
                label={t('clinic_phone')}
                value={settings.clinic_phone}
                onChange={(e) => handleInputChange('clinic_phone', e.target.value)}
                placeholder="Enter clinic phone"
              />
            </div>

            <div>
              <Input
                label={t('clinic_email')}
                type="email"
                value={settings.clinic_email}
                onChange={(e) => handleInputChange('clinic_email', e.target.value)}
                placeholder="Enter clinic email"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAppointmentsTab = () => {
    if (!settings || !fieldValues) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="material-icons-round text-primary-600 mr-2">schedule</span>
            {t('working_hours')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Input
                label={t('start_time')}
                type="time"
                value={settings.appointments_start_time}
                onChange={(e) => handleInputChange('appointments_start_time', e.target.value)}
              />
            </div>

            <div>
              <Input
                label={t('end_time')}
                type="time"
                value={settings.appointments_end_time}
                onChange={(e) => handleInputChange('appointments_end_time', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('working_days')}</label>
            <div className="flex flex-wrap gap-2">
              {fieldValues.weekDays.map(day => (
                <button
                  key={day}
                  onClick={() => handleWorkingDayToggle(day)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    settings.appointments_working_days.includes(day)
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Keep the new beautiful notifications design
  const renderNotificationsTab = () => {
    if (!settings) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('notifications')}</h3>
          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons-round text-blue-600 text-xl">email</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  id="email-notifications"
                  checked={settings.notifications_email}
                  onChange={(e) => handleInputChange('notifications_email', e.target.checked)}
                  className="sr-only peer"
                />
                <label
                  htmlFor="email-notifications"
                  className="relative flex items-center justify-center w-11 h-6 bg-gray-200 rounded-full cursor-pointer transition-colors peer-checked:bg-primary-600"
                >
                  <span className="absolute left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
                </label>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons-round text-green-600 text-xl">sms</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                  <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  id="sms-notifications"
                  checked={settings.notifications_sms}
                  onChange={(e) => handleInputChange('notifications_sms', e.target.checked)}
                  className="sr-only peer"
                />
                <label
                  htmlFor="sms-notifications"
                  className="relative flex items-center justify-center w-11 h-6 bg-gray-200 rounded-full cursor-pointer transition-colors peer-checked:bg-primary-600"
                >
                  <span className="absolute left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
                </label>
              </div>
            </div>

            {/* Appointment Reminders */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="material-icons-round text-orange-600 text-xl">schedule</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Appointment Reminders</h4>
                  <p className="text-sm text-gray-500">Send automatic appointment reminders</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  id="appointment-reminders"
                  checked={settings.notifications_appointment_reminder}
                  onChange={(e) => handleInputChange('notifications_appointment_reminder', e.target.checked)}
                  className="sr-only peer"
                />
                <label
                  htmlFor="appointment-reminders"
                  className="relative flex items-center justify-center w-11 h-6 bg-gray-200 rounded-full cursor-pointer transition-colors peer-checked:bg-primary-600"
                >
                  <span className="absolute left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
                </label>
              </div>
            </div>

            {/* Reminder Time Setting */}
            {settings.notifications_appointment_reminder && (
              <div className="ml-14 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Input
                      label="Reminder Time (minutes before)"
                      type="number"
                      value={settings.notifications_reminder_time.toString()}
                      onChange={(e) => handleInputChange('notifications_reminder_time', parseInt(e.target.value) || 0)}
                      placeholder="60"
                      className="w-32"
                    />
                  </div>
                  <span className="text-sm text-gray-500 mt-6">{t('minutes')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDisplayTab = () => {
    if (!settings || !fieldValues) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="material-icons-round text-primary-600 mr-2">display_settings</span>
            Display Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={settings.display_date_format}
                onChange={(e) => handleInputChange('display_date_format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {fieldValues.dateFormats.map((format) => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
              <select
                value={settings.display_time_format}
                onChange={(e) => handleInputChange('display_time_format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {fieldValues.timeFormats.map((format) => (
                  <option key={format} value={format}>{format === '12h' ? '12 Hour (AM/PM)' : '24 Hour'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={settings.display_currency}
                onChange={(e) => handleInputChange('display_currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {fieldValues.currencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temperature Unit</label>
              <select
                value={settings.display_temperature_unit}
                onChange={(e) => handleInputChange('display_temperature_unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {fieldValues.temperatureUnits.map((unit) => (
                  <option key={unit} value={unit}>{unit === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={settings.display_language}
                onChange={(e) => handleInputChange('display_language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {fieldValues.languages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBackupRestoreTab = () => (
    <div className="space-y-6">
      {/* Cloud Backup Section */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="material-icons-round text-primary-600 mr-2">cloud_upload</span>
          Cloud Backup
        </h3>

        <div className="space-y-6">
          {/* Enable Cloud Backup Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h4 className="font-medium text-gray-800">Enable Cloud Backup</h4>
              <p className="text-sm text-gray-600">Automatically backup your clinic data to secure cloud storage</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cloudBackupEnabled}
                onChange={(e) => setCloudBackupEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Backup Frequency */}
          {cloudBackupEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Automatic Backup Frequency</label>
              <select
                value={autoBackupFrequency}
                onChange={(e) => setAutoBackupFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Automatic backups will run in the background at the selected frequency
              </p>
            </div>
          )}

          {/* Manual Backup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Manual Backup</h4>
              <p className="text-sm text-gray-600 mb-4">Create an immediate backup of all your clinic data</p>
              <Button
                onClick={handleCloudBackup}
                disabled={isBackingUp}
                variant="primary"
                className="w-full"
              >
                {isBackingUp ? (
                  <>
                    <span className="material-icons-round animate-spin mr-2">cloud_upload</span>
                    Backing up...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round mr-2">cloud_upload</span>
                    Backup Now
                  </>
                )}
              </Button>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">Restore from Cloud</h4>
              <p className="text-sm text-gray-600 mb-4">Restore your clinic data from the latest cloud backup</p>
              <Button
                onClick={handleCloudRestore}
                disabled={isRestoring || !lastBackupDate}
                variant="secondary"
                className="w-full"
              >
                {isRestoring ? (
                  <>
                    <span className="material-icons-round animate-spin mr-2">cloud_download</span>
                    Restoring...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round mr-2">cloud_download</span>
                    Restore from Cloud
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Last Backup Info */}
          {lastBackupDate && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <span className="material-icons-round text-green-600 mr-2">cloud_done</span>
                <div>
                  <p className="font-medium text-green-800">Last backup completed</p>
                  <p className="text-sm text-green-600">
                    {new Date(lastBackupDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Local Backup Section */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="material-icons-round text-primary-600 mr-2">download</span>
          Local Backup & Restore
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Export Settings</h4>
            <p className="text-sm text-gray-600 mb-4">Download your clinic settings as a local backup file</p>
            <Button
              onClick={handleExportSettings}
              variant="secondary"
              className="w-full"
            >
              <span className="material-icons-round mr-2">download</span>
              Export Settings
            </Button>
          </div>

          <div>
            <h4 className="font-medium text-gray-800 mb-2">Import Settings</h4>
            <p className="text-sm text-gray-600 mb-4">Restore settings from a previously exported backup file</p>
            <label className="cursor-pointer w-full">
              <input
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="hidden"
              />
              <div className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 cursor-pointer transition-colors flex items-center justify-center">
                <span className="material-icons-round mr-2">upload</span>
                Import Settings
              </div>
            </label>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start">
            <span className="material-icons-round text-yellow-600 mr-2 mt-0.5">info</span>
            <div>
              <p className="font-medium text-yellow-800">Important Notes</p>
              <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                <li>• Local backups only include settings and preferences</li>
                <li>• For complete data backup including patients and appointments, use cloud backup</li>
                <li>• Keep your backup files secure and in a safe location</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="material-icons-round text-primary-600 mr-2">history</span>
          Backup History
        </h3>

        <div className="space-y-3">
          {/* Mock backup history entries */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="material-icons-round text-green-600 mr-3">cloud_done</span>
              <div>
                <p className="font-medium text-gray-800">Automatic Cloud Backup</p>
                <p className="text-sm text-gray-600">August 1, 2025 at 2:00 AM</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Success</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="material-icons-round text-blue-600 mr-3">download</span>
              <div>
                <p className="font-medium text-gray-800">Manual Settings Export</p>
                <p className="text-sm text-gray-600">July 28, 2025 at 10:30 AM</p>
              </div>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Exported</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="material-icons-round text-green-600 mr-3">cloud_done</span>
              <div>
                <p className="font-medium text-gray-800">Automatic Cloud Backup</p>
                <p className="text-sm text-gray-600">July 25, 2025 at 2:00 AM</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Success</span>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'appointments', label: 'Appointments', icon: 'event' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'display', label: 'Display', icon: 'display_settings' },
    { id: 'backup_restore', label: 'Backup & Restore', icon: 'cloud' }
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <span className="material-icons-round animate-spin text-4xl text-primary-600 mb-4">autorenew</span>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>
            <p className="text-gray-600 mt-1">{t('manage_clinic_preferences')}</p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isSaving ? (
              <>
                <span className="material-icons-round animate-spin mr-2">autorenew</span>
                {t('saving')}
              </>
            ) : (
              <>
                <span className="material-icons-round mr-2">save</span>
                {t('save_changes')}
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-card">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="material-icons-round mr-2 text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'appointments' && renderAppointmentsTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'display' && renderDisplayTab()}
            {activeTab === 'backup_restore' && renderBackupRestoreTab()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
