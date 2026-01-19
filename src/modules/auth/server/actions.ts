"use server";

/**
 * Server actions pour l'authentification
 */

import { cookies } from 'next/headers';
import { signIn as authSignIn, signOut as authSignOut, getUserById } from '@/lib/auth/auth-service';

export interface SignInResult {
    success: boolean;
    error?: string;
    user?: {
        id: number;
        codeUtilisateur: string;
        nomUtilisateur: string;
        permissions: number[];
    };
}

/**
 * Action de connexion
 */
export async function signIn(codeUtilisateur: string): Promise<SignInResult> {
    try {
        // Authentifier l'utilisateur
        const user = await authSignIn(codeUtilisateur);

        // Créer un cookie de session
        const cookieStore = await cookies();
        cookieStore.set('session', JSON.stringify({
            userId: user.id,
            sessionId: user.sessionId,
            codeUtilisateur: user.codeUtilisateur,
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 jours
        });

        return {
            success: true,
            user: {
                id: user.id,
                codeUtilisateur: user.codeUtilisateur,
                nomUtilisateur: user.nomUtilisateur,
                permissions: user.permissions,
            },
        };
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erreur lors de la connexion',
        };
    }
}

/**
 * Action de déconnexion
 */
export async function signOut(): Promise<{ success: boolean }> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (sessionCookie) {
            const session = JSON.parse(sessionCookie.value);

            // Fermer la session SQL Server
            if (session.sessionId) {
                await authSignOut(session.sessionId);
            }

            // Supprimer le cookie
            cookieStore.delete('session');
        }

        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        return { success: false };
    }
}

/**
 * Obtenir la session courante
 */
export async function getSession() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie) {
            return { user: null };
        }

        const session = JSON.parse(sessionCookie.value);
        const user = await getUserById(session.userId);

        if (!user) {
            // Session invalide, supprimer le cookie
            cookieStore.delete('session');
            return { user: null };
        }

        return {
            user: {
                id: user.id,
                codeUtilisateur: user.codeUtilisateur,
                nomUtilisateur: user.nomUtilisateur,
                permissions: user.permissions,
            },
        };
    } catch (error) {
        console.error('Erreur lors de la récupération de la session:', error);
        return { user: null };
    }
}
