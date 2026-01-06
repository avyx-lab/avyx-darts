import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==========================================
// DARTS SETTINGS STORE
// ==========================================

export type InputMode = 'round' | 'dart';
export type LayoutMode = 'auto' | 'stacked' | 'side-by-side';
export type Language = 'en' | 'de';

interface DartsSettingsStore {
    // Input Settings
    inputMode: InputMode;

    // Display Settings
    showDynamicCheckout: boolean;
    layoutMode: LayoutMode;

    // Language
    language: Language;

    // Actions
    setInputMode: (mode: InputMode) => void;
    setShowDynamicCheckout: (show: boolean) => void;
    setLayoutMode: (mode: LayoutMode) => void;
    setLanguage: (lang: Language) => void;
}

export const useDartsSettingsStore = create<DartsSettingsStore>()(
    persist(
        (set) => ({
            inputMode: 'round',
            showDynamicCheckout: true,
            layoutMode: 'auto',
            language: 'en',

            setInputMode: (mode) => set({ inputMode: mode }),
            setShowDynamicCheckout: (show) => set({ showDynamicCheckout: show }),
            setLayoutMode: (mode) => set({ layoutMode: mode }),
            setLanguage: (lang) => set({ language: lang }),
        }),
        {
            name: 'avyx-darts-settings',
        }
    )
);
