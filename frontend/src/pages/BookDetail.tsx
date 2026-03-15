import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    BookOpen, ShoppingCart, Loader2, User, Tag,
    CheckCircle2, ChevronLeft, Flame, Ticket, X, FileText, MapPin
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/pages/Books";

const WILAYAS = [
    '1- Adrar', '2- Chlef', '3- Laghouat', '4- Oum El Bouaghi', '5- Batna', '6- Béjaïa',
    '7- Biskra', '8- Béchar', '9- Blida', '10- Bouira', '11- Tamanrasset', '12- Tébessa',
    '13- Tlemcen', '14- Tiaret', '15- Tizi Ouzou', '16- Alger', '17- Djelfa', '18- Jijel',
    '19- Sétif', '20- Saïda', '21- Skikda', '22- Sidi Bel Abbès', '23- Annaba', '24- Guelma',
    '25- Constantine', '26- Médéa', '27- Mostaganem', "28- M'Sila", '29- Mascara', '30- Ouargla',
    '31- Oran', '32- El Bayadh', '33- Illizi', '34- Bordj Bou Arreridj', '35- Boumerdès',
    '36- El Tarf', '37- Tindouf', '38- Tissemsilt', '39- El Oued', '40- Khenchela',
    '41- Souk Ahras', '42- Tipaza', '43- Mila', '44- Aïn Defla', '45- Naâma',
    '46- Aïn Témouchent', '47- Ghardaïa', '48- Relizane', '49- Timimoun',
    '50- Bordj Badji Mokhtar', '51- Ouled Djellal', '52- Béni Abbès', '53- In Salah',
    '54- In Guezzam', '55- Touggourt', '56- Djanet', '57- El Meghaier', '58- El Menia'
];


const formatPrice = (price: number | string) =>
    parseFloat(String(price)).toLocaleString("fr-DZ");

const BookDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(false);
    const [owned, setOwned] = useState(false);

    const [couponCode, setCouponCode] = useState("");
    const [couponError, setCouponError] = useState("");
    const [couponData, setCouponData] = useState<{
        discount_percent: number;
        discounted_price: number;
        savings: number;
        description: string;
    } | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const token = localStorage.getItem("access_token");

    useEffect(() => {
        if (!id) return;
        fetchBook();
        if (token) checkOwned();
    }, [id]);

    const fetchBook = async () => {
        try {
            const headers: Record<string, string> = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(`/api/books/${id}/`, { headers });
            if (res.ok) {
                setBook(await res.json());
            } else if (res.status === 401 && token) {
                const retryRes = await fetch(`/api/books/${id}/`);
                if (retryRes.ok) setBook(await retryRes.json());
                else navigate("/books");
            } else {
                navigate("/books");
            }
        } catch {
            navigate("/books");
        } finally {
            setLoading(false);
        }
    };

    const checkOwned = async () => {
        try {
            const res = await fetch("/api/payment/my-books/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const books: Book[] = await res.json();
                setOwned(books.some((b) => String(b.id) === id));
            }
        } catch { }
    };

    const handleBuy = () => {
        if (!token) {
            toast({ title: "Connexion requise", description: "Veuillez vous connecter pour acheter ce livre." });
            navigate("/login");
            return;
        }
        handleCheckout();
    };

    const handleCheckout = async () => {
        setBuying(true);
        try {
            const res = await fetch("/api/payment/initiate/", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    item_type: "book",
                    item_id: id,
                    ...(couponCode ? { coupon_code: couponCode.toUpperCase() } : {}),
                }),
            });
            if (res.status === 401) { navigate("/login"); return; }
            const data = await res.json();
            if (res.ok && data.redirect_url) {
                window.location.href = data.redirect_url;
            } else {
                toast({ variant: "destructive", title: "Erreur", description: data.error || "Impossible de créer le paiement." });
            }
        } catch {
            toast({ variant: "destructive", title: "Erreur réseau", description: "Vérifiez votre connexion." });
        } finally {
            setBuying(false);
        }
    };

    const validateCoupon = async () => {
        if (!couponCode.trim() || !book) return;
        const originalPrice = book.discounted_price ?? parseFloat(book.price_dzd);
        setCouponLoading(true);
        setCouponError("");
        setCouponData(null);
        try {
            const res = await fetch("/api/payment/validate-coupon/", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    coupon_code: couponCode.toUpperCase(),
                    item_type: "book",
                    original_price: originalPrice,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setCouponData(data);
            } else {
                setCouponError(data.error || "Code invalide.");
            }
        } catch {
            setCouponError("Erreur réseau.");
        } finally {
            setCouponLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center pt-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </main>
            </div>
        );
    }

    if (!book) return null;

    const originalPrice = parseFloat(book.price_dzd);
    const hasDiscount = book.discount_percent && book.discount_percent > 0;
    const itemPrice = book.discounted_price ?? originalPrice;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 pt-20">

                {/* ── Hero Section ── */}
                <section className="relative py-12 md:py-16 bg-gradient-to-br from-background via-card to-background border-b border-border overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none" />
                    <div className="container max-w-6xl mx-auto px-4">
                        <button
                            onClick={() => navigate("/books")}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" /> Tous les livres
                        </button>

                        <div className="flex flex-col lg:flex-row gap-10 items-start">
                            {/* Left: Book info */}
                            <div className="flex-1 min-w-0">
                                {book.category_details && (
                                    <Badge className="mb-4 rounded-full bg-primary/10 text-primary border-primary/20">
                                        <Tag className="h-3 w-3 mr-1" /> {book.category_details.name}
                                    </Badge>
                                )}

                                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                                    {book.title}
                                </h1>

                                {book.author && (
                                    <p className="flex items-center gap-2 text-muted-foreground text-base mb-4">
                                        <User className="h-4 w-4" /> Par <span className="font-medium text-foreground">{book.author}</span>
                                    </p>
                                )}

                                {/* Description */}
                                {book.description && (
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-muted-foreground text-base leading-relaxed mb-6 whitespace-pre-line">
                                            {book.description}
                                        </p>
                                    </div>
                                )}

                                {/* Features */}
                                <ul className="space-y-2 text-sm text-muted-foreground mt-4">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                        Accès illimité au livre numérique
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                        Téléchargement PDF disponible
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                        Accès depuis n'importe quel appareil
                                    </li>
                                </ul>
                            </div>

                            {/* Right: sticky purchase card */}
                            <div className="w-full lg:w-80 shrink-0">
                                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg sticky top-24">
                                    {/* Book cover */}
                                    <div className="h-52 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden relative">
                                        {book.cover_image ? (
                                            <img
                                                src={book.cover_image.startsWith("http") ? book.cover_image : `${book.cover_image}`}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <BookOpen className="h-20 w-20 text-primary/30" />
                                        )}
                                        {hasDiscount && !couponData && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                                                <Flame className="h-3 w-3" /> -{book.discount_percent}%
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        {/* Price */}
                                        <div className="text-3xl font-bold mb-1">
                                            {couponData ? (
                                                <>
                                                    <span className="text-lg line-through text-muted-foreground mr-2">
                                                        {formatPrice(originalPrice)} DZD
                                                    </span>
                                                    <span className="text-red-500">{formatPrice(couponData.discounted_price)}</span>
                                                </>
                                            ) : hasDiscount ? (
                                                <>
                                                    <span className="text-lg line-through text-muted-foreground mr-2">
                                                        {formatPrice(originalPrice)} DZD
                                                    </span>
                                                    <span className="text-red-500">{formatPrice(itemPrice)}</span>
                                                </>
                                            ) : (
                                                formatPrice(originalPrice)
                                            )}
                                            <span className="text-base font-normal text-muted-foreground ml-1">DZD</span>
                                        </div>

                                        {hasDiscount && !couponData && (
                                            <div className="flex items-center gap-1.5 mb-3">
                                                <Flame className="h-4 w-4 text-red-500" />
                                                <span className="text-sm font-semibold text-red-500">-{book.discount_percent}% de réduction</span>
                                            </div>
                                        )}

                                        {couponData && (
                                            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-3">
                                                <div>
                                                    <p className="text-xs font-semibold text-green-600">Coupon appliqué ✓</p>
                                                    <p className="text-xs text-muted-foreground">-{couponData.discount_percent}% • Économie: {formatPrice(couponData.savings)} DZD</p>
                                                </div>
                                                <button
                                                    onClick={() => { setCouponData(null); setCouponCode(""); }}
                                                    className="text-muted-foreground hover:text-red-500"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground mb-3">Accès illimité à vie</p>

                                        {/* Coupon input */}
                                        {!owned && !couponData && (
                                            <div className="flex gap-2 mb-4">
                                                <Input
                                                    placeholder="Code promo"
                                                    value={couponCode}
                                                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                                                    onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                                                    className="h-9 text-sm font-mono uppercase"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="shrink-0 gap-1.5 h-9"
                                                    onClick={validateCoupon}
                                                    disabled={couponLoading || !couponCode.trim()}
                                                >
                                                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
                                                    Appliquer
                                                </Button>
                                            </div>
                                        )}
                                        {couponError && <p className="text-xs text-red-500 mb-3">{couponError}</p>}

                                        {/* Action button */}
                                        {owned ? (
                                            <Button
                                                className="w-full gradient-primary text-white border-0 gap-2"
                                                onClick={() => {
                                                    if (book.book_file) {
                                                        window.open(
                                                            book.book_file.startsWith("http") ? book.book_file : `${book.book_file}`,
                                                            "_blank"
                                                        );
                                                    } else {
                                                        navigate("/student-dashboard");
                                                    }
                                                }}
                                            >
                                                <FileText className="h-4 w-4" /> Lire le livre
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full gradient-primary text-white border-0 gap-2"
                                                onClick={handleBuy}
                                                disabled={buying}
                                            >
                                                {buying ? (
                                                    <><Loader2 className="h-4 w-4 animate-spin" /> Redirection...</>
                                                ) : (
                                                    <><ShoppingCart className="h-4 w-4" /> Acheter maintenant</>
                                                )}
                                            </Button>
                                        )}

                                        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                Fichier PDF haute qualité
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                Accès illimité à vie
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                Paiement sécurisé Paypart
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CTA Bottom Banner ── */}
                {!owned && (
                    <section className="py-12 md:py-16">
                        <div className="container max-w-6xl mx-auto px-4">
                            <div className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20 text-center">
                                <BookOpen className="h-10 w-10 text-primary/50 mx-auto mb-4" />
                                <p className="font-semibold text-xl mb-2">Prêt à lire ce livre ?</p>
                                <p className="text-muted-foreground text-sm mb-6">
                                    Achetez-le maintenant et accédez-y instantanément depuis votre tableau de bord.
                                </p>
                                <Button
                                    className="gradient-primary text-white border-0 gap-2 px-8"
                                    onClick={handleBuy}
                                    disabled={buying}
                                >
                                    {buying ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Redirection...</>
                                    ) : (
                                        <><ShoppingCart className="h-4 w-4" /> Acheter – {formatPrice(couponData?.discounted_price ?? itemPrice)} DZD</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

            </main>
            <Footer />
        </div>
    );
};

export default BookDetail;
