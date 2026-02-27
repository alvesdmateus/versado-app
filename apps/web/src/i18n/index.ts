import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enOnboarding from "./locales/en/onboarding.json";
import enProfile from "./locales/en/profile.json";
import ptCommon from "./locales/pt/common.json";
import ptAuth from "./locales/pt/auth.json";
import ptOnboarding from "./locales/pt/onboarding.json";
import ptProfile from "./locales/pt/profile.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, onboarding: enOnboarding, profile: enProfile },
      pt: { common: ptCommon, auth: ptAuth, onboarding: ptOnboarding, profile: ptProfile },
    },
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "auth", "onboarding", "profile"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
