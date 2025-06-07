import { HammerIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import Silk from "@/components/reactbits/Silk/Silk";
import { motion } from "framer-motion";

export default function SettingsBuildInfo() {
  return (
    <div className="h-full w-full p-0">
        {/* wrap Silk in a relative container */}
        <div className="absolute w-full h-full">


          <Silk className="absolute inset-0 w-full h-full z-0" color="#707070" />

          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ boxShadow: "inset 100px 100px 100px #0a0a0a" }}
          />
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ boxShadow: "inset -100px -100px 100px #0a0a0a" }}
          />

          <motion.div
            className="absolute inset-0 pointer-events-none z-[9] bg-[#0a0a0a]"
            initial={{ opacity: 1 }}
            whileInView={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

      <div className="absolute h-full w-full z-99 p-4">

        <SettingsSectionHeader 
          title="Build Info"
          description="Info about the app."
          icon={<HammerIcon className="opacity-50" />}
      />

      <div className="flex items-center justify-center h-full w-full">

        
        <div className="flex flex-col absolute p-4 overflow-y-auto items-center justify-center rounded-[10px] border-1 border-input bg-input/30 ">




          <span className="font-medium text-2xl">asp</span>
          <span className="text-sm">A tool to make downloading YouTube videos easy</span>
          <div className="w-full flex flex-row items-center justify-between mt-2">
            <span className="opacity-50 text-sm">beta</span>
            <span className="opacity-50 text-sm">windows</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}