interface SettingsPrefWrapperProps {
    children: React.ReactNode;
    className?: string;
    title: string;
    description: string;
}

export default function SettingsPrefWrapper({children, className, title, description}: SettingsPrefWrapperProps) {
    return (
        <div
            className={`border-1 border-input bg-input/30 w-full p-4 flex transition-all rounded-[10px] ${className || ""}`}
        >
            <div className="w-full flex flex-row gap-4 items-center justify-between">
                <div className="prefs-title-wrapper">
                    <div className="prefs-item-title !font-medium">{title}</div>
                    <div className="prefs-item-desc !w-full !max-w-[300px]">{description}</div>
                </div>
                {children}
            </div>
        </div>
    );
}