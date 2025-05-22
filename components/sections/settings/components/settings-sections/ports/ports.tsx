import { EthernetPortIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";

export default function SettingsPorts() {
  return (
    <div className="h-full w-full p-4">
      <SettingsSectionHeader 
        title="Ports"
        description="Manage the ports that communicate between the server and frontend."
        icon={<EthernetPortIcon className="opacity-50" />}
      />
    </div>
  );
}