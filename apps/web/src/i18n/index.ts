import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enOnboarding from "./locales/en/onboarding.json";
import enProfile from "./locales/en/profile.json";
import enDecks from "./locales/en/decks.json";
import enStudy from "./locales/en/study.json";
import enHome from "./locales/en/home.json";
import enMarketplace from "./locales/en/marketplace.json";
import enBilling from "./locales/en/billing.json";
import enErrors from "./locales/en/errors.json";
import ptCommon from "./locales/pt/common.json";
import ptAuth from "./locales/pt/auth.json";
import ptOnboarding from "./locales/pt/onboarding.json";
import ptProfile from "./locales/pt/profile.json";
import ptDecks from "./locales/pt/decks.json";
import ptStudy from "./locales/pt/study.json";
import ptHome from "./locales/pt/home.json";
import ptMarketplace from "./locales/pt/marketplace.json";
import ptBilling from "./locales/pt/billing.json";
import ptErrors from "./locales/pt/errors.json";
import esCommon from "./locales/es/common.json";
import esAuth from "./locales/es/auth.json";
import esOnboarding from "./locales/es/onboarding.json";
import esProfile from "./locales/es/profile.json";
import esDecks from "./locales/es/decks.json";
import esStudy from "./locales/es/study.json";
import esHome from "./locales/es/home.json";
import esMarketplace from "./locales/es/marketplace.json";
import esBilling from "./locales/es/billing.json";
import esErrors from "./locales/es/errors.json";
import frCommon from "./locales/fr/common.json";
import frAuth from "./locales/fr/auth.json";
import frOnboarding from "./locales/fr/onboarding.json";
import frProfile from "./locales/fr/profile.json";
import frDecks from "./locales/fr/decks.json";
import frStudy from "./locales/fr/study.json";
import frHome from "./locales/fr/home.json";
import frMarketplace from "./locales/fr/marketplace.json";
import frBilling from "./locales/fr/billing.json";
import frErrors from "./locales/fr/errors.json";
import deCommon from "./locales/de/common.json";
import deAuth from "./locales/de/auth.json";
import deOnboarding from "./locales/de/onboarding.json";
import deProfile from "./locales/de/profile.json";
import deDecks from "./locales/de/decks.json";
import deStudy from "./locales/de/study.json";
import deHome from "./locales/de/home.json";
import deMarketplace from "./locales/de/marketplace.json";
import deBilling from "./locales/de/billing.json";
import deErrors from "./locales/de/errors.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, onboarding: enOnboarding, profile: enProfile, decks: enDecks, study: enStudy, home: enHome, marketplace: enMarketplace, billing: enBilling, errors: enErrors },
      pt: { common: ptCommon, auth: ptAuth, onboarding: ptOnboarding, profile: ptProfile, decks: ptDecks, study: ptStudy, home: ptHome, marketplace: ptMarketplace, billing: ptBilling, errors: ptErrors },
      es: { common: esCommon, auth: esAuth, onboarding: esOnboarding, profile: esProfile, decks: esDecks, study: esStudy, home: esHome, marketplace: esMarketplace, billing: esBilling, errors: esErrors },
      fr: { common: frCommon, auth: frAuth, onboarding: frOnboarding, profile: frProfile, decks: frDecks, study: frStudy, home: frHome, marketplace: frMarketplace, billing: frBilling, errors: frErrors },
      de: { common: deCommon, auth: deAuth, onboarding: deOnboarding, profile: deProfile, decks: deDecks, study: deStudy, home: deHome, marketplace: deMarketplace, billing: deBilling, errors: deErrors },
    },
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "auth", "onboarding", "profile", "decks", "study", "home", "marketplace", "billing", "errors"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
