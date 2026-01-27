"use client";

import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tauxChangeColumns } from "./taux-change-columns";

type Props = {
    conversion: any;
    tauxList: any[];
};

export const TauxChangeList = ({ conversion, tauxList }: Props) => {
    const conversionId = conversion.ID_Convertion || conversion.id;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Taux de change</CardTitle>
                <CardDescription>
                    Gérez les taux de change pour cette date de conversion
                </CardDescription>
            </CardHeader>
            <CardContent>
                {tauxList && tauxList.length > 0 ? (
                    <DataTable
                        columns={tauxChangeColumns(conversionId.toString())}
                        data={tauxList}
                        searchKey="Devise"
                        searchPlaceholder="Rechercher une devise..."
                    />
                ) : (
                    <EmptyState
                        title="Aucun taux de change"
                        description="Ajoutez des taux de change pour cette conversion"
                    />
                )}
            </CardContent>
        </Card>
    );
};