import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, User, Mail, Lock, BookOpen } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
    username: z.string().min(3, "Nom d'utilisateur requis"),
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Le mot de passe doit comporter au moins 6 caractères"),
    role: z.enum(["student", "teacher"], { required_error: "Veuillez sélectionner un rôle" }),
});

const Register = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { username: "", email: "", password: "", role: "student" },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/auth/register/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg =
                    data.username?.[0] ||
                    data.email?.[0] ||
                    data.password?.[0] ||
                    data.non_field_errors?.[0] ||
                    data.detail ||
                    "Erreur d'inscription";
                throw new Error(errorMsg);
            }

            toast({
                title: "Inscription réussie !",
                description: "Votre compte est en attente d'approbation par l'administrateur."
            });
            navigate("/login");

        } catch (error: any) {
            toast({ variant: "destructive", title: "Erreur", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4">
                <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm relative overflow-hidden animate-fade-in">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                    <div className="text-center mb-8 relative z-10">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Rejoignez-nous</h1>
                        <p className="text-sm text-muted-foreground">Créez votre compte The Bequer</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative z-10">
                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom d'utilisateur</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Identifiant" className="pl-10 bg-background/50" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input type="email" placeholder="nom@exemple.com" className="pl-10 bg-background/50" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="password" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mot de passe</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input type="password" placeholder="••••••••" className="pl-10 bg-background/50" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vous êtes</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-background/50">
                                                <SelectValue placeholder="Sélectionnez un rôle" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="student">Étudiant / Visionnaire</SelectItem>
                                            <SelectItem value="teacher">Formateur / Expert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <Button type="submit" className="w-full h-11 gradient-primary text-white border-0 mt-4" disabled={isSubmitting}>
                                {isSubmitting ? "Création..." : "S'inscrire"}
                                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    </Form>

                    <p className="text-center text-sm text-muted-foreground mt-6 relative z-10">
                        Déjà un compte ?{" "}
                        <Link to="/login" className="text-primary hover:underline font-medium">Se connecter</Link>
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Register;
