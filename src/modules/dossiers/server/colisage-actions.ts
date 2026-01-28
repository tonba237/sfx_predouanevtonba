"use server";

import { Prisma } from "@/generated/prisma/browser";
// ============================================================================
// MODULE COLISAGE-ACTIONS.TS - GESTION DES COLISAGES
// ============================================================================
// Rôle global : Ce fichier contient toutes les actions serveur pour la gestion
// des colisages (packages) dans les dossiers de douane. Il gère les opérations
// CRUD (Créer, Lire, Mettre à jour, Supprimer), l'import Excel et les
// statistiques des colisages.
//
// Architecture :
// - Utilise VColisageDossiers (vue) pour les lectures avec jointures
// - Utilise TColisageDossiers (table) pour les écritures
// - Inclut l'authentification utilisateur pour sécuriser les actions
// - Gère la sérialisation des Decimal Prisma
// - Invalide le cache Next.js après modifications
// ============================================================================

// Import des bibliothèques nécessaires
import auth from "@/lib/auth";  // Système d'authentification pour sécuriser les actions
import prisma from "@/lib/prisma";  // Client Prisma pour les interactions avec la base de données
import { revalidatePath } from "next/cache";  // Fonction Next.js pour invalider le cache
import { headers } from "next/headers";  // Fonction Next.js pour récupérer les en-têtes HTTP (sessions)

/**
 * Convertit les Decimal de Prisma en nombres via JSON
 */
function convertDecimalsToNumbers(data: any): any {
    const jsonString = JSON.stringify(data, (_, value) => {
        if (value && typeof value === 'object' && value.constructor.name === 'Decimal') {
            return parseFloat(value.toString());
        }
        return value;
    });
    return JSON.parse(jsonString);
}

/**
 * Crée un nouveau colisage dans un dossier
 */
