import { Suspense } from "react";
import { getAllConversions } from "@/modules/conversion/server/actions";
import { ConversionsView, ConversionsLoadingView, ConversionsErrorView } from "@/modules/conversion/ui/views/conversions-view";
import ConversionsHeader from "@/modules/conversion/ui/components/conversions-header";

export default async function ConversionPage() {
    const result = await getAllConversions();

    if (!result.success) {
        return <ConversionsErrorView />;
    }

    return (
        <div className="flex flex-col h-full">
            <ConversionsHeader />
            <Suspense fallback={<ConversionsLoadingView />}>
                <ConversionsView conversions={result.data || []} />
            </Suspense>
        </div>
    );
}