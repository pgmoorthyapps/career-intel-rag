"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Logo } from "@/components/logo"

export function SiteHeader() {
  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 py-3 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-vertical:self-center data-vertical:h-4"
          />
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Logo size={16} className="text-current" />
            </div>
            <span className="hidden sm:inline-block">Career Intel</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>
    </>
  )
}
