"use client";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuItem as SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";

export type Route = {
    title: string;
    icon?: React.ReactNode;
    url: string;
    items?: {
        title: string;
        url: string;
        icon?: React.ReactNode;
    }[];
};

export function NavMain({ items }: { items: Route[] }) {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);

    return (
        <SidebarMenu>
            {items.map((route) => {
                const isOpen = !isCollapsed && openCollapsible === route.title;
                const hasSubRoutes = !!route.items?.length;

                return (
                    <SidebarMenuItem key={route.title}>
                        {hasSubRoutes ? (
                            <Collapsible
                                open={isOpen}
                                onOpenChange={(open) =>
                                    setOpenCollapsible(open ? route.title : null)
                                }
                                className="w-full"
                            >
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        className={cn(
                                            "flex w-full items-center rounded-lg px-2 transition-colors",
                                            isOpen
                                                ? "bg-sidebar-muted text-foreground"
                                                : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                                            isCollapsed && "justify-center"
                                        )}
                                    >
                                        {route.icon}
                                        {!isCollapsed && (
                                            <span className="ml-2 flex-1 text-sm font-medium">
                                                {route.title}
                                            </span>
                                        )}
                                        {!isCollapsed && hasSubRoutes && (
                                            <span className="ml-auto">
                                                {isOpen ? (
                                                    <ChevronUp className="size-4" />
                                                ) : (
                                                    <ChevronDown className="size-4" />
                                                )}
                                            </span>
                                        )}
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                {!isCollapsed && (
                                    <CollapsibleContent>
                                        <SidebarMenuSub className="my-1 ml-3.5 ">
                                            {route.items?.map((subRoute) => (
                                                <SidebarMenuSubItem
                                                    key={`${route.title}-${subRoute.title}`}
                                                    className="h-auto"
                                                >
                                                    <SidebarMenuSubButton asChild>
                                                        <Link
                                                            href={subRoute.url}
                                                            prefetch={true}
                                                            className="flex items-center rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-muted hover:text-foreground"
                                                        >
                                                            {subRoute.title}
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                )}
                            </Collapsible>
                        ) : (
                            <SidebarMenuButton tooltip={route.title} asChild>
                                <Link
                                    href={route.url}
                                    prefetch={true}
                                    className={cn(
                                        "flex items-center rounded-lg px-2 transition-colors text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                                        isCollapsed && "justify-center"
                                    )}
                                >
                                    {route.icon}
                                    {!isCollapsed && (
                                        <span className="ml-2 text-sm font-medium">
                                            {route.title}
                                        </span>
                                    )}
                                </Link>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}
