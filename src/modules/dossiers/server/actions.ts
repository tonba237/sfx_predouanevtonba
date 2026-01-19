"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Récupère tous les dossiers avec leurs informations complètes via VDossiers
 */
export async function getAllDossiers(
    page = 1,
    take = 10000,
    search = "",
    statutId: number | null = null,
    etapeId: number | null = null
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        // Construire les conditions de filtre
        const where: any = {};

        if (search) {
            where.OR = [
                { No_Dossier: { contains: search } },
                { No_OT: { contains: search } },
                { Nom_Client: { contains: search } },
                { Libelle_Type_Dossier: { contains: search } },
            ];
        }

        if (statutId !== null) {
            where.ID_Statut_Dossier = statutId;
        }

        if (etapeId !== null) {
            where.ID_Etape_Actuelle = etapeId;
        }

        const dossiers = await prisma.vDossiers.findMany({
            where,
            orderBy: { ID_Dossier: "desc" },
            take,
            skip: (page - 1) * take,
        });

        // Convertir les Decimal en nombres pour les composants client
        const serializedDossiers = JSON.parse(JSON.stringify(dossiers));

        return { success: true, data: serializedDossiers, total: serializedDossiers.length };
    } catch (error) {
        console.error("getAllDossiers error:", error);
        return { success: false, error };
    }
}

/**
 * Récupère un dossier par ID via VDossiers
 */
export async function getDossierById(id: string) {
    try {
        const dossier = await prisma.vDossiers.findFirst({
            where: { ID_Dossier: parseInt(id) },
        });

        if (!dossier) {
            return { success: false, error: "Dossier non trouvé" };
        }

        // Sérialiser TOUS les Decimal via JSON.parse(JSON.stringify())
        const serializedDossier = JSON.parse(JSON.stringify(dossier));

        return { success: true, data: serializedDossier };
    } catch (error) {
        console.error("getDossierById error:", error);
        return { success: false, error };
    }
}

/**
 * Crée un nouveau dossier
 * Utilise automatiquement la branche 0 (DEFAULT BRANCH) et la conversion 1
 */
