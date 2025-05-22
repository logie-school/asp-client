import React from "react";

interface SettingsSectionHeaderProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

export function SettingsSectionHeader({ title, description, icon }: SettingsSectionHeaderProps) {
    return (
        <div className="w-full pb-2 border-b flex flex-row items-center justify-between">
            <div className="flex flex-col">
                <h1 className="font-medium text-xl">{title}</h1>
                <span className="opacity-50 text-sm">{description}</span>
            </div>
            <div className="aspect-square h-[65px] flex items-center justify-center">
                {icon}
            </div>
        </div>
    );
}