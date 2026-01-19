"use client";

import { useEffect, useState } from 'react';
import { getSession } from '@/modules/auth/server/actions';

export interface User {
    id: number;
    codeUtilisateur: string;
    nomUtilisateur: string;
    permissions: number[];
}

export function useSession() {
    const [user, setUser] = useState<User | null>(null);
    const [isPending, setIsPending] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const session = await getSession();
                setUser(session.user);
            } catch (error) {
                console.error('Erreur lors de la récupération de la session:', error);
                setUser(null);
            } finally {
                setIsPending(false);
            }
        };

        fetchSession();
    }, []);

    return { user, isPending };
}
