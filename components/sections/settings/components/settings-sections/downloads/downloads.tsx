import { CheckIcon, DownloadIcon, Folder, FolderOpenDotIcon, FolderOpenIcon, FolderSearchIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/app/contexts/settings-context";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner";

// Default settings
const DEFAULT_SETTINGS = {
  downloadPath: "~/Downloads/asp-downloads",
  autoOpenFolder: false
};

export default function SettingsDownloads() {
  const { settings, updateSettings } = useSettings();

  // Initialize tempPath with localStorage value or default if empty/undefined
  const [tempPath, setTempPath] = useState<string>(() => {
    const storedPath = settings.downloads?.downloadPath;
    return (!storedPath || storedPath.trim() === '') ? DEFAULT_SETTINGS.downloadPath : storedPath;
  });

  // Path validity state for extra text
  const [isPathValid, setIsPathValid] = useState<boolean | null>(null);

  // Get downloads settings with defaults
  const downloadsSettings = {
    ...DEFAULT_SETTINGS,
    ...settings.downloads,
    // Ensure downloadPath uses default if empty/undefined in settings
    downloadPath: (!settings.downloads?.downloadPath || settings.downloads.downloadPath.trim() === '') 
      ? DEFAULT_SETTINGS.downloadPath 
      : settings.downloads.downloadPath
  };

  // Validate path on mount and whenever tempPath changes
  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      if (window.api?.invoke) {
        const valid = await window.api.invoke('validate-path', tempPath);
        if (!cancelled) setIsPathValid(valid);
      }
    };
    validate();
    return () => { cancelled = true; };
  }, [tempPath]);

  // Update handler for non-path settings
  const handleSettingChange = (key: string, value: any) => {
    if (key !== 'downloadPath') {
      updateSettings('downloads', {
        ...downloadsSettings,
        [key]: value
      });
    }
  };

  // Handle input change to update temporary value and validate
  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempPath(e.target.value);
  };

  // Handle open folder button click
  const handleOpenFolder = async () => {
    if (downloadsSettings.downloadPath && window.api?.invoke) {
      const result = await window.api.invoke('open-download-folder', downloadsSettings.downloadPath);
      if (!result) {
        toast.error("Failed to open folder, it likely does not exist.");
      }
    }
  };

  // Handle blur event for downloadPath input
  const handleDownloadPathBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();

    // If empty, use default value
    const finalValue = !value ? DEFAULT_SETTINGS.downloadPath : value;
    setTempPath(finalValue);

    // Validate path using Electron IPC
    let isValid = false;
    if (window.api?.invoke) {
      isValid = await window.api.invoke('validate-path', finalValue);
      setIsPathValid(isValid);
    }

    // Always update settings, even if path is invalid
    updateSettings('downloads', {
      ...downloadsSettings,
      downloadPath: finalValue
    });
  };

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
          extra={
            isPathValid === false ? (
              <div className="flex items-center gap-4">
                <div className="text-amber-500 text-sm flex-row flex items-center justify-center gap-2 border-1 border-amber-500 rounded-md p-2 bg-amber-500/10">
                  <TriangleAlertIcon size={20} className="flex shrink-0" />
                  Download path is invalid, a new path will be made when you use the download feature.
                </div>
                <Button
                  variant={'ghost'}
                  onClick={async () => {
                    if (window.api?.invoke) {
                      const valid = await window.api.invoke('validate-path', tempPath);
                      setIsPathValid(valid);
                      // Always update settings, even if path is invalid
                      updateSettings('downloads', {
                        ...downloadsSettings,
                        downloadPath: tempPath
                      });
                      if (valid) {
                        toast.success("Path is now valid!");
                      } else {
                        toast.error("Path is still invalid! (Saved anyway)");
                      }
                    }
                  }}
                >
                  <RotateCwIcon />
                </Button>
              </div>
            ) : null
          }
        >
          <Input
            className="w-full"
            placeholder="path"
            value={tempPath}
            onChange={handlePathChange}
            onBlur={handleDownloadPathBlur}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={'outline'}
                  onClick={async () => {
                    if (window.api?.invoke) {
                      const folder = await window.api.invoke('open-folder-dialog');
                      if (folder) {
                        const valid = await window.api.invoke('validate-path', folder);
                        setTempPath(folder);
                        setIsPathValid(valid);
                        updateSettings('downloads', {
                          ...downloadsSettings,
                          downloadPath: folder
                        });
                      }
                    }
                  }}  
                >
                  <FolderSearchIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use explorer</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>        
        </SettingsPrefWrapper>

        <SettingsPrefWrapper
          title="Open Download Folder"
          description="Open the folder where media is downloaded to."
        >
          <Button 
            variant={'outline'}
            onClick={handleOpenFolder}
            disabled={!downloadsSettings.downloadPath}
          >
            <FolderOpenIcon />
          </Button>
        </SettingsPrefWrapper>
      </div>
    </div>
  );
}