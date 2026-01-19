"use client";

import { useRouter } from "next/navigation";
import { ChevronDownIcon, LogOutIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/hooks/use-session";
import { signOut as authSignOut } from "@/modules/auth/server/actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Separator } from "@/components/ui/separator";



export const DashboardUserButton = () => {

    const isMobile = useIsMobile();
    const router = useRouter();
    const { user, isPending } = useSession();


    const onLogout = async () => {
        await authSignOut();
        router.push("/sign-in");
    }

    if (isPending || !user) return null

    const Trigger = (
        <div
            className="
                flex w-full items-center gap-3
                rounded-md px-3 py-2
                bg-white/5
                text-sm
                transition-colors
                hover:bg-white/10
            "
        >
        <GeneratedAvatar
            seed={user.nomUtilisateur}
            variant="initials"
            className="size-8"
        />
        <div className="flex min-w-0 flex-1 flex-col text-left">
            <span className="truncate font-medium">
            {user.nomUtilisateur}
            </span>
            <span className="truncate text-xs text-muted-foreground">
            {user.codeUtilisateur}
            </span>
        </div>
        <ChevronDownIcon className="size-4 shrink-0 opacity-70" />
        </div>
    );



    if (isMobile) {
        return (
            <Drawer>
                <DrawerTrigger className="w-full">{Trigger}</DrawerTrigger>
                <DrawerContent>
                    <div className="px-2 py-2">
                        <Separator className="opacity-10 text-[#5D6B68]" />
                    </div>
                    <DrawerHeader>
                        <DrawerTitle>{user.nomUtilisateur}</DrawerTitle>
                        <DrawerDescription>{user.codeUtilisateur}</DrawerDescription>
                    </DrawerHeader>
                    <DrawerFooter>
                        <Button
                            onClick={onLogout}
                            className="
                                flex w-full items-center justify-between
                                rounded-md px-4 py-3
                                text-sm
                                transition-colors
                                hover:bg-white/10
                            "
                        >
                            Se déconnecter
                            <LogOutIcon className="size-4" /> 
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
       <DropdownMenu>
            <DropdownMenuTrigger className="w-full">{Trigger} </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-72">
                <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                        <span className="truncate font-medium">{user.nomUtilisateur}</span>
                        <span className="truncate text-sm text-muted-foreground">{user.codeUtilisateur}</span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={onLogout}
                    className="
                        flex cursor-pointer items-center justify-between
                        transition-colors
                        hover:bg-white/10
                    "
                >
                    Se déconnecter
                    <LogOutIcon className="size-4" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}