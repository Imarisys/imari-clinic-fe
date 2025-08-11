import React, { useState, useEffect } from 'react';

export const AppLoadingSpinner: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fr'>('en');

  // Alternate between languages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLanguage(prev => prev === 'en' ? 'fr' : 'en');
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const messages = {
    en: {
      main: "App Loading in Progress...",
      secondary: "This is a test environment. Please wait while we connect to the backend server.",
      tertiary: "If this takes too long, the backend server might be starting up."
    },
    fr: {
      main: "Chargement de l'Application...",
      secondary: "Ceci est un environnement de test. Veuillez patienter pendant que nous nous connectons au serveur.",
      tertiary: "Le serveur backend pourrait être en cours de démarrage."
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
      <div className="text-center">
        {/* Logo or App Name */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="material-icons-round text-white text-3xl">local_hospital</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-700">Imari Medical</h1>
        </div>

        {/* Spinner */}
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>

        {/* Loading Text with Language Alternation */}
        <div className="max-w-md mx-auto px-4 relative">
          {/* English Text */}
          <div className={`transition-opacity duration-1000 ${currentLanguage === 'en' ? 'opacity-100' : 'opacity-0'} ${currentLanguage === 'fr' ? 'absolute inset-0' : ''}`}>
            <p className="text-primary-600 text-xl font-bold mb-3">
              {messages.en.main}
            </p>
            <p className="text-primary-500 text-base">
              {messages.en.secondary}
            </p>
            <p className="text-primary-400 text-sm mt-2">
              {messages.en.tertiary}
            </p>
          </div>

          {/* French Text */}
          <div className={`transition-opacity duration-1000 ${currentLanguage === 'fr' ? 'opacity-100' : 'opacity-0'} ${currentLanguage === 'en' ? 'absolute inset-0' : ''}`}>
            <p className="text-primary-600 text-xl font-bold mb-3">
              {messages.fr.main}
            </p>
            <p className="text-primary-500 text-base">
              {messages.fr.secondary}
            </p>
            <p className="text-primary-400 text-sm mt-2">
              {messages.fr.tertiary}
            </p>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center mt-8 space-x-1">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};
