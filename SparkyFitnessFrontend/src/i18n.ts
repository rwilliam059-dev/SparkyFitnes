import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import frOverrides from './i18n/frOverrides';
import frMobileOverrides from './i18n/frMobileOverrides';
import frPass2Overrides from './i18n/frPass2Overrides';
import { getSupportedLanguages } from './utils/languageUtils';

i18n.use(HttpApi).use(LanguageDetector).use(initReactI18next);

void i18n
  .init({
    supportedLngs: getSupportedLanguages(),
    fallbackLng: 'en',
    detection: {
      order: [
        'localStorage',
        'querystring',
        'cookie',
        'sessionStorage',
        'navigator',
        'htmlTag',
      ],
      caches: ['localStorage', 'cookie'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    react: {
      useSuspense: false,
    },
  })
  .then(async () => {
    i18n.addResourceBundle('fr', 'translation', frOverrides, true, true);
    i18n.addResourceBundle('fr', 'translation', frMobileOverrides, true, true);
    i18n.addResourceBundle('fr', 'translation', frPass2Overrides, true, true);

    // Resource bundles are added after initialization. Re-applying the active
    // language notifies React subscribers so freshly added overrides are shown
    // immediately instead of waiting for a reload or another language change.
    await i18n.changeLanguage(i18n.language);
  });

export default i18n;
