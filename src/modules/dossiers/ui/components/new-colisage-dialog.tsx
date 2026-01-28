import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "../../../../components/responsive-dialog";
import { ColisageForm } from "./colisage-form";

interface ColisageDialogProps {
    open: boolean;
    dosierId: string;
    onOpenChange: (open: boolean) => void;
}

export const NewColisageDialog = ({
    open,
    onOpenChange,
    dosierId,
}: ColisageDialogProps) => {
    const router = useRouter();

    return (
        <ResponsiveDialog
            title="Nouveau Colisage"
            description="Créer un nouveau Colisage"
            open={open}
            onOpenChange={onOpenChange}
        >
            <ColisageForm
                onSuccess={(id) => {
                    onOpenChange(false);
                    router.refresh();
                }}
                onCancel={() => onOpenChange(false)}
                dosierId={dosierId}
            />
        </ResponsiveDialog>
    );
};