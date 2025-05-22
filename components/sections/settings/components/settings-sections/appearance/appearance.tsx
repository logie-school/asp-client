import { PaletteIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";

export default function SettingsAppearance() {
  return (
    <div className="h-full w-full p-4">
        <SettingsSectionHeader 
            title="Appearance"
            description="Manage the look and feel."
            icon={<PaletteIcon className="opacity-50" />}
        />
    </div>
  );
}