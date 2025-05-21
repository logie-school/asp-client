"use client"

import { Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/sections/settings/components/sidebar"

interface SearchFormProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
}

export function SearchForm({ searchTerm, setSearchTerm }: SearchFormProps) {
  return (
    <SidebarGroup suppressHydrationWarning>
      <SidebarGroupContent className="relative">
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <SidebarInput
          id="search"
          placeholder="Search settings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
        <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none pb-0" />
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
