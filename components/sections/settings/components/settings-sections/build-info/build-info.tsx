import { HammerIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";

export default function SettingsBuildInfo() {
  return (
    <div className="h-full w-full p-4">
      <SettingsSectionHeader 
          title="Build Info"
          description="Info about the app."
          icon={<HammerIcon className="opacity-50" />}
      />
    </div>
  );
}