'use client'

import { useEffect, useRef } from 'react'
import { useSettings } from '@/app/contexts/settings-context'
import { useTheme } from 'next-themes'

export default function LoaderTheme() {
    const { settings, updateSettings } = useSettings();
    const { theme, setTheme } = useTheme();
    const isInitialMount = useRef(true);

    // Apply theme from settings only on initial mount
    useEffect(() => {
        if (isInitialMount.current) {
            const settingsTheme = settings?.appearance?.theme || "system";
            if (theme !== settingsTheme) {
                setTheme(settingsTheme);
            }
            isInitialMount.current = false;
        }
    }, [settings?.appearance?.theme]);

    // Sync theme changes back to settings, but only if it's different
    useEffect(() => {
        if (!isInitialMount.current && theme && theme !== settings?.appearance?.theme) {
            updateSettings('appearance', {
                ...settings?.appearance,
                theme
            });
        }
    }, [theme]);

    return null;
}