import { ResponsiveDialog } from "@/components/responsive-dialog";

import { ClientForm } from "./client-form";
import { TClients } from '@/generated/prisma/client';



interface UpdateClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: {
        id: string;
        nomClient: string;
    };
}

export const UpdateClientDialog = ({ open, onOpenChange, initialValues }: UpdateClientDialogProps) => {
    // Plus besoin de conversion, les données sont déjà au bon format
    return (
        <ResponsiveDialog
            title="Modifier le client"
            description="Modifiez les informations du client ci-dessous."
            open={open}
            onOpenChange={onOpenChange}
        >
            <ClientForm
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
                initialValues={initialValues}
            />
        </ResponsiveDialog>
    )
}