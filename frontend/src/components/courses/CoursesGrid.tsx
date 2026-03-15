import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen, Video, ShoppingCart, Loader2, Eye, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/pages/Courses";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CoursesGridProps {
  courses: Course[];
  loading: boolean;
}

const formatPrice = (price: number) => price.toLocaleString("fr-DZ");

const formatDuration = (course: Course) => {
  if (!course.videos || course.videos.length === 0) return course.duration || "0 min";
  const totalSeconds = course.videos.reduce((sum, v) => sum + v.duration_seconds, 0);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const CoursesGrid = ({ courses, loading }: CoursesGridProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Chargement des formations...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border">
        <p className="text-xl font-medium text-muted-foreground mb-2">Aucune formation trouvée</p>
        <p className="text-sm text-muted-foreground">Veuillez sélectionner une autre catégorie.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      {courses.map((course, i) => {
        const hasDiscount = course.discount_percent && course.discount_percent > 0;
        const originalPrice = parseFloat(course.price_dzd as any);
        const finalPrice = course.discounted_price ?? originalPrice;

        return (
          <motion.article
            key={course.id}
            className="group bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col cursor-pointer"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            onClick={() => navigate(`/courses/${course.id}`)}
          >
            {/* Cover image */}
            <div className="relative h-44 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border-b border-border overflow-hidden">
              {course.cover_image ? (
                <img
                  src={course.cover_image.startsWith("http") ? course.cover_image : `${course.cover_image}`}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <BookOpen className="h-16 w-16 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
              )}
              <Badge className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur-md border border-border text-foreground font-medium text-xs shadow-sm">
                {course.category_details?.name || "Général"}
              </Badge>
              {hasDiscount && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                  <Flame className="h-3 w-3" /> -{course.discount_percent}%
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Eye className="h-5 w-5" /> Voir le programme
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-foreground text-xl mb-3 group-hover:text-primary transition-colors line-clamp-2">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-5 line-clamp-3 leading-relaxed flex-1">
                {course.description}
              </p>
              <div className="flex items-center gap-3 text-sm mb-6 font-medium">
                <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md text-foreground">
                  <Clock className="h-4 w-4 text-accent" /> {formatDuration(course)}
                </span>
                <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md text-foreground">
                  <Video className="h-4 w-4 text-primary" /> {course.videos?.length || 0} modules
                </span>
              </div>

              <div className="flex items-end justify-between pt-5 border-t border-border mt-auto">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Prix</span>
                  {hasDiscount ? (
                    <div>
                      <span className="text-sm line-through text-muted-foreground mr-2">{formatPrice(originalPrice)} DZD</span>
                      <span className="text-2xl font-bold tracking-tight text-red-500">
                        {formatPrice(finalPrice)} <span className="text-sm font-normal text-muted-foreground">DZD</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {formatPrice(originalPrice)} <span className="text-sm font-normal text-muted-foreground">DZD</span>
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}
                  >
                    <Eye className="h-4 w-4" /> Programme
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}
                    size="sm"
                    className="gradient-primary text-white border-0 shadow-sm hover:shadow-md transition-shadow gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" /> Acheter
                  </Button>
                </div>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
};

export default CoursesGrid;
