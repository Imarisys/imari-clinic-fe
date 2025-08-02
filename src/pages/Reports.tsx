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
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { reportService } from '../services/reportService';
import { AppointmentChart } from '../components/reports/AppointmentChart';
import { PatientDemographics } from '../components/reports/PatientDemographics';
import { RevenueChart } from '../components/reports/RevenueChart';
import { AppointmentSummary } from '../components/reports/AppointmentSummary';
import { PatientInsights } from '../components/reports/PatientInsights';
import { PerformanceMetrics } from '../components/reports/PerformanceMetrics';

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into your practice performance</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={handlePrintReport}
              className="flex items-center space-x-2"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedReportType(type.id)}
              className={`p-6 rounded-lg border-2 text-left transition-all duration-200 ${
                selectedReportType === type.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`p-2 rounded-lg ${type.color} text-white`}>
                  <type.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900">{type.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{type.description}</p>
            </button>
          ))}
        </div>

        {/* Date Range Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Date Range:</span>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {dateRange === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-100">
                <DocumentChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {reportTypes.find(t => t.id === selectedReportType)?.title}
                </h2>
                <p className="text-sm text-gray-600">
                  Data from {getStartDate()} to {getEndDate()}
                </p>
              </div>
            </div>

            {renderReportContent()}
          </div>
        </div>

        {/* Export Modal */}
        <Modal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Export Report"
        >
          <div className="space-y-4">
            <p className="text-gray-600">Choose the format for your report export:</p>
            <div className="space-y-3">
              <Button
                variant="secondary"
                onClick={() => handleExportReport('pdf')}
                className="w-full justify-start"
              >
                Export as PDF
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExportReport('excel')}
                className="w-full justify-start"
              >
                Export as Excel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExportReport('csv')}
                className="w-full justify-start"
              >
                Export as CSV
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};
