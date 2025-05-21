"use client";

import React, { useEffect, useState } from "react";
import { Toolbar } from "@/components/toolbar";
import { Sidebar } from "@/components/sidebar";

// page sections
import { Download }  from "@/components/sections/download/download";
import { Gallery }  from "@/components/sections/gallery/gallery";
import { Settings } from "@/components/sections/settings/settings";

const App = () => {
  const [activeSection, setActiveSection] = useState<string | null>("download");

  useEffect(() => {
    // console.log("Active Section:", activeSection);
  }, [activeSection]);

  return (
    <div suppressHydrationWarning>
      <div className="flex flex-row">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="w-full h-[calc(100svh-32px)] box-border">
          <div className="w-full h-full relative flex items-center justify-center">
            <Download active={activeSection === "download"} />
            <Gallery active={activeSection === "gallery"} />
            <Settings active={activeSection === "settings"} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;