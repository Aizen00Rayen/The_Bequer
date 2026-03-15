import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sparkles, Target, Users, MapPin, Calendar, Heart } from "lucide-react";

const About = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-16">
                <div className="container max-w-5xl mx-auto px-4">

                    <div className="flex flex-col items-center text-center space-y-6 mt-8 mb-16 animate-fade-in relative z-10">
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Notre Histoire
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-3xl">
                            Donner vie à l'excellence cosmétique en <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Algérie</span>.
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                            Chez The Bequer, nous croyons au pouvoir de la création locale. Notre académie accompagne
                            les visionnaires de la formulation jusqu'au lancement réussi de leur marque.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center mb-24 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="space-y-6 relative z-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <h2 className="text-3xl font-bold text-foreground">Notre Mission</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Née en <strong className="text-foreground">2026</strong>, The Bequer a été fondée avec un objectif clair : combler le fossé entre la passion pour les cosmétiques et l'industrie en Algérie.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Nous sommes partis du constat que de nombreux talents locaux possèdent des idées brillantes, mais manquent de l'expertise technique et stratégique pour créer une marque de zéro (from scratch).
                                C'est là que nous intervenons : nous fournissons la formation, les laboratoires, et l'accompagnement d'experts pour transformer vos idées en produits réels et commercialisables.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <MapPin className="h-10 w-10 text-primary mb-4" />
                                <h3 className="font-semibold text-xl mb-2">Fiers de nos Racines</h3>
                                <p className="text-muted-foreground">Une expertise internationale, adaptée et appliquée au marché algérien.</p>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <Calendar className="h-10 w-10 text-primary mb-4" />
                                <h3 className="font-semibold text-xl mb-2">Depuis 2026</h3>
                                <p className="text-muted-foreground">L'année où notre vision commune a pris forme pour révolutionner le secteur.</p>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                                <Target className="h-10 w-10 text-primary mb-4" />
                                <h3 className="font-semibold text-xl mb-2">Création "From Scratch"</h3>
                                <p className="text-muted-foreground">De la première formule chimique jusqu'au design du packaging, nous vous montrons exactement comment tout construire de A à Z.</p>
                            </div>
                        </div>
                    </div>

                    {/* Value Section */}
                    <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                            <Heart className="h-12 w-12 text-primary mx-auto" />
                            <h2 className="text-3xl font-bold text-foreground">L'avenir de la beauté s'écrit ensemble</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Que vous souhaitiez formuler des crèmes de soins organiques ou la prochaine gamme de maquillage phare du pays,
                                The Bequer est votre partenaire dévoué pour propulser l'innovation "Made in Algeria".
                            </p>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default About;
