"use client";

import { SettingsIcon, DownloadIcon, GalleryVerticalEndIcon } from "lucide-react";
import { SidebarButton } from "@/components/sidebar-button";
import { FileCode2 } from "lucide-react";

interface SidebarProps {
  activeSection: string | null;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <div className="w-[56px] flex flex-col justify-between items-center" style={{ height: "calc(100svh - 32px)" }}>
      <div>
        <SidebarButton
          id="download"
          active={activeSection === "download"}
          onClick={() => onSectionChange("download")}
        >
          <DownloadIcon />
        </SidebarButton>

        <SidebarButton
          id="gallery"
          active={activeSection === "gallery"}
          onClick={() => onSectionChange("gallery")}
        >
          <GalleryVerticalEndIcon />
        </SidebarButton>
      </div>

      <SidebarButton
        id="settings"
        active={activeSection === "settings"}
        onClick={() => onSectionChange("settings")}
      >
        <SettingsIcon />
      </SidebarButton>
    </div>
  );
}