import { FileAudioIcon, PaletteIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Input } from "@/components/ui/input";

export default function SoundpadExtension() {
  return (
    <div className="h-full w-full p-4">
        <SettingsSectionHeader 
            title="Soundpad Extension"
            description="Manage Soundpad extension settings."
            icon={<FileAudioIcon className="opacity-50" />}
        />

        <div className="flex flex-col gap-4 mt-4 h-full overflow-y-auto">
          <SettingsPrefWrapper
            title="Server Port"
            description="Set the port for the Soundpad extension server."
          >
            <Input
              placeholder="port"
            />
          </SettingsPrefWrapper>
        </div>
    </div>
  );
}