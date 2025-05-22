import { BugOffIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";

export default function SettingsDebugging() {
  return (
    <div className="h-full w-full p-4">
      <SettingsSectionHeader 
          title="Debugging"
          description="Tools to help fix or submit bugs."
          icon={<BugOffIcon className="opacity-50" />}
      />
    </div>
  );
}