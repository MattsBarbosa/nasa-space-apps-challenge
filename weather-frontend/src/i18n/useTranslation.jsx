import React, { useState, useEffect, createContext, useContext } from 'react';
import { locales, defaultLocale, detectBrowserLanguage, getNestedTranslation } from './index.js';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState(() => {
        const saved = localStorage.getItem('preferred-language');
        return saved || detectBrowserLanguage();
    });

    useEffect(() => {
        localStorage.setItem('preferred-language', currentLanguage);
    }, [currentLanguage]);

    const changeLanguage = (lang) => {
        if (locales[lang]) {
            setCurrentLanguage(lang);
        }
    };

    const t = (key, fallback = key) => {
        const translation = getNestedTranslation(locales[currentLanguage], key);
        return translation || fallback;
    };

    const value = {
        currentLanguage,
        changeLanguage,
        t,
        availableLanguages: Object.keys(locales)
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};