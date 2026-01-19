"use client";

import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { columns } from "../components/columns";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteHSCode } from "../../server/actions";
import { useConfirm } from "@/hooks/use-confirm";

// Type pour VHSCodes (vue SQL Server)
type VHSCode = {
  ID_HS_Code: number;
  HS_Code: string;
  Libelle_HS_Code: string;
  Date_Creation: Date | string;
  Nom_Creation: string | null;
};

type Props = {
  hscode: VHSCode[];
};

export const HscodeView = ({ hscode }: Props) => {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<VHSCode[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [ConfirmDialog, confirm] = useConfirm(
    "Confirmer la suppression",
    selectedRows.length > 0 
      ? `Voulez-vous vraiment supprimer ${selectedRows.length} HS Code(s) sélectionné(s) ? Cette action est irréversible.`
      : `Voulez-vous vraiment supprimer TOUS les HS Codes (${hscode.length}) ? Cette action est irréversible.`
  );

  const handleDeleteSelected = async () => {
    const ok = await confirm();
    if (!ok) return;

    setIsDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of selectedRows) {
        const result = await deleteHSCode(row.ID_HS_Code.toString());
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} HS Code(s) supprimé(s)`);
        router.refresh();
        setSelectedRows([]);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} HS Code(s) n'ont pas pu être supprimés`);
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    const ok = await confirm();
    if (!ok) return;

    setIsDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const row of hscode) {
        const result = await deleteHSCode(row.ID_HS_Code.toString());
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} HS Code(s) supprimé(s)`);
        router.refresh();
        setSelectedRows([]);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} HS Code(s) n'ont pas pu être supprimés`);
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ConfirmDialog />
      <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
        {hscode.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {selectedRows.length > 0 ? (
              <>
                <span className="text-sm font-medium">
                  {selectedRows.length} ligne(s) sélectionnée(s)
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Suppression..." : "Supprimer la sélection"}
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">
                  {hscode.length} HS Code(s) au total
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="ml-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Suppression..." : "Supprimer tout"}
                </Button>
              </>
            )}
          </div>
        )}

        {hscode && hscode.length > 0 ? (
          <DataTable
            data={hscode}
            columns={columns as any}
            onRowClick={(row) => router.push(`/hscode/${(row as any).ID_HS_Code}`)}
            enableRowSelection={true}
            onSelectionChange={setSelectedRows}
            searchKey="globalSearch"
            searchPlaceholder="Rechercher par code HS ou libellé..."
          />
        ) : (
          <EmptyState
            title="Créer votre premier code HS"
            description="Il n'y a pas encore de codes HS dans votre compte."
          />
        )}
      </div>
    </>
  );
};

export const HscodeLoadingView = () => {
  return (
    <LoadingState
      title="Chargement des codes HS"
      description="Ceci peut prendre quelques secondes..."
    />
  );
};

export const HscodeErrorView = () => {
  return (
    <ErrorState
      title="Erreur du chargements des codes HS"
      description="Quelque chose n'a pas marcher lors du chargement des codes HS. Veuillez reessayer."
    />
  );
};
