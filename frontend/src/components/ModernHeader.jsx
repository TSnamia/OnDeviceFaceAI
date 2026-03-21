import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, User, Globe, Moon, Sun, ChevronDown, Bell, LogOut, Search } from 'lucide-react';
import UploadModal from './UploadModal';

const ModernHeader = () => {
  const { t, i18n } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Load dark mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setShowDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('is_authenticated');
    window.location.reload();
  };

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white dark:bg-gray-950 dark:border-gray-800">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-6">
        <div className="text-xl font-bold text-blue-600">{t('app.title')}</div>

        {/* SEARCH */}
        <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl w-[400px]">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        {/* PRIMARY ACTION */}
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow"
        >
          <Upload size={18} />
          <span>{t('navigation.import')}</span>
        </button>

        {/* NOTIFICATION */}
        <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bell size={18} />
        </button>

        {/* THEME TOGGLE */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* USER MENU */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <User size={18} />
            <ChevronDown size={16} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 shadow-lg rounded-xl p-2 border dark:border-gray-700 z-60">
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                Profil
              </button>

              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t('settings.language')}
                </p>
                <div className="space-y-1">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => changeLanguage(language.code)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left transition-colors ${
                        i18n.language === language.code
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{language.flag}</span>
                        <span className="text-sm">{language.name}</span>
                      </span>
                      {i18n.language === language.code && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t my-2 dark:border-gray-700"></div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={16} />
                <span>{t('auth.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </>
  );
};

export default ModernHeader;
