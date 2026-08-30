import { createContext, useContext } from 'react';

export type Locale = 'en' | 'ja';
export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';
export const PreferencesContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; theme: Theme; themePreference: ThemePreference; setThemePreference: (theme: ThemePreference) => void } | null>(null);
export function usePreferences() { const value = useContext(PreferencesContext); if (!value) throw new Error('PreferencesContext is missing'); return value; }
export function text(locale: Locale, en: string, ja: string) { return locale === 'ja' ? ja : en; }
export function readStoredPreference(key: 'locale' | 'theme'): string | null { try { return localStorage.getItem(key); } catch { return null; } }
export function savePreference(key: 'locale' | 'theme', value: string): void { try { localStorage.setItem(key, value); } catch { /* Storage can be unavailable in privacy-restricted contexts. */ } }
