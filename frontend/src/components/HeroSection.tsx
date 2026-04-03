import { motion } from "framer-motion";
import { Star, Users, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { icon: Users, label: "Étudiantes", value: "2,500+" },
  { icon: Star, label: "Note moyenne", value: "4.9/5" },
  { icon: Award, label: "Marques lancées", value: "180+" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-hero" />
      </div>

      <div className="container relative z-10 pt-24 pb-16">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground text-sm font-medium mb-6 border border-primary-foreground/20">
              🧪 Académie de Formulation Cosmétique
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-primary-foreground leading-[1.1] mb-6">
              Formule. Crée.
              <br />
              <span className="font-light opacity-90">Lance ta marque.</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-lg mb-8 leading-relaxed">
              Apprends la formulation cosmétique, crée tes produits et lance ta
              marque de beauté avec l'accompagnement d'experts scientifiques.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                onClick={() => navigate("/courses")}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-base font-semibold px-8 h-13 rounded-xl"
              >
                Commencer à Apprendre
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/brand")}
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base font-semibold px-8 h-13 rounded-xl bg-transparent"
              >
                Lancer ma Marque
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-primary-foreground/10"
              >
                <s.icon className="h-5 w-5 text-primary-foreground/70" />
                <div>
                  <p className="text-lg font-bold text-primary-foreground">{s.value}</p>
                  <p className="text-xs text-primary-foreground/60">{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
