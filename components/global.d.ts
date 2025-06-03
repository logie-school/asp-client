declare global {
    interface Window {
        api: {
            send: (channel: string, ...args: any[]) => void;
            receive: (channel: string, func: (...args: any[]) => void) => void;
            removeListener: (channel: string, func: (...args: any[]) => void) => void;
            invoke: (channel: string, ...args: any[]) => Promise<any>;
            openFile?: (filePath: string) => void;
            path?: {
                dirname: (p: string) => string;
                join: (...paths: string[]) => string;
                basename: (p: string, ext?: string) => string;
            };
        };
        editor: any;
        loadFileContent: (filePath: string) => void;
    }
}

export {};