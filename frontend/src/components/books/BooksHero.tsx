const BooksHero = () => {
    return (
        <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-background via-card to-background">
            {/* Decorative background elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/4 w-72 h-72 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute top-1/3 right-1/4 w-56 h-56 rounded-full bg-accent/5 blur-3xl" />
            </div>

            <div className="container relative max-w-4xl mx-auto px-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-6">
                    📚 Bibliothèque
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-5">
                    Notre{" "}
                    <span className="gradient-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Librairie
                    </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    Découvrez notre sélection de livres soigneusement choisis pour
                    développer vos compétences et alimenter votre passion.
                </p>
            </div>
        </section>
    );
};

export default BooksHero;
