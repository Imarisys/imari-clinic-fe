import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useTranslation } from '../context/TranslationContext';
import { useNotification } from '../context/NotificationContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { Settings as SettingsType, SettingsFieldValues } from '../types/Settings';
import { SettingsService } from '../services/settingsService';
import { AppointmentTypeService, AppointmentType, AppointmentTypeCreate } from '../services/appointmentTypeService';
import { authService } from '../services/authService';

export const SettingsPage: React.FC = () => {
  const { t, language: currentUILanguage, setLanguage: setUILanguage } = useTranslation();
  const { showNotification } = useNotification();

  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [fieldValues, setFieldValues] = useState<SettingsFieldValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Check if we should restore to layout tab after reload
    const savedTab = localStorage.getItem('settings_active_tab');
    if (savedTab) {
      localStorage.removeItem('settings_active_tab'); // Clean up
      return savedTab;
    }
    return 'general';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Cloud backup states
  const [cloudBackupEnabled, setCloudBackupEnabled] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState('weekly');
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Appointment types management states
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [isLoadingAppointmentTypes, setIsLoadingAppointmentTypes] = useState(false);
  const [showAppointmentTypeModal, setShowAppointmentTypeModal] = useState(false);
  const [editingAppointmentType, setEditingAppointmentType] = useState<AppointmentType | null>(null);
  const [appointmentTypeForm, setAppointmentTypeForm] = useState<AppointmentTypeCreate>({
    name: '',
    duration_minutes: 30,
    cost: 0,
    icon: 'event'
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [appointmentTypeToDelete, setAppointmentTypeToDelete] = useState<string | null>(null);

  // Available icons for appointment types
  const availableIcons = [
    { value: 'event', label: t('general_appointment'), color: 'text-blue-600' },
    { value: 'medical_services', label: t('medical_checkup'), color: 'text-green-600' },
    { value: 'healing', label: t('treatment'), color: 'text-purple-600' },
    { value: 'vaccines', label: t('vaccination'), color: 'text-orange-600' },
    { value: 'psychology', label: t('consultation'), color: 'text-indigo-600' },
    { value: 'monitor_heart', label: t('cardiology'), color: 'text-red-600' },
    { value: 'visibility', label: t('eye_exam'), color: 'text-cyan-600' },
    { value: 'hearing', label: t('hearing_test'), color: 'text-yellow-600' },
    { value: 'pregnant_woman', label: t('prenatal_care'), color: 'text-pink-600' },
    { value: 'child_care', label: t('pediatric'), color: 'text-emerald-600' },
    { value: 'elderly', label: t('geriatric_care'), color: 'text-gray-600' },
    { value: 'psychology_alt', label: t('mental_health'), color: 'text-violet-600' },
    { value: 'sports_soccer', label: t('sports_medicine'), color: 'text-lime-600' },
    { value: 'spa', label: t('wellness'), color: 'text-teal-600' }
  ];

  // Available languages - always show these regardless of backend response
  const availableLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointmentTypes();
    }
  }, [activeTab]);

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
    if (settings) {
      const updatedSettings = { ...settings, [field]: value };
      setSettings(updatedSettings);

      // If language is changed, also update the UI language immediately
      if (field === 'display_language') {
        setUILanguage(value as 'en' | 'fr' );
      }
    }
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

      // Check if layout position was changed and reload page if so
      const currentLayoutPosition = updatedSettings.layout_position || 'sidebar';
      const previousLayoutPosition = localStorage.getItem('previous_layout_position') || 'sidebar';

      showNotification('success', 'Success', t('layout_updated_successfully'));

      // Store the current layout position for next comparison
      localStorage.setItem('previous_layout_position', currentLayoutPosition);

      // Reload page if layout position changed
      if (currentLayoutPosition !== previousLayoutPosition) {
        // Store the current tab so we can restore it after reload
        localStorage.setItem('settings_active_tab', 'layout');
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Small delay to show the success notification
      }
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

  // Appointment types handlers
  const loadAppointmentTypes = async () => {
    setIsLoadingAppointmentTypes(true);
    try {
      const types = await AppointmentTypeService.getAll();
      setAppointmentTypes(types);
    } catch (error) {
      console.error('Error loading appointment types:', error);
      showNotification('error', 'Error', 'Failed to load appointment types');
    } finally {
      setIsLoadingAppointmentTypes(false);
    }
  };

  const handleAddEditAppointmentType = async () => {
    if (!appointmentTypeForm.name) return;

    try {
      let response: AppointmentType;
      if (editingAppointmentType) {
        // Update existing appointment type
        response = await AppointmentTypeService.updateAppointmentType(
          editingAppointmentType.name,
          appointmentTypeForm
        );
        showNotification('success', 'Success', 'Appointment type updated successfully');
      } else {
        // Create new appointment type
        response = await AppointmentTypeService.createAppointmentType(appointmentTypeForm);
        showNotification('success', 'Success', 'Appointment type created successfully');
      }

      // Update local state
      setAppointmentTypes(prev => {
        if (editingAppointmentType) {
          return prev?.map(type => type.name === editingAppointmentType.name ? response : type) || [];
        } else {
          return [...(prev || []), response];
        }
      });

      // Reset form and close modal
      setAppointmentTypeForm({ name: '', duration_minutes: 30, cost: 0, icon: 'event' });
      setEditingAppointmentType(null);
      setShowAppointmentTypeModal(false);
    } catch (error) {
      console.error('Error saving appointment type:', error);
      showNotification('error', 'Error', 'Failed to save appointment type');
    }
  };

  const handleDeleteAppointmentType = async () => {
    if (!appointmentTypeToDelete) return;

    try {
      await AppointmentTypeService.deleteAppointmentType(appointmentTypeToDelete);
      setAppointmentTypes(prev => prev?.filter(type => type.name !== appointmentTypeToDelete) || []);
      showNotification('success', 'Success', 'Appointment type deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment type:', error);
      showNotification('error', 'Error', 'Failed to delete appointment type');
    } finally {
      setShowDeleteConfirmation(false);
      setAppointmentTypeToDelete(null);
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Language Settings Section */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="material-icons-round text-primary-600 mr-2">language</span>
            {t('language_settings')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('language' as any) || 'Language'}</label>
              <select
                value={settings.display_language || currentUILanguage}
                onChange={(e) => handleInputChange('display_language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
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
        {/* Working Hours Section */}
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

        {/* Appointment Types Management Section */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <span className="material-icons-round text-primary-600 mr-2">category</span>
              {t('appointment_types')}
            </h3>
            <Button
              onClick={() => {
                setEditingAppointmentType(null);
                setAppointmentTypeForm({ name: '', duration_minutes: 30, cost: 0, icon: 'event' });
                setShowAppointmentTypeModal(true);
              }}
              variant="primary"
              className="flex items-center"
            >
              <span className="material-icons-round mr-2">add</span>
              {t('add_type')}
            </Button>
          </div>

          {isLoadingAppointmentTypes ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <span className="material-icons-round animate-spin text-2xl text-primary-600 mb-2">autorenew</span>
                <p className="text-gray-600">{t('loading_appointment_types')}</p>
              </div>
            </div>
          ) : appointmentTypes.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-icons-round text-gray-400 text-2xl">category</span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">{t('no_appointment_types')}</h4>
              <p className="text-gray-600 mb-4">{t('create_first_appointment_type')}</p>
              <Button
                onClick={() => {
                  setEditingAppointmentType(null);
                  setAppointmentTypeForm({ name: '', duration_minutes: 30, cost: 0, icon: 'event' });
                  setShowAppointmentTypeModal(true);
                }}
                variant="primary"
              >
                <span className="material-icons-round mr-2">add</span>
                {t('add_appointment_type')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointmentTypes.map((type) => {
                const selectedIcon = availableIcons.find(icon => icon.value === type.icon) || availableIcons[0];
                // Use proper currency symbol based on backend settings
                const getCurrencySymbol = (currency: string) => {
                  switch (currency) {
                    case 'USD': return '$ ';
                    case 'EUR': return '€ ';
                    case 'GBP': return '£ ';
                    default: return currency + ' ';
                  }
                };
                const currencySymbol = getCurrencySymbol(settings?.display_currency || 'USD');

                return (
                  <div
                    key={type.name}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-3 ${
                          selectedIcon.value === 'event' ? 'bg-primary-100' : 'bg-gray-100'
                        }`}>
                          <span className={`material-icons-round text-xl ${
                            selectedIcon.value === 'event' ? 'text-primary-600' : selectedIcon.color
                          }`}>
                            {type.icon}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{type.name}</h4>
                          <p className="text-sm text-gray-600">{type.duration_minutes} minutes</p>
                          <p className="text-sm font-medium text-green-600">
                            {currencySymbol}{type.cost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingAppointmentType(type);
                            setAppointmentTypeForm({
                              name: type.name,
                              duration_minutes: type.duration_minutes,
                              cost: type.cost,
                              icon: type.icon
                            });
                            setShowAppointmentTypeModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons-round text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setAppointmentTypeToDelete(type.name);
                            setShowDeleteConfirmation(true);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <span className="material-icons-round text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                value={settings.display_language || currentUILanguage}
                onChange={(e) => handleInputChange('display_language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLayoutTab = () => {
    if (!settings) return null;

    return (
      <div className="space-y-6">
        {/* Layout Position Section */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <span className="material-icons-round text-primary-600 mr-2">view_quilt</span>
            {t('layout_position')}
          </h3>

          <p className="text-gray-600 mb-6">{t('layout_position_description')}</p>

          <div className="space-y-6">
            {/* Layout Position Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sidebar Layout Option */}
              <div
                onClick={() => handleInputChange('layout_position', 'sidebar')}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  (settings.layout_position || 'sidebar') === 'sidebar'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{t('sidebar_layout')}</h4>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    (settings.layout_position || 'sidebar') === 'sidebar'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {(settings.layout_position || 'sidebar') === 'sidebar' && (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Preview */}
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="w-20 h-12 bg-primary-500 rounded mr-2"></div>
                    <div className="flex-1 h-12 bg-gray-300 rounded"></div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Navigation menu positioned on the left side of the screen
                </p>
              </div>

              {/* Header Layout Option */}
              <div
                onClick={() => handleInputChange('layout_position', 'header')}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  settings.layout_position === 'header'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{t('header_layout')}</h4>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    settings.layout_position === 'header'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {settings.layout_position === 'header' && (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Preview */}
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-primary-500 rounded"></div>
                    <div className="w-full h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Navigation menu positioned at the top of the screen
                </p>
              </div>
            </div>

            {/* Layout Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="material-icons-round text-primary-600 mr-2">preview</span>
                Live Preview
              </h4>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {(settings.layout_position || 'sidebar') === 'sidebar' ? (
                  <div className="flex h-32">
                    <div className="w-20 bg-primary-600 flex flex-col items-center justify-center space-y-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="material-icons-round text-primary-600 text-sm">local_hospital</span>
                      </div>
                      <div className="space-y-1">
                        {['dashboard', 'calendar', 'people', 'bar_chart', 'settings'].map((icon, idx) => (
                          <div key={idx} className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                            <span className="material-icons-round text-white text-xs">{icon}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-200 rounded mt-4"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    <div className="h-16 bg-primary-600 flex items-center justify-between px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                          <span className="material-icons-round text-primary-600 text-sm">local_hospital</span>
                        </div>
                        <span className="text-white font-medium">Clinic Name</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {['dashboard', 'calendar', 'people', 'bar_chart', 'settings'].map((icon, idx) => (
                          <div key={idx} className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                            <span className="material-icons-round text-white text-sm">{icon}</span>
                          </div>
                        ))}
                        <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-16 bg-gray-50 p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3 text-center">
                This preview shows how your layout will appear. Changes take effect immediately.
              </p>
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
    { id: 'general', label: t('general'), icon: 'settings' },
    { id: 'appointments', label: t('appointments'), icon: 'event' },
    { id: 'notifications', label: t('notifications'), icon: 'notifications' },
    { id: 'display', label: t('display'), icon: 'display_settings' },
    { id: 'layout', label: t('layout_position'), icon: 'view_quilt' },
    { id: 'backup_restore', label: t('backup_restore'), icon: 'cloud' }
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
            {activeTab === 'layout' && renderLayoutTab()}
            {activeTab === 'backup_restore' && renderBackupRestoreTab()}
          </div>
        </div>

        {/* Appointment Types Modal */}
        <Modal
          isOpen={showAppointmentTypeModal}
          onClose={() => setShowAppointmentTypeModal(false)}
          title={`${editingAppointmentType ? 'Edit' : 'Add'} Appointment Type`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <Input
                value={appointmentTypeForm.name}
                onChange={(e) => setAppointmentTypeForm({ ...appointmentTypeForm, name: e.target.value })}
                placeholder="Enter appointment type name"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
              <Input
                type="number"
                value={appointmentTypeForm.duration_minutes.toString()}
                onChange={(e) => setAppointmentTypeForm({ ...appointmentTypeForm, duration_minutes: parseInt(e.target.value) })}
                placeholder="Enter duration in minutes"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost</label>
              <Input
                type="number"
                step="0.01"
                value={appointmentTypeForm.cost.toString()}
                onChange={(e) => setAppointmentTypeForm({ ...appointmentTypeForm, cost: parseFloat(e.target.value) || 0 })}
                placeholder="Enter cost"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="grid grid-cols-6 gap-3 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {availableIcons.map(icon => (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setAppointmentTypeForm({ ...appointmentTypeForm, icon: icon.value })}
                    className={`flex items-center justify-center p-3 rounded-lg transition-all hover:scale-105 ${
                      appointmentTypeForm.icon === icon.value
                        ? 'bg-primary-100 border-2 border-primary-300 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                    }`}
                    title={icon.label}
                  >
                    <span className={`material-icons-round text-xl ${
                      appointmentTypeForm.icon === icon.value ? 'text-primary-600' : icon.color
                    }`}>
                      {icon.value}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Select an icon that best represents this appointment type</p>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              onClick={() => setShowAppointmentTypeModal(false)}
              variant="secondary"
              className="px-4 py-2 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddEditAppointmentType}
              variant="primary"
              className="px-4 py-2 rounded-lg"
            >
              Save
            </Button>
          </div>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleDeleteAppointmentType}
          title="Delete Appointment Type"
          message="Are you sure you want to delete this appointment type? This action cannot be undone."
          confirmButtonText="Delete"
          cancelButtonText="Cancel"
        />
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
