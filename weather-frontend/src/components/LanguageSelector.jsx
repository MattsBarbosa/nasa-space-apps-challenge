import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.jsx';

const LanguageSelector = () => {
    const { currentLanguage, changeLanguage, availableLanguages } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languageNames = {
        'en': 'English',
        'pt-BR': 'Português (BR)'
    };

    const languageFlags = {
        'en': '🇺🇸',
        'pt-BR': '🇧🇷'
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            return () => {
                document.removeEventListener('keydown', handleEscapeKey);
            };
        }
    }, [isOpen]);

    const handleToggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleLanguageChange = (lang) => {
        changeLanguage(lang);
        setIsOpen(false);
    };

    const handleKeyDown = (event, lang) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleLanguageChange(lang);
        }
    };

    return (
        <div className="language-selector" ref={dropdownRef}>
            <div className="language-selector__dropdown">
                <button
                    className="language-selector__trigger"
                    onClick={handleToggleDropdown}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-label="Selecionar idioma"
                >
                    <Globe size={16} />
                    <span className="language-selector__flag">
                        {languageFlags[currentLanguage]}
                    </span>
                    <span className="language-selector__name">
                        {languageNames[currentLanguage]}
                    </span>
                    <ChevronDown
                        size={14}
                        className={`language-selector__chevron ${isOpen ? 'language-selector__chevron--up' : ''}`}
                    />
                </button>

                {isOpen && (
                    <div
                        className="language-selector__menu"
                        role="listbox"
                        aria-label="Opções de idioma"
                    >
                        {availableLanguages.map((lang) => (
                            <button
                                key={lang}
                                className={`language-selector__option ${currentLanguage === lang ? 'language-selector__option--active' : ''
                                    }`}
                                onClick={() => handleLanguageChange(lang)}
                                onKeyDown={(e) => handleKeyDown(e, lang)}
                                role="option"
                                aria-selected={currentLanguage === lang}
                                tabIndex={0}
                            >
                                <span className="language-selector__option-flag">
                                    {languageFlags[lang]}
                                </span>
                                <span className="language-selector__option-name">
                                    {languageNames[lang]}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LanguageSelector;