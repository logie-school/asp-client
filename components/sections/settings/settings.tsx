import React, { useState } from "react";
import { AppSidebar } from "@/components/sections/settings/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "./components/sidebar";
import { SectionWrapper } from "../section-wrapper";
import SettingsAppearance from "./components/settings-sections/appearance/appearance";
import SettingsDownloads from "./components/settings-sections/downloads/downloads";
// import SettingsPorts from "./components/settings-sections/ports/ports";
import SettingsDebugging from "./components/settings-sections/debugging/debugging";
import SettingsBuildInfo from "./components/settings-sections/build-info/build-info";
import SoundpadExtension from "./components/settings-sections/soundpad-extension/soundpad-extension"; 
import SettingsReset from "./components/settings-sections/reset-settings/reset-settings";
import { AnimatePresence, motion } from "framer-motion";


interface SettingsProps {
  active?: boolean;
}

const sectionComponents = {
  appearance: SettingsAppearance,
  downloads: SettingsDownloads,
  // ports: SettingsPorts,
  debugging: SettingsDebugging,
  buildInfo: SettingsBuildInfo,
  soundpadExtension: SoundpadExtension,
  resetSettings: SettingsReset,
};

export type SectionKey = keyof typeof sectionComponents;

export function Settings({ active }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>("appearance");
  const ActiveSectionComponent = sectionComponents[activeSection];

  return (
    <div className="w-full h-full flex flex-row absolute">
      <SectionWrapper active={active}>
        <SidebarProvider>
          <AppSidebar
            className="h-[calc(100svh-32px)]"
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 pl-4 ">
              <div className="h-full w-full border-l border-t rounded-tl-xl relative overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.1, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <ActiveSectionComponent />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SectionWrapper>
    </div>
  );
}