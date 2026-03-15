import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen, Video, ArrowRight, ShoppingCart, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: number;
  title: string;
  description: string;
  price_dzd: string;
  cover_image: string | null;
  duration: string;
  category_details: { id: number; name: string } | null;
  videos?: { duration_seconds: number }[];
}

const formatPrice = (price: string) => parseFloat(price).toLocaleString("fr-DZ");

const formatDuration = (course: Course) => {
  if (!course.videos || course.videos.length === 0) return course.duration || "0 min";
  const totalSeconds = course.videos.reduce((sum, v) => sum + v.duration_seconds, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
};

const PopularCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses/");
        if (res.ok) {
          const data: Course[] = await res.json();
          setCourses(data.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleBuy = async (e: React.MouseEvent, courseId: number) => {
    e.stopPropagation();
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour acheter cette formation." });
      navigate("/login");
      return;
    }
    setLoadingId(courseId);
    try {
      const res = await fetch("/api/payment/checkout/", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ item_type: "course", item_id: courseId }),
      });
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast({ variant: "destructive", title: "Erreur", description: data.error || "Impossible de créer le paiement." });
      }
    } catch {
      toast({ variant: "destructive", title: "Erreur réseau", description: "Vérifiez votre connexion." });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-widest">
            Formations
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Nos formations les plus{" "}
            <span className="text-gradient">populaires</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Des programmes conçus par des scientifiques pour te donner les
            compétences nécessaires à la création de produits cosmétiques
            professionnels.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <BookOpen className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <p className="text-xl font-medium text-muted-foreground">Aucune formation disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {courses.map((course, i) => (
              <motion.article
                key={course.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 border border-border hover:-translate-y-1 flex flex-col cursor-pointer"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div className="relative h-48 gradient-primary flex items-center justify-center overflow-hidden border-b border-border">
                  {course.cover_image ? (
                    <img
                      src={course.cover_image.startsWith("http") ? course.cover_image : `${course.cover_image}`}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-primary-foreground/50 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {course.category_details && (
                    <Badge className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur-md border border-border text-foreground font-medium text-xs shadow-sm">
                      {course.category_details.name}
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Eye className="h-5 w-5" /> Voir le programme
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-foreground text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-3 leading-relaxed flex-1">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-5">
                    <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md text-foreground">
                      <Clock className="h-4 w-4 text-accent" />{formatDuration(course)}
                    </span>
                    <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md text-foreground">
                      <Video className="h-4 w-4 text-primary" />{course.videos?.length ?? 0} modules
                    </span>
                  </div>

                  <div className="flex items-end justify-between pt-5 border-t border-border mt-auto">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Prix</span>
                      <span className="text-2xl font-bold tracking-tight text-foreground">
                        {formatPrice(course.price_dzd)}{" "}
                        <span className="text-sm font-normal text-muted-foreground">DZD</span>
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="gradient-primary text-primary-foreground border-0 rounded-lg gap-2"
                      onClick={(e) => handleBuy(e, course.id)}
                      disabled={loadingId === course.id}
                    >
                      {loadingId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><ShoppingCart className="h-4 w-4" /> Acheter</>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/courses">
            <Button variant="outline" size="lg" className="rounded-xl font-semibold">
              Voir toutes les formations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularCourses;
