"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { previewHSCodesImport } from "../../server/actions";
import { HSCodeImportPreviewDialog } from "./hscode-import-preview-dialog";

export const HSCodeImportDialog = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await previewHSCodesImport(formData);
      
      if (!result.success || !result.data) {
        toast.error(
          typeof result.error === "string"
            ? result.error
            : "Erreur lors de l'analyse"
        );
        return;
      }

      setPreviewData(result.data);
      setShowPreview(true);
      e.target.value = "";
    } catch (err) {
      toast.error("Erreur lors du traitement du fichier");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const XLSX = require("xlsx");
    const worksheet = XLSX.utils.json_to_sheet([
      { Row_Key: "HS-001", HS_Code: "123456", Description: "Exemple de produit" },
      { Row_Key: "HS-002", HS_Code: "789012", Description: "Autre exemple" },
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HSCodes");

    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 40 }
    ];

    XLSX.writeFile(workbook, "template-hscodes.xlsx");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={downloadTemplate}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Template
        </Button>

        <label htmlFor="excel-import-hscode" className="cursor-pointer">
          <Button
            asChild
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {isLoading ? "Chargement..." : "Importer Excel"}
            </span>
          </Button>
          <input
            id="excel-import-hscode"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={isLoading}
            className="hidden"
          />
        </label>
      </div>

      <HSCodeImportPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        previewData={previewData}
      />
    </>
  );
};