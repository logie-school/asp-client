"use client"

import { Minus, Copy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge"
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

type CurlCodeBlockProps = {
    code: string;
};

import './editor.css';

export function Editor() {
    const handleMinimize = () => {
        window.api.send('minimizeApp');
    };

    const handleMaximize = () => {
        window.api.send('maximizeApp');
    };

    const handleClose = () => {
        window.api.send('closeApp');
    };

    return (
        <div className="w-full fixed bottom-0 left-0 z-50" style={{ height: "calc(100svh - 32px)" }}>
            <div className="editor-wrapper flex flex-row w-full fixed bottom-0 z-52 p-4 gap-4" style={{ height: "calc(100svh - 32px)" }}>
                <div className="editor-params border border-input p-4 rounded-md shadow-sm h-full overflow-y-auto min-h-0 bg-black/40 w-[300px] flex flex-col">
                    test
                </div>
                <div className="editor-main border border-input p-4 rounded-md shadow-sm bg h-full overflow-y-auto min-h-0 bg-black/40 w-full flex flex-col">
                    <SyntaxHighlighter language="bash" style={dark}>
                        curl -X GET "https://httpbin.org/basic-auth/test/testpwd" -H "accept: application/json"
                    </SyntaxHighlighter>
                </div>
            </div>
            <div className="w-full fixed bottom-0 backdrop-blur-lg z-51" style={{ height: "calc(100svh - 32px)" }}></div>
        </div>
    );
}