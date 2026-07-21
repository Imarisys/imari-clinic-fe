import { Settings } from '../types/Settings';

export type DateFormat = string;
export type TimeFormat = '12h' | '24h';

interface FormatOptions {
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  language: 'en' | 'fr';
}

const localeFor = (language: 'en' | 'fr') => (language === 'fr' ? 'fr-TN' : 'en-US');

const resolveDateFormat = (dateFormat?: DateFormat) => {
  if (!dateFormat) return { year: 'numeric', month: 'long', day: 'numeric' } as const;
  if (dateFormat.includes('DD/MM/YYYY')) return { year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  if (dateFormat.includes('MM/DD/YYYY')) return { year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  if (dateFormat.includes('YYYY-MM-DD')) return { year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  return { year: 'numeric', month: 'long', day: 'numeric' } as const;
};

export const formatDate = (dateString: string, options: FormatOptions): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(localeFor(options.language), resolveDateFormat(options.dateFormat));
};

export const formatTime = (timeString: string, options: FormatOptions): string => {
  if (!timeString) return '';
  const time = timeString.split('.')[0];
  const parts = time.split(':');
  if (parts.length < 2) return timeString;
  const hours = parts[0];
  const minutes = parts[1];
  if (options.timeFormat === '24h' || options.language === 'fr') {
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatDateFromSettings = (dateString: string, settings: Settings | null, language: 'en' | 'fr'): string =>
  formatDate(dateString, {
    dateFormat: settings?.display_date_format,
    timeFormat: settings?.display_time_format as TimeFormat,
    language,
  });

export const formatTimeFromSettings = (timeString: string, settings: Settings | null, language: 'en' | 'fr'): string =>
  formatTime(timeString, {
    dateFormat: settings?.display_date_format,
    timeFormat: settings?.display_time_format as TimeFormat,
    language,
  });
