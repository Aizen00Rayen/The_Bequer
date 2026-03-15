import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, User, ShoppingCart, Loader2, Flame, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Book } from "@/pages/Books";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface BooksGridProps {
    books: Book[];
    loading: boolean;
}

const formatPrice = (price: number) => price.toLocaleString("fr-DZ");

const BooksGrid = ({ books, loading }: BooksGridProps) => {
    const { toast } = useToast();
    const navigate = useNavigate();


    if (loading) {
        return <div className="text-center py-20 text-muted-foreground">Chargement des livres...</div>;
    }

    if (books.length === 0) {
        return (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-xl font-medium text-muted-foreground mb-2">Aucun livre trouvé</p>
                <p className="text-sm text-muted-foreground">Veuillez sélectionner une autre catégorie.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {books.map((book, i) => {
                const hasDiscount = book.discount_percent && book.discount_percent > 0;
                const originalPrice = parseFloat(book.price_dzd as any);
                const finalPrice = book.discounted_price ?? originalPrice;

                return (
                    <motion.article
                        key={book.id}
                        className="group bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1 flex flex-col cursor-pointer"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        onClick={() => navigate(`/books/${book.id}`)}
                    >
                        {/* Cover image area */}
                        <div className="relative h-52 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border-b border-border overflow-hidden">
                            {book.cover_image ? (
                                <img
                                    src={book.cover_image.startsWith("http") ? book.cover_image : `${book.cover_image}`}
                                    alt={book.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <BookOpen className="h-20 w-20 text-primary/30 group-hover:scale-110 transition-transform duration-300" />
                            )}
                            <Badge className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur-md border border-border text-foreground font-medium text-xs shadow-sm">
                                {book.category_details?.name || "Général"}
                            </Badge>
                            {hasDiscount && (
                                <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                                    <Flame className="h-3 w-3" /> -{book.discount_percent}%
                                </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <span className="flex items-center gap-2 text-white font-semibold text-sm">
                                    <Eye className="h-5 w-5" /> Voir le livre
                                </span>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="font-bold text-foreground text-xl mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                {book.title}
                            </h3>
                            {book.author && (
                                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                                    <User className="h-3.5 w-3.5" /> {book.author}
                                </p>
                            )}
                            {book.description && (
                                <p className="text-sm text-muted-foreground mb-5 line-clamp-3 leading-relaxed flex-1">
                                    {book.description}
                                </p>
                            )}

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
                                        onClick={(e) => { e.stopPropagation(); navigate(`/books/${book.id}`); }}
                                    >
                                        <Eye className="h-4 w-4" /> Voir
                                    </Button>
                                    <Button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/books/${book.id}`); }}
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

export default BooksGrid;
