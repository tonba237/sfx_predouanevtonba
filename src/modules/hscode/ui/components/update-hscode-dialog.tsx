import { ResponsiveDialog } from "@/components/responsive-dialog";
import { HscodeForm } from "./hscode-form";

interface HscodeFormData {
    id: string;
    code: string;
    libelle: string;
}

interface UpdateHscodeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialValues?: HscodeFormData;
}

export const UpdateHscodeDialog = ({ open, onOpenChange, initialValues }: UpdateHscodeDialogProps) => {

    return (
        <ResponsiveDialog
            title="Modifier le Hscode"
            description="Modifiez les informations du Hscode ci-dessous."
            open={open}
            onOpenChange={onOpenChange}
        >
            <HscodeForm
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
                initialValues={initialValues}
            />
        </ResponsiveDialog>
    )
}