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

      <div className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col p-4 overflow-y-auto items-center justify-center rounded-[10px] border-1 border-input bg-input/30 ">
          <span className="font-medium text-2xl">asp</span>
          <span className="text-sm">A tool to make downloading YouTube videos easy</span>
          <div className="w-full flex flex-row items-center justify-between mt-2">
            <span className="opacity-50 text-sm">beta</span>
            <span className="opacity-50 text-sm">windows</span>
          </div>
        </div>
      </div>
    </div>
  );
}