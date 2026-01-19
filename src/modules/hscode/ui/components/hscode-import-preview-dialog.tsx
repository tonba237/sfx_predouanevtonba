"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { importHSCodesFromExcel } from "../../server/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface HSCodePreviewItem {
  Row_Key: string;
  HS_Code: string;
  Description: string;
  status: 'new' | 'existing';
}

interface PreviewData {
  preview: HSCodePreviewItem[];
  total: number;
  valid: number;
  stats: {
    new: number;
    existing: number;
  };
  errors?: string[];
}

interface ImportResultData {
  created: number;
  updated: number;
}

interface HSCodeImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: PreviewData | null;
}

export const HSCodeImportPreviewDialog = ({
  open,
  onOpenChange,
  previewData,
}: HSCodeImportPreviewDialogProps) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const router = useRouter();

 // ✅ Correct: effet déclenché quand previewData change
  useEffect(() => {
    if (previewData) {
      setSelectedRows(new Set(previewData.preview.map((_, idx) => idx)));
    }
  }, [previewData]);

  if (!previewData) return null;

  const toggleRow = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.size === previewData.preview.length
        ? new Set()
        : new Set(previewData.preview.map((_, idx) => idx))
    );
  };

  const handleImport = async () => {
    const rowsToImport = previewData.preview.filter(
      (_, idx) => selectedRows.has(idx)
    );

    if (rowsToImport.length === 0) {
      toast.error("Veuillez sélectionner au moins une ligne");
      return;
    }

    setIsImporting(true);

    try {
      const mode = updateExisting ? "both" : "create";
      const result = await importHSCodesFromExcel(rowsToImport, mode);

      if (!result.success) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Erreur lors de l'import"
        );
        return;
      }

      const data = result.data as ImportResultData;
      toast.success(`${data.created} créé(s), ${data.updated} mis à jour`);
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      toast.error("Erreur lors de l'import");
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = selectedRows.size;
  const newCount = previewData.preview.filter(
    (row, idx) => selectedRows.has(idx) && row.status === "new"
  ).length;
  const existingCount = previewData.preview.filter(
    (row, idx) => selectedRows.has(idx) && row.status === "existing"
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! max-h-[90vh]!">
        <DialogHeader>
          <DialogTitle>Aperçu de l'import - {previewData.preview.length} ligne(s)</DialogTitle>
          <DialogDescription>
            Sélectionnez les lignes à importer. Les lignes existantes sont marquées en orange.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2 border-b flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedRows.size === previewData.preview.length}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium">
              Tout sélectionner ({selectedCount}/{previewData.preview.length})
            </span>
          </div>

          {existingCount > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={updateExisting}
                onCheckedChange={(checked) => setUpdateExisting(!!checked)}
              />
              <span className="text-sm">Mettre à jour les existants</span>
            </div>
          )}

          <div className="ml-auto flex gap-2">
            <Badge variant="secondary">{newCount} nouveau(x)</Badge>
            {existingCount > 0 && (
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                {existingCount} existant(s)
              </Badge>
            )}
          </div>
        </div>

        {previewData.errors && previewData.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Erreurs détectées:</div>
              <ul className="mt-2 list-disc list-inside text-sm">
                {previewData.errors.slice(0, 5).map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
                {previewData.errors.length > 5 && (
                  <li>... et {previewData.errors.length - 5} autres erreurs</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-2">
            {previewData.preview.map((row, idx) => {
              const isExisting = row.status === 'existing';
              const isSelected = selectedRows.has(idx);

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                    isSelected ? "bg-accent/50" : "bg-background"
                  } ${isExisting ? "border-orange-300" : "border-border"}`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRow(idx)}
                    className="mt-1"
                  />

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {row.Row_Key}
                      </span>
                      {isExisting && (
                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                          Existe
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        HS: {row.HS_Code}
                      </Badge>
                    </div>

                    <p className="text-sm font-medium">{row.Description}</p>
                  </div>
                </div>
              );
            })}
          </div>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Annuler
          </Button>
          <Button onClick={handleImport} disabled={isImporting || selectedCount === 0}>
            {isImporting ? "Import en cours..." : `Importer ${selectedCount} ligne(s)`}
          </Button>
        </DialogFooter>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
