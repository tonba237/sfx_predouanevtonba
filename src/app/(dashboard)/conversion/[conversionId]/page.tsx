import { Suspense } from "react";
import { getConversionById } from "@/modules/conversion/server/actions";
import { getTauxChangeByConversion } from "@/modules/conversion/server/taux-change-actions";
import { ConversionIdView, ConversionIdLoadingView, ConversionIdErrorView } from "@/modules/conversion/ui/views/conversion-id-view";
import console from "console";

interface PageProps {
    params: Promise<{
        conversionId: string;
    }>;
}

export default async function ConversionDetailPage({ params }: PageProps) {
    const { conversionId } = await params;

    const [conversionResult, tauxResult] = await Promise.all([
        getConversionById(conversionId),
        getTauxChangeByConversion(conversionId)
    ]);

    if (!conversionResult.success || !conversionResult.data) {
        return <ConversionIdErrorView />;
    }

    return (
        <div className="flex flex-col h-full">
            <Suspense fallback={<ConversionIdLoadingView />}>
                <ConversionIdView 
                    conversion={conversionResult.data} 
                    tauxList={tauxResult.data || []} 
                />
            </Suspense>
        </div>
    );
}