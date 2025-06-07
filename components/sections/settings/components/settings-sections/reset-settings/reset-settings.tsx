import { ListRestartIcon, RotateCwIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect } from "react";

export default function SettingsReset() {

  return (
    <div className="h-full w-full p-4 pb-0 flex flex-col min-h-0">
      <SettingsSectionHeader 
        title="Reset Settings"
        description="Reset all settings to their default values."
        icon={<ListRestartIcon className="opacity-50" />}
      />

      <div className="flex flex-col gap-4 overflow-y-auto py-4 flex-1 min-h-0">
        <SettingsPrefWrapper
          title="Reset Settings"
          description="This will reset all settings to their default values. Use with caution as it can't be undone."
        >
          <Button 
            variant={'outline'}
            className="hover:!bg-red-500/10 hover:text-red-500 transition-all hover:!border-red-500"
            onClick={() => {
              localStorage.removeItem('settings');
              sessionStorage.setItem('settingsResetFlag', 'true');
              window.location.reload();
            }}
          >
            <RotateCwIcon />
            Reset
          </Button>
        </SettingsPrefWrapper>
      </div>
    </div>
  );
}