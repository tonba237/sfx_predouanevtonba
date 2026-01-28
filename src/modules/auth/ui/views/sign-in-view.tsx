"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OctagonAlertIcon } from "lucide-react";
import  { signIn }  from "@/modules/auth/server/actions";


const formSchema = z.object({
  codeUtilisateur: z.string().min(1, {
    message: "Le code utilisateur est requis.",
  }),
});

export const SignInView = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codeUtilisateur: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setError(null);
    setPending(true);

    try {
      const result = await signIn(data.codeUtilisateur);

      if (!result.success) {
        setError(result.error || 'Code utilisateur invalide');
        setPending(false);
        return;
      }

      // Rediriger vers la page d'accueil
      router.push("/");
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion");
      setPending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image / GIF */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-background.gif')" }}
      ></div>

      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/50">
        <div className="relative z-10 min-h-screen grid place-items-center px-4">
          {/* Carte de login */}
          <Card className="relative w-full max-w-md backdrop-blur-md bg-card/80 border-white/20 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex flex-col gap-6">
                {/* Logo */}
                <div className="flex justify-center">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-md">
                    <img
                      src="/Mon-logo-SFX_Pre-Douane.png"
                      alt="SFX Pre-Douane"
                      className="h-full w-full object-cover p-3"
                    />
                  </div>
                </div>

                {/* Titre */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold">Connectez-vous !</h1>
                  <p className="text-muted-foreground text-sm">
                    Entrez votre code utilisateur pour continuer
                  </p>
                </div>

                {/* Formulaire */}
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                  >
                    <FormField
                      control={form.control}
                      name="codeUtilisateur"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code Utilisateur</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Entrez votre code utilisateur"
                              className="bg-white text-black placeholder:text-gray-500 border border-gray-300 focus-visible:ring-primary/40"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {error && (
                      <Alert className="bg-destructive/10 border-none">
                        <OctagonAlertIcon className="h-4 w-4 text-destructive" />
                        <AlertTitle>{error}</AlertTitle>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      disabled={pending}
                      className={`w-full transition-colors ${
                        pending
                          ? "bg-black text-white"
                          : "bg-[#3c2aaf] text-white hover:bg-black"
                      }`}
                    >
                      {pending ? "Connexion en cours..." : "Se connecter"}
                    </Button>
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
