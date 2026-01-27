"use client";

import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { TauxChangeForm } from "./taux-change-form";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversionId: string;
};

export const NewTauxChangeDialog = ({ open, onOpenChange, conversionId }: Props) => {
    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Ajouter un taux de change"
            description="Ajoutez un nouveau taux de change pour cette conversion"
            open={open}
            onOpenChange={onOpenChange}
        >
            <TauxChangeForm
                conversionId={conversionId}
                onSuccess={() => {
                    onOpenChange(false);
                    router.refresh();
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    );
};