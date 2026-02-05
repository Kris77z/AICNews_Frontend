import * as React from "react"
import { Bot } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground",
                className
            )}
            {...props}
        >
            <Bot className="size-4" />
        </div>
    )
}