export async function createColisage(data: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const colisage = await prisma.tColisageDossiers.create({
            data: {
                Dossier: data.dossierId,
                HS_Code: data.hsCodeId,
                Description_Colis: data.description,
                No_Commande: data.numeroCommande,
                Nom_Fournisseur: data.nomFournisseur,
                No_Facture: data.numeroFacture,
                Devise: data.deviseId,
                Item_No: data.article?.toString() || "1",
                Qte_Colis: data.quantite || 1,
                Prix_Unitaire_Colis: data.prixUnitaireColis || 0,
                Poids_Brut: data.poidsBrut || 0,
                Poids_Net: data.poidsNet || 0,
                Volume: data.volume || 0,
                Pays_Origine: data.paysOrigineId,
                Regime_Declaration: data.regimeDeclarationId,
                Regroupement_Client: data.regroupementClient || '-',
                UploadKey: data.uploadKey || `COL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                Session: parseInt(session.user.id),
                Date_Creation: new Date(),
            },
        });

        revalidatePath(`/dossiers/${data.dossierId}`);
        revalidatePath("/colisage");
        return {
            success: true,
            data: convertDecimalsToNumbers(colisage),
        };
    } catch (error) {
        console.error("createColisage error:", error);
        return { success: false, error };
    }
}


/**
 * ============================================================================
 * FONCTION : getColisagesDossier
 * ============================================================================
 * Rôle global : Récupère TOUS les colisages d'un dossier spécifique avec
 * toutes leurs informations (jointures incluses) via la vue VColisageDossiers.
 * 
 * Paramètre :
 * @param dossierId - ID numérique du dossier pour lequel on veut les colisages
 * 
 * Retour : Objet { success: boolean, data: array, error?: string }
 * ============================================================================
 */
export async function getColisagesDossier(dossierId: number) {
    try {
        // --------------------------------------------------------------------
        // 1️⃣ VÉRIFICATION DE L'AUTHENTIFICATION
        // --------------------------------------------------------------------
        // Récupère la session utilisateur depuis les en-têtes HTTP
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        // Si aucune session n'est trouvée, l'utilisateur n'est pas authentifié
        if (!session) {
            throw new Error("Missing User Session");
        }

        // --------------------------------------------------------------------
        // 2️⃣ RÉCUPÉRATION DES COLISAGES PRINCIPAUX
        // --------------------------------------------------------------------
        // Interroge la vue VColisageDossiers qui contient déjà toutes les jointures
        const colisages = await prisma.vColisageDossiers.findMany({
            where: { ID_Dossier: dossierId },    // Filtre : uniquement les colisages du dossier spécifié
            orderBy: { Date_Creation: 'asc' }     // Tri : par date de création croissante (plus ancien d'abord)
        });

        // --------------------------------------------------------------------
        // 3️⃣ RÉCUPÉRATION DES UPLOADKEYS MANQUANTS
        // --------------------------------------------------------------------
        // La vue VColisageDossiers ne contient pas l'UploadKey, on va la chercher
        // dans la table TColisageDossiers pour chaque colisage
        const uploadKeys = await prisma.tColisageDossiers.findMany({
            where: { Dossier: dossierId },                    // Même filtre que ci-dessus
            select: { ID_Colisage_Dossier: true, UploadKey: true }  // Sélectionne uniquement l'ID et l'UploadKey
        });
        
        // Crée une Map (dictionnaire) pour un accès O(1) aux UploadKeys par ID
        // Format : Map( ID_Colisage_Dossier => UploadKey )
        const uploadKeyMap = new Map(uploadKeys.map(uk => [uk.ID_Colisage_Dossier, uk.UploadKey]));

        // --------------------------------------------------------------------
        // 4️⃣ MAPPING DES DONNÉES POUR LE FRONTEND
        // --------------------------------------------------------------------
        // Transforme les données de la vue en format compatible avec le frontend
        // Conserve les noms de colonnes originaux pour la rétrocompatibilité
        const mappedColisages = colisages.map(c => ({
            ID_Colisage_Dossier: c.ID_Colisage_Dossier,     // Identifiant unique du colisage
            ID_Dossier: c.ID_Dossier,                     // ID du dossier parent
            HS_Code: c.HS_Code,                            // Code HS (Harmonized System) du produit
            Description_Colis: c.Description_Colis,         // Description détaillée du colisage
            No_Commande: c.No_Commande,                    // Numéro de commande client
            Nom_Fournisseur: c.Nom_Fournisseur,            // Nom du fournisseur
            No_Facture: c.No_Facture,                      // Numéro de facture
            Item_No: c.Item_No,                            // Numéro d'article (SKU)
            Code_Devise: c.Code_Devise,                    // Code de la devise (EUR, USD, etc.)
            Qte_Colis: c.Qte_Colis,                     // Quantité de colis
            Prix_Unitaire_Colis: c.Prix_Unitaire_Colis, // Prix unitaire du colisage
            Poids_Brut: c.Poids_Brut,                      // Poids brut en kg
            Poids_Net: c.Poids_Net,                        // Poids net en kg
            Volume: c.Volume,                             // Volume en m³
            Pays_Origine: c.Pays_Origine,                  // Pays d'origine du produit
            ID_Regime_Declaration: c.ID_Regime_Declaration, // ID du régime douanier de déclaration
            ID_Regime_Douanier: c.ID_Regime_Douanier,       // ID du régime douanier
            Libelle_Regime_Declaration: c.Libelle_Regime_Declaration, // Libellé lisible du régime
            Regroupement_Client: c.Regroupement_Client,   // Champ de regroupement pour le client
            UploadKey: uploadKeyMap.get(c.ID_Colisage_Dossier) || null, // Clé d'upload (récupérée depuis la Map)
            Date_Creation: c.Date_Creation,               // Date et heure de création
            Nom_Creation: c.Nom_Creation,                  // Nom de l'utilisateur qui a créé
        }));

        // --------------------------------------------------------------------
        // 5️⃣ SÉRIALISATION DES DONNÉES
        // --------------------------------------------------------------------
        // Prisma retourne des objets Decimal qui ne peuvent pas être sérialisés en JSON
        // JSON.parse(JSON.stringify()) convertit les Decimal en nombres normaux
        const serializedColisages = JSON.parse(JSON.stringify(mappedColisages));

        // --------------------------------------------------------------------
        // 6️⃣ RETOUR DU RÉSULTAT
        // --------------------------------------------------------------------
        return { success: true, data: serializedColisages };
    } catch (error) {
        // En cas d'erreur, log l'erreur dans la console et retourne un objet d'erreur
        console.error('getColisagesDossier error:', error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}

/**
 * ============================================================================
 * FONCTION : getColisageById
 * ============================================================================
 * Rôle global : Récupère UN SEUL colisage spécifique par son ID avec toutes
 * ses informations détaillées. Résout également les IDs manquants en faisant
 * des recherches supplémentaires dans les tables de référence.
 * 
 * Paramètre :
 * @param id - ID numérique du colisage à récupérer
 * 
 * Retour : Objet { success: boolean, data: object, error?: string }
 * ============================================================================
 */
export async function getColisageById(id: number) {
    try {
        // Vérification de l'authentification utilisateur
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        // Si pas de session, lance une erreur
        if (!session) {
            throw new Error("Missing User Session");
        }

        // Recherche du colisage par ID via la vue VColisageDossiers
        const colisage = await prisma.vColisageDossiers.findFirst({
            where: { ID_Colisage_Dossier: id }
        });

        // Si aucun colisage trouvé, retourne une erreur
        if (!colisage) {
            return { success: false, error: 'Colisage non trouvé' };
        }

        // Récupération de l'uploadKey depuis la table TColisageDossiers (non inclus dans la vue)
        const uploadKeyData = await prisma.tColisageDossiers.findUnique({
            where: { ID_Colisage_Dossier: colisage.ID_Colisage_Dossier },
            select: { UploadKey: true }
        });

        // Mapping vers les anciens noms de colonnes pour la compatibilité frontend
        const mappedColisage = {
            ID_Colisage_Dossier: colisage.ID_Colisage_Dossier,     // ID du colisage
            ID_Dossier: colisage.ID_Dossier,                     // ID du dossier parent
            HS_Code: colisage.HS_Code,                            // Code HS du produit
            Description_Colis: colisage.Description_Colis,         // Description du colis
            No_Commande: colisage.No_Commande,                    // Numéro de commande
            Nom_Fournisseur: colisage.Nom_Fournisseur,            // Nom du fournisseur
            No_Facture: colisage.No_Facture,                      // Numéro de facture
            Item_No: colisage.Item_No,                            // Numéro d'article
            Code_Devise: colisage.Code_Devise,                    // Code de la devise
            Qte_Colis: colisage.Qte_Colis,                     // Quantité de colis
            Prix_Unitaire_Colis: colisage.Prix_Unitaire_Colis, // Prix unitaire facturé
            Poids_Brut: colisage.Poids_Brut,                      // Poids brut
            Poids_Net: colisage.Poids_Net,                        // Poids net
            Volume: colisage.Volume,                             // Volume
            Pays_Origine: colisage.Pays_Origine,                  // Pays d'origine
            ID_Regime_Declaration: colisage.ID_Regime_Declaration, // ID du régime de déclaration
            ID_Regime_Douanier: colisage.ID_Regime_Douanier,       // ID du régime douanier
            Libelle_Regime_Declaration: colisage.Libelle_Regime_Declaration, // Libellé du régime
            Regroupement_Client: colisage.Regroupement_Client,   // Regroupement client
            UploadKey: uploadKeyData?.UploadKey || null,       // Clé d'upload
            Date_Creation: colisage.Date_Creation,               // Date de création
            Nom_Creation: colisage.Nom_Creation,                  // Nom du créateur
        };

        // Sérialisation des Decimal pour éviter les erreurs de sérialisation JSON
        const serializedColisage = JSON.parse(JSON.stringify(mappedColisage));

        // Résolution des IDs manquants pour la compatibilité
        // 1. ID_Devise à partir de Code_Devise
        if (serializedColisage.Code_Devise && !serializedColisage.ID_Devise) {
            const devise = await prisma.vDevises.findFirst({
                where: { Code_Devise: serializedColisage.Code_Devise },
                select: { ID_Devise: true }
            });
            if (devise) {
                serializedColisage.ID_Devise = devise.ID_Devise;
            }
        }

        // 2. ID_Pays_Origine à partir de Pays_Origine
        if (serializedColisage.Pays_Origine && !serializedColisage.ID_Pays_Origine) {
            const pays = await prisma.vPays.findFirst({
                where: { Libelle_Pays: serializedColisage.Pays_Origine },
                select: { ID_Pays: true }
            });
            if (pays) {
                serializedColisage.ID_Pays_Origine = pays.ID_Pays;
            }
        }

        // 3. ID_HS_Code à partir de HS_Code (string)
        if (serializedColisage.HS_Code && !serializedColisage.ID_HS_Code) {
            const hsCode = await prisma.vHSCodes.findFirst({
                where: { HS_Code: serializedColisage.HS_Code },
                select: { ID_HS_Code: true }
            });
            if (hsCode) {
                serializedColisage.ID_HS_Code = hsCode.ID_HS_Code;
            }
        }

        return { success: true, data: serializedColisage };
    } catch (error) {
        console.error('getColisageById error:', error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}

/**
 * Récupère tous les colisages via VColisageDossiers
 */
export async function getAllColisages(
    page = 1,
    take = 10000,
    search = ""
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        let query = `
            SELECT DISTINCT * FROM VColisageDossiers
            WHERE 1=1
        `;

        if (search) {
            query += ` AND (
                Description_Colis LIKE '%${search}%' OR
                No_Commande LIKE '%${search}%' OR
                Nom_Fournisseur LIKE '%${search}%'
            )`;
        }

        query += ` ORDER BY Date_Creation DESC`;

        const colisages = await prisma.$queryRawUnsafe<any[]>(query);

        return {
            success: true,
            data: convertDecimalsToNumbers(colisages),
            total: colisages.length,
        };
    } catch (error) {
        console.error("getAllColisages error:", error);
        return { success: false, error, total: 0 };
    }
}

/**
 * Récupère tous les colisages d'un dossier via VColisageDossiers
 */
export async function getColisagesByDossierId(dossierId: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const colisages = await prisma.$queryRaw<any[]>`
            SELECT * FROM VColisageDossiers
            WHERE ID_Dossier = ${dossierId}
            ORDER BY Date_Creation ASC
        `;

        return {
            success: true,
            data: convertDecimalsToNumbers(colisages),
        };
    } catch (error) {
        console.error("getColisagesByDossierId error:", error);
        return { success: false, error };
    }
}

/**
 * Obtenir les statistiques des colisages d'un dossier
 */
export async function getColisagesStats(dossierId: number) {
    try {
        const colisages = await prisma.vColisageDossiers.findMany({
            where: { ID_Dossier: dossierId },
            select: {
                Qte_Colis: true,
                Poids_Brut: true,
                Poids_Net: true,
                Volume: true,
                Prix_Unitaire_Colis: true
            }
        });

        // Sérialiser les Decimal pour les calculs
        const serializedColisages = JSON.parse(JSON.stringify(colisages));

        const stats = {
            total: serializedColisages.length,
            qteTotal: serializedColisages.reduce((sum: number, c: any) => sum + Number(c.Qte_Colis || 0), 0),
            poidsBrutTotal: serializedColisages.reduce((sum: number, c: any) => sum + Number(c.Poids_Brut || 0), 0),
            poidsNetTotal: serializedColisages.reduce((sum: number, c: any) => sum + Number(c.Poids_Net || 0), 0),
            volumeTotal: serializedColisages.reduce((sum: number, c: any) => sum + Number(c.Volume || 0), 0),
            valeurTotal: serializedColisages.reduce(
                (sum: number, c: any) => sum + Number(c.Qte_Colis || 0) * Number(c.Prix_Unitaire_Colis || 0),
                0
            ),
        };

        return { success: true, data: stats };
    } catch (error: any) {
        console.error('Erreur getColisagesStats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Interface TypeScript pour la création d'un colisage
 * Définit la structure des données attendues pour la création
 */
export interface CreateColisageInput {
    dossier: number;              // ID du dossier parent (obligatoire)
    hsCode?: number;              // ID du HS Code (optionnel)
    descriptionColis: string;     // Description du colis (obligatoire)
    noCommande?: string;          // Numéro de commande (optionnel)
    nomFournisseur?: string;      // Nom du fournisseur (optionnel)
    noFacture?: string;           // Numéro de facture (optionnel)
    itemNo?: string;              // Numéro d'article (optionnel)
    devise: number;               // ID de la devise (obligatoire)
    qteColisage?: number;         // Quantité (défaut: 1)
    prixUnitaireColis?: number; // Prix unitaire colis (défaut: 0)
    poidsBrut?: number;           // Poids brut (défaut: 0)
    poidsNet?: number;            // Poids net (défaut: 0)
    volume?: number;              // Volume (défaut: 0)
    ajustementValeur?: number;    // Ajustement de la valeur (optionnel)
    paysOrigine: number;           // ID du pays d'origine (obligatoire)
    regimeDeclaration?: number;   // ID du régime de déclaration (optionnel)
    regroupementClient?: string;  // Regroupement client (défaut: '-')
    uploadKey?: string;           // Clé d'upload pour l'import Excel (optionnel)
    sessionId: number;            // ID de la session utilisateur (obligatoire)
}

/**
 * Interface TypeScript pour la mise à jour d'un colisage
 * Définit la structure des données attendues pour la mise à jour
 */
export interface UpdateColisageInput {
    id: number;                   // ID du colisage à mettre à jour (obligatoire)
    hsCode?: number;              // ID du HS Code (optionnel)
    descriptionColis?: string;     // Description du colis (optionnel)
    noCommande?: string;          // Numéro de commande (optionnel)
    nomFournisseur?: string;      // Nom du fournisseur (optionnel)
    noFacture?: string;           // Numéro de facture (optionnel)
    itemNo?: string;              // Numéro d'article (optionnel)
    devise?: number;               // ID de la devise (optionnel)
    qteColisage?: number;         // Quantité (optionnel)
    prixUnitaireColis?: number; // Prix unitaire (optionnel)
    poidsBrut?: number;           // Poids brut (optionnel)
    poidsNet?: number;            // Poids net (optionnel)
    volume?: number;              // Volume (optionnel)
    ajustementValeur?: number;    // Ajustement de la valeur (optionnel)
    paysOrigine?: number;         // ID du pays d'origine (optionnel)
    regimeDeclaration?: number;   // ID du régime de déclaration (optionnel)
    regroupementClient?: string;  // Regroupement client (optionnel)
}


/**
 * ============================================================================
 * FONCTION : updateColisage (VERSION FUSIONNÉE PRO)
 * ============================================================================
 * - Typée (UpdateColisageInput)
 * - Sécurisée (auth obligatoire)
 * - Tolérante au frontend (plusieurs variantes de champs)
 * - Prisma-safe
 * - Maintenable long terme
 * ============================================================================
 */
/**
 * Met à jour un colisage existant dans la base de données
 * Utilise la table TColisageDossiers pour la mise à jour
 * @param input - Données du colisage à mettre à jour
 * @returns Objet de succès avec le colisage mis à jour
 */
export async function updateColisage(input: UpdateColisageInput) {
    try {
        
        // --------------------------------------------------------------------
        // 1️⃣ SÉCURITÉ : AUTHENTIFICATION
        // --------------------------------------------------------------------
        // Vérification de l'authentification utilisateur
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        // Si pas de session, lance une erreur
        if (!session) {
            throw new Error("Missing User Session");
        }

         // --------------------------------------------------------------------
        // 2️⃣ VALIDATION DE L’ID
        // --------------------------------------------------------------------
        const { id, ...payload } = input;

        if (!Number.isInteger(id)) {
            throw new Error("ID colisage invalide");
        }

         // --------------------------------------------------------------------
        // 3️⃣ CONSTRUCTION DES DONNÉES À METTRE À JOUR
        // (STRICTEMENT SELON LA BD)
        // --------------------------------------------------------------------
        const data: Prisma.TColisageDossiersUpdateInput = {};

        if (payload.hsCode !== undefined)
        {
            data.THSCodes = {
                connect: { ID_HS_Code: payload.hsCode },
            };
        }

        if (payload.descriptionColis !== undefined)
            data.Description_Colis = payload.descriptionColis;

        if (payload.noCommande !== undefined)
            data.No_Commande = payload.noCommande;

        if (payload.nomFournisseur !== undefined)
            data.Nom_Fournisseur = payload.nomFournisseur;

        if (payload.noFacture !== undefined)
            data.No_Facture = payload.noFacture;

        if (payload.itemNo !== undefined)
            data.Item_No = payload.itemNo;

        if (payload.devise !== undefined)
        {
            data.TDevises = {
        connect: { ID_Devise: payload.devise },
      };
        }

        if (payload.qteColisage !== undefined)
            data.Qte_Colis = payload.qteColisage;

        if (payload.prixUnitaireColis !== undefined)
            data.Prix_Unitaire_Colis = payload.prixUnitaireColis;

        if (payload.poidsBrut !== undefined)
            data.Poids_Brut = payload.poidsBrut;

        if (payload.poidsNet !== undefined)
            data.Poids_Net = payload.poidsNet;

        if (payload.volume !== undefined)
            data.Volume = payload.volume;

        if (payload.ajustementValeur !== undefined)
            data.Ajustement_Valeur = payload.ajustementValeur;

        if (payload.paysOrigine !== undefined) {
      data.TPays = {
        connect: { ID_Pays: payload.paysOrigine },
      };
    }

    if (payload.regimeDeclaration !== undefined) {
      data.TRegimesDeclarations = payload.regimeDeclaration
        ? { connect: { ID_Regime_Declaration: payload.regimeDeclaration } }
        : { disconnect: true };
    } // nullable OK

        if (payload.regroupementClient !== undefined)
            data.Regroupement_Client = payload.regroupementClient;
        
        // --------------------------------------------------------------------
        // 4️⃣ MISE À JOUR
        // --------------------------------------------------------------------
        // Met à jour le colisage dans la table TColisageDossiers avec Prisma
        const colisage = await prisma.tColisageDossiers.update({
            where: { ID_Colisage_Dossier : id },                    // Filtre par ID du colisage
            data,                             // Applique les modifications
        });

        // --------------------------------------------------------------------
        // 5️⃣ INVALIDATION DU CACHE
        // --------------------------------------------------------------------
        revalidatePath(`/dossiers/${colisage.Dossier}`);
        revalidatePath(`/dossiers/${colisage.Dossier}/colisages`);
        revalidatePath(`/dossiers/${colisage.Dossier}/colisages/${id}`);

    // --------------------------------------------------------------------
        // 6️⃣ RETOUR
        // --------------------------------------------------------------------
        return {
            success: true,
            data: JSON.parse(JSON.stringify(colisage)), // Decimal-safe
        };
    } catch (error) {
        console.error('updateColisage error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}

/**
 * Supprime un colisage de la base de données
 * Utilise la table TColisageDossiers pour la suppression
 * @param id - ID du colisage à supprimer (string ou number)
 * @returns Objet de succès
 */
export async function deleteColisage(id: string | number) {
    try {
         // --------------------------------------------------------------------
        // 1️⃣ AUTHENTIFICATION
        // --------------------------------------------------------------------
        // Vérification de l'authentification utilisateur
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        // Si pas de session, lance une erreur
        if (!session) {
            throw new Error("Missing User Session");
        }

        // --------------------------------------------------------------------
        // 2️⃣ VALIDATION ID
        // --------------------------------------------------------------------
        if (!Number.isInteger(id)) {
            throw new Error("ID colisage invalide");
        }

        // Convertit l'ID en nombre si c'est une chaîne
        const colisageId = typeof id === 'string' ? parseInt(id) : id;
        
        // Récupère l'ID du dossier avant suppression pour invalider le cache
        const colisage = await prisma.tColisageDossiers.findUnique({
            where: { ID_Colisage_Dossier: colisageId },
            select: { Dossier: true },       // Sélectionne uniquement l'ID du dossier
        });

        // Supprime le colisage de la table TColisageDossiers
        await prisma.tColisageDossiers.delete({
            where: { ID_Colisage_Dossier: colisageId },
        });

        // Invalide le cache de la page des colisages du dossier si trouvé
        if (colisage) {
            revalidatePath(`/dossiers/${colisage.Dossier}/colisages`);
        }

        // Retourne le succès
        return { success: true };
    } catch (error) {
        console.error('deleteColisage error:', error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}

/**
 * Supprime tous les colisages d'un dossier
 */
export async function deleteAllColisagesByDossierId(dossierId: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Missing User Session");
        }

        const result = await prisma.tColisageDossiers.deleteMany({
            where: {
                Dossier: dossierId,
            },
        });

        revalidatePath(`/dossiers/${dossierId}`);
        revalidatePath("/colisage");

        return {
            success: true,
            data: { deleted: result.count }
        };
    } catch (error) {
        console.error("deleteAllColisagesByDossierId error:", error);
        return { success: false, error };
    }
}

export interface ImportColisageRow {
    Row_Key: string;
    HS_Code?: string;
    Descr: string;
    Command_No?: string;
    Supplier_Name?: string;
    Invoice_No?: string;
    Currency: string;
    Qty?: number;
    Unit_Prize_Colis?: number;
    Gross_Weight?: number;
    Net_Weight?: number;
    Volume?: number;
    Value_Adjustment?: number;
    Country_Origin: string;
    Regime_Code?: string;
    Customer_Grouping?: string;
}

export async function checkColisageExists(dossierId: number, item: any) {
  try {
    // Use findMany with where clause instead of findUnique for composite queries
    const existing = await prisma.tColisageDossiers.findMany({
      where: {
        Dossier: dossierId,
        HS_Code: item.HS_Code,
        Item_No: item.No_Article,
      },
      take: 1,
    });

    return existing.length > 0 ? existing[0] : null;
  } catch (error) {
    return null;
  }
}

export async function previewColisagesImport(
  formData: FormData,
  dossierId: number,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "Aucun fichier fourni" };
    }

    // Lire le fichier Excel
    const buffer = await file.arrayBuffer();
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
      return {
        success: false,
        error: "Aucune feuille trouvée dans le fichier",
      };
    }

    // 🔧 IMPORTANT: Lire avec defval pour gérer les cellules vides
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
      raw: false,
    }) as any[];

    if (rows.length === 0) {
      return { success: false, error: "Le fichier est vide" };
    }

    console.log("🔍 Première ligne Excel:", rows[0]);

    // Valider et préparer les données
    const previewData = [];
    const errors = [];
    const missingHsCodes = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // 🔧 Fonction helper pour récupérer valeur non vide
        const getValue = (value: any, defaultValue: any = null) => {
          if (value === null || value === undefined || value === "")
            return defaultValue;
          return String(value).trim();
        };

        const getNumericValue = (value: any, defaultValue: number = 0) => {
          if (value === null || value === undefined || value === "")
            return defaultValue;
          const num = Number(String(value).trim());
          return isNaN(num) ? defaultValue : num;
        };

        // 📌 Récupérer les valeurs brutes depuis Excel
        const hsCodeStr = getValue(row.HS_Code || row["HS_Code"]);
        const deviseStr = getValue(
          row.Currency || row["Currency"] || row.Devise,
        );
        const paysOrigineStr = getValue(
          row.Country_Origin || row["Country_Origin"] || row.Pays_Origine,
        );
        const regimeStr = getValue(
          row.Regime_Code ||
            row["Regime_Code"]
        );

        // 🔍 Chercher les IDs correspondants dans la base de données
        let hsCodeId = null;
        let deviseId = null;
        let paysOrigineId = null;
        let regimeId = null;

        // Chercher HS Code
        if (hsCodeStr) {
          const hsCode = await prisma.tHSCodes.findFirst({
            where: { HS_Code: hsCodeStr },
            select: { ID_HS_Code: true },
          });
          hsCodeId = hsCode?.ID_HS_Code;
          if (!hsCodeId) {
            missingHsCodes.add(hsCodeStr);
            errors.push(
              `Ligne ${i + 2}: HS Code "${hsCodeStr}" introuvable dans la base`,
            );
            continue;
          }
        } else {
          const hscode = await prisma.tHSCodes.findFirst({
            where: { HS_Code: "0" },
            select: { ID_HS_Code: true },
          });
          hsCodeId = hscode?.ID_HS_Code;
          continue;
        }

        // Chercher Devise
        if (deviseStr) {
          const devise = await prisma.tDevises.findFirst({
            where: { Code_Devise: deviseStr },
            select: { ID_Devise: true },
          });
          deviseId = devise?.ID_Devise;
          if (!deviseId) {
            errors.push(
              `Ligne ${i + 2}: Devise "${deviseStr}" introuvable dans la base`,
            );
            continue;
          }
        }

        // Chercher Pays
        if (paysOrigineStr) {
          const pays = await prisma.tPays.findFirst({
            where: { Code_Pays: paysOrigineStr },
            select: { ID_Pays: true },
          });
          paysOrigineId = pays?.ID_Pays;
        }

        // Chercher Régime
        if (regimeStr) {
          const regime = await prisma.tRegimesDeclarations.findFirst({
            where: {
              OR: [
                { Libelle_Regime_Declaration: { contains: regimeStr } },
                { ID_Regime_Declaration: getNumericValue(regimeStr, 0) },
              ],
            },
            select: { ID_Regime_Declaration: true },
          });
          regimeId = regime?.ID_Regime_Declaration;
        }

        // 🔧 MAPPING avec les IDs trouvés
        const rowData = {
          Row_Key: getValue(row.Row_Key || row["Row_Key"], `ROW_${i + 1}`),

          // IDs des tables de référence
          HS_Code: hsCodeId,
          Devise: deviseId,
          Pays_Origine: paysOrigineId,
          Regime_Declaration: regimeId,

          // Valeurs texte
          Description_Colis: getValue(
            row.Descr || row["Descr"] || row.Description_Colis,
          ),
          No_Commande: getValue(
            row.Command_No || row["Command_No"] || row.No_Commande,
            "",
          ),
          Nom_Fournisseur: getValue(
            row.Supplier_Name || row["Supplier_Name"] || row.Nom_Fournisseur,
          ),
          No_Facture: getValue(
            row.Invoice_No || row["Invoice_No"] || row.No_Facture,
          ),
          No_Article: getValue(
            row.Item_No || row["Item_No"] || row.No_Article,
            "1",
          ),
          Regroupement_Client: getValue(
            row.Customer_Grouping ||
              row["Customer_Grouping"] ||
              row.Regroupement_Client,
            "Sanaga",
          ),

          // Valeurs numériques
          Qte_Colis: getNumericValue(
            row.Qty || row["Qty"] || row.Qte_Colis || "1",
          ),
          Prix_Unitaire_Facture: getNumericValue(
            row.Unit_Prize ||
              row["Unit_Prize"] ||
              row.Unit_Price ||
              row.Prix_Unitaire_Facture,
          ),
          Poids_Brut: getNumericValue(
            row.Gross_Weight || row["Gross_Weight"] || row.Poids_Brut,
          ),
          Poids_Net: getNumericValue(
            row.Net_Weight || row["Net_Weight"] || row.Poids_Net,
          ),
          Volume: getNumericValue(row.Volume || row["Volume (exles colun)"]),
        };

        // ✅ VALIDATION
        const rowErrors = [];

        if (!rowData.HS_Code) {
          rowErrors.push("HS Code manquant ou invalide");
        }
        if (!rowData.Description_Colis) {
          rowErrors.push("Description manquante");
        }
        if (!rowData.Devise) {
          rowErrors.push("Devise manquante ou invalide");
        }
        if (!rowData.Qte_Colis || rowData.Qte_Colis <= 0) {
          rowErrors.push("Quantité invalide");
        }

        if (rowErrors.length > 0) {
          errors.push(`Ligne ${i + 2}: ${rowErrors.join(", ")}`);
          continue;
        }

        // Vérifier si le colisage existe déjà
        const existingColisage = await checkColisageExists(dossierId, rowData);

        previewData.push({
          ...rowData,
          // Conserver les codes texte pour l'affichage
          //   HS_Code_Display: hsCodeStr,
          //   Devise_Display: deviseStr,
          //   Pays_Origine_Display: paysOrigineStr,
          //   Regime_Display: regimeStr,

          status: existingColisage ? "existing" : "new",
          existingId: existingColisage?.ID_Colisage_Dossier,
          existingData: existingColisage
            ? {
                HS_Code: existingColisage.HS_Code,
                Description_Colis: existingColisage.Description_Colis,
                No_Commande: existingColisage.No_Commande,
                Nom_Fournisseur: existingColisage.Nom_Fournisseur,
                No_Facture: existingColisage.No_Facture,
                Devise: existingColisage.Devise,
                No_Article: existingColisage.Item_No,
                Qte_Colis: Number(existingColisage.Qte_Colis),
                Prix_Unitaire_Facture: Number(
                  existingColisage.Prix_Unitaire_Colis,
                ),
                Poids_Brut: Number(existingColisage.Poids_Brut),
                Poids_Net: Number(existingColisage.Poids_Net),
                Volume: Number(existingColisage.Volume),
                Pays_Origine: existingColisage.Pays_Origine,
                Regime_Declaration: existingColisage.Regime_Declaration,
                Regroupement_Client: existingColisage.Regroupement_Client,
              }
            : null,
        });
      } catch (error: any) {
        errors.push(`Ligne ${i + 2}: ${error.message}`);
      }
    }

    return {
      success: true,
      data: {
        preview: previewData,
        total: rows.length,
        valid: previewData.length,
        errors: errors.length > 0 ? errors : undefined,
        stats: {
          new: previewData.filter((p) => p.status === "new").length,
          existing: previewData.filter((p) => p.status === "existing").length,
        },
        missingData: {
          hsCodes: Array.from(missingHsCodes),
        },
      },
    };
  } catch (error) {
    console.error("previewColisageImport error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la prévisualisation",
    };
  }
}


export async function importSelectedColisages(
  dossierId: number,
  rows: any[],
  updateExisting: boolean = false,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Missing User Session");
    }
    // ✅ VÉRIFIER QUE LE DOSSIER EXISTE
    const dossierExists = await prisma.tDossiers.findUnique({
      where: { ID_Dossier: dossierId },
      select: { ID_Dossier: true }
    });

    if (!dossierExists) {
      return {
        success: false,
        error: `Le dossier ID ${dossierId} n'existe pas dans la base de données`,
        data: {
          created: 0,
          updated: 0,
          total: rows.length,
          errors: [{ row: 0, error: `Dossier ${dossierId} introuvable` }],
        },
      };
    }

    const createdColisages: any[] = [];
    const updatedColisages: any[] = [];
    const errors: Array<{ row: number; rowKey?: string; error: string }> = [];

    console.log(
      `🚀 [importSelectedColisages] Début import de ${rows.length} lignes pour dossier ${dossierId}`,
    );

    // Transaction pour traiter tous les colisages
    try {
      await prisma.$transaction(
        async (tx) => {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
              console.log(
                `📝 [importSelectedColisages] Traitement ligne ${i + 1}:`,
                {
                  rowKey: row.Row_Key,
                  description: row.Description_Colis?.substring(0, 50),
                  devise: row.Devise,
                  hscode: row.HS_Code,
                  paysOrigine: row.Pays_Origine,
                  regimeRatio: row.Ratio_DC,
                },
              );

               let hsCodeValue = "0";
    
    if (row.HS_Code && row.HS_Code !== 0) {
      const hsCodeRecord = await tx.tHSCodes.findUnique({
        where: { ID_HS_Code: row.HS_Code },
        select: { HS_Code: true }
      });
      
      if (hsCodeRecord) {
        hsCodeValue = hsCodeRecord.HS_Code; // Ex: "8481809190"
      } else {
        errors.push({
          row: i + 1,
          rowKey: row.Row_Key,
          error: `HS Code ID ${row.HS_Code} introuvable dans la base`
        });
        continue;
      }
    }
    let PaysValue = "0";
    
    if (row.Pays_Origine && row.Pays_Origine !== "0") {
      const paysRecord = await tx.tPays.findUnique({
        where: { ID_Pays: row.Pays_Origine },
        select: { Code_Pays: true }
      });
      
      if (paysRecord) {
        PaysValue = paysRecord.Code_Pays; // Ex: "FR"
      } else {
        errors.push({
          row: i + 1,
          rowKey: row.Row_Key,
          error: `Pays ID ${row.Pays_Origine} introuvable dans la base`
        });
        continue;
      }
    }
    let DeviseValue = "0";
    
      if (row.Devise && row.Devise !== "0") {
        const deviseRecord = await tx.tDevises.findUnique({
        where: { ID_Devise: row.Devise },
        select: { Code_Devise: true }
      });

      if (deviseRecord) {
        DeviseValue = deviseRecord.Code_Devise; // Ex: "EUR"
      } else {
        errors.push({
          row: i + 1,
          rowKey: row.Row_Key,
          error: `Devise ID ${row.Devise} introuvable dans la base`
        });
        continue;
      }
    }
              const regimeRatio =
                row.Regime_Declaration !== undefined &&
                row.Regime_Ratio !== null &&
                !isNaN(row.Regime_Ratio)
                  ? typeof row.Regime_Ratio === "string"
                    ? parseFloat(row.Regime_Ratio)
                    : row.Regime_Ratio
                  : 0;
              const regimeCode = row.Regime_Declaration || ""; // Utiliser chaîne vide au lieu de null

              // Appeler la procédure stockée pSP_AjouterColisageDossier
              const query = `
                            EXEC [dbo].[pSP_AjouterColisageDossier] 
                                @Id_Dossier = ${dossierId},
                                @Row_Key = N'${(row.Row_Key || "").replace(/'/g, "''")}',
                                @HS_Code = N'${hsCodeValue}',
                                @Descr = N'${(row.Description_Colis || "").replace(/'/g, "''")}',
                                @Command_No = N'${(row.No_Commande || "231123").replace(/'/g, "''")}',
                                @Supplier_Name = N'${(row.Nom_Fournisseur || "").replace(/'/g, "''")}',
                                @Invoice_No = N'${(row.No_Facture || "").replace(/'/g, "''")}',
                                @Item_No = N'${(row.No_Article || "").replace(/'/g, "''")}',
                                @Currency = N'${DeviseValue}',
                                @Qty = ${row.Qte_Colis || 1},
                                @Unit_Prize = ${row.Prix_Unitaire_Facture || 0},
                                @Gross_Weight = ${row.Poids_Brut || 0},
                                @Net_Weight = ${row.Poids_Net || 0},
                                @Volume = ${row.Volume || 0},
                                @Country_Origin = N'${String(PaysValue || "").replace(/'/g, "''")}',
                                @Regime_Code = N'${regimeCode}',
                                @Regime_Ratio = ${regimeRatio},
                                @Customer_Grouping = N'${String(row.Regroupement_Client || "").replace(/'/g, "''")}',
                                @Session = ${parseInt(session.user.id)}
                        `;

              console.log(
                `🔧 [importSelectedColisages] Exécution procédure pour ligne ${i + 1}`,
              );

              const colisage = await tx.$executeRawUnsafe(query);
              convertDecimalsToNumbers(colisage);

              console.log(
                `✅ [importSelectedColisages] Ligne ${i + 1} traitée avec succès`,
              );

              // Compter comme créé (la procédure gère INSERT/UPDATE automatiquement)
              createdColisages.push({
                rowKey: row.rowKey,
                description: row.description,
                processed: true,
              });
            } catch (error: any) {
              console.error(
                `❌ [importSelectedColisages] Erreur ligne ${i + 1}:`,
                error,
              );

              // Extraire le message d'erreur de SQL Server
              let errorMessage = error.message || "Erreur lors du traitement";

              // Nettoyer les messages d'erreur SQL Server
              if (
                errorMessage.includes("CURRENCY") &&
                errorMessage.includes("NOT EXIST")
              ) {
                errorMessage = `Devise "${row.devise}" non trouvée`;
              } else if (
                errorMessage.includes("COUNTRY CODE") &&
                errorMessage.includes("NOT EXIST")
              ) {
                errorMessage = `Pays "${row.paysOrigine}" non trouvé`;
              } else if (
                errorMessage.includes("HS CODE") &&
                errorMessage.includes("NOT EXIST")
              ) {
                errorMessage = `Code HS "${row.HS_Code}" non trouvé`;
              } else if (
                errorMessage.includes("REGIME") &&
                errorMessage.includes("NOT EXIST")
              ) {
                errorMessage = `Régime "${row.Regime_Declaration}" avec taux ${row.Regime_Ratio}% non trouvé pour ce client`;
              } else if (
                errorMessage.includes("FILE ID") &&
                errorMessage.includes("NOT EXIST")
              ) {
                errorMessage = `Dossier ${dossierId} non trouvé`;
              }

              errors.push({
                row: i + 1,
                rowKey: row.rowKey,
                error: errorMessage,
              });

              // Ne pas arrêter la transaction, continuer avec les autres lignes
              // throw error; // Commenté pour permettre le traitement des autres lignes
            }
          }
        },
        {
          maxWait: 60000,
          timeout: 120000,
        },
      );

      console.log(
        `🎉 [importSelectedColisages] Import terminé - Succès: ${createdColisages.length}, Erreurs: ${errors.length}`,
      );

      revalidatePath(`/dossiers/${dossierId}`);
      revalidatePath("/colisage");

      return {
        success: true,
        data: {
          created: createdColisages.length,
          updated: 0, // La procédure gère automatiquement INSERT/UPDATE
          total: rows.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (transactionError: any) {
      console.error(
        "❌ [importSelectedColisages] Erreur transaction:",
        transactionError,
      );
      return {
        success: false,
        error: `Importation annulée : ${transactionError.message}`,
        data: {
          created: 0,
          updated: 0,
          total: rows.length,
          errors:
            errors.length > 0
              ? errors
              : [{ row: 0, error: transactionError.message }],
        },
      };
    }
  } catch (error) {
    console.error("❌ [importSelectedColisages] Erreur générale:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'import",
    };
  }
}

/**
 * Importer des colisages depuis Excel/CSV
 * Format attendu: voir ImportColisageRow
 */
export async function importColisagesExcel(
    dossierId: number,
    rows: ImportColisageRow[],
    sessionId: number
) {
    try {
        let imported = 0;
        let errors: string[] = [];

        for (const row of rows) {
            try {
                // 1️⃣ Devise (Code → ID)
                const devise = await prisma.tDevises.findFirst({
                    where: { Code_Devise: row.Currency },
                });

                if (!devise) {
                    errors.push(`Devise ${row.Currency} non trouvée pour ${row.Row_Key}`);
                    continue;
                }

                // 2️⃣ Pays (Code → ID)
                const pays = await prisma.tPays.findFirst({
                    where: { Code_Pays: row.Country_Origin },
                });

                if (!pays) {
                    errors.push(`Pays ${row.Country_Origin} non trouvé pour ${row.Row_Key}`);
                    continue;
                }

                // 3️⃣ HS Code (optionnel)
                let hsCodeId: number | null = null;
                if (row.HS_Code) {
                    const hsCode = await prisma.tHSCodes.findFirst({
                        where: { HS_Code: row.HS_Code },
                    });
                    hsCodeId = hsCode?.ID_HS_Code ?? null;
                }

                // 4️⃣ Régime (optionnel)
                let regimeId: number | null = null;
                if (row.Regime_Code) {
                    const regime = await prisma.tRegimesDeclarations.findFirst({
                        where: {
                            Libelle_Regime_Declaration: {
                                contains: row.Regime_Code,
                            },
                        },
                    });
                    regimeId = regime?.ID_Regime_Declaration ?? null;
                }

                // 5️⃣ INSERT Colisage
                await prisma.tColisageDossiers.create({
                    data: {
                        Dossier: dossierId,
                        HS_Code: hsCodeId,
                        Description_Colis: row.Descr,
                        No_Commande: row.Command_No ?? '',
                        Nom_Fournisseur: row.Supplier_Name ?? '',
                        No_Facture: row.Invoice_No ?? '',
                        Item_No: '',
                        Devise: devise.ID_Devise,
                        Qte_Colis: row.Qty ?? 1,
                        Prix_Unitaire_Colis: row.Unit_Prize_Colis ?? 0,
                        Poids_Brut: row.Gross_Weight ?? 0,
                        Poids_Net: row.Net_Weight ?? 0,
                        Volume: row.Volume ?? 0,
                        Ajustement_Valeur: row.Value_Adjustment ?? 0,
                        Pays_Origine: pays.ID_Pays,
                        Regime_Declaration: regimeId,
                        Regroupement_Client: row.Customer_Grouping ?? '-',
                        UploadKey: row.Row_Key,
                        Session: sessionId,
                        Date_Creation: new Date(),
                    },
                });

                imported++;
            } catch (error: any) {
                errors.push(`Erreur ligne ${row.Row_Key}: ${error.message}`);
            }
        }

        revalidatePath(`/dossiers/${dossierId}/colisages`);

        return {
            success: true,
            data: {
                imported,
                total: rows.length,
                errors,
            },
        };
    } catch (error: any) {
        console.error('Erreur importColisagesExcel:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Actions simples pour récupérer les données de référence
 */

// Actions compatibles avec le formulaire du module colisage (format: id, code, libelle)
export async function getAllHscodesForSelect() {
    try {
        const hscodes = await prisma.vHSCodes.findMany({
            where: { ID_HS_Code: { gt: 0 } },
            select: {
                ID_HS_Code: true,
                HS_Code: true,
                Libelle_HS_Code: true
            },
            orderBy: { HS_Code: 'asc' },
            distinct: ["Libelle_HS_Code"]
        });
        
        // Mapper vers le format attendu
        const mappedData = hscodes.map(h => ({
            id: h.ID_HS_Code,
            code: h.HS_Code,
            libelle: h.Libelle_HS_Code
        }));
        
        return { success: true, data: mappedData };
    } catch (error: any) {
        console.error('Erreur getAllHscodesForSelect:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllDevisesForSelect() {
    try {
        const devises = await prisma.vDevises.findMany({
            where: { ID_Devise: { gt: 0 } },
            select: {
                ID_Devise: true,
                Code_Devise: true,
                Libelle_Devise: true
            },
            orderBy: { Code_Devise: 'asc' }
        });
        
        // Mapper vers le format attendu
        const mappedData = devises.map(d => ({
            id: d.ID_Devise,
            code: d.Code_Devise,
            libelle: d.Libelle_Devise
        }));
        
        return { success: true, data: mappedData };
    } catch (error: any) {
        console.error('Erreur getAllDevisesForSelect:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllPaysForSelect() {
    try {
        const pays = await prisma.vPays.findMany({
            where: { ID_Pays: { gt: 0 } },
            select: {
                ID_Pays: true,
                Code_Pays: true,
                Libelle_Pays: true
            },
            orderBy: { Libelle_Pays: 'asc' }
        });
        console.log("pays", pays);
        
        // Mapper vers le format attendu
        const mappedData = pays.map(p => ({
            id: p.ID_Pays,
            code: p.Code_Pays,
            libelle: p.Libelle_Pays
        }));
        
        return { success: true, data: mappedData };
    } catch (error: any) {
        console.error('Erreur getAllPaysForSelect:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllRegimeDeclarationsForSelect() {
    try {
        const regimesDeclarations = await prisma.vRegimesDeclarations.findMany({
            where: { 
                ID_Regime_Declaration   : {                 
                    notIn: [0, 1] 
                } 
            },
            select: {
                ID_Regime_Declaration: true,
                Libelle_Regime_Declaration: true
            },
            orderBy: { Libelle_Regime_Declaration: 'asc' }
        });
        
        // Mapper vers le format attendu
        const mappedData = regimesDeclarations.map(r => ({
            id: r.ID_Regime_Declaration,
            libelle: r.Libelle_Regime_Declaration
        }));
        
        return { success: true, data: mappedData };
    } catch (error: any) {
        console.error('Erreur getAllRegimeDeclarationsForSelect:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Récupère un colisage au format du module colisage (pour le formulaire)
 */
export async function getColisageForEdit(id: number) {
    try {
        const colisage = await prisma.vColisageDossiers.findFirst({
            where: { ID_Colisage_Dossier: id }
        });

        if (!colisage) {
            return { success: false, error: 'Colisage non trouvé' };
        }

        // Récupérer l'uploadKey depuis la table TColisageDossiers
        const uploadKeyData = await prisma.tColisageDossiers.findUnique({
            where: { ID_Colisage_Dossier: colisage.ID_Colisage_Dossier },
            select: { UploadKey: true }
        });

        // Mapper vers les anciens noms de colonnes pour la compatibilité frontend
        const mappedColisage = {
            ID_Colisage_Dossier: colisage.ID_Colisage_Dossier,
            ID_Dossier: colisage.ID_Dossier,
            HS_Code: colisage.HS_Code,
            Description_Colis: colisage.Description_Colis,
            No_Commande: colisage.No_Commande,
            Nom_Fournisseur: colisage.Nom_Fournisseur,
            No_Facture: colisage.No_Facture,
            Item_No: colisage.Item_No,
            Code_Devise: colisage.Code_Devise,
            Qte_Colis: colisage.Qte_Colis,
            Prix_Unitaire_Colis: colisage.Prix_Unitaire_Colis,
            Poids_Brut: colisage.Poids_Brut,
            Poids_Net: colisage.Poids_Net,
            Volume: colisage.Volume,
            Pays_Origine: colisage.Pays_Origine,
            ID_Regime_Declaration: colisage.ID_Regime_Declaration,
            ID_Regime_Douanier: colisage.ID_Regime_Douanier,
            Libelle_Regime_Declaration: colisage.Libelle_Regime_Declaration, // Afficher le libellé de déclaration
            Regroupement_Client: colisage.Regroupement_Client,
            UploadKey: uploadKeyData?.UploadKey || null, // Récupéré depuis TColisageDossiers
            Date_Creation: colisage.Date_Creation,
            Nom_Creation: colisage.Nom_Creation,
        };

        const serializedColisage = JSON.parse(JSON.stringify(mappedColisage));

        // Résoudre les IDs manquants
        if (serializedColisage.Code_Devise && !serializedColisage.ID_Devise) {
            const devise = await prisma.vDevises.findFirst({
                where: { Code_Devise: serializedColisage.Code_Devise },
                select: { ID_Devise: true }
            });
            if (devise) {
                serializedColisage.ID_Devise = devise.ID_Devise;
            }
        }

        if (serializedColisage.Pays_Origine && !serializedColisage.ID_Pays_Origine) {
            const pays = await prisma.vPays.findFirst({
                where: { Libelle_Pays: serializedColisage.Pays_Origine },
                select: { ID_Pays: true }
            });
            if (pays) {
                serializedColisage.ID_Pays_Origine = pays.ID_Pays;
            }
        }

        if (serializedColisage.HS_Code && !serializedColisage.ID_HS_Code) {
            const hsCode = await prisma.vHSCodes.findFirst({
                where: { ID_HS_Code: serializedColisage.HS_Code },
                select: { ID_HS_Code: true }
            });
            if (hsCode) {
                serializedColisage.ID_HS_Code = hsCode.ID_HS_Code;
            }
        }

        // Convertir au format attendu par le formulaire du module colisage
        const formattedColisage = {
            id: serializedColisage.ID_Colisage_Dossier.toString(),
            description: serializedColisage.Description_Colis || "",
            numeroCommande: serializedColisage.No_Commande || null,
            nomFournisseur: serializedColisage.Nom_Fournisseur || null,
            numeroFacture: serializedColisage.No_Facture || null,
            quantite: Number(serializedColisage.Qte_Colis) || 1,
            prixUnitaireColis: Number(serializedColisage.Prix_Unitaire_Colis) || 0,
            poidsBrut: Number(serializedColisage.Poids_Brut) || 0,
            poidsNet: Number(serializedColisage.Poids_Net) || 0,
            volume: Number(serializedColisage.Volume) || 0,
            regroupementClient: serializedColisage.Regroupement_Client || null,
            hscodeId: serializedColisage.ID_HS_Code?.toString() || null,
            deviseId: serializedColisage.ID_Devise?.toString() || undefined,
            paysOrigineId: serializedColisage.ID_Pays_Origine?.toString() || undefined,
            regimeDeclarationId: serializedColisage.ID_Regime_Declaration?.toString() || null,
        };

        return { success: true, data: formattedColisage };
    } catch (error: any) {
        console.error('Erreur getColisageForEdit:', error);
        return { success: false, error: error.message };
    }
}