"use client"

import * as React from "react"
import {
    Newspaper,
    PenLine,
    Bot,
    Twitter,
    BookOpen
} from "lucide-react"
import { motion } from "framer-motion"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { Logo } from "./logo"
import { NavMain, type Route } from "./nav-main"
import { NotificationsPopover } from "./nav-notifications"
import { TeamSwitcher } from "./team-switcher"

// 导航配置 - 只保留核心页面
const dashboardRoutes: Route[] = [
    {
        title: "手动录入",
        url: "/manual",
        icon: <PenLine className="size-4" />,
    },
    {
        title: "素材源",
        url: "/material-sources",
        icon: <BookOpen className="size-4" />,
    },
    {
        title: "推文素材",
        url: "/twitter-materials",
        icon: <Twitter className="size-4" />,
    },
    {
        title: "文章",
        url: "/feed",
        icon: <Newspaper className="size-4" />,
    },
]

const sampleNotifications = [
    {
        id: "1",
        fallback: "SYS",
        text: "系统启动成功",
        time: "刚刚",
    },
    {
        id: "2",
        fallback: "L5",
        text: "新文章生成完成",
        time: "5分钟前",
    },
]

const teams = [
    { name: "AICNews", logo: Bot, plan: "Pro" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

    return (
        <Sidebar variant="inset" collapsible="icon" {...props}>
            <SidebarHeader
                className={cn(
                    "flex md:pt-3.5",
                    isCollapsed
                        ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
                        : "flex-row items-center justify-between"
                )}
            >
                <a href="/" className="flex items-center gap-2">
                    <Logo className="h-8 w-8" />
                    {!isCollapsed && (
                        <span className="font-semibold text-black dark:text-white">
                            AICNews
                        </span>
                    )}
                </a>

                <motion.div
                    key={isCollapsed ? "header-collapsed" : "header-expanded"}
                    className={cn(
                        "flex items-center gap-2",
                        isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row"
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <NotificationsPopover notifications={sampleNotifications} />
                    <SidebarTrigger className="size-8" />
                </motion.div>
            </SidebarHeader>

            <SidebarContent className="gap-4 px-2 py-4">
                <NavMain items={dashboardRoutes} />
            </SidebarContent>

            <SidebarFooter className="px-2">
                <TeamSwitcher teams={teams} />
            </SidebarFooter>
        </Sidebar>
    )
}
