import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun } from 'lucide-react';

const SettingsBar = () => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'tr' : 'en';
    setCurrentLang(nextLang);
    i18n.changeLanguage(nextLang);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center bg-gray-100/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-300 dark:border-gray-600 px-3 py-2">
      {/* Language Selector */}
      <button
        onClick={toggleLanguage}
        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
        title={currentLanguage.name}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
        title={isDarkMode ? 'Açık moda geç' : 'Karanlık moda geç'}
      >
        {isDarkMode ? (
          <Sun className="w-4 h-4 text-yellow-500" />
        ) : (
          <Moon className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  );
};

export default SettingsBar;
