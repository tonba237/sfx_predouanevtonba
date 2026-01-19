import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { HscodeCreateSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { HscodeCreate } from "@/lib/validation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createHSCode, updateHSCode } from "../../server/actions";

/* ============================================================================
   TYPES
============================================================================ */

interface HscodeFormData {
  id?: string;
  code?: string;
  libelle?: string;
}

interface HscodeFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: HscodeFormData;
}

/* ============================================================================
   COMPONENT
============================================================================ */

export const HscodeForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: HscodeFormProps) => {
  const form = useForm<HscodeCreate>({
    resolver: zodResolver(HscodeCreateSchema),
    defaultValues: {
      code: initialValues?.code ?? "",
      libelle: initialValues?.libelle ?? "",
    },
  });

  const isPending = form.formState.isSubmitting;
 // ✅ Sécurisation du mode édition
  const isEdit =
    typeof initialValues?.id === "string" &&
    initialValues.id.trim().length > 0 &&
  !Number.isNaN(Number(initialValues.id));

  /* ============================================================================
     SUBMIT
  ============================================================================ */

  const onSubmit = async (data: HscodeCreate) => {
      try {
        /* ============================ UPDATE ============================ */
        if (isEdit) {
          const id = initialValues!.id!;

          const result = await updateHSCode(id, data);
  
          if (!result.success) {
            toast.error(
              typeof result.error === "string"
                ? result.error
                : "Erreur lors de la mise à jour du HS Code"
            );
            return;
          }
  
          toast.success("HS Code mis à jour avec succès");
          onSuccess?.(id);
          return;
        }
   /* ============================ CREATE ============================ */
        const result = await createHSCode(data);
  
        if (!result.success) {
          toast.error(
            typeof result.error === "string"
              ? result.error
              : "Erreur lors de la création du HS Code"
          );
          return;
        }
  
        const createdId = result.data?.ID_HS_Code;
  
        if (!createdId) {
          toast.error("Création réussie mais ID introuvable");
          return;
        }
  
        toast.success("HS Code créé avec succès");
        onSuccess?.(createdId.toString());
  
      } catch (error) {
        toast.error("Une erreur inattendue est survenue");
        console.error("HscodeForm submit error:", error);
      }
  };
  
    
  /* ======================================================================== */
  /* RENDER */
  /* ======================================================================== */

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code*</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. 12345678" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="libelle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Libelle*</FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="Libellé du HS Code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between gap-x-2 pt-2">
            {onCancel && (
              <Button
                variant="ghost"
                disabled={isPending}
                type="button"
                onClick={onCancel}
              >
                Fermer
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isPending}
            >
              {isEdit ? "Mettre à jour le Hscode" : "Créer le Hscode"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};