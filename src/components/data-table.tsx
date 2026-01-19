"use client"

import { useState, useEffect } from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    ColumnFiltersState,
    useReactTable,
    RowSelectionState,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[],
    onRowClick?: (row: TData) => void
    searchKey?: string
    searchPlaceholder?: string
    enableRowSelection?: boolean
    onSelectionChange?: (selectedRows: TData[]) => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
    onRowClick,
    searchKey,
    searchPlaceholder = "Rechercher...",
    enableRowSelection = false,
    onSelectionChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        enableRowSelection: enableRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    })

    // Notify parent of selection changes
    useEffect(() => {
        if (onSelectionChange && enableRowSelection) {
            const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
            onSelectionChange(selectedRows)
        }
    }, [rowSelection, enableRowSelection, onSelectionChange, table])

    return (
        <div className="space-y-4">
            {searchKey && (
                <div className="flex items-center">
                    <Input
                        placeholder={searchPlaceholder}
                        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn(searchKey)?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                </div>
            )}
            <div className="rounded-lg border bg-background overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="p-4">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    onClick={() => onRowClick?.(row.original)}
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={onRowClick ? "cursor-pointer" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="text-sm p-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-19 text-center text-muted-foreground">
                                    Aucune donnée à afficher.
                                </TableCell>
                            </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-sm text-muted-foreground">
                {enableRowSelection && table.getFilteredSelectedRowModel().rows.length > 0 ? (
                    <span>
                        {table.getFilteredSelectedRowModel().rows.length} ligne(s) sélectionnée(s) sur {table.getFilteredRowModel().rows.length}
                    </span>
                ) : (
                    <span>{table.getFilteredRowModel().rows.length} ligne(s) au total</span>
                )}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Lignes par page</p>
                    <select
                        value={table.getState().pagination.pageSize}
                        onChange={(e) => {
                            table.setPageSize(Number(e.target.value))
                        }}
                        className="h-8 w-[70px] rounded-md border border-input bg-background px-2 text-sm"
                    >
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} sur{" "}
                    {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Précédent
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Suivant
                    </Button>
                </div>
            </div>
        </div>
    </div>
    )
}