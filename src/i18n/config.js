/**
 * i18n Configuration
 * 
 * Internationalization setup for McCarthy app
 * Currently English-only for MVP, but ready for V3 translations
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      // V3: Add more languages here
      // fr: { translation: require('./locales/fr.json') },
      // es: { translation: require('./locales/es.json') },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    compatibilityJSON: 'v3',
  });

export default i18n;

