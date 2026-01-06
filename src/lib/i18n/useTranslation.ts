import { useCallback } from 'react';
import { useDartsSettingsStore } from '../../stores/settingsStore';
import { translations, type TranslationKey } from './translations';

export function useTranslation() {
    const language = useDartsSettingsStore((s) => s.language);

    const t = useCallback((key: TranslationKey): string => {
        return translations[language]?.[key] || translations.en[key] || key;
    }, [language]);

    return { t, language };
}

// Re-export for convenience
export { translations } from './translations';
export type { TranslationKey, Language } from './translations';
