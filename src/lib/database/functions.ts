/**
 * Wrappers TypeScript pour les fonctions SQL Server
 */

import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

/**
 * Type de retour pour les taux de change d'un dossier
 */
export interface TauxChangeDossier {
    ID_Devise: number;
    Code_Devise: string;
    Taux_Change: number | null;
}

/**
 * Obtenir les taux de change pour un dossier
 * Appelle la fonction fx_TauxChangeDossier
 * 
 * Cette fonction retourne:
 * - Toutes les devises utilisées dans les colisages du dossier
 * - Le taux de change de chaque devise par rapport à la devise locale de l'entité
 * - Taux_Change = 1 pour la devise locale
 * - Taux_Change = null si le taux n'est pas défini dans TTauxChange
 * 
 * @param dossierId - ID du dossier
 * @returns Array de taux de change
 */
export async function getTauxChangeDossier(
    dossierId: number
): Promise<TauxChangeDossier[]> {
    try {
        const result = await prisma.$queryRaw<TauxChangeDossier[]>`
      SELECT * FROM dbo.fx_TauxChangeDossier(${dossierId})
    `;
        return result;
    } catch (error: any) {
        const message = error.message || 'Erreur inconnue';
        throw new Error(`Erreur lors de la récupération des taux de change: ${message}`);
    }
}

/**
 * Type de retour pour les permissions d'un utilisateur
 */
export interface PermissionUtilisateur {
    ID_Permission: number;
}

/**
 * Obtenir toutes les permissions d'un utilisateur
 * Appelle la fonction fx_PermissionsUtilisateur
 * 
 * Cette fonction retourne tous les IDs de permissions que l'utilisateur possède
 * via ses rôles (table TRolesUtilisateurs -> TPermissonsRoles)
 * 
 * @param utilisateurId - ID de l'utilisateur
 * @returns Array d'IDs de permissions
 */
export async function getPermissionsUtilisateur(
    utilisateurId: number
): Promise<number[]> {
    try {
        const result = await prisma.$queryRaw<PermissionUtilisateur[]>`
      SELECT * FROM dbo.fx_PermissionsUtilisateur(${utilisateurId})
    `;
        return result.map((p) => p.ID_Permission);
    } catch (error: any) {
        const message = error.message || 'Erreur inconnue';
        throw new Error(`Erreur lors de la récupération des permissions: ${message}`);
    }
}

/**
 * Vérifier si un utilisateur a une permission spécifique
 * 
 * @param utilisateurId - ID de l'utilisateur
 * @param permissionId - ID de la permission à vérifier
 * @returns true si l'utilisateur a la permission
 */
export async function hasPermission(
    utilisateurId: number,
    permissionId: number
): Promise<boolean> {
    const permissions = await getPermissionsUtilisateur(utilisateurId);
    return permissions.includes(permissionId);
}

/**
 * Vérifier si un utilisateur a au moins une des permissions spécifiées
 * 
 * @param utilisateurId - ID de l'utilisateur
 * @param permissionIds - Array d'IDs de permissions
 * @returns true si l'utilisateur a au moins une des permissions
 */
export async function hasAnyPermission(
    utilisateurId: number,
    permissionIds: number[]
): Promise<boolean> {
    const permissions = await getPermissionsUtilisateur(utilisateurId);
    return permissionIds.some((id) => permissions.includes(id));
}

/**
 * Vérifier si un utilisateur a toutes les permissions spécifiées
 * 
 * @param utilisateurId - ID de l'utilisateur
 * @param permissionIds - Array d'IDs de permissions
 * @returns true si l'utilisateur a toutes les permissions
 */
export async function hasAllPermissions(
    utilisateurId: number,
    permissionIds: number[]
): Promise<boolean> {
    const permissions = await getPermissionsUtilisateur(utilisateurId);
    return permissionIds.every((id) => permissions.includes(id));
}

export default {
    getTauxChangeDossier,
    getPermissionsUtilisateur,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
};
