import { DownloadIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";

export default function SettingsDownloads() {
  return (
    <div className="h-full w-full p-4">
      <SettingsSectionHeader 
        title="Downloads"
        description="Manage where media is downloaded to and default configuration."
        icon={<DownloadIcon className="opacity-50" />}
      />
    </div>
  );
}