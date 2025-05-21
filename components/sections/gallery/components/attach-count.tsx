interface AttachCountProps {
    attached?: boolean;
    attachCount?: number;
}

export function AttachCount({ attached, attachCount }: AttachCountProps) {
    if (attached) {
        return (
            <div className="flex flex-row items-center justify-center gap-2 select-none">
                <div className="h-1.5 w-1.5 bg-green-400 rounded-full"></div>
                <div className="text-center text-sm">
                    attached to <span className="font-medium">{attachCount}</span> clients
                </div>
            </div>
        );
    } else {
        return (
            <div className="flex flex-row items-center justify-center gap-2 select-none">
                <div className="h-1.5 w-1.5 bg-red-400 rounded-full"></div>
                <div className="text-center text-sm">
                    not attached to any clients
                </div>
            </div>
        );
    }
}