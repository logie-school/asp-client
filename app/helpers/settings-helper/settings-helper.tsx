'use client'

import { useEffect } from 'react'
import { useSettings } from '@/app/contexts/settings-context'
import LoaderBoundingBoxes from './loaders/debugging/bounding-boxes'
import LoaderTheme from "./loaders/appearance/theme";

export default function SettingsLoader() {
    const { settings } = useSettings();

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Settings updated:', settings);
        }
    }, [settings]);

    return (
        <>
            <LoaderBoundingBoxes />
            <LoaderTheme />
        </>
    )
}