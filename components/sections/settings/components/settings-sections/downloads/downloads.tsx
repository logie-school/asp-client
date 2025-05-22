import { DownloadIcon, FolderSearchIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function SettingsDownloads() {
  const [downloadPath, setDownloadPath] = useState("~/Downloads/asp-downloads");

  // store states in localstorage in a structured style
  const storeSettings = () => {
    const existingSettings = localStorage.getItem("settings");
    const settings = existingSettings ? JSON.parse(existingSettings) : {};
    
    settings.downloads = {
      downloadPath,
    };

    localStorage.setItem("settings", JSON.stringify(settings));
  };

  // load settings from localstorage
  const loadSettings = () => {
    const settings = localStorage.getItem("settings");
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      if (parsedSettings.downloads) {
        setDownloadPath(parsedSettings.downloads.downloadPath ?? "");
      }
    }
  };

  // load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // save settings when values change
  useEffect(() => {
    storeSettings();
  }, [downloadPath]);

  return (
    <div className="h-full w-full p-4">
      <SettingsSectionHeader 
        title="Downloads"
        description="Manage where media is downloaded to and default configuration."
        icon={<DownloadIcon className="opacity-50" />}
      />

       <div className="flex flex-col gap-4 mt-4 h-full overflow-y-auto">        
        <SettingsPrefWrapper
          title="Download Path"
          description="Set the default path for downloaded media."
        >
          <Input
            className="w-full"
            placeholder="path"
          />
        </SettingsPrefWrapper>

        <SettingsPrefWrapper
          title="Open Download Folder"
          description="Open the folder where media is downloaded to."
        >
          <Button variant={'ghost'}>
            <FolderSearchIcon />
          </Button>
        </SettingsPrefWrapper>
      </div>
    </div>
  );
}