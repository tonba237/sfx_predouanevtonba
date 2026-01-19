"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NewHscodeDialog } from "./new-hscode-dialog";
import { HSCodeImportDialog } from "./hscode-import-dialog";

export const HscodeListHeader = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNewHscodeDialogOpen, setIsNewHscodeDialogOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const hscode = searchParams.get("hscode") || "";
  const isAnyFilterModified = !!search || !!hscode;

  const onHscodeFilters = () => {
    router.push("?page=1");
  };

  return (
    <>
      <NewHscodeDialog open={isNewHscodeDialogOpen} onOpenChange={setIsNewHscodeDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">Mes Hscodes</h5>
          <div className="flex gap-2">
            <HSCodeImportDialog />
            <Button onClick={() => setIsNewHscodeDialogOpen(true)}>
              <PlusIcon />
              Nouveau Hscode
            </Button>
          </div>
        </div>
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            {isAnyFilterModified && (
              <Button onClick={onHscodeFilters} variant="outline">
                <XCircleIcon className="text-destructive!" />
                Effacer les filtres
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
};
