import { FileAudioIcon, PaletteIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";

export default function SettingsASP() {
  return (
    <div className="h-full w-full p-4">
        <SettingsSectionHeader 
            title="ASP Extension"
            description="Configure ASP (AutoSoundPort)."
            icon={<FileAudioIcon className="opacity-50" />}
        />
    </div>
  );
}