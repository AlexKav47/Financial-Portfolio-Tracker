const KEY = "fpt_settings_v1";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { currencySymbol: "€", baseCurrency: "EUR" };
    const parsed = JSON.parse(raw);
    return {
      currencySymbol: parsed.currencySymbol || "€",
      baseCurrency: parsed.baseCurrency || "EUR",
    };
  } catch {
    return { currencySymbol: "€", baseCurrency: "EUR" };
  }
}

export function saveSettings(next) {
  const current = loadSettings();
  const merged = { ...current, ...next };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}