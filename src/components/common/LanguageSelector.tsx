import React, { useState } from 'react';
import { useTranslation } from '../../context/TranslationContext';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇹🇳' },
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    languages.find(lang => lang.code === language) || languages[0]
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLanguage: Language) => {
    setSelectedLanguage(newLanguage);
    setIsOpen(false);
    setLanguage(newLanguage.code as 'en' | 'fr' | 'ar');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 w-full"
      >
        <span className="text-lg">{selectedLanguage.flag}</span>
        <span className="text-sm text-gray-600">{selectedLanguage.name}</span>
        <span className="material-icons text-sm text-gray-400 ml-auto">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`
                flex items-center space-x-2 p-2 w-full text-left hover:bg-gray-50 transition-colors duration-150
                ${selectedLanguage.code === language.code ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}
                ${language === languages[0] ? 'rounded-t-lg' : ''}
                ${language === languages[languages.length - 1] ? 'rounded-b-lg' : ''}
              `}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm">{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
