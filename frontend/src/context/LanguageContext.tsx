import React, { createContext, useContext, useState } from 'react';
import { translations, type Language, type TranslationKey } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  currency: string;
  setCurrency: (currency: string) => void;
  formatAmount: (amount: number | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-lang');
    return (saved as Language) || 'vi';
  });

  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('app-currency') || 'đ';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-lang', lang);
    window.dispatchEvent(new Event('language_changed'));
  };

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
    localStorage.setItem('app-currency', curr);
    window.dispatchEvent(new Event('currency_changed'));
  };

  const t = (key: TranslationKey): string => {
    const dictionary = translations[language] as Record<TranslationKey, string>;
    return dictionary[key] || key;
  };

  const formatAmount = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `0 ${currency}`;
    const formatted = num.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
    return `${formatted} ${currency}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, currency, setCurrency, formatAmount }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
