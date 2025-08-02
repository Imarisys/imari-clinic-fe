import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useTranslation } from '../context/TranslationContext';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Settings as SettingsType, SettingsFieldValues } from '../types/Settings';
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

  const tabs = [
    { id: 'general', label: t('general'), icon: 'settings' },
    { id: 'appointments', label: t('appointments'), icon: 'event' },
    { id: 'notifications', label: t('notifications'), icon: 'notifications' },
    { id: 'display', label: t('display'), icon: 'visibility' },
  ];

  const renderGeneralTab = () => {
    if (!settings) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('clinic_information')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={t('clinic_name')}
              value={settings.clinic_name}
              onChange={(e) => handleInputChange('clinic_name', e.target.value)}
              placeholder="Enter clinic name"
            />
            <Input
              label={t('clinic_phone')}
              value={settings.clinic_phone}
              onChange={(e) => handleInputChange('clinic_phone', e.target.value)}
              placeholder="Enter clinic phone"
            />
            <Input
              label={t('clinic_email')}
              type="email"
              value={settings.clinic_email}
              onChange={(e) => handleInputChange('clinic_email', e.target.value)}
              placeholder="Enter clinic email"
            />
            <div className="md:col-span-2">
              <Input
                label={t('clinic_address')}
                value={settings.clinic_address}
                onChange={(e) => handleInputChange('clinic_address', e.target.value)}
                placeholder="Enter clinic address"
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('appointments')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={t('start_time')}
              type="time"
              value={settings.appointments_start_time}
              onChange={(e) => handleInputChange('appointments_start_time', e.target.value)}
            />
            <Input
              label={t('end_time')}
              type="time"
              value={settings.appointments_end_time}
              onChange={(e) => handleInputChange('appointments_end_time', e.target.value)}
            />
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Working Days</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {fieldValues.weekDays.map((day) => (
              <div key={day} className="relative">
                <input
                  type="checkbox"
                  id={`day-${day}`}
                  checked={settings.appointments_working_days.includes(day)}
                  onChange={() => handleWorkingDayToggle(day)}
                  className="sr-only peer"
                />
                <label
                  htmlFor={`day-${day}`}
                  className={`flex items-center justify-center p-3 text-sm font-medium rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    settings.appointments_working_days.includes(day)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {day.substring(0, 3)}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

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
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('display')} Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={settings.display_date_format}
                onChange={(e) => handleInputChange('display_date_format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {fieldValues.timeFormats.map((format) => (
                  <option key={format} value={format}>{format === '12h' ? '12 Hour' : '24 Hour'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={settings.display_currency}
                onChange={(e) => handleInputChange('display_currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

  if (isLoading || !settings || !fieldValues) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading settings...</div>
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
