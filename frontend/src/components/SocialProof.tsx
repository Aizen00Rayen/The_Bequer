import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Amina K.",
    role: "Fondatrice, Glow Naturals",
    text: "Grâce à The Bequer, j'ai pu formuler mes propres soins et lancer ma marque en 6 mois. L'accompagnement est exceptionnel.",
    rating: 5,
  },
  {
    name: "Sophie M.",
    role: "Créatrice, Belle Essence",
    text: "La formation est complète et scientifiquement rigoureuse. J'ai enfin confiance en mes formulations cosmétiques.",
    rating: 5,
  },
  {
    name: "Fatou D.",
    role: "Entrepreneuse Beauté",
    text: "Le programme Brand Builder m'a donné toutes les clés pour passer de l'idée à un business rentable. Merci The Bequer !",
    rating: 5,
  },
];

const SocialProof = () => {
  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-widest">
            Témoignages
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Elles ont transformé leur passion en <span className="text-gradient">business</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="bg-background rounded-2xl p-8 shadow-card hover:shadow-hover transition-shadow duration-300 border border-border relative"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Quote className="h-8 w-8 text-accent/20 mb-4" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
