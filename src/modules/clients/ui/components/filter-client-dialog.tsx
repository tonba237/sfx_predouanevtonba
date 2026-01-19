"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAllClients } from "../../server/actions";

const filterClientSchema = z.object({
    clientId: z.string().optional(),
});

interface FilterClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFilter: (clientId: number | null) => void;
    selectedClientId: number | null;
}

export const FilterClientDialog = ({
    open,
    onOpenChange,
    onFilter,
    selectedClientId,
}: FilterClientDialogProps) => {
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof filterClientSchema>>({
        resolver: zodResolver(filterClientSchema),
        defaultValues: {
            clientId: selectedClientId?.toString() || "",
        },
    });

    useEffect(() => {
        if (open) {
            loadClients();
            form.setValue("clientId", selectedClientId?.toString() || "");
        }
    }, [open, selectedClientId, form]);

    const loadClients = async () => {
        setIsLoading(true);
        try {
            const result = await getAllClients(1, 10000);
            
            if (result.success && result.data) {
                const clientOptions = result.data.map(c => ({
                    id: c.ID_Client.toString(),
                    value: c.ID_Client.toString(),
                    children: (
                        <div className="flex items-center gap-x-2">
                            <GeneratedAvatar
                                seed={c.Nom_Client}
                                variant="initials"
                                className="border size-6"
                            />
                            <span>{c.Nom_Client}</span>
                        </div>
                    ),
                }));

                // Ajouter l'option "Tous les clients"
                setClients([
                    {
                        id: "",
                        value: "",
                        children: <span className="font-medium text-muted-foreground">Tous les clients</span>
                    },
                    ...clientOptions
                ]);
            }
        } catch (error) {
            console.error("Error loading clients:", error);
            toast.error("Erreur lors du chargement des clients");
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = (data: z.infer<typeof filterClientSchema>) => {
        const clientId = data.clientId && data.clientId !== "" ? parseInt(data.clientId) : null;
        onFilter(clientId);
        onOpenChange(false);
    };

    const handleClearFilter = () => {
        form.setValue("clientId", "");
        onFilter(null);
        onOpenChange(false);
    };

    const isPending = form.formState.isSubmitting;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Filtrer par client</DialogTitle>
                    <DialogDescription>
                        Sélectionnez un client pour afficher uniquement ses régimes associés
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client</FormLabel>
                                    <FormControl>
                                        <CommandSelect
                                            options={clients}
                                            value={field.value || ""}
                                            onSelect={field.onChange}
                                            placeholder="Sélectionner un client..."
                                            className={isLoading || isPending ? "opacity-50 pointer-events-none" : ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>

                <DialogFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={handleClearFilter}
                        disabled={isPending}
                        type="button"
                    >
                        Effacer le filtre
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            type="button"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isPending}
                            type="button"
                        >
                            {isPending ? "Application..." : "Appliquer"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};