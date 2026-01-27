"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTauxChange } from "../../server/taux-change-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";

// Composant pour le bouton de suppression avec confirmation
const DeleteTauxButton = ({ taux, conversionId }: { taux: any; conversionId: string }) => {
    const router = useRouter();
    const [ConfirmDialog, confirm] = useConfirm(
        "Supprimer le taux de change",
        `Êtes-vous sûr de vouloir supprimer le taux de change pour ${taux.Devise} ?`
    );

    const handleDelete = async () => {
        const ok = await confirm();
        if (!ok) return;

        const result = await deleteTauxChange(
            taux.ID_Taux_Change.toString(), 
            conversionId
        );
        if (result.success) {
            toast.success("Taux supprimé");
            router.refresh();
        } else {
            toast.error(result.error || "Erreur lors de la suppression");
        }
    };

    return (
        <>
            <ConfirmDialog />
            <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </>
    );
};

export const tauxChangeColumns = (conversionId: string): ColumnDef<any>[] => [
    {
        accessorKey: "Devise",
        header: "Devise",
    },
    {
        accessorKey: "Taux_Change",
        header: "Taux de change",
        cell: ({ row }) => {
            const tauxValue = row.getValue("Taux_Change");
            if (!tauxValue) return "0.000000";
            const taux = parseFloat(tauxValue as string);
            return taux.toFixed(6);
        },
    },
    {
        accessorKey: "Date_Creation",
        header: "Date de création",
        cell: ({ row }) => {
            const dateValue = row.getValue("Date_Creation");
            if (!dateValue) return "N/A";
            try {
                const date = new Date(dateValue as string);
                return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
            } catch {
                return "N/A";
            }
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const taux = row.original;
            
            // Empêcher la suppression de la devise locale (ID 0)
            const isDeviseLocale = taux.ID_Devise === 0;

            if (isDeviseLocale) {
                return (
                    <div className="flex items-center text-xs text-muted-foreground">
                        Devise locale
                    </div>
                );
            }

            return <DeleteTauxButton taux={taux} conversionId={conversionId} />;
        },
    },
];