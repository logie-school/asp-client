import { AppSidebar } from "@/components/sections/settings/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "./components/sidebar";
import { SectionWrapper } from "../section-wrapper";

interface SettingsProps {
  active?: boolean;
}

export function Settings({ active }: SettingsProps) {
  return (
    <div className="w-full h-full flex flex-row absolute">
      <SectionWrapper active={active}>
        <SidebarProvider>
          <AppSidebar className="h-[calc(100svh-32px)]" />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 pl-4 ">
              <div className="h-full w-full border-l border-t rounded-tl-xl"></div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SectionWrapper>
    </div>
  );
}