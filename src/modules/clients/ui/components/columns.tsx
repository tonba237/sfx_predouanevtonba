"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";

// Type pour VClients (vue SQL Server)
type VClient = {
  ID_Client: number;
  Nom_Client: string;
  Date_Creation: Date;
  Nom_Creation: string | null;
};

export const columns: ColumnDef<VClient, any>[] = [
  {
    accessorKey: "Nom_Client",
    header: "Nom du client",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold">{row.original.Nom_Client}</span>
        <span className="text-sm text-muted-foreground">
          ID: {row.original.ID_Client}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "Date_Creation",
    header: "Date de création",
    cell: ({ row }) => {
      try {
        return (
          <div className="flex flex-col gap-y-1">
            <span className="font-semibold">
              {format(new Date(row.original.Date_Creation), "dd MMM yyyy")}
            </span>
            <span className="text-sm text-muted-foreground">
              {format(new Date(row.original.Date_Creation), "HH:mm")}
            </span>
          </div>
        );
      } catch {
        return <span className="text-muted-foreground">-</span>;
      }
    },
  },
  {
    accessorKey: "Nom_Creation",
    header: "Créé par",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.Nom_Creation || "Système"}
      </span>
    ),
  },
];
