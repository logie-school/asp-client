import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarButtonProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  id: string;
}

export function SidebarButton({ children, active, onClick, id }: SidebarButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip disableHoverableContent>
        <TooltipTrigger className="w-[56px] h-[56px] flex items-center justify-center relative" asChild>
          <button
            className="w-[56px] h-[56px] flex items-center justify-center relative hover group"
            onClick={onClick}
          >
            <div
              className={
                active
                  ? "indicator h-5 w-[3px] absolute bg-foreground left-0 rounded-full transition-all"
                  : "indicator h-1 w-[3px] absolute bg-white/0 left-0 rounded-full group-hover:bg-foreground/50 transition-all group-hover:h-3"
              }
            ></div>
            <div className={active ? "opacity-100 transition-all" : "opacity-50 transition-all"}>
              {children}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={-10} className="select-none pointer-events-none capitalize">
          <p>{id}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}