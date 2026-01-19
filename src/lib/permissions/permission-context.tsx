/**
 * Contexte pour les permissions utilisateur
 */

'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useUser } from '../auth/hooks';

interface PermissionContextValue {
    permissions: number[];
    isLoading: boolean;
    hasPermission: (permissionId: number) => boolean;
    hasAnyPermission: (permissionIds: number[]) => boolean;
    hasAllPermissions: (permissionIds: number[]) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

/**
 * Provider pour les permissions
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
    const { data: user, isLoading: userLoading } = useUser();
    const [permissions, setPermissions] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPermissions() {
            if (!user?.id) {
                setPermissions([]);
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/users/${user.id}/permissions`);
                if (!response.ok) {
                    setPermissions([]);
                    return;
                }

                const data = await response.json();
                setPermissions(data.permissions as number[]);
            } catch (error) {
                console.error('Erreur lors de la récupération des permissions:', error);
                setPermissions([]);
            } finally {
                setIsLoading(false);
            }
        }

        if (!userLoading) {
            fetchPermissions();
        }
    }, [user?.id, userLoading]);

    const hasPermission = (permissionId: number) => {
        return permissions.includes(permissionId);
    };

    const hasAnyPermission = (permissionIds: number[]) => {
        return permissionIds.some((id) => permissions.includes(id));
    };

    const hasAllPermissions = (permissionIds: number[]) => {
        return permissionIds.every((id) => permissions.includes(id));
    };

    return (
        <PermissionContext.Provider
            value={{
                permissions,
                isLoading,
                hasPermission,
                hasAnyPermission,
                hasAllPermissions,
            }}
        >
            {children}
        </PermissionContext.Provider>
    );
}

/**
 * Hook pour utiliser les permissions
 */
export function usePermissions() {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
}

export default {
    PermissionProvider,
    usePermissions,
};
