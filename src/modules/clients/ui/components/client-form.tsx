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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createClient, updateClient } from "../../server/actions";
import { toast } from "sonner";

// Schema simplifié - seul le nom est requis
const ClientFormSchema = z.object({
  nom: z.string().min(1, "Le nom du client est requis"),
});

type ClientFormData = z.infer<typeof ClientFormSchema>;

interface ClientFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: { id: string; nomClient: string };
}

export const ClientForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: ClientFormProps) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(ClientFormSchema),
    defaultValues: {
      nom: initialValues?.nomClient ?? "",
    },
  });

  const isPending = form.formState.isSubmitting;
  const isEdit = !!initialValues?.id;

  const onSubmit = async (data: ClientFormData) => {
   try {
    if(isEdit) {
      // convertir string -> number avant d'envoyer au serveur
      const updatedClient = await updateClient(initialValues.id, data);
      if (updatedClient.success) {
        toast.success("Client mis à jour avec succès");
        onSuccess ?.(initialValues.id);
      } else {
        toast.error(String(updatedClient.error) || "Erreur lors de la mise à jour du client");
      }
    } else {
      const client = await createClient(data);
      if(client.success) {
        toast.success("Client créé avec succès");
        onSuccess ?.(client.data?.ID_Client.toString());
      } else {
        toast.error(String(client.error) || "Erreur lors de la création du client");
      }
    }
   } catch (error) {
      // Logger l'erreur pour le debug
      console.error(isEdit ? 'Erreur update client:' : 'Erreur création client:', error);
      const errorMessage = isEdit ? "Erreur lors de la mise à jour" : "Erreur lors de la création";
      toast.error(errorMessage);
   }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du client*</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: PERENCO CAMEROUN"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={onCancel}
            >
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "En cours..." : isEdit ? "Mettre à jour" : "Créer le client"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
