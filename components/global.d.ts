declare global {
    interface Window {
        api: {
            send: (channel: string, ...args: any[]) => void;
            receive: (channel: string, func: (...args: any[]) => void) => void;
            removeListener: (channel: string, func: (...args: any[]) => void) => void;
            invoke: (channel: string, ...args: any[]) => Promise<any>;
            openFile?: (filePath: string) => void; // <-- Add this line
        };
        editor: any;
        loadFileContent: (filePath: string) => void;
    }
}

export {};