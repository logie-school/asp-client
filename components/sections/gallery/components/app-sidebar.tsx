"use client"

import * as React from "react"

import { SearchForm } from "./search-form"
import { AttachCount } from "./attach-count"
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
} from "./sidebar"
import { pid, title } from "process"

const data = {
  navMain: [
    {
      title: "accounts",
      url: "#",
      items: [
        {
          title: "Bob",
          pfp: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-3FA2DCA331856681BAFC9879F7B92E5A-Png/150/150/AvatarHeadshot/Webp/noFilter",
          url: "#",
          pid: "1752",
          attached: true,
        },
        {
          title: "Joe",
          pfp: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-CC87873E68C8A8BCDF9B8CA4DE878E89-Png/150/150/AvatarHeadshot/Webp/noFilter",
          url: "#",
          pid: "5912",
          attached: false,
        },
        {
          title: "Fred",
          pfp: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-634BB1FCE643704B9E20ECACBCA08999-Png/150/150/AvatarHeadshot/Webp/noFilter",
          url: "#",
          pid: "1255",
          attached: false,
        },
        {
          title: "David",
          pfp: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-94E297B5490A91577B4DD0E18F293E76-Png/150/150/AvatarHeadshot/Webp/noFilter",
          url: "#",
          pid: "8512",
          attached: true,
        },
        {
          title: "Garry",
          pfp: "https://tr.rbxcdn.com/30DAY-AvatarHeadshot-10F5FE3A19280109BA8B673F70E5919E-Png/150/150/AvatarHeadshot/Webp/noFilter",
          url: "#",
          pid: "9121",
          attached: true,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filteredData, setFilteredData] = React.useState(data.navMain)
  let [attachCount, setAttachCount] = React.useState(0)

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

  // count how many of items are attached and set to attachCount variable
  attachCount = filteredData.reduce((acc, group) => {
    return (
      acc +
      group.items.filter((item) => item.attached).length
    )
  }, 0)

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarGroup>
          <AttachCount attached attachCount={attachCount}/>
        </SidebarGroup>
        <SearchForm searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </SidebarHeader>
      <SidebarContent>
        {filteredData.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-15">
                      <div className="!capitalize transition-all hover:!pl-4 whitespace-nowrap cursor-pointer">
                        <div className={`p-1 flex items-center justify-center rounded-full border ${item.attached ? "border-green-400" : "border-red-400"}`}>
                          <img src={item.pfp} alt="pfp" className="w-10 h-10 rounded-full"/>
                        </div>
                        <div className="flex flex-col">
                          {item.title}
                          <span className="text-[10px] opacity-40">PID: {item.pid}</span>
                        </div>
                      </div>
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