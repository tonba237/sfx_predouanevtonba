import { useRouter } from "next/navigation";

import { ResponsiveDialog } from "@/components/responsive-dialog";

import { ClientForm } from "./client-form";


interface NewClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export const NewClientDialog = ({ open, onOpenChange, onSuccess }: NewClientDialogProps) => {

    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouveau Client"
            description="Creer un nouveau Client"
            open={open}
            onOpenChange={onOpenChange}
        >
            <ClientForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        router.push(`/client/${id}`);
                    }
                }}
                onCancel={() => onOpenChange(false)}
            />
        </ResponsiveDialog>
    )
}