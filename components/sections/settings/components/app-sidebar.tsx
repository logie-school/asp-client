"use client"

import * as React from "react"

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
      url: "#",
      items: [
        {
          title: "execution",
          url: "#",
        },
        {
          title: "appearance",
          url: "#",
        },
        {
          title: "notifications",
          url: "#",
        },
        {
          title: "hotkeys",
          url: "#",
        },
        {
          title: "caching",
          url: "#",
        }
      ],
    },
    {
      title: "advanced",
      url: "#",
      items: [
        {
          title: "debugging",
          url: "#",
        },
        {
          title: "build info",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filteredData, setFilteredData] = React.useState(data.navMain)

  React.useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase()
    const filtered = data.navMain
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.title.toLowerCase().includes(lowercasedSearchTerm)
        ),
      }))
      .filter((group) => group.items.length > 0)
    setFilteredData(filtered)
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
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a className="!capitalize transition-all hover:!pl-4 whitespace-nowrap" href={item.url}>{item.title}</a>
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