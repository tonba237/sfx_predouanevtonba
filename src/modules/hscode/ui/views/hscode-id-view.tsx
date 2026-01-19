"use client";

import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  CodeSquare,
  Edit,
  MapPin,
  Globe,
  Calendar,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { HscodeIdViewHeader } from "../components/hscode-id-view-header";
import { useConfirm } from "@/hooks/use-confirm";
import { deleteHSCode } from "../../server/actions";
import { UpdateHscodeDialog } from "../components/update-hscode-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ============================================================================ */
/* TYPES */
/* ============================================================================ */

type VHSCode = {
  ID_HS_Code: number;
  HS_Code: string;
  Libelle_HS_Code: string;
  Date_Creation: Date | string;
  Nom_Creation: string | null;
};

interface Props {
  hscodeId: string;
  hscode: VHSCode;
}

/* ============================================================================ */
/* COMPONENT */
/* ============================================================================ */

export const HscodeIdView = ({ hscodeId, hscode }: Props) => {
  const router = useRouter();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  /* =========================
       VALIDATION ID (CRUCIAL)
    ========================= */
  const safeHscodeId = useMemo(() => {
    if (!hscodeId) return null;
    if (Number.isNaN(Number(hscodeId))) return null;
    return hscodeId;
  }, [hscodeId]);

  if (!safeHscodeId) {
    return <ErrorState title="HS Code invalide" description="Identifiant incorrect." />;
  }

  /* =========================
      CONFIRM DELETE
   ========================= */
  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Êtes-vous sûr ?",
    `Voulez-vous vraiment supprimer le HS Code "${hscode.HS_Code}" ? Cette action est irréversible.`
  );
  const handleRemoveHscode = async () => {
    const ok = await confirmRemove();

    if (!ok) return;

    try {
      const res = await deleteHSCode(safeHscodeId);

      if (!res.success) {
        toast.error("Erreur lors de la suppression du Hscode.");
        return;
      }
      toast.success("Hscode supprimé avec succès.");
      router.push("/hscode");
    } catch (error) {
      toast.error("Erreur lors de la suppression du Hscode.");
    }
  };

  /* =========================
     FORM INITIAL VALUES
  ========================= */
  const formInitialValues = {
    id: safeHscodeId,
    code: hscode.HS_Code,
    libelle: hscode.Libelle_HS_Code,
  };

  /* ======================================================================== */
  /* RENDER */
  /* ======================================================================== */

  return (
    <>
      <RemoveConfirmation />

      <UpdateHscodeDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        initialValues={formInitialValues}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-6">
        <HscodeIdViewHeader
          hscodeId={hscodeId}
          code={hscode.HS_Code}
          onEdit={() => setIsUpdateDialogOpen(true)}
          onRemove={handleRemoveHscode}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{hscode.HS_Code}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Informations HSCode
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CodeSquare className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Code HS</p>
                      <p className="font-medium">{hscode.HS_Code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Edit className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Libellé</p>
                      <p className="font-medium">{hscode.Libelle_HS_Code}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Informations secondaires */}
          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date de création
                </p>
                <p className="text-sm mt-1">
                  {hscode.Date_Creation ? format(new Date(hscode.Date_Creation), "d MMMM yyyy à HH:mm", {
                    locale: fr,
                  }) : "-"}
                </p>
              </div>

              {hscode.Nom_Creation && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Créé par
                    </p>
                    <p className="text-sm mt-1">
                      {hscode.Nom_Creation}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

/* ============================================================================ */
/* STATES */
/* ============================================================================ */

export const HscodeIdLoadingView = () => {
  return (
    <LoadingState
      title="Chargement du code HS"
      description="Ceci peut prendre quelques secondes."
    />
  );
};

export const HscodeIdErrorView = () => {
  return (
    <ErrorState
      title="Erreur lors du chargement du code HS"
      description="Une erreur est survenue."
    />
  );
};
