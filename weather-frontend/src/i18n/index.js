import { en } from './locales/en.js';
import { ptBR } from './locales/pt-BR.js';

export const locales = {
    'en': en,
    'pt-BR': ptBR
};

export const defaultLocale = 'pt-BR';

export const detectBrowserLanguage = () => {
    const browserLang = navigator.language || navigator.languages[0];

    const langMap = {
        'en': 'en',
        'en-US': 'en',
        'en-GB': 'en',
        'pt': 'pt-BR',
        'pt-BR': 'pt-BR',
        'pt-PT': 'pt-BR'
    };

    return langMap[browserLang] || defaultLocale;
};

export const getNestedTranslation = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};