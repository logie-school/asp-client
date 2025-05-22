"use client"

import * as React from "react"
import type { SectionKey } from "../settings"; // adjust path if needed

import { SearchForm } from "@/components/sections/settings/components/search-form"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/sections/settings/components/sidebar"

const data = {
  navMain: [
    {
      title: "general",
      items: [
        { label: "Appearance", section: "appearance" },
        { label: "Downloads", section: "downloads" },
      ],
    },
    {
      title: "extra",
      items: [
        { label: "ASP", section: "asp" },
      ],
    },
    {
      title: "advanced",
      items: [
        { label: "Ports", section: "ports" },
        { label: "Debugging", section: "debugging" },
        { label: "Build Info", section: "buildInfo" },
      ],
    },
  ],
};

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeSection: SectionKey;
  setActiveSection: React.Dispatch<React.SetStateAction<SectionKey>>;
}

// Map sidebar labels to section keys
const sectionKeyMap: Record<string, SectionKey> = {
  appearance: "appearance",
  downloads: "downloads",
  ports: "ports",
  debugging: "debugging",
  "build info": "buildInfo",
  asp: "asp",
};

export function AppSidebar({
  activeSection,
  setActiveSection,
  ...props
}: AppSidebarProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filteredData, setFilteredData] = React.useState(data.navMain)

  React.useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase()
    const filtered = data.navMain
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(lowercasedSearchTerm)
        ),
      }))
      .filter((group) => group.items.length > 0)
    setFilteredData(filtered as typeof data.navMain)
  }, [searchTerm])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SearchForm searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </SidebarHeader>
      <SidebarContent>
        {filteredData.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="font-medium opacity-50 uppercase">{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.section}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeSection === item.section}
                      onClick={() => setActiveSection(item.section as SectionKey)}
                      className="data-[active=true]:bg-white data-[active=true]:text-black data-[active=true]:font-medium data-[active=true]:rounded-lg data-[active=true]:transition-all data-[active=true]:duration-200 data-[active=true]:ease-in-out data-[active=true]:pl-4 data-[active=true]:pr-4 data-[active=true]:py-2"
                    >
                      <a className="!capitalize transition-all whitespace-nowrap" href="#">{item.label}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {/* <SidebarRail /> */}
    </Sidebar>
  )
}