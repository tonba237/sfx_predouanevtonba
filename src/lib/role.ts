export type Role = keyof typeof ROLES;
export type Permission = (typeof ROLES)[Role][number];

const ROLES = {
  admin: [
    "view:clients",
    "manage:clients",
    "view:users",
    "manage:users",
    "view:orders",
    "manage:orders",
  ],
  moderateur: ["view:clients", "view:orders"],
};

export function hasPermission(
  user: { id: string; role: Role },
  permission: Permission
) {
  return (ROLES[user.role] as readonly Permission[]).includes(permission);
}
