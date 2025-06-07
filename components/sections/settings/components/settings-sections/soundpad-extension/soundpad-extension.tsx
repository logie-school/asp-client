import { FileAudioIcon, CircleXIcon, Check } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from "@/app/contexts/settings-context";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// defaults
const DEFAULT_SOUNDPAD_SETTINGS = {
  enabled: false,
  port: "8866"
};

const MIN_PORT = 1;
const MAX_PORT = 65535;

export default function SoundpadExtension() {
  const { settings, updateSettings } = useSettings();

  // Function to get soundpad status
  const getSoundpadStatus = async () => {
    try {
      const resp: { status: string; message: string } =
        await window.api.invoke('get-soundpad-status', soundpadSettings.port);
      if (resp.status === 'ok') {
        toast.success(resp.message);
      } else {
        toast.error(resp.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Unknown error checking Soundpad status');
    }
  };

  // Get soundpad settings with defaults
  const soundpadSettings = {
    ...DEFAULT_SOUNDPAD_SETTINGS,
    ...settings.soundpad,
    port:
      !settings.soundpad?.port || settings.soundpad.port.trim() === ""
        ? DEFAULT_SOUNDPAD_SETTINGS.port
        : settings.soundpad.port,
  };

  // Track the last saved port value
  const [tempPort, setTempPort] = useState<string>(soundpadSettings.port);
  const lastSavedPort = useRef<string>(soundpadSettings.port);

  // Update handler for enabled checkbox
  const handleSettingChange = (key: string, value: boolean | string) => {
    updateSettings('soundpad', {
      ...soundpadSettings,
      [key]: value
    });
    if (key === "port" && typeof value === "string") {
      lastSavedPort.current = value;
    }
  };

  // Only allow digits in the input
  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setTempPort(numericValue);
  };

  // On blur, update settings and restore previous value if input is empty or out of range
  const handlePortBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    let finalValue = value;

    // If input is empty, revert to last saved value (or default if never set)
    if (value === "") {
      finalValue = lastSavedPort.current || DEFAULT_SOUNDPAD_SETTINGS.port;
      toast.error("Port cannot be empty.");
    } else {
      // Clamp to valid port range
      const num = Number(value);
      if (num < MIN_PORT) {
        finalValue = String(MIN_PORT);
      } else if (num > MAX_PORT) {
        finalValue = String(MAX_PORT);
      }
    }

    setTempPort(finalValue);
    updateSettings('soundpad', {
      ...soundpadSettings,
      port: finalValue
    });
    lastSavedPort.current = finalValue;
  };

  // Show warning if port is over max while editing
  const portNum = Number(tempPort);
  const showPortWarning = tempPort !== "" && portNum > MAX_PORT;

  return (
    <div className="h-full w-full p-4 pb-0 flex flex-col min-h-0">
      <SettingsSectionHeader 
        title="Soundpad Extension"
        description="Manage Soundpad extension settings (asp-server.exe)."
        icon={<FileAudioIcon className="opacity-50" />}
      />

      <div className="flex flex-col gap-4 overflow-y-auto py-4 flex-1 min-h-0">
        
        <SettingsPrefWrapper
          title="Enable Soundpad Extension"
          description="Toggle the Soundpad extension on or off."
        >
          <Checkbox 
            className="size-6"
            checked={soundpadSettings.enabled}
            onCheckedChange={checked => handleSettingChange('enabled', checked as boolean)}
          />
        </SettingsPrefWrapper>

        {/* wrap and grey out when disabled */}
        <div className={
            soundpadSettings.enabled
              ? "transition-all flex flex-col gap-4"
              : "opacity-50 pointer-events-none transition-all flex flex-col gap-4"
          }
        >
          <SettingsPrefWrapper
            title="Soundpad Status"
            description="See if the background server can talk to Soundpad."
          >
            <Button variant="outline" onClick={getSoundpadStatus}>
              Check
            </Button>
          </SettingsPrefWrapper>

          <SettingsPrefWrapper
            title="Server Port"
            description="Set the port for the Soundpad extension server."
            extra={
              showPortWarning ? (
                <div className="flex items-center gap-2 text-red-500 text-sm border border-red-500 rounded-md p-2 bg-red-500/10 mt-2">
                  <CircleXIcon size={18} className="flex shrink-0" />
                  Port must be between {MIN_PORT} and {MAX_PORT}, your input will be changed to fit this range after deselecting.
                </div>
              ) : null
            }
          >
            <Input
              placeholder="port"
              value={tempPort}
              onChange={handlePortChange}
              onBlur={handlePortBlur}
              inputMode="numeric"
              pattern="[0-9]*"
              disabled={!soundpadSettings.enabled}
            />
          </SettingsPrefWrapper>
        </div>
      </div>
    </div>
  );
}