import { PaletteIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/app/contexts/settings-context";
import { useTheme } from 'next-themes';

export default function SettingsAppearance() {
    const { settings, updateSettings } = useSettings();
    const { setTheme } = useTheme();

    const handleThemeChange = (value: string) => {
        // Only update if value is different from current
        if (value !== settings.appearance?.theme) {
            updateSettings('appearance', {
                ...settings.appearance,
                theme: value
            });
            setTheme(value);
        }
    };

    return (
        <div className="h-full w-full p-4 pb-0 flex flex-col min-h-0">
            <SettingsSectionHeader 
                title="Appearance"
                description="Manage the look and feel."
                icon={<PaletteIcon className="opacity-50" />}
            />

            <div className="flex flex-col gap-4 overflow-y-auto py-4 flex-1 min-h-0">
                <SettingsPrefWrapper
                    title="Theme"
                    description="Choose between light and dark themes."
                >
                    <Select 
                        value={settings.appearance?.theme || "system"} 
                        onValueChange={handleThemeChange}
                        defaultValue="system"
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Theme</SelectLabel>
                                <SelectItem value="system">System</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </SettingsPrefWrapper>
            </div>
        </div>
    );
}