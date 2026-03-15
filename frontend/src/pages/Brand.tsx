import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Sparkles, ArrowRight, CheckCircle2, Globe, Smartphone,
    Megaphone, Palette, Camera, Share2, MessageCircle, Mail,
    Building2, Star, Zap
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
    fullName: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
    email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
    phone: z.string().min(9, { message: "Veuillez entrer un numéro de téléphone valide." }),
    brandName: z.string().optional(),
    productCategory: z.string({ required_error: "Veuillez sélectionner une catégorie." }),
    budget: z.string({ required_error: "Veuillez sélectionner une tranche de budget." }),
    description: z.string().min(20, { message: "Veuillez décrire votre vision (min. 20 caractères)." }),
});

const services = [
    {
        icon: Building2,
        title: "Création de Marque",
        description: "Nous construisons votre identité de marque de A à Z : nom, positionnement, valeurs et stratégie globale pour vous démarquer sur le marché.",
        color: "from-violet-500/20 to-purple-500/10",
        iconColor: "text-violet-400",
    },
    {
        icon: Globe,
        title: "Développement Web",
        description: "Sites vitrines, boutiques e-commerce, plateformes sur mesure. Des expériences web modernes, rapides et optimisées SEO.",
        color: "from-blue-500/20 to-cyan-500/10",
        iconColor: "text-blue-400",
    },
    {
        icon: Smartphone,
        title: "Application Mobile",
        description: "Applications iOS et Android natives ou cross-platform. Transformez votre vision en une app intuitive et performante.",
        color: "from-green-500/20 to-emerald-500/10",
        iconColor: "text-green-400",
    },
    {
        icon: Megaphone,
        title: "Marketing Digital",
        description: "Stratégies marketing digitales percutantes : publicités, campagnes Google & Meta Ads, emailing et growth hacking.",
        color: "from-orange-500/20 to-amber-500/10",
        iconColor: "text-orange-400",
    },
    {
        icon: Palette,
        title: "Identité Visuelle",
        description: "Logo, charte graphique, typographies et couleurs qui reflètent l'âme de votre marque avec professionnalisme et cohérence.",
        color: "from-pink-500/20 to-rose-500/10",
        iconColor: "text-pink-400",
    },
    {
        icon: Camera,
        title: "Design Créatif",
        description: "Affiches, brochures, packagings, catalogues et tous supports print & digital avec un design premium et original.",
        color: "from-indigo-500/20 to-blue-500/10",
        iconColor: "text-indigo-400",
    },
    {
        icon: Share2,
        title: "Social Media",
        description: "Gestion complète de vos réseaux sociaux : stratégie de contenu, création de posts, calendrier éditorial et engagement communauté.",
        color: "from-red-500/20 to-pink-500/10",
        iconColor: "text-red-400",
    },
];

