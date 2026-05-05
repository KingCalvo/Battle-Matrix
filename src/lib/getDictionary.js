const dictionaries = {
  es: () => import("@/messages/es.json").then((m) => m.default),
  en: () => import("@/messages/en.json").then((m) => m.default),
};

export async function getDictionary(locale) {
  return dictionaries[locale]?.() || dictionaries.es();
}
