import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Lock, Clock, Video, BookOpen, ShoppingCart, Loader2,
    CheckCircle2, GraduationCap, Tag, PlayCircle, ChevronLeft, Flame, Ticket, X,
    MapPin, ChevronDown
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Course } from "@/pages/Courses";

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

const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const formatPrice = (price: number | string) => parseFloat(String(price)).toLocaleString("fr-DZ");

const CourseDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
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
        fetchCourse();
        if (token) checkEnrollment();
    }, [id]);

    const fetchCourse = async () => {
        try {
            const headers: Record<string, string> = {};
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`/api/courses/${id}/`, { headers });
            if (res.ok) {
                setCourse(await res.json());
            } else if (res.status === 401 && token) {
                // If token is invalid/expired, try fetching anonymously
                const retryRes = await fetch(`/api/courses/${id}/`);
                if (retryRes.ok) setCourse(await retryRes.json());
                else navigate("/courses");
            } else {
                navigate("/courses");
            }
        } catch {
            navigate("/courses");
        } finally {
            setLoading(false);
        }
    };

    const checkEnrollment = async () => {
        try {
            const res = await fetch("/api/enrollments/mine/", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const enrollments = await res.json();
                const enrolled = enrollments.some(
                    (e: any) => e.course_details?.id === parseInt(id!) && e.is_approved
                );
                setIsEnrolled(enrolled);
            }
        } catch { }
    };

    const handleBuy = () => {
        if (!token) {
            toast({ title: "Connexion requise", description: "Veuillez vous connecter pour acheter cette formation." });
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
                    item_type: "course",
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
        if (!couponCode.trim() || !course) return;
        const originalPrice = course.discounted_price ?? parseFloat(course.price_dzd);
        setCouponLoading(true);
        setCouponError("");
        setCouponData(null);
        try {
            const res = await fetch("/api/payment/validate-coupon/", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ coupon_code: couponCode.toUpperCase(), item_type: "course", original_price: originalPrice }),
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

    if (!course) return null;

    const sortedVideos = [...(course.videos ?? [])].sort((a, b) => a.order - b.order);
    const totalSeconds = sortedVideos.reduce((s, v) => s + v.duration_seconds, 0);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 pt-20">

                {/* ── Hero ── */}
                <section className="relative py-12 md:py-16 bg-gradient-to-br from-background via-card to-background border-b border-border overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none" />
                    <div className="container max-w-6xl mx-auto px-4">
                        <button
                            onClick={() => navigate("/courses")}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" /> Toutes les formations
                        </button>

                        <div className="flex flex-col lg:flex-row gap-10 items-start">
                            {/* Left: info */}
                            <div className="flex-1 min-w-0">
                                {course.category_details && (
                                    <Badge className="mb-4 rounded-full bg-primary/10 text-primary border-primary/20">
                                        <Tag className="h-3 w-3 mr-1" /> {course.category_details.name}
                                    </Badge>
                                )}
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                                    {course.title}
                                </h1>
                                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                                    {course.description}
                                </p>

                                {/* Meta pills */}
                                <div className="flex flex-wrap gap-3 mb-6 text-sm">
                                    <span className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full">
                                        <Video className="h-4 w-4 text-primary" />
                                        {sortedVideos.length} modules
                                    </span>
                                    <span className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full">
                                        <Clock className="h-4 w-4 text-accent" />
                                        {formatDuration(totalSeconds)}
                                    </span>
                                    {course.teacher_details && (
                                        <span className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full">
                                            <GraduationCap className="h-4 w-4 text-green-500" />
                                            {course.teacher_details.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Right: sticky purchase card */}
                            <div className="w-full lg:w-80 shrink-0">
                                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg sticky top-24">
                                    {/* Course cover */}
                                    <div className="h-44 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                                        {course.cover_image ? (
                                            <img
                                                src={course.cover_image.startsWith("http") ? course.cover_image : `${course.cover_image}`}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <BookOpen className="h-16 w-16 text-primary/30" />
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <div className="text-3xl font-bold mb-1">
                                            {couponData ? (
                                                <>
                                                    <span className="text-lg line-through text-muted-foreground mr-2">
                                                        {formatPrice(parseFloat(course.price_dzd))} DZD
                                                    </span>
                                                    <span className="text-red-500">
                                                        {formatPrice(couponData.discounted_price)}
                                                    </span>
                                                </>
                                            ) : course.discount_percent && course.discount_percent > 0 ? (
                                                <>
                                                    <span className="text-lg line-through text-muted-foreground mr-2">
                                                        {formatPrice(parseFloat(course.price_dzd))} DZD
                                                    </span>
                                                    <span className="text-red-500">
                                                        {formatPrice(course.discounted_price ?? parseFloat(course.price_dzd))}
                                                    </span>
                                                </>
                                            ) : (
                                                formatPrice(parseFloat(course.price_dzd))
                                            )}
                                            <span className="text-base font-normal text-muted-foreground ml-1">DZD</span>
                                        </div>
                                        {course.discount_percent && course.discount_percent > 0 && !couponData && (
                                            <div className="flex items-center gap-1.5 mb-3">
                                                <Flame className="h-4 w-4 text-red-500" />
                                                <span className="text-sm font-semibold text-red-500">-{course.discount_percent}% de réduction</span>
                                            </div>
                                        )}
                                        {couponData && (
                                            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-3">
                                                <div>
                                                    <p className="text-xs font-semibold text-green-600">Coupon appliqué ✓</p>
                                                    <p className="text-xs text-muted-foreground">-{couponData.discount_percent}% • Économie: {formatPrice(couponData.savings)} DZD</p>
                                                </div>
                                                <button onClick={() => { setCouponData(null); setCouponCode(""); }} className="text-muted-foreground hover:text-red-500">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mb-3">Accès illimité à vie</p>

                                        {/* Coupon input */}
                                        {!isEnrolled && !couponData && (
                                            <div className="flex gap-2 mb-4">
                                                <Input
                                                    placeholder="Code promo"
                                                    value={couponCode}
                                                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                                                    onKeyDown={e => e.key === "Enter" && validateCoupon()}
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

                                        {isEnrolled ? (
                                            <Button
                                                className="w-full gradient-primary text-white border-0 gap-2"
                                                onClick={() => navigate("/student-dashboard")}
                                            >
                                                <PlayCircle className="h-4 w-4" /> Accéder à la formation
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
                                                {sortedVideos.length} modules vidéo
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                {formatDuration(totalSeconds)} de contenu
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                Certificat de completion
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                Accès illimité à vie
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Syllabus ── */}
                <section className="py-12 md:py-16">
                    <div className="container max-w-6xl mx-auto px-4">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl font-bold mb-2">Contenu de la formation</h2>
                            <p className="text-muted-foreground mb-8">
                                {sortedVideos.length} modules • {formatDuration(totalSeconds)} au total
                                {!isEnrolled && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full">
                                        <Lock className="h-3 w-3" /> Achetez pour débloquer
                                    </span>
                                )}
                            </p>

                            <div className="space-y-2">
                                {sortedVideos.map((video, i) => (
                                    <div
                                        key={video.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${isEnrolled
                                            ? "bg-card border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                                            : "bg-card/50 border-border/50"
                                            }`}
                                        onClick={() => isEnrolled && navigate("/student-dashboard")}
                                    >
                                        {/* Order badge */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isEnrolled
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted text-muted-foreground"
                                            }`}>
                                            {isEnrolled ? (
                                                <PlayCircle className="h-4 w-4" />
                                            ) : (
                                                <Lock className="h-4 w-4" />
                                            )}
                                        </div>

                                        {/* Title */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isEnrolled ? "text-foreground" : "text-muted-foreground"
                                                }`}>
                                                {i + 1}. {video.title}
                                            </p>
                                            {video.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                    {video.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Duration + lock */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                                                {formatDuration(video.duration_seconds)}
                                            </span>
                                            {!isEnrolled && (
                                                <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA below syllabus */}
                            {!isEnrolled && sortedVideos.length > 0 && (
                                <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20 text-center">
                                    <Lock className="h-8 w-8 text-primary/50 mx-auto mb-3" />
                                    <p className="font-semibold text-lg mb-1">Débloquez tous les modules</p>
                                    <p className="text-muted-foreground text-sm mb-5">
                                        Achetez la formation pour accéder à l'ensemble du contenu.
                                    </p>
                                    <Button
                                        className="gradient-primary text-white border-0 gap-2 px-8"
                                        onClick={handleBuy}
                                        disabled={buying}
                                    >
                                        {buying ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Redirection...</>
                                        ) : (
                                            <><ShoppingCart className="h-4 w-4" /> Acheter – {formatPrice(course.price_dzd)} DZD</>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default CourseDetail;