export async function createDossier(data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        // 1. Insertion SQL brute dans la table TDossiers (pas la vue VDossiers)
        const result = await prisma.$executeRaw`
          INSERT INTO [dbo].[TDossiers]
            ([Branche], [Type Dossier], [Client], [Description Dossier], [No OT], [No Dossier], 
             [Qte Colis OT], [Poids Brut OT], [Poids Net OT], [Volume OT], 
             [Responsable Dossier], [Statut Dossier], [Session], [Date Creation])
          VALUES
            (0, ${data.typeDossierId}, ${data.clientId}, ${data.description || "N'"}, 
             ${data.noOT || ""}, ${data.noDossier || ""}, ${data.qteColisOT || 1}, 
             ${data.poidsBrutOT || 0}, ${data.poidsNetOT || 0}, ${data.volumeOT || 0}, 
             ${parseInt(session.user.id)}, ${data.statutDossierId || 0}, 
             ${parseInt(session.user.id)}, SYSDATETIME())
        `;

        // 2. Récupération du dossier créé via la vue VDossiers
        const dossier = await prisma.$queryRaw<
          {
              ID_Dossier: number;
              Branche: number;
              Type_Dossier: number;
              Client: number;
              Description_Dossier: string;
              No_OT: string;
              No_Dossier: string;
              Qte_Colis_OT: number;
              Poids_Brut_OT: number;
              Poids_Net_OT: number;
              Volume_OT: number;
              Responsable_Dossier: number;
              Statut_Dossier: number;
              Session: number;
              Date_Creation: Date;
          }[]
        >`
          SELECT TOP 1
            [ID Dossier] AS ID_Dossier,
            [Branche] AS Branche,
            [Type Dossier] AS Type_Dossier,
            [Client] AS Client,
            [Description Dossier] AS Description_Dossier,
            [No OT] AS No_OT,
            [No Dossier] AS No_Dossier,
            [Qte Colis OT] AS Qte_Colis_OT,
            [Poids Brut OT] AS Poids_Brut_OT,
            [Poids Net OT] AS Poids_Net_OT,
            [Volume OT] AS Volume_OT,
            [Responsable Dossier] AS Responsable_Dossier,
            [Statut Dossier] AS Statut_Dossier,
            [Session] AS Session,
            [Date Creation] AS Date_Creation
          FROM [dbo].[VDossiers]
          ORDER BY [ID Dossier] DESC
        `;

        revalidatePath("/dossiers");
        return { success: true, data: dossier[0] };
    } catch (error) {
        console.error("createDossier error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}

/**
 * Met à jour un dossier
 */
export async function updateDossier(id: string, data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const dossier = await prisma.tDossiers.update({
            where: { ID_Dossier: parseInt(id) },
            data: {
                ...(data.brancheId && { Branche: data.brancheId }),
                ...(data.typeDossierId && { Type_Dossier: data.typeDossierId }),
                ...(data.clientId && { Client: data.clientId }),
                ...(data.description && { Description_Dossier: data.description }),
                ...(data.noOT && { No_OT: data.noOT }),
                ...(data.noDossier && { No_Dossier: data.noDossier }),
                ...(data.qteColisOT !== undefined && { Qte_Colis_OT: data.qteColisOT }),
                ...(data.poidsBrutOT !== undefined && { Poids_Brut_OT: data.poidsBrutOT }),
                ...(data.poidsNetOT !== undefined && { Poids_Net_OT: data.poidsNetOT }),
                ...(data.volumeOT !== undefined && { Volume_OT: data.volumeOT }),
                ...(data.statutDossierId && { Statut_Dossier: data.statutDossierId }),
            },
        });

        revalidatePath(`/dossiers/${id}`);
        revalidatePath("/dossiers");
        return { success: true, data: dossier };
    } catch (error) {
        console.error("updateDossier error:", error);
        return { success: false, error };
    }
}

/**
 * Supprime un dossier
 */
export async function deleteDossier(id: string) {
    try {
        const dossier = await prisma.tDossiers.delete({
            where: { ID_Dossier: parseInt(id) },
        });

        revalidatePath("/dossiers");
        return { success: true, data: dossier };
    } catch (error) {
        console.error("deleteDossier error:", error);
        return { success: false, error };
    }
}

/**
 * Récupère tous les clients pour le sélecteur
 */
export async function getAllClientsForSelect() {
    try {
        const clients = await prisma.tClients.findMany({
            where: {
                ID_Client: { gt: 0 } // Exclure les valeurs système (ID = 0)
            },
            select: {
                ID_Client: true,
                Nom_Client: true,
            },
            orderBy: { Nom_Client: "asc" },
        });

        return { success: true, data: clients };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les types de dossiers
 */
export async function getAllTypesDossiers() {
    try {
        const types = await prisma.tTypesDossiers.findMany({
            where: {
                ID_Type_Dossier: { gt: 0 } // Exclure les valeurs système
            },
            select: {
                ID_Type_Dossier: true,
                Libelle_Type_Dossier: true,
            },
            orderBy: { Libelle_Type_Dossier: "asc" },
        });

        return { success: true, data: types };
    } catch (error) {
        return { success: false, error };
    }
} 

/**
 * Récupère tous les sens de trafic
 */
export async function getAllSensTrafic() {
    try {
        const sens = await prisma.tSensTrafic.findMany({
            where: {
                ID_Sens_Trafic: { gt: "0" } // Exclure les valeurs système (ID_Sens_Trafic est String)
            },
            select: {
                ID_Sens_Trafic: true,
                Libelle_Sens_Trafic: true,
            },
            orderBy: { Libelle_Sens_Trafic: "asc" },
        });

        return { success: true, data: sens };
    } catch (error) {
        return { success: false, error };
    }
} // Ajout de la fermeture de fonction

/**
 * Récupère tous les modes de transport
 */
export async function getAllModesTransport() {
    try {
        const modes = await prisma.tModesTransport.findMany({
            where: {
                ID_Mode_Transport: { gt: "0" } // Exclure les valeurs système (ID_Mode_Transport est String)
            },
            select: {
                ID_Mode_Transport: true,
                Libelle_Mode_Transport: true,
            },
            orderBy: { Libelle_Mode_Transport: "asc" },
        });

        return { success: true, data: modes };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les branches
 */
export async function getAllBranches() {
    try {
        const branches = await prisma.tBranches.findMany({
            select: {
                ID_Branche: true,
                Nom_Branche: true,
            },
            orderBy: { Nom_Branche: "asc" },
        });

        return { success: true, data: branches };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les entités
 */
export async function getAllEntites() {
    try {
        const entites = await prisma.tEntites.findMany({
            select: {
                ID_Entite: true,
                Nom_Entite: true,
            },
            orderBy: { Nom_Entite: "asc" },
        });

        return { success: true, data: entites };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère tous les statuts de dossiers
 */
export async function getAllStatutsDossiers() {
    try {
        const statuts = await prisma.tStatutsDossier.findMany({
            select: {
                ID_Statut_Dossier: true,
                Libelle_Statut_Dossier: true,
            },
            orderBy: { Libelle_Statut_Dossier: "asc" },
        });

        // Mapper pour avoir un format cohérent
        const mappedStatuts = statuts.map(s => ({
            id: s.ID_Statut_Dossier,
            libelle: s.Libelle_Statut_Dossier,
        }));

        return { success: true, data: mappedStatuts };
    } catch (error) {
        return { success: false, error };
    }
}

/**
 * Récupère toutes les étapes disponibles
 */
export async function getAllEtapes() {
    try {
        // Utiliser les étapes actuelles des dossiers pour garantir la correspondance
        const etapes = await prisma.vDossiers.findMany({
            select: {
                ID_Etape_Actuelle: true,
                Libelle_Etape_Actuelle: true,
            },
            distinct: ["ID_Etape_Actuelle"],
            orderBy: { Libelle_Etape_Actuelle: "asc" },
        });

        // Mapper pour avoir le même format
        const mappedEtapes = etapes.map(e => ({
            idEtape: e.ID_Etape_Actuelle,
            libelleEtape: e.Libelle_Etape_Actuelle,
        }));

        return { success: true, data: mappedEtapes };
    } catch (error) {
        console.error("getAllEtapes error:", error);
        return { success: false, error };
    }
}

/**
 * Récupère tous les dossiers d'un client spécifique
 */
export async function getDossiersByClientId(clientId: string) {
    try {
        console.log('🔍 [getDossiersByClientId] Recherche dossiers pour client ID:', clientId);
        
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const clientIdInt = parseInt(clientId);
        console.log('📝 [getDossiersByClientId] Client ID converti:', clientIdInt);

        const dossiers = await prisma.vDossiers.findMany({
            where: { ID_Client: clientIdInt },
            orderBy: { Date_Creation: "desc" },
            select: {
                ID_Dossier: true,
                No_Dossier: true,
                No_OT: true,
                ID_Client: true,
                Nom_Client: true,
                Libelle_Type_Dossier: true,
                Libelle_Statut_Dossier: true,
                ID_Statut_Dossier: true,
                ID_Etape_Actuelle: true,
                Libelle_Etape_Actuelle: true,
                Date_Creation: true,
                Date_Ouverture_Dossier: true,
            },
        });

        console.log('📊 [getDossiersByClientId] Dossiers trouvés:', dossiers.length);
        console.log('📋 [getDossiersByClientId] Premier dossier:', dossiers[0]);

        // Sérialiser les données pour éviter les erreurs Decimal et mapper les noms
        const serializedDossiers = dossiers.map(d => ({
            ID_Dossier: d.ID_Dossier,
            No_Dossier: d.No_Dossier,
            No_OT: d.No_OT,
            ID_Client: d.ID_Client,
            Nom_Client: d.Nom_Client,
            Libelle_Type_Dossier: d.Libelle_Type_Dossier,
            Libelle_Statut_Dossier: d.Libelle_Statut_Dossier,
            "Statut Dossier": d.ID_Statut_Dossier,
            "Libelle Etape Actuelle": d.Libelle_Etape_Actuelle,
            Date_Creation: d.Date_Creation,
            "Date Ouverture Dossier": d.Date_Ouverture_Dossier,
        }));

        return { success: true, data: serializedDossiers };
    } catch (error) {
        console.error("❌ [getDossiersByClientId] error:", error);
        return { success: false, error: "Erreur lors de la récupération des dossiers" };
    }
}