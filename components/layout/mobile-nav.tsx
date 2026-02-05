"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Newspaper, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()

    const items = [
        {
            title: "文章",
            url: "/feed",
            icon: Newspaper,
        },
        {
            title: "录入",
            url: "/manual",
            icon: PenLine,
        },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg md:hidden">
            <div className="flex h-16 items-center justify-around px-4">
                {items.map((item) => {
                    const isActive = pathname === item.url
                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 rounded-lg px-6 py-2 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-primary/70"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-current/20")} />
                            <span className="text-[10px] font-medium">{item.title}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
