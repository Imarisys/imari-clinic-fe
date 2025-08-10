import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  ClockIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  WrenchScrewdriverIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { reportService } from '../services/reportService';
import { AppointmentChart } from '../components/reports/AppointmentChart';
import { PatientDemographics } from '../components/reports/PatientDemographics';
import { RevenueChart } from '../components/reports/RevenueChart';
import { AppointmentSummary } from '../components/reports/AppointmentSummary';
import { PatientInsights } from '../components/reports/PatientInsights';
import { PerformanceMetrics } from '../components/reports/PerformanceMetrics';
import { useTranslation } from '../context/TranslationContext';

type ReportType = 'appointments' | 'patients' | 'revenue' | 'performance';
type DateRange = '7days' | '30days' | '90days' | '1year' | 'custom';

interface ReportData {
  appointments?: any[];
  patients?: any[];
  revenue?: any;
  metrics?: any;
  summary?: any;
  insights?: any;
}

export const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('appointments');
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const reportTypes = [
    {
      id: 'appointments' as ReportType,
      title: 'Appointment Analytics',
      description: 'Track appointment trends, status distribution, and scheduling patterns',
      icon: CalendarIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'patients' as ReportType,
      title: 'Patient Insights',
      description: 'Demographics, visit frequency, and patient engagement metrics',
      icon: UserGroupIcon,
      color: 'bg-green-500'
    },
    {
      id: 'revenue' as ReportType,
      title: 'Revenue Analysis',
      description: 'Financial performance, payment trends, and revenue forecasting',
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500'
    },
    {
      id: 'performance' as ReportType,
      title: 'Practice Performance',
      description: 'Operational efficiency, wait times, and capacity utilization',
      icon: ChartBarIcon,
      color: 'bg-orange-500'
    }
  ];

  const dateRangeOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: '1year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  useEffect(() => {
    loadReportData();
  }, [selectedReportType, dateRange, customDateStart, customDateEnd]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();

      const data = await reportService.getReportData(selectedReportType, startDate, endDate);
      setReportData(data as ReportData);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    if (dateRange === 'custom') return customDateStart;

    const now = new Date();
    switch (dateRange) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '90days':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '1year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  };

  const getEndDate = () => {
    if (dateRange === 'custom') return customDateEnd;
    return new Date().toISOString().split('T')[0];
  };

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();

      await reportService.exportReport(selectedReportType, format, startDate, endDate);
      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!reportData) return null;

    switch (selectedReportType) {
      case 'appointments':
        return (
          <div className="space-y-6">
            <AppointmentSummary data={[reportData.summary]} />
            <AppointmentChart data={reportData.appointments || []} />
          </div>
        );
      case 'patients':
        return (
          <div className="space-y-6">
            <PatientInsights data={reportData} />
            <PatientDemographics data={reportData.patients || []} />
          </div>
        );
      case 'revenue':
        return (
          <div className="space-y-6">
            <RevenueChart data={reportData.revenue || { revenue: [], summary: {} }} />
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-6">
            <PerformanceMetrics data={reportData} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="relative">
        {/* Blurred Content */}
        <div className="blur-sm pointer-events-none select-none">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('reports_analytics')}</h1>
                <p className="text-gray-600 mt-1">{t('comprehensive_insights_practice_performance')}</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={handlePrintReport}
                  className="flex items-center space-x-2"
                >
                  <PrinterIcon className="h-4 w-4" />
                  <span>{t('print')}</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>{t('export')}</span>
                </Button>
              </div>
            </div>

            {/* Report Type Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reportTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedReportType(type.id)}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                    selectedReportType === type.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${type.color} p-2 rounded-lg text-white`}>
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{type.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Date Range Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">Date Range:</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dateRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateRange(option.value as DateRange)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        dateRange === option.value
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {dateRange === 'custom' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <input
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Report Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {renderReportContent()}
            </div>
          </div>
        </div>

        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <div className="relative">
                <WrenchScrewdriverIcon className="w-10 h-10 text-white" />
                <SparklesIcon className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('coming_soon')}</h2>
            <p className="text-gray-600 text-lg mb-6">
              {t('working_hard_comprehensive_reports')}
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">{t('whats_coming')}</h3>
              <ul className="text-sm text-gray-700 space-y-2 text-left">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  {t('appointment_analytics_trends')}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  {t('patient_demographics_insights')}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  {t('revenue_analysis_forecasting')}
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  {t('practice_performance_metrics')}
                </li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-500 mt-6">
              {t('stay_tuned_updates')}
            </p>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={t('export_report')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">{t('choose_format_export')}</p>
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={() => handleExportReport('pdf')}
              className="flex-1"
            >
              {t('export_as_pdf')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExportReport('excel')}
              className="flex-1"
            >
              {t('export_as_excel')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExportReport('csv')}
              className="flex-1"
            >
              {t('export_as_csv')}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
