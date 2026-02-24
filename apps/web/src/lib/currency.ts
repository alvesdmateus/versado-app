const LOCALE_CURRENCY_MAP: Record<string, string> = {
  "pt-BR": "brl",
  "en-US": "usd",
  "en-GB": "gbp",
  "es-MX": "mxn",
  "es-AR": "ars",
  "ja-JP": "jpy",
  "en-AU": "aud",
  "en-CA": "cad",
  "de-DE": "eur",
  "fr-FR": "eur",
  "es-ES": "eur",
  "it-IT": "eur",
};

export function getCurrencyFromLocale(): string {
  const locale = navigator.language;
  return LOCALE_CURRENCY_MAP[locale] ?? "usd";
}

export function formatPrice(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(unitAmount / 100);
}
