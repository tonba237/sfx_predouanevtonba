"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface DossierClient {
    ID_Dossier: number;
    No_Dossier: string;
    No_OT: string;
    Libelle_Type_Dossier: string;
    Libelle_Statut_Dossier: string;
    Statut_Dossier: number;
    Libelle_Etape_Actuelle: string;
    Date_Creation: string;
    Date_Ouverture_Dossier: string;
}

interface Props {
    dossiers: DossierClient[];
}

export const ClientDossiers = ({ dossiers }: Props) => {
    const router = useRouter();
    
    // Debug temporaire
    console.log('🔍 [ClientDossiers] Dossiers reçus:', dossiers);
    console.log('📊 [ClientDossiers] Nombre de dossiers:', dossiers?.length);

    const columns: ColumnDef<DossierClient>[] = [
        {
            accessorKey: "No_Dossier",
            header: "N° Dossier",
            cell: ({ row }) => (
                <span className="font-semibold">{row.original.No_Dossier}</span>
            ),
        },
        {
            accessorKey: "No_OT",
            header: "N° OT",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.No_OT || "-"}</span>
            ),
        },
        {
            accessorKey: "Libelle_Type_Dossier",
            header: "Type",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.Libelle_Type_Dossier}</span>
            ),
        },
        {
            accessorKey: "Libelle_Statut_Dossier",
            header: "Statut",
            cell: ({ row }) => {
                const statut = row.original.Statut_Dossier;
                const statusColor: Record<number, string> = {
                    0: "bg-blue-100 text-blue-800", // En cours
                    1: "bg-green-100 text-green-800", // Terminé
                    2: "bg-red-100 text-red-800", // Annulé
                };

                return (
                    <Badge className={statusColor[statut] || "bg-gray-100 text-gray-800"}>
                        {row.original.Libelle_Statut_Dossier}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "Libelle_Etape_Actuelle",
            header: "Étape",
            cell: ({ row }) => (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    {row.original.Libelle_Etape_Actuelle || "-"}
                </span>
            ),
        },
        {
            accessorKey: "Date_Creation",
            header: "Date création",
            cell: ({ row }) => {
                const date = row.original.Date_Creation;
                if (!date) return "-";
                try {
                    return format(new Date(date), "dd MMM yyyy", { locale: fr });
                } catch {
                    return "-";
                }
            },
        },
    ];

    if (dossiers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Dossiers</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Aucun dossier associé à ce client
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dossiers ({dossiers.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <DataTable
                    data={dossiers}
                    columns={columns}
                    onRowClick={(row) => router.push(`/dossiers/${row.ID_Dossier}`)}
                    searchKey="No_Dossier"
                    searchPlaceholder="Rechercher par n° dossier..."
                />
            </CardContent>
        </Card>
    );
};