const Brand = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            brandName: "",
            description: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/brand/requests/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: values.fullName,
                    email: values.email,
                    phone: values.phone,
                    brand_name: values.brandName,
                    product_category: values.productCategory,
                    budget: values.budget,
                    description: values.description,
                }),
            });

            if (!response.ok) throw new Error("Erreur lors de l'envoi de la demande");

            setIsSubmitting(false);
            setIsSuccess(true);
            toast({ title: "Demande envoyée avec succès !", description: "Notre équipe vous contactera très prochainement." });
        } catch (error: any) {
            setIsSubmitting(false);
            toast({ variant: "destructive", title: "Erreur", description: error.message || "Impossible de contacter le serveur." });
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-20 pb-16">

                {/* ── HERO SECTION ── */}
                <section className="relative py-20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 pointer-events-none" />
                    {/* Decorative orbs */}
                    <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="container max-w-6xl mx-auto px-4 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            {/* Left: Text */}
                            <motion.div
                                className="flex-1 text-center lg:text-left"
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Partenaire Officiel — Spectra Agency
                                </div>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6">
                                    Donnez vie à votre{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                                        marque
                                    </span>{" "}
                                    avec Spectra
                                </h1>

                                <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                                    De l'idée au lancement, Spectra Agency transforme votre vision en une marque puissante, cohérente et mémorable sur tous les canaux digitaux.
                                </p>

                                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                                    {["Branding", "Web & Mobile", "Marketing", "Design", "Social Media"].map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-card border border-border rounded-full text-sm font-medium text-foreground">
                                            ✦ {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Right: Spectra Logo Card */}
                            <motion.div
                                className="w-full lg:w-96 shrink-0"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="relative group">
                                    {/* Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                                    <div className="relative bg-black rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden text-center">
                                        {/* Geometric background pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="absolute border border-white/20 rotate-12"
                                                    style={{
                                                        width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
                                                        top: `${10 + i * 5}%`, left: `${10 + i * 5}%`
                                                    }} />
                                            ))}
                                        </div>

                                        {/* Logo image — if available, otherwise styled text logo */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <img
                                                src="/spectra-logo.png"
                                                alt="Spectra Agency"
                                                className="w-40 h-40 object-contain mb-4 drop-shadow-2xl"
                                                onError={(e) => {
                                                    // Fallback to styled text if image missing
                                                    (e.target as HTMLImageElement).style.display = "none";
                                                    const fallback = document.getElementById("spectra-fallback-logo");
                                                    if (fallback) fallback.style.display = "flex";
                                                }}
                                            />
                                            {/* Fallback logo in CSS if image not found */}
                                            <div
                                                id="spectra-fallback-logo"
                                                className="hidden w-36 h-36 mb-4 items-center justify-center"
                                            >
                                                <div className="relative">
                                                    <div className="text-7xl font-black text-white" style={{
                                                        fontFamily: "system-ui",
                                                        textShadow: "0 0 30px rgba(255,255,255,0.5), 2px 2px 0 #888, 4px 4px 0 #666",
                                                        letterSpacing: "-0.05em"
                                                    }}>S</div>
                                                </div>
                                            </div>
                                            <div className="text-white font-black text-3xl tracking-[0.3em] uppercase mb-1">SPECTRA</div>
                                            <div className="text-white/50 text-xs tracking-widest">AGENCY</div>
                                        </div>

                                        {/* Stars */}
                                        <div className="flex justify-center gap-1 mt-4 relative z-10">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                            ))}
                                        </div>
                                        <p className="text-white/60 text-xs mt-2 relative z-10">Agence digitale premium</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── WHAT SPECTRA DOES ── */}
                <section className="py-16 md:py-20">
                    <div className="container max-w-6xl mx-auto px-4">
                        <div className="text-center mb-14">
                            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
                                <Zap className="h-4 w-4" /> Nos expertises
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                                Tout ce dont votre marque a besoin,
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"> au même endroit</span>
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Spectra Agency est une agence digitale full-service. Nous prenons en charge chaque aspect de votre présence digitale pour que vous puissiez vous concentrer sur votre business.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {services.map((svc, i) => (
                                <motion.div
                                    key={i}
                                    className={`group relative p-6 rounded-2xl border border-border bg-gradient-to-br ${svc.color} hover:border-primary/30 hover:shadow-lg transition-all duration-300`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.07, duration: 0.4 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <div className={`w-11 h-11 rounded-xl bg-background/80 border border-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${svc.iconColor}`}>
                                        <svc.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-bold text-foreground text-base mb-2">{svc.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{svc.description}</p>
                                </motion.div>
                            ))}

                            {/* + 1 extra CTA card */}
                            <motion.div
                                className="group relative p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                                whileHover={{ y: -4 }}
                            >
                                <Sparkles className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                                <h3 className="font-bold text-foreground text-base mb-1">Et bien plus encore…</h3>
                                <p className="text-xs text-muted-foreground">Consulting, automatisation, formations et solutions sur mesure.</p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── CONTACT + FORM SECTION ── */}
                <section className="py-8">
                    <div className="container max-w-6xl mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-12 items-start">

                            {/* Left: Contact Info */}
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground mb-3">
                                        Démarrez votre projet avec Spectra
                                    </h2>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Remplissez le formulaire et notre équipe Spectra vous recontactera sous 24h pour une consultation gratuite et sans engagement.
                                    </p>
                                </div>

                                {/* Why choose us */}
                                <div className="space-y-3">
                                    {[
                                        "Équipe expérimentée et certifiée",
                                        "Solutions sur mesure adaptées à votre budget",
                                        "Suivi et support continu après livraison",
                                        "Portfolio de + 50 marques accompagnées",
                                        "Délais respectés, résultats garantis",
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                            <span className="text-foreground font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Contact Methods */}
                                <div className="space-y-4 pt-2">
                                    <h3 className="font-bold text-foreground text-lg">Contactez-nous directement</h3>

                                    <a
                                        href="https://wa.me/213556614740"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/40 transition-all duration-200 group"
                                    >
                                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <MessageCircle className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">WhatsApp</p>
                                            <p className="text-sm text-muted-foreground">+213 556 61 47 40</p>
                                            <p className="text-xs text-green-500 font-medium mt-0.5">Répondons généralement en moins d'une heure</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                                    </a>

                                    <a
                                        href="mailto:spectra26agency@gmail.com"
                                        className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 group"
                                    >
                                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Mail className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Email</p>
                                            <p className="text-sm text-muted-foreground">spectra26agency@gmail.com</p>
                                            <p className="text-xs text-primary font-medium mt-0.5">Réponse sous 24h ouvrées</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </a>
                                </div>
                            </div>

                            {/* Right: Form */}
                            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                                {isSuccess ? (
                                    <div className="flex flex-col items-center justify-center text-center space-y-4 py-12 animate-fade-in relative z-10">
                                        <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                                            <CheckCircle2 className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-foreground">Demande Reçue !</h3>
                                        <p className="text-muted-foreground max-w-sm">
                                            Merci pour votre confiance. L'équipe <strong>Spectra Agency</strong> vous contactera dans les 24 heures pour discuter de votre projet.
                                        </p>
                                        <div className="flex gap-3 mt-4">
                                            <a
                                                href="https://wa.me/213556614740"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
                                            >
                                                <MessageCircle className="h-4 w-4" /> WhatsApp
                                            </a>
                                            <Button variant="outline" onClick={() => { setIsSuccess(false); form.reset(); }}>
                                                Nouveau projet
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                                            <div className="space-y-1 mb-6">
                                                <h3 className="text-2xl font-semibold text-foreground">Parlez-nous de votre projet</h3>
                                                <p className="text-sm text-muted-foreground">Consultation gratuite et sans engagement.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <FormField control={form.control} name="fullName" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nom Complet *</FormLabel>
                                                        <FormControl><Input placeholder="Votre nom" className="bg-background/50" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="email" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email *</FormLabel>
                                                        <FormControl><Input placeholder="vous@exemple.com" type="email" className="bg-background/50" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <FormField control={form.control} name="phone" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Téléphone *</FormLabel>
                                                        <FormControl><Input placeholder="0550 00 00 00" className="bg-background/50" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="brandName" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Nom de la marque (Optionnel)</FormLabel>
                                                        <FormControl><Input placeholder="Ex: Mon Projet" className="bg-background/50" {...field} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>

                                            <FormField control={form.control} name="productCategory" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Type de projet *</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-background/50">
                                                                <SelectValue placeholder="Que souhaitez-vous créer ?" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="brand">Création de marque complète</SelectItem>
                                                            <SelectItem value="website">Site web / E-commerce</SelectItem>
                                                            <SelectItem value="mobile_app">Application mobile</SelectItem>
                                                            <SelectItem value="marketing">Campagne marketing</SelectItem>
                                                            <SelectItem value="visual_identity">Identité visuelle / Logo</SelectItem>
                                                            <SelectItem value="social_media">Gestion réseaux sociaux</SelectItem>
                                                            <SelectItem value="design">Design & Création graphique</SelectItem>
                                                            <SelectItem value="makeup">Marque cosmétiques / Maquillage</SelectItem>
                                                            <SelectItem value="mixed">Projet complet (plusieurs services)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="budget" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Budget initial estimé *</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-background/50">
                                                                <SelectValue placeholder="Sélectionnez un budget en DZD" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="under_500k">Moins de 500,000 DZD</SelectItem>
                                                            <SelectItem value="500k_1m">500,000 DZD – 1,000,000 DZD</SelectItem>
                                                            <SelectItem value="1m_3m">1,000,000 DZD – 3,000,000 DZD</SelectItem>
                                                            <SelectItem value="over_3m">Plus de 3,000,000 DZD</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <FormField control={form.control} name="description" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Décrivez votre vision *</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Parlez-nous de votre projet, vos objectifs et ce que vous souhaitez accomplir..."
                                                            className="resize-none h-28 bg-background/50"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />

                                            <Button
                                                type="submit"
                                                className="w-full h-12 text-base font-medium gradient-primary text-white border-0 mt-4 gap-2"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? "Envoi en cours..." : "Soumettre mon projet"}
                                                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
                                            </Button>

                                            <p className="text-center text-xs text-muted-foreground">
                                                En soumettant ce formulaire, vous acceptez d'être contacté par l'équipe Spectra Agency.
                                            </p>
                                        </form>
                                    </Form>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
};

export default Brand;
