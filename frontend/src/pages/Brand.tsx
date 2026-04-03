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
import logo from "@/assets/new_logo.png";

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
                                    Une collaboration, une équipe, votre marque
                                </div>

                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6">
                                    <span className="font-light">The Bequer & Spectra :</span>{" "}
                                    Nous créons votre{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                                        marque cosmétique
                                    </span>{" "}
                                    ensemble
                                </h1>

                                <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                                    The Bequer et Spectra collaborent et travaillent ensemble en tant qu'équipe pour vous accompagner de la première formulation jusqu'au lancement digital de votre marque.
                                </p>

                                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                                    {["Formulation", "Branding", "Web & App", "Marketing", "Social Media"].map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-card border border-border rounded-full text-sm font-medium text-foreground">
                                            ✶ {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Right: Collaboration Card */}
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
                                        {/* Background pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="absolute border border-white/20 rotate-12"
                                                    style={{
                                                        width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
                                                        top: `${10 + i * 5}%`, left: `${10 + i * 5}%`
                                                    }} />
                                            ))}
                                        </div>

                                        <div className="relative z-10">
                                            {/* Logos side by side */}
                                            <div className="flex items-center justify-center gap-4 mb-5">
                                                {/* The Bequer logo */}
                                                <div className="flex flex-col items-center">
                                                    <img
                                                        src={logo}
                                                        alt="The Bequer"
                                                        className="w-16 h-16 object-contain rounded-xl mb-2 drop-shadow-2xl"
                                                    />
                                                    <span className="text-white font-black text-sm tracking-widest uppercase">The Bequer</span>
                                                </div>

                                                {/* X Separator */}
                                                <div className="flex flex-col items-center px-2">
                                                    <span className="text-3xl font-black text-white/40">×</span>
                                                </div>

                                                {/* Spectra logo */}
                                                <div className="flex flex-col items-center">
                                                    <img
                                                        src="/spectra-logo.png"
                                                        alt="Spectra Agency"
                                                        className="w-16 h-16 object-contain mb-2 drop-shadow-2xl"
                                                        onError={(e) => {
                                                            const el = e.target as HTMLImageElement;
                                                            el.style.display = "none";
                                                            const fallback = el.nextElementSibling as HTMLElement;
                                                            if (fallback) fallback.style.display = "flex";
                                                        }}
                                                    />
                                                    <div className="hidden w-16 h-16 mb-2 items-center justify-center">
                                                        <div className="text-5xl font-black text-white" style={{ textShadow: "0 0 20px rgba(255,255,255,0.4)" }}>S</div>
                                                    </div>
                                                    <span className="text-white font-black text-sm tracking-widest uppercase">Spectra</span>
                                                </div>
                                            </div>

                                            {/* Collab label */}
                                            <div className="bg-white/10 rounded-xl px-4 py-3 mb-4 border border-white/10">
                                                <p className="text-white/90 text-sm font-semibold mb-1">🤝 Une collaboration fusionnelle</p>
                                                <p className="text-white/60 text-xs leading-relaxed">
                                                    The Bequer et Spectra travaillent main dans la main en tant qu'équipe pour transformer votre idée en marque à succès.
                                                </p>
                                            </div>

                                            {/* Stars */}
                                            <div className="flex justify-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                                ))}
                                            </div>
                                            <p className="text-white/50 text-xs mt-2">Partenariat premium & exclusif</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── ROADMAP SECTION ── */}
                <section className="py-16 md:py-20">
                    <div className="container max-w-5xl mx-auto px-4">
                        <div className="text-center mb-14">
                            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent mb-4">
                                <Zap className="h-4 w-4" /> Notre parcours ensemble
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                                De la première idée au
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"> lancement officiel</span>
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Voici comment nous vous accompagnons, étape par étape, pour transformer votre vision en une marque cosmétique professionnelle.
                            </p>
                        </div>

                        <div className="relative">
                            {/* Vertical line */}
                            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-primary/20 hidden sm:block" style={{ transform: 'translateX(-50%)' }} />

                            {[
                                {
                                    step: "01",
                                    phase: "The Bequer",
                                    title: "Réunion de lancement (Meeting)",
                                    description: "Nous échangeons pour comprendre votre vision. Cette première rencontre permet de poser les bases de notre collaboration en équipe.",
                                    icon: MessageCircle,
                                    color: "from-violet-500/20 to-purple-500/10",
                                    iconBg: "bg-violet-500",
                                    side: "left",
                                },
                                {
                                    step: "02",
                                    phase: "The Bequer",
                                    title: "Choix du produit",
                                    description: "Nous vous aidons à choisir les produits stratégiques pour votre future gamme cosmétique.",
                                    icon: Star,
                                    color: "from-blue-500/20 to-cyan-500/10",
                                    iconBg: "bg-blue-500",
                                    side: "right",
                                },
                                {
                                    step: "03",
                                    phase: "The Bequer",
                                    title: "Formulation",
                                    description: "Nos experts créent vos formules exclusives. Nous passons de l'idée à la réalité scientifique avec précision.",
                                    icon: Sparkles,
                                    color: "from-pink-500/20 to-rose-500/10",
                                    iconBg: "bg-pink-500",
                                    side: "left",
                                },
                                {
                                    step: "04",
                                    phase: "The Bequer",
                                    title: "Validation & confirmation",
                                    description: "Nous validons ensemble le produit final. Une fois confirmé, nous passons aux étapes de design et de marketing.",
                                    icon: CheckCircle2,
                                    color: "from-green-500/20 to-emerald-500/10",
                                    iconBg: "bg-green-500",
                                    side: "right",
                                },
                                {
                                    step: "05",
                                    phase: "Spectra Services",
                                    title: "Identité visuelle & branding",
                                    description: "Nous créons l'univers visuel de votre marque : logo, packaging et charte graphique premium.",
                                    icon: Palette,
                                    color: "from-orange-500/20 to-amber-500/10",
                                    iconBg: "bg-orange-500",
                                    side: "left",
                                },
                                {
                                    step: "06",
                                    phase: "Spectra Services",
                                    title: "Présence digitale",
                                    description: "Nous construisons votre e-shop et votre présence sur les réseaux sociaux pour lancer les ventes.",
                                    icon: Globe,
                                    color: "from-indigo-500/20 to-blue-500/10",
                                    iconBg: "bg-indigo-500",
                                    side: "right",
                                },
                                {
                                    step: "07",
                                    phase: "Lancement",
                                    title: "Lancement officiel 🚀",
                                    description: "Nous lançons votre marque sur le marché. Notre équipe reste à vos côtés pour assurer le succès de votre entreprise.",
                                    icon: Zap,
                                    color: "from-yellow-500/20 to-orange-500/10",
                                    iconBg: "bg-gradient-to-r from-primary to-accent",
                                    side: "left",
                                },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    className={`relative flex flex-col sm:flex-row gap-6 mb-10 ${item.side === 'right' ? 'sm:flex-row-reverse' : ''
                                        }`}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08, duration: 0.5 }}
                                >
                                    {/* Timeline dot */}
                                    <div className="absolute left-8 sm:left-1/2 top-6 w-4 h-4 rounded-full border-4 border-background bg-primary hidden sm:block" style={{ transform: 'translate(-50%, 0)' }} />

                                    {/* Spacer for alternating */}
                                    <div className="hidden sm:block flex-1" />

                                    {/* Card */}
                                    <div className={`flex-1 sm:max-w-[calc(50%-2rem)] ${item.side === 'right' ? 'sm:mr-8' : 'sm:ml-8'}`}>
                                        <div className={`p-6 rounded-2xl border border-border bg-gradient-to-br ${item.color} hover:shadow-lg transition-all duration-300`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.iconBg} shrink-0`}>
                                                    <item.icon className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${item.phase === 'Cosmétique' ? 'bg-pink-500/20 text-pink-400' :
                                                        item.phase === 'Digital' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-yellow-500/20 text-yellow-400'
                                                        }`}>{item.phase}</span>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">Étape {item.step}</p>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-foreground text-base mb-2">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CONTACT + FORM SECTION ── */}
                < section className="py-8" >
                    <div className="container max-w-6xl mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-12 items-start">

                            {/* Left: Contact Info */}
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground mb-3">
                                        Démarrez votre projet avec nous
                                    </h2>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Remplissez le formulaire et notre équipe vous recontactera sous 24h pour une consultation gratuite et sans engagement.
                                    </p>
                                </div>

                                {/* Why choose us */}
                                <div className="space-y-3">
                                    {[
                                        "Collaboration unique The Bequer × Spectra",
                                        "Expertise cosmétique et digitale combinée",
                                        "Accompagnement de A à Z par une seule équipe",
                                        "Solutions sur mesure adaptées à votre budget",
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
                                        href="https://wa.me/213655380817"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 p-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/40 transition-all duration-200 group"
                                    >
                                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <MessageCircle className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">WhatsApp</p>
                                            <p className="text-sm text-muted-foreground">+213 655 38 08 17</p>
                                            <p className="text-xs text-green-500 font-medium mt-0.5">Répondons généralement en moins d'une heure</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                                    </a>

                                    <a
                                        href="mailto:contact@thebequer.tech"
                                        className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all duration-200 group"
                                    >
                                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Mail className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Email</p>
                                            <p className="text-sm text-muted-foreground">contact@thebequer.tech</p>
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
                                            Merci pour votre confiance. Notre équipe vous contactera dans les 24 heures pour discuter de votre projet.
                                        </p>
                                        <div className="flex gap-3 mt-4">
                                            <a
                                                href="https://wa.me/213655380817"
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
                                                En soumettant ce formulaire, vous acceptez d'être contacté par notre équipe.
                                            </p>
                                        </form>
                                    </Form>
                                )}
                            </div>
                        </div>
                    </div>
                </section >

            </main >

            <Footer />
        </div >
    );
};

export default Brand;
