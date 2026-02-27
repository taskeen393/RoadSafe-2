// context/ThemeContext.tsx — Centralized Light/Dark Theme System
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ─── Color Palettes ────────────────────────────────────────
const LIGHT = {
    bg: '#F4F7F4',
    card: '#FFFFFF',
    darkGreen: '#1A4D2E',
    midGreen: '#2D7A4D',
    lightGreen: '#E8F5ED',
    text: '#1A1A1A',
    sub: '#6B7280',
    border: '#D1E8D9',
    inputBg: '#F9FBFA',
    red: '#EF4444',
    overlay: 'rgba(0,0,0,0.5)',
    modalBg: '#FFFFFF',
    divider: '#F3F4F6',
    chipBg: '#F3F4F6',

    // Gradient constants
    gradientHero: ['#1A4D2E', '#2D7A4D'] as readonly [string, string],

    // Specific tokens
    tabBarBg: '#FFFFFF',
    tabBarActive: '#1A4D2E',
    tabBarInactive: '#9CA3AF',
    tabBarShadow: '#1A4D2E',
    statusBar: 'dark-content' as const,
};

const DARK = {
    bg: '#121212',
    card: '#1E1E1E',
    darkGreen: '#2D7A4D',
    midGreen: '#4CAF50',
    lightGreen: '#1B3A2A',
    text: '#E8E8E8',
    sub: '#9CA3AF',
    border: '#2A3A30',
    inputBg: '#1A1A1A',
    red: '#EF4444',
    overlay: 'rgba(0,0,0,0.7)',
    modalBg: '#1E1E1E',
    divider: '#2A2A2A',
    chipBg: '#2A2A2A',

    // Gradient constants
    gradientHero: ['#0D3320', '#1A4D2E'] as readonly [string, string],

    // Specific tokens
    tabBarBg: '#1A1A1A',
    tabBarActive: '#4CAF50',
    tabBarInactive: '#6B7280',
    tabBarShadow: '#000000',
    statusBar: 'light-content' as const,
};

export type ThemeColors = typeof LIGHT;

// ─── Context ───────────────────────────────────────────────
interface ThemeContextValue {
    colors: ThemeColors;
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    colors: LIGHT,
    isDark: false,
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = 'roadsafe_theme';

// ─── Provider ──────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false);

    // Load saved preference
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved === 'dark') setIsDark(true);
            } catch {
                // silent
            }
        })();
    }, []);

    const toggleTheme = useCallback(async () => {
        const newValue = !isDark;
        setIsDark(newValue);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, newValue ? 'dark' : 'light');
        } catch {
            // silent
        }
    }, [isDark]);

    const colors = isDark ? DARK : LIGHT;

    return (
        <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
