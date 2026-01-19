"use client";

import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

// Type pour VHSCodes (vue SQL Server)
type VHSCode = {
  ID_HS_Code: number;
  HS_Code: string;
  Libelle_HS_Code: string;
  Date_Creation: Date | string;
  Nom_Creation: string | null;
};

export const columns: ColumnDef<VHSCode, any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Tout sélectionner"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Sélectionner la ligne"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // Colonne virtuelle pour la recherche globale (cachée)
  {
    id: "globalSearch",
    accessorFn: (row) => `${row.HS_Code} ${row.Libelle_HS_Code}`.toLowerCase(),
    header: "",
    cell: () => null,
    enableSorting: false,
    enableHiding: false,
    size: 0,
  },
  {
    accessorKey: "HS_Code",
    header: "Code",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold">{row.original.HS_Code}</span>
      </div>
    ),
  },
  {
    accessorKey: "Libelle_HS_Code",
    header: "Libellé",
    cell: ({ row }) => (
      <span>{row.original.Libelle_HS_Code}</span>
    ),
  },
  {
    accessorKey: "Date_Creation",
    header: "Date de création",
    cell: ({ row }) => {
      try {
        return format(new Date(row.original.Date_Creation), "dd MMM yyyy");
      } catch {
        return <span className="text-muted-foreground">-</span>;
      }
    },
  },
]    