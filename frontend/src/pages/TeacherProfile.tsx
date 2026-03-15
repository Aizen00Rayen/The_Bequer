import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    User, BookOpen, Mail, Linkedin, Globe, Phone,
    Clock, Video, Send, ArrowLeft, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API = "/api";

const formatDuration = (videos: any[]) => {
    if (!videos || videos.length === 0) return "0 min";
    const total = videos.reduce((s: number, v: any) => s + (v.duration_seconds || 0), 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

export default function TeacherProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [data, setData] = useState<{ profile: any; courses: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [contactForm, setContactForm] = useState({ subject: "", body: "" });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const token = localStorage.getItem("access_token");

    useEffect(() => {
        fetch(`${API}/teachers/${id}/`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    const handleSendMessage = async () => {
        if (!token) { navigate("/login"); return; }
        if (!contactForm.subject.trim() || !contactForm.body.trim()) {
            toast({ variant: "destructive", title: "Champs requis", description: "Veuillez remplir tous les champs." });
            return;
        }
        setSending(true);
        try {
            const res = await fetch(`${API}/messages/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ teacher: Number(id), ...contactForm }),
            });
            if (res.ok) {
                setSent(true);
                setContactForm({ subject: "", body: "" });
                toast({ title: "Message envoyé !", description: "Le formateur vous répondra bientôt." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer le message." });
            }
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Profil introuvable.</p>
                <Button variant="outline" onClick={() => navigate(-1)}>Retour</Button>
            </div>
        );
    }

    const { profile, courses } = data;
    const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 pb-16">
                {/* Hero Banner */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 gradient-primary opacity-10 pointer-events-none" />
                    <div className="container max-w-5xl mx-auto px-4 py-12">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                            <ArrowLeft size={16} /> Retour
                        </button>

                        <div className="flex flex-col md:flex-row items-start gap-8">
                            {/* Avatar */}
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0">
                                {profile.photo ? (
                                    <img
                                        src={profile.photo.startsWith("http") ? profile.photo : `${profile.photo}`}
                                        alt={displayName}
                                        className="h-32 w-32 rounded-2xl object-cover ring-4 ring-primary/20 shadow-xl"
                                    />
                                ) : (
                                    <div className="h-32 w-32 rounded-2xl gradient-primary flex items-center justify-center ring-4 ring-primary/10 shadow-xl">
                                        <User size={48} className="text-primary-foreground/60" />
                                    </div>
                                )}
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{displayName}</h1>
                                {profile.speciality && (
                                    <p className="text-primary font-semibold mb-3">{profile.speciality}</p>
                                )}
                                {profile.bio && (
                                    <p className="text-muted-foreground leading-relaxed max-w-2xl mb-5">{profile.bio}</p>
                                )}

                                {/* Social links */}
                                <div className="flex flex-wrap gap-3">
                                    {profile.email && (
                                        <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-full">
                                            <Mail size={14} /> {profile.email}
                                        </a>
                                    )}
                                    {profile.phone && (
                                        <a href={`tel:${profile.phone}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-full">
                                            <Phone size={14} /> {profile.phone}
                                        </a>
                                    )}
                                    {profile.linkedin && (
                                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-full">
                                            <Linkedin size={14} /> LinkedIn
                                        </a>
                                    )}
                                    {profile.website && (
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 px-3 py-1.5 rounded-full">
                                            <Globe size={14} /> Site web
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <div className="container max-w-5xl mx-auto px-4 mt-12 grid lg:grid-cols-3 gap-10">
                    {/* Courses section */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-2xl font-bold text-foreground">
                            Formations <span className="text-gradient">disponibles</span>
                        </h2>

                        {courses.length === 0 ? (
                            <div className="text-center py-16 bg-card rounded-2xl border border-border">
                                <BookOpen className="h-12 w-12 text-primary/20 mx-auto mb-3" />
                                <p className="text-muted-foreground">Aucune formation pour le moment.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {courses.map((course, i) => (
                                    <motion.div
                                        key={course.id}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex"
                                    >
                                        <div className="w-32 shrink-0 relative overflow-hidden">
                                            {course.cover_image ? (
                                                <img
                                                    src={course.cover_image.startsWith("http") ? course.cover_image : `${course.cover_image}`}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full gradient-primary flex items-center justify-center">
                                                    <BookOpen className="h-8 w-8 text-primary-foreground/40" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-bold text-foreground text-sm line-clamp-2">{course.title}</h3>
                                                {course.category_details && (
                                                    <Badge variant="outline" className="shrink-0 text-xs">{course.category_details.name}</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Video size={12} /> {course.videos?.length || 0} modules</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(course.videos)}</span>
                                                <span className="font-bold text-foreground ml-auto">
                                                    {parseFloat(course.price_dzd).toLocaleString("fr-DZ")} DZD
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Contact form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-card border border-border rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Mail size={18} className="text-primary" /> Contacter le formateur
                            </h3>

                            {!token ? (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground mb-4">Connectez-vous pour envoyer un message.</p>
                                    <Button className="gradient-primary text-white border-0 w-full" onClick={() => navigate("/login")}>Se connecter</Button>
                                </div>
                            ) : sent ? (
                                <div className="text-center py-6">
                                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                    <p className="font-semibold text-foreground">Message envoyé !</p>
                                    <p className="text-sm text-muted-foreground mt-1">Le formateur vous répondra bientôt.</p>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>Envoyer un autre</Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Sujet</label>
                                        <Input
                                            value={contactForm.subject}
                                            onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                                            placeholder="Votre question..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Message</label>
                                        <Textarea
                                            rows={5}
                                            value={contactForm.body}
                                            onChange={e => setContactForm(p => ({ ...p, body: e.target.value }))}
                                            placeholder="Décrivez votre demande..."
                                            className="resize-none"
                                        />
                                    </div>
                                    <Button
                                        className="gradient-primary text-white border-0 w-full gap-2"
                                        onClick={handleSendMessage}
                                        disabled={sending}
                                    >
                                        <Send size={15} />
                                        {sending ? "Envoi..." : "Envoyer le message"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
