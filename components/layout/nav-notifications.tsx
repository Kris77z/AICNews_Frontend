"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Notification {
    id: string
    avatar?: string
    fallback: string
    text: string
    time: string
}

export function NotificationsPopover({ notifications }: { notifications: Notification[] }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="font-semibold">Notifications</h4>
                    <span className="text-xs text-muted-foreground">
                        {notifications.length} unread
                    </span>
                </div>
                <ScrollArea className="h-[300px]">
                    <div className="grid gap-1 p-1">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="flex items-start gap-3 rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                                <Avatar className="h-8 w-8 mt-0.5">
                                    <AvatarImage src={notification.avatar} />
                                    <AvatarFallback>{notification.fallback}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1">
                                    <p className="text-sm font-medium leading-none">
                                        {notification.text}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {notification.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
