"use client";

import { 
    BadgeCheck, ChevronDown, CodeSquare, FileIcon, User2,ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/role";
import { DashboardUserButton } from "./dashboard-user-button";

const menuSections = [
    {
        title: "Dossiers",
        icon: FileIcon,
        href: "/dossiers",
        isDirectLink: true
    },
    {
        title: "Conversions",
        icon: ArrowLeftRight,
        href: "/conversion",
        isDirectLink: true
    },
    {
        title: "Constantes",
        icon: BadgeCheck,
        items: [
            {
                icon: User2,
                label: "Clients",
                href: "/client"
            },
            {
                icon: CodeSquare,
                label: "HS Codes",
                href: "/hscode"
            },
            {
                icon: BadgeCheck,
                label: "Régimes Déclarations",
                href: "/regime-declaration"
            }
        ]
    }
];

export const DashboadSidebar = () => {
    const pathname = usePathname();
    const user: { id: string, role: Role } = { 
        id: "temp-id", 
        role: "moderateur" 
    };
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "Constantes": true
    });

    const toggleSection = (title: string) => {
        setOpenSections(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    return (
        <Sidebar className="bg-sidebar text-sidebar-foreground">
            <SidebarHeader className="px-4 py-3">
                <Link href="/" className="flex items-center gap-3">
                    <Image 
                        src="/logo.png" 
                        height={60} 
                        width={180} 
                        className="rounded-xl" 
                        alt="logo" 
                    />
                </Link>
            </SidebarHeader>
            <div className="px-2 py-2">
                <Separator className="opacity-10 text-[#5D6B68]" />
            </div>

            {/* Content */}
            <SidebarContent className="px-3 py-4 scrollbar-hide">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {menuSections.map((section) => (
                                <div key={section.title}>
                                    {section.isDirectLink ? (
                                        // Lien direct (Dossiers, Conversions)
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                className={cn(
                                                    "h-10 rounded-md px-3 text-sm font-medium transition-colors",
                                                    pathname === section.href 
                                                     ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                     : "hover:bg-sidebar-accent/15"
                                                )}
                                                isActive={pathname === section.href}
                                            >
                                                <Link href={section.href!}>
                                                    <section.icon className="size-5" />
                                                    <span>{section.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ) : (
                                        // Section avec sous-éléments (Constantes)
                                        <>
                                         {/* Section title */}
                                            <SidebarMenuItem>
                                                <SidebarMenuButton
                                                    onClick={() => toggleSection(section.title)}
                                                    className="h-10 rounded-md px-3 text-sm font-semibold hover:bg-sidebar-accent/15 transition-colors"
                                                >
                                                    <section.icon className="size-5" />
                                                    <span className="flex-1">{section.title}</span>
                                                    <ChevronDown
                                                        className={cn(
                                                            "size-4 transition-transform",
                                                            openSections[section.title] && "rotate-180"
                                                        )}
                                                    />
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>

                                            {openSections[section.title] && (
                                                <div className="ml-4 mt-1 space-y-1">
                                                    {section.items?.map((item) => (
                                                        <SidebarMenuItem key={item.href}>
                                                            <SidebarMenuButton
                                                                asChild
                                                                className={cn(
                                                                    "h-9 rounded-md px-3 text-sm transition-colors",
                                                                    pathname === item.href 
                                                                     ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                                     : "hover:bg-sidebar-accent/15"
                                                                )}
                                                                isActive={pathname === item.href}
                                                            >
                                                                <Link href={item.href}>
                                                                    <item.icon className="size-4" />
                                                                    <span>{item.label}</span>
                                                                </Link>
                                                            </SidebarMenuButton>
                                                        </SidebarMenuItem>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="text-white">
                <DashboardUserButton />
            </SidebarFooter>
        </Sidebar>
    );
};