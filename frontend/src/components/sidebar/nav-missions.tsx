"use client"

import { usePathname } from "next/navigation"
import { Briefcase, LayoutDashboard, MessageSquare, Plus } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMissions() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <div className="flex flex-col gap-2 px-2">
      {/* Main Navigation */}
      <div className="space-y-1 mb-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname === "/dashboard"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className={cn("truncate", state === "collapsed" && "sr-only")}>
            Tableau de bord
          </span>
        </Link>

        <Link
          href="/missions"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname.startsWith("/missions")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <Briefcase className="h-4 w-4" />
          <span className={cn("truncate", state === "collapsed" && "sr-only")}>
            Missions
          </span>
        </Link>



        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            pathname.startsWith("/agents") && !pathname.includes("/missions")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          <span className={cn("truncate", state === "collapsed" && "sr-only")}>
            Conversations
          </span>
        </Link>
      </div>

      <Separator className="my-2" />

      {/* Missions Section */}
      <div className="flex items-center justify-between px-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {state !== "collapsed" ? "Missions récentes" : ""}
        </div>
        <Link href="/missions">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Nouvelle mission</span>
          </Button>
        </Link>
      </div>

      {/* We'll add mission items here in the future */}
      <div className="px-2 py-1.5 text-sm text-muted-foreground">
        {state !== "collapsed" ? "Aucune mission récente" : ""}
      </div>

      <Separator className="my-2" />
    </div>
  )
}
