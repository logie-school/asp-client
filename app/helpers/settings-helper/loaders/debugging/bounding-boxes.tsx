'use client'

import { useEffect } from 'react'
import { useSettings } from '@/app/contexts/settings-context'

export default function LoaderBoundingBoxes() {
    const { settings } = useSettings();
    const boundingBoxesEnabled = settings?.debugging?.boundingBoxes || false;

    useEffect(() => {
        let cleanup: (() => void) | undefined

        if (boundingBoxesEnabled) {
            cleanup = applyBoundingBoxOutline()
        }

        return () => {
            if (cleanup) cleanup()
        }
    }, [boundingBoxesEnabled])

    const applyBoundingBoxOutline = () => {
        const style = document.createElement('style')
        style.innerHTML = `
        * {
            outline: 1px solid red !important;
        }
        `
        document.head.appendChild(style)
        return () => {
            document.head.removeChild(style)
        }
    }

    return null
}