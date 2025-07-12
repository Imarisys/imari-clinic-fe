import React, { createContext, useContext, useState, ReactNode } from 'react';
import enTranslations from '../i18n/locales/en.json';
import frTranslations from '../i18n/locales/fr.json';

type Translations = typeof enTranslations;
type Language = 'en' | 'fr';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, params?: Record<string, string>) => string;
}

const translations: Record<Language, Translations> = {
  en: enTranslations,
  fr: frTranslations,
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

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
