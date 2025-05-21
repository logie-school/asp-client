import { ReactNode } from "react";
import './section-wrapper.css';

interface SectionWrapperProps {
    children: ReactNode;
    className?: string;
    active?: boolean;
}

export function SectionWrapper({ children, className, active }: SectionWrapperProps) {
    // console.log("SectionWrapper active:", active);
    return (
        <div
            className={`w-full h-full flex transition-all ${
                active ? "active-section" : "inactive-section"
            } ${className || ""}`}
        >
            <div className="w-full h-full flex">
                {children}
            </div>
        </div>
    );
}