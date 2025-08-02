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
          <h4 className="text-md font-medium text-gray-900 mb-3">Working Days</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {fieldValues.weekDays.map((day) => (
              <label key={day} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.appointments_working_days.includes(day)}
                  onChange={() => handleWorkingDayToggle(day)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{day}</span>
              </label>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('notifications')}</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications_email}
                onChange={(e) => handleInputChange('notifications_email', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive notifications via email</div>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications_sms}
                onChange={(e) => handleInputChange('notifications_sms', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">SMS Notifications</div>
                <div className="text-sm text-gray-500">Receive notifications via SMS</div>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications_appointment_reminder}
                onChange={(e) => handleInputChange('notifications_appointment_reminder', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Appointment Reminders</div>
                <div className="text-sm text-gray-500">Send automatic appointment reminders</div>
              </div>
            </label>

            <div className="ml-6">
              <Input
                label="Reminder Time (minutes before)"
                type="number"
                value={settings.notifications_reminder_time.toString()}
                onChange={(e) => handleInputChange('notifications_reminder_time', parseInt(e.target.value) || 0)}
                placeholder="60"
                disabled={!settings.notifications_appointment_reminder}
                className="w-32"
              />
              <span className="ml-2 text-sm text-gray-500">{t('minutes')}</span>
            </div>
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
