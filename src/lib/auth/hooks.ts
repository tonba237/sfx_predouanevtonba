/**
 * Hooks React pour l'authentification
 */

'use client';

import { useState, useEffect } from 'react';
import { getSession, signOut as authSignOut } from '@/modules/auth/server/actions';

interface User {
    id: number;
    codeUtilisateur: string;
    nomUtilisateur: string;
    permissions: number[];
}

/**
 * Hook pour obtenir l'utilisateur courant
 */
export function useUser() {
    const [data, setData] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchUser() {
            try {
                const session = await getSession();
                setData(session.user);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Erreur inconnue'));
            } finally {
                setIsLoading(false);
            }
        }

        fetchUser();
    }, []);

    return { data, isLoading, error };
}

/**
 * Hook pour la déconnexion
 */
export function useSignOut() {
    return {
        mutateAsync: async () => {
            await authSignOut();
        },
        mutate: () => {
            authSignOut();
        },
    };
}

/**
 * Hook pour vérifier si l'utilisateur est authentifié
 */
export function useIsAuthenticated() {
    const { data: user, isLoading } = useUser();
    return { isAuthenticated: !!user, isLoading };
}

export default {
    useUser,
    useSignOut,
    useIsAuthenticated,
};
