/**
 * Internationalization Service
 * Multi-language support with RTL for Arabic
 */

export type Language = "en" | "ar" | "fr" | "es";

export interface Translation {
  [key: string]: string | Translation;
}

export class I18nService {
  private currentLanguage: Language = "en";
  private translations: Map<Language, Translation> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Initialize translations
   */
  async initialize(language: Language = "en"): Promise<void> {
    this.currentLanguage = language;

    // Load translations (in production, load from files)
    const enTranslations: Translation = {
      common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        search: "Search",
        filter: "Filter",
      },
      chemical: {
        name: "Chemical Name",
        casNumber: "CAS Number",
        hazard: "Hazard",
      },
    };

    const arTranslations: Translation = {
      common: {
        save: "حفظ",
        cancel: "إلغاء",
        delete: "حذف",
        edit: "تعديل",
        search: "بحث",
        filter: "تصفية",
      },
      chemical: {
        name: "اسم المادة الكيميائية",
        casNumber: "رقم CAS",
        hazard: "خطر",
      },
    };

    this.translations.set("en", enTranslations);
    this.translations.set("ar", arTranslations);
  }

  /**
   * Set language
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language;
    this.notifyListeners();

    // Update document direction for RTL
    if (typeof document !== "undefined") {
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }

  /**
   * Get current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Translate key
   */
  t(key: string, params?: Record<string, string>): string {
    const translation = this.getTranslation(key);
    if (!translation) return key;

    // Replace parameters
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, value]) => str.replace(`{{${param}}}`, value),
        translation,
      );
    }

    return translation;
  }

  /**
   * Get translation value
   */
  private getTranslation(key: string): string | null {
    const translations = this.translations.get(this.currentLanguage);
    if (!translations) return null;

    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return typeof value === "string" ? value : null;
  }

  /**
   * Subscribe to language changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error("Error in i18n listener:", error);
      }
    });
  }

  /**
   * Check if RTL
   */
  isRTL(): boolean {
    return this.currentLanguage === "ar";
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): Array<{
    code: Language;
    name: string;
    nativeName: string;
  }> {
    return [
      { code: "en", name: "English", nativeName: "English" },
      { code: "ar", name: "Arabic", nativeName: "العربية" },
      { code: "fr", name: "French", nativeName: "Français" },
      { code: "es", name: "Spanish", nativeName: "Español" },
    ];
  }
}

export const i18nService = new I18nService();

// Initialize on load
if (typeof window !== "undefined") {
  const savedLanguage = localStorage.getItem("language") as Language;
  if (savedLanguage) {
    i18nService.initialize(savedLanguage);
  } else {
    i18nService.initialize("en");
  }
}
