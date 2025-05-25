interface SettingsPrefWrapperProps {
    children: React.ReactNode;
    className?: string;
    title: string;
    description: string;
    extra?: React.ReactNode;
}

export default function SettingsPrefWrapper({children, className, title, description, extra}: SettingsPrefWrapperProps) {
    return (
        <div
            className={`border-1 border-input bg-input/30 w-full p-4 flex transition-all rounded-[10px] ${className || ""}`}
        >
            <div className="w-full flex flex-col gap-4 items-start">
                <div className="w-full flex flex-row gap-4 items-center justify-between">
                    <div className="prefs-title-wrapper">
                        <div className="prefs-item-title !font-medium !text-foreground">{title}</div>
                        <div className="prefs-item-desc !w-full !max-w-[300px] !text-foreground">{description}</div>
                    </div>
                    {children}
                </div>
                {extra}
            </div>
        </div>
    );
}