import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CoursesPromoBanner = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <motion.div
          className="gradient-primary rounded-2xl p-10 md:p-16 text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Decorative elements */}
          <div className="absolute top-6 left-8 opacity-20">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="absolute bottom-8 right-10 opacity-20">
            <Sparkles className="h-12 w-12 text-primary-foreground" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Prête à lancer votre propre marque ?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
            Rejoignez notre programme d'accompagnement exclusif et transformez votre passion en business.
          </p>
          <Link to="/brand">
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-xl font-semibold text-base px-8"
            >
              Découvrir l'accompagnement premium
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CoursesPromoBanner;
