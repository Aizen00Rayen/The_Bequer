import { motion } from "framer-motion";
import { FlaskConical, Lightbulb, Rocket, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: FlaskConical,
    title: "Formulation Scientifique",
    desc: "Apprends les bases chimiques et crée des formules stables, efficaces et conformes aux normes.",
  },
  {
    icon: Lightbulb,
    title: "Méthodologie Éprouvée",
    desc: "Un parcours structuré étape par étape, de la théorie à la commercialisation.",
  },
  {
    icon: Rocket,
    title: "Lancement de Marque",
    desc: "Accompagnement complet pour passer de la formule au produit vendu en ligne.",
  },
  {
    icon: ShieldCheck,
    title: "Conformité Réglementaire",
    desc: "Maîtrise les réglementations cosmétiques pour vendre en toute légalité.",
  },
];

const WhySection = () => {
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
            Pourquoi The Bequer
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            La science au service de ta <span className="text-gradient">beauté</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="text-center group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="mx-auto h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-5 shadow-elegant group-hover:scale-110 transition-transform">
                <f.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
