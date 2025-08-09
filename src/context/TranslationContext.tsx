import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enTranslations from '../i18n/locales/en.json';
import frTranslations from '../i18n/locales/fr.json';
import arTranslations from '../i18n/locales/ar.json';

type Translations = typeof enTranslations;
type Language = 'en' | 'fr' | 'ar';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, params?: Record<string, string>) => string;
}

const translations: Record<Language, Translations> = {
  en: enTranslations,
  fr: frTranslations,
  ar: arTranslations,
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language') as Language;
    if (savedLanguage && ['en', 'fr', 'ar'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Wrapper for setLanguage that also persists to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);

    // Apply RTL/LTR direction for Arabic
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
  };

  // Apply direction on language change
  useEffect(() => {
    if (language === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', language);
    }
  }, [language]);

  const t = (key: keyof Translations, params?: Record<string, string>): string => {
    let translation = translations[language][key] || translations.en[key] || key;

    // Replace parameters in translation string
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, value);
      });
    }

    return translation;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
