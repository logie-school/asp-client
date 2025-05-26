"use client";

import { useEffect, useState } from "react";
import { Minus, Copy, X, Square } from "lucide-react";
import { useSettings } from "@/app/contexts/settings-context";
import './toolbar.css';

interface WindowState {
    isMaximized: boolean;
}

export function Toolbar() {
    const [isMaximized, setIsMaximized] = useState(false);
    const { settings } = useSettings();
    const boundingBoxesEnabled = settings?.debugging?.boundingBoxes || false;

    const boundingBoxMessage = "Bounding boxes are enabled, you can disable in settings > debugging > bounding boxes";

    const handleMinimize = () => {
        window.api.send('minimizeApp');
    };

    const handleMaximize = () => {
        window.api.send('maximizeApp');
    };

    const handleClose = () => {
        window.api.send('closeApp');
    };

    useEffect(() => {
        window.api.receive('windowStateChange', (state: WindowState) => {
            setIsMaximized(state.isMaximized);
        });
    }, []);

    return (
        <div className="w-full">
            <nav className="flex items-center flex-row relative toolbar">
                <div className="title-wrapper flex flex-row justify-center shrink-0 items-center">
                    <span className="opacity-50 w-[56px] text-center text-[11px] select-none">asp</span>
                </div>
                <div style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} className="w-full h-[32px] flex items-center justify-center select-none">
                    {boundingBoxesEnabled && (
                        <span className="text-sm text-[#0a0a0a] px-1 bg-[red] font-bold animate-pulse rounded">
                            {boundingBoxMessage}
                        </span>
                    )}
                </div>
                <div className="flex flex-row">
                    <button className="toolbar-button hover:bg-foreground/10 select-none outline-none" id="minimizeButton" onClick={handleMinimize}>
                        <Minus size={16} />
                    </button>
                    <button className="toolbar-button hover:bg-foreground/10 select-none outline-none" id="maximizeButton" onClick={handleMaximize}>
                        {isMaximized ? <Copy size={13} style={{ transform: "scaleX(-100%)" }} /> : <Square size={13} />}
                    </button>
                    <button className="toolbar-button select-none outline-none" id="closeButton" onClick={handleClose}>
                        <X size={16} />
                    </button>
                </div>
            </nav>
        </div>
    );
}