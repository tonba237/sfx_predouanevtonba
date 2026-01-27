"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteConversion } from "../../server/actions";
import { ConversionIdHeader } from "../components/conversion-id-header";
import { TauxChangeList } from "../components/taux-change-list";
import { NewTauxChangeDialog } from "../components/new-taux-change-dialog";

type Props = {
    conversion: any;
    tauxList: any[];
};

export const ConversionIdView = ({ conversion, tauxList }: Props) => {
    const router = useRouter();
    const [addTauxDialogOpen, setAddTauxDialogOpen] = useState(false);

    const conversionId = (conversion.ID_Convertion || conversion.id).toString();

    const [RemoveConfirmation, confirmRemove] = useConfirm(
        "Êtes-vous sûr?",
        `Voulez-vous vraiment supprimer cette conversion ? Cette action est irréversible.`
    );

    const handleRemoveConversion = async () => {
        const ok = await confirmRemove();
        if (!ok) return;

        try {
            const res = await deleteConversion(conversionId);
            if (!res.success) {
                toast.error("Erreur lors de la suppression de la conversion.");
                return;
            }
            toast.success("Conversion supprimée avec succès.");
            router.push("/conversion");
        } catch (error) {
            toast.error("Erreur lors de la suppression de la conversion.");
        }
    };

    return (
        <>
            <RemoveConfirmation />
            <NewTauxChangeDialog
                open={addTauxDialogOpen}
                onOpenChange={setAddTauxDialogOpen}
                conversionId={conversionId}
            />
            <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
                <ConversionIdHeader
                    conversion={conversion}
                    onAddTaux={() => setAddTauxDialogOpen(true)}
                    onRemove={handleRemoveConversion}
                />
                <TauxChangeList conversion={conversion} tauxList={tauxList} />
            </div>
        </>
    );
};

export const ConversionIdLoadingView = () => {
    return (
        <LoadingState
            title="Chargement de la conversion"
            description="Ceci peut prendre quelques secondes..."
        />
    );
};

export const ConversionIdErrorView = () => {
    return (
        <ErrorState
            title="Erreur du chargement de la conversion"
            description="Quelque chose n'a pas marché lors du chargement de la conversion. Veuillez réessayer."
        />
    );
};