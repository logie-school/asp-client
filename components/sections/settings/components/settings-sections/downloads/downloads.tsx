import React, { useState, useEffect, useRef } from "react";
import { useSettings } from "@/app/contexts/settings-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DownloadIcon, FolderSearchIcon, RotateCwIcon, TriangleAlertIcon, PlusIcon, CircleXIcon } from "lucide-react";
import { PathList } from "./components/path-list";
import { SettingsSectionHeader } from "../../settings-section-header";
import { Checkbox } from "@/components/ui/checkbox";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function SettingsDownloads() {
  const { settings, updateSettings } = useSettings();

  // Always use the paths from settings, which are initialized from DEFAULT_SETTINGS in the context
  const paths = settings.downloads?.paths ?? [];

  // Download path input is always the first path
  const [tempPath, setTempPath] = useState<string>("");
  const [isPathValid, setIsPathValid] = useState<boolean | null>(null);
  const prevPathRef = useRef(paths[0]?.path || "");

  // Keep track of the previous path for revert
  useEffect(() => {
    prevPathRef.current = paths[0]?.path || "";
  }, [paths]);

  // Validate tempPath only if not empty
  useEffect(() => {
    let cancelled = false;
    const validate = async () => {
      if (!tempPath) {
        setIsPathValid(null);
        return;
      }
      if (window.api?.invoke) {
        const valid = await window.api.invoke('validate-path', tempPath);
        if (!cancelled) setIsPathValid(valid);
      }
    };
    validate();
    return () => { cancelled = true; };
  }, [tempPath]);

  // On mount or when paths change, input is empty
  useEffect(() => {
    setTempPath("");
  }, [paths]);

  // Update the first path in the array
  const updateFirstPath = (newPath: string) => {
    const match = newPath.replace(/[/\\]+$/, "").match(/([^\\/]+)$/);
    const folderName = match ? match[1] : newPath.trim();
    const newPaths = [
      { name: folderName, path: newPath },
      ...paths.slice(1)
    ];
    updateSettings('downloads', { paths: newPaths });
  };

  // For the folder picker button
  const handlePickFolder = async () => {
    if (window.api?.invoke) {
      const folder = await window.api.invoke('open-folder-dialog');
      if (folder) {
        setTempPath(folder);
        let valid = false;
        if (window.api?.invoke) {
          valid = await window.api.invoke('validate-path', folder);
          setIsPathValid(valid);
        }
        // Do NOT call updateFirstPath(folder) here!
      }
    }
  };

  // For the refresh/validate button
  const handleValidate = async () => {
    if (!tempPath) return;
    if (window.api?.invoke) {
      const valid = await window.api.invoke('validate-path', tempPath);
      setIsPathValid(valid);
      updateFirstPath(tempPath);
      if (valid) {
        toast.success("Path is now valid!");
      } else {
        toast.error("Path is still invalid! (Saved anyway)");
      }
    }
  };

  // Remove path handler (don't allow removing the first path)
  const handleRemovePath = (idx: number) => {
    if (idx === 0) {
      toast.error("You cannot remove the default download path.");
      return;
    }
    const newPaths = paths.filter((_, i) => i !== idx);
    updateSettings('downloads', { paths: newPaths });
  };

  // Add a new path to the list (not replacing the first path)
  const handleAddPath = async () => {
    const newPath = tempPath.trim();
    if (!newPath) {
      toast.error("Please enter a path.");
      return;
    }
    if (!isWindowsAbsolutePath(newPath)) {
      toast.error("Not a valid Windows path.");
      return;
    }
    if (hasInvalidWindowsChars(newPath)) {
      toast.error("Path contains invalid characters.");
      return;
    }
    if (hasInvalidWindowsSymbols(newPath)) {
      toast.error("Folder names can only contain letters, numbers, spaces, dashes, underscores, and periods.");
      return;
    }
    // Check for duplicates
    if (paths.some(p => p.path === newPath)) {
      toast.error("This path is already in the list.");
      return;
    }
    // Validate path if possible
    let valid = true;
    if (window.api?.invoke) {
      valid = await window.api.invoke('validate-path', newPath);
    }
    const match = newPath.replace(/[/\\]+$/, "").match(/([^\\/]+)$/);
    const folderName = match ? match[1] : newPath;
    const newPaths = [...paths, { name: folderName, path: newPath, active: false }];
    updateSettings('downloads', { paths: newPaths });
    setTempPath("");
    setIsPathValid(null);
    if (valid) {
      toast.success("Path added");
    } else {
      toast.warning("Path added, but it does not exist. It will be created when used.");
    }
  };

  // Handler for renaming a path entry (only updates the name, not the path)
  const handleRenamePath = (idx: number, newName: string) => {
    if (!newName.trim()) return;
    const newPaths = paths.map((entry, i) =>
      i === idx ? { ...entry, name: newName } : entry
    );
    updateSettings('downloads', { paths: newPaths });
    // Optionally show a toast
    toast.success('Path name updated.');
  };

  // Add a function to check for invalid Windows path characters
  const hasInvalidWindowsChars = (p: string) => {
    // Forbidden chars: < > : " / \ | ? * (except for the drive colon and root slash)
    // Allow colon only as the second char (drive letter)
    // Allow ~ at the start
    let pathWithoutDrive = p;
    if (/^[a-zA-Z]:[\\/]/.test(p)) {
      pathWithoutDrive = p.replace(/^[a-zA-Z]:[\\/]?/, "");
    } else if (/^~[\\/]/.test(p)) {
      pathWithoutDrive = p.replace(/^~[\\/]?/, "");
    }
    const forbidden = /[<>:"|?*\x00-\x1F]/g; // Don't forbid / or \ here, they're separators
    return forbidden.test(pathWithoutDrive);
  };

  // Add a function to check for allowed folder/file name characters
  const hasInvalidWindowsSymbols = (p: string) => {
    // Remove drive letter or ~, split by \ or /
    let parts = p;
    if (/^[a-zA-Z]:[\\/]/.test(p)) {
      parts = p.replace(/^[a-zA-Z]:[\\/]/, "");
    } else if (/^~[\\/]/.test(p)) {
      parts = p.replace(/^~[\\/]/, "");
    }
    // Split by slash or backslash
    const segments = parts.split(/[\\/]/);
    const allowed = /^[\w\s.-]+$/;
    // Only check non-empty parts
    return segments
      .filter(part => part.length > 0)
      .some(part => !allowed.test(part) || part.trim().length === 0);
  };

  // Update the absolute path checker to also check for invalid chars and symbols
  const isWindowsAbsolutePath = (p: string) => {
    const trimmed = p.trim();
    // Must start with drive letter or ~, then slash or backslash
    if (!/^(~|[a-zA-Z]:)[\\/]/.test(trimmed)) return false;
    // Must not have forbidden chars
    if (hasInvalidWindowsChars(trimmed)) return false;
    // Must not have forbidden symbols
    if (hasInvalidWindowsSymbols(trimmed)) return false;
    return true;
  };

  const useTempPath = settings.downloads?.useTempPath ?? false;

  // Handler for the checkbox
  const handleTempPathToggle = (checked: boolean) => {
    updateSettings('downloads', { ...settings.downloads, useTempPath: checked });
  };

  return (
    <div className="h-full w-full p-4 pb-0 flex flex-col min-h-0">
      <SettingsSectionHeader 
        title="Downloads"
        description="Manage where media is downloaded to and default configuration."
        icon={<DownloadIcon className="opacity-50" />}
      />

      <div className="flex flex-col gap-4 overflow-y-auto py-4 flex-1 min-h-0">
        <SettingsPrefWrapper
          title="Use Temporary Path"
          description="This will use file explorer after the file downloads and let you choose the download location temporarily."
        >
          <Checkbox 
            className="size-6"
            checked={useTempPath}
            onCheckedChange={handleTempPathToggle}
          />
        </SettingsPrefWrapper>
        
        <div className={useTempPath ? "opacity-50 pointer-events-none transition-all gap-4 flex flex-col" : "transition-all gap-4 flex flex-col"}>
          <SettingsPrefWrapper
            title="Add Download Path"
            description="Add a new download path. The first path is the default and cannot be removed."
            extra={
              tempPath && !isWindowsAbsolutePath(tempPath) ? (
                <div className="flex items-center gap-4">
                  <div className="text-red-500 text-sm flex-row flex items-center justify-center gap-2 border-1 border-red-500 rounded-md p-2 bg-red-500/10">
                    <CircleXIcon size={20} className="flex shrink-0" />
                    Not a valid Windows path. Cannot use: <span className="font-mono">&lt; &gt; : " / \ | ? *</span>
                  </div>
                </div>
              ) : isPathValid === false && tempPath && isWindowsAbsolutePath(tempPath) ? (
                <div className="flex items-center gap-4">
                  <div className="text-amber-500 text-sm flex-row flex items-center justify-center gap-2 border-1 border-amber-500 rounded-md p-2 bg-amber-500/10">
                    <TriangleAlertIcon size={20} className="flex shrink-0" />
                    Download path doesn't exist, a new path will be made when you use the download feature.
                  </div>
                  <Button
                    variant={'ghost'}
                    onClick={handleValidate}
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
              onChange={e => setTempPath(e.target.value)}
              spellCheck={false}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={'outline'}
                    onClick={handlePickFolder}
                  >
                    <FolderSearchIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use explorer</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleAddPath}
                    disabled={
                      !tempPath.trim() ||
                      !isWindowsAbsolutePath(tempPath) ||
                      hasInvalidWindowsChars(tempPath) ||
                      hasInvalidWindowsSymbols(tempPath)
                    }
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add path</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SettingsPrefWrapper>

          <PathList
            paths={paths}
            onRemove={handleRemovePath}
            onRename={handleRenamePath}
          />
        </div>
      </div>
    </div>
  );
}