import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Lock, Mail } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
    username: z.string().min(3, "Nom d'utilisateur requis"),
    password: z.string().min(6, "Mot de passe requis (min 6 caractères)"),
});

const Login = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { username: "", password: "" },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/auth/login/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || data.non_field_errors?.[0] || "Erreur de connexion");
            }

            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            localStorage.setItem("user_role", data.user.role);

            toast({ title: "Connexion réussie", description: "Bienvenue sur The Bequer." });

            if (data.user.role === "admin") navigate("/admin-dashboard");
            else if (data.user.role === "teacher") navigate("/teacher-dashboard");
            else navigate("/courses");

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: error.message
            });
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
                        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Bienvenue</h1>
                        <p className="text-sm text-muted-foreground">Connectez-vous à votre compte The Bequer</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom d'utilisateur</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Votre identifiant" className="pl-10 bg-background/50" {...field} />
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

                            <Button type="submit" className="w-full h-11 gradient-primary text-white border-0 mt-2" disabled={isSubmitting}>
                                {isSubmitting ? "Connexion..." : "Se connecter"}
                                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    </Form>

                    <p className="text-center text-sm text-muted-foreground mt-6 relative z-10">
                        Pas encore de compte ?{" "}
                        <Link to="/register" className="text-primary hover:underline font-medium">Créer un compte</Link>
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Login;
