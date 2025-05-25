'use client'

import { useEffect } from 'react'
import { useSettings } from '@/app/contexts/settings-context'
import { useTheme } from 'next-themes'

export default function LoaderTheme() {
    const { settings } = useSettings();
    const { setTheme } = useTheme();

    useEffect(() => {
        // Default to "system" if not set
        const theme = settings?.appearance?.theme || "system";
        setTheme(theme);
    }, [settings?.appearance?.theme, setTheme]);

    return null;
}