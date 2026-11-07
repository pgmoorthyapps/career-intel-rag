"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Search,
  LogOut,
  Database,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Logo } from "@/components/logo"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate()

  // Get user from local storage (saved during login)
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/auth/sign-in")
  }

  // Dynamic Navigation based on Role
  const navGroups = React.useMemo(() => {
    if (!user) return []

    if (user.role_id === 2) {
      // Employer Menu
      return [
        {
          label: "Employer Menu",
          items: [
              { title: "Master Data", url: "/masters", icon: Database },
            { title: "Post a Job", url: "/employer/dashboard", icon: Briefcase },
          ],
        },
      ]
    } else {
      // Candidate Menu (Default)
      return [
        {
          label: "Candidate Menu",
          items: [
            { title: "My Resume", url: "/candidate/dashboard", icon: FileText },
            { title: "Browse Jobs", url: "/candidate/jobs", icon: Search },
          ],
        },
      ]
    }
  }, [user])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Logo size={24} className="text-current" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Career Intel</span>
                <span className="truncate text-xs">AI Assistant</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {user?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.full_name || "User"}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-red-500" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
