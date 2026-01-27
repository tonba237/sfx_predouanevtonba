"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { columns } from "../components/columns";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { DateFilter } from "../components/date-filter";

type Props = {
    conversions: any[];
};

export const ConversionsView = ({ conversions }: Props) => {
    const router = useRouter();
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);

    // Filtrer les conversions par date
    const filteredConversions = useMemo(() => {
        if (!conversions) return [];
        
        return conversions.filter((conversion) => {
            const conversionDate = new Date(conversion.Date_Convertion);
            
            // Si pas de filtre, afficher toutes les conversions
            if (!startDate && !endDate) return true;
            
            // Si seulement date de début
            if (startDate && !endDate) {
                const start = new Date(startDate);
                return conversionDate >= start;
            }
            
            // Si seulement date de fin
            if (!startDate && endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
                return conversionDate <= end;
            }
            
            // Si les deux dates
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
                return conversionDate >= start && conversionDate <= end;
            }
            
            return true;
        });
    }, [conversions, startDate, endDate]);

    const handleDateFilter = (newStartDate: string | null, newEndDate: string | null) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
    };

    return (
        <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
            {/* Header avec filtre */}
            <div className="flex items-center justify-between">
                <DateFilter onFilter={handleDateFilter} />
            </div>

            {filteredConversions && filteredConversions.length > 0 && (
                <DataTable
                    data={filteredConversions}
                    columns={columns}
                    onRowClick={(row: any) => {
                        router.push(`/conversion/${row.ID_Convertion}`);
                    }}
                />
            )}

            {conversions && conversions.length > 0 && filteredConversions.length === 0 && (
                <EmptyState
                    title="Aucune conversion trouvée"
                    description="Aucune conversion ne correspond aux critères de date sélectionnés."
                />
            )}

            {conversions?.length === 0 && (
                <EmptyState
                    title="Créer votre première conversion"
                    description="Il n'y a pas encore de conversions dans votre compte."
                />
            )}
        </div>
    );
};

export const ConversionsLoadingView = () => {
    return (
        <LoadingState
            title="Chargement des conversions"
            description="Ceci peut prendre quelques secondes..."
        />
    );
};

export const ConversionsErrorView = () => {
    return (
        <ErrorState
            title="Erreur du chargement des conversions"
            description="Quelque chose n'a pas marché lors du chargement des conversions. Veuillez réessayer."
        />
    );
};