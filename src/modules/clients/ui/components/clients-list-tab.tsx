"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { UserPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { getAllClients } from "../../server/actions";
import { AssociateRegimeDialog } from "./associate-regime-dialog";
import { NewClientDialog } from "./new-client-dialog";

interface Client {
    ID_Client: number;
    Nom_Client: string;
    Date_Creation: Date;
    Nom_Creation: string | null;
}

interface ClientForDialog {
    id: number;
    nomClient: string;
}

export const ClientsListTab = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<ClientForDialog | null>(null);
    const [showAssociateDialog, setShowAssociateDialog] = useState(false);
    const [showNewClientDialog, setShowNewClientDialog] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setIsLoading(true);
        try {
            const result = await getAllClients(1, 10000);
            if (result.success && result.data) {
                setClients(result.data);
            }
        } catch (error) {
            console.error("Error loading clients:", error);
            toast.error("Erreur lors du chargement des clients");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRowClick = (client: Client) => {
        router.push(`/client/${client.ID_Client}`);
    };

    const handleAssociateRegime = (e: React.MouseEvent, client: Client) => {
        e.stopPropagation(); // Empêcher la navigation vers la page de détails
        // Adapter le format pour le dialog
        const adaptedClient = {
            id: client.ID_Client,
            nomClient: client.Nom_Client
        };
        setSelectedClient(adaptedClient);
        setShowAssociateDialog(true);
    };

    const columns: ColumnDef<Client>[] = [
        {
            accessorKey: "Nom_Client",
            header: "Nom du client",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("Nom_Client")}</div>
            ),
        },
        {
            accessorKey: "Date_Creation",
            header: "Date de création",
            cell: ({ row }) => {
                const dateValue = row.getValue("Date_Creation") as Date;
                if (!dateValue) return "-";
                
                try {
                    if (isNaN(dateValue.getTime())) return "-";
                    return dateValue.toLocaleDateString("fr-FR");
                } catch {
                    return "-";
                }
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const client = row.original;
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleAssociateRegime(e, client)}
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Associer régime
                    </Button>
                );
            },
        },
    ];

    if (isLoading) {
        return (
            <LoadingState 
                title="Chargement des clients..." 
                description="Veuillez patienter..." 
            />
        );
    }

    return (
        <>
            <AssociateRegimeDialog
                open={showAssociateDialog}
                onOpenChange={setShowAssociateDialog}
                client={selectedClient}
                onSuccess={() => {
                    setShowAssociateDialog(false);
                }}
            />

            <NewClientDialog
                open={showNewClientDialog}
                onOpenChange={setShowNewClientDialog}
                onSuccess={() => {
                    setShowNewClientDialog(false);
                    loadClients();
                    toast.success("Client créé avec succès");
                }}
            />

            {clients.length === 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium">Liste des clients</h3>
                            <p className="text-sm text-muted-foreground">
                                Aucun client n'a été trouvé
                            </p>
                        </div>
                        
                        <Button onClick={() => setShowNewClientDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau client
                        </Button>
                    </div>
                    
                    <EmptyState
                        title="Aucun client"
                        description="Commencez par créer votre premier client pour pouvoir lui associer des régimes de déclaration."
                    />
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium">Liste des clients</h3>
                            <p className="text-sm text-muted-foreground">
                                Sélectionnez un client pour lui associer un régime
                            </p>
                        </div>
                        
                        <Button onClick={() => setShowNewClientDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau client
                        </Button>
                    </div>

                    <DataTable
                        columns={columns}
                        data={clients}
                        searchKey="Nom_Client"
                        searchPlaceholder="Rechercher un client..."
                        onRowClick={handleRowClick}
                    />
                </>
            )}
        </>
    );
};