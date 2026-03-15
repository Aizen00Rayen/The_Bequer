import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    UserCircle, BookOpen, Video, Award, ChevronLeft, ChevronRight,
    CheckCircle2, Circle, Download, PlayCircle, Search, ShoppingBag, Clock, GraduationCap, MessageCircle, Reply,
    MessageSquare, Send, Loader2, ArrowLeft, Lock, CreditCard, AlertTriangle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Course, VideoLesson } from "./Courses";
import { Book } from "./Books";

/* ─────────────────────── Types ─────────────────────── */
interface Enrollment {
    id: number;
    course: number;
    course_details: Course;
    is_approved: boolean;
    enrolled_at: string;
}

interface Profile {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
}

/* ─────────────────── Secure Video Player ─────────────────── */
const SecureVideoPlayer = ({
    video,
    token,
    username,
    onEnded,
}: {
    video: VideoLesson;
    token: string;
    username: string;
    onEnded: () => void;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Intercept PrintScreen key — dim video briefly
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "PrintScreen") {
                const el = containerRef.current;
                if (el) {
                    el.style.opacity = "0";
                    setTimeout(() => (el.style.opacity = "1"), 400);
                }
            }
        };
        window.addEventListener("keyup", handleKey);
        return () => window.removeEventListener("keyup", handleKey);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full select-none"
            style={{ transition: "opacity 0.2s" }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <video
                key={video.id}
                className="w-full rounded-lg bg-black"
                controls
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                src={video.stream_url.startsWith('http') ? `${video.stream_url}?token=${token}` : `${video.stream_url}?token=${token}`}
                preload="metadata"
                onEnded={onEnded}
                style={{ pointerEvents: "auto" }}
            />
            {/* Watermark overlay */}
            <div
                className="absolute inset-0 pointer-events-none flex items-end justify-end p-4"
                style={{ zIndex: 10 }}
            >
                <span
                    className="text-white/20 text-xs font-mono select-none"
                    style={{ userSelect: "none", WebkitUserSelect: "none" }}
                >
                    {username}
                </span>
            </div>
            {/* Top-left watermark */}
            <div
                className="absolute top-3 left-3 pointer-events-none"
                style={{ zIndex: 10 }}
            >
                <span
                    className="text-white/15 text-xs font-mono select-none"
                    style={{ userSelect: "none" }}
                >
                    Bequer Academy • {username}
                </span>
            </div>
        </div>
    );
};

/* ─────────────────────── Main Component ─────────────────────── */
const StudentDashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const token = localStorage.getItem("access_token") || "";

    const [profile, setProfile] = useState<Profile>({ username: "", first_name: "", last_name: "", email: "" });
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [completedVideos, setCompletedVideos] = useState<number[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [catalogueSearch, setCatalogueSearch] = useState("");
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [purchasedBooks, setPurchasedBooks] = useState<Book[]>([]);

    // Messenger State
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConv, setActiveConv] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [msgInput, setMsgInput] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Complaint State
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [complaintReason, setComplaintReason] = useState("");
    const [submittingComplaint, setSubmittingComplaint] = useState(false);

    // Player state
    const [activeEnrollmentId, setActiveEnrollmentId] = useState<number | null>(null);
    const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* ─── Auth ─── */
    useEffect(() => {
        const role = localStorage.getItem("user_role");
        if (!token) { navigate("/login"); return; }
        if (role === "admin") { navigate("/admin-dashboard"); return; }
        loadAll();
    }, []);

    const loadAll = async () => {
        await Promise.all([fetchProfile(), fetchEnrollments(), fetchVideoProgress(), fetchAllCourses(), fetchConversations(), fetchPurchasedBooks()]);
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/users/me/", { headers: authHeaders });
            if (res.status === 401) { navigate("/login"); return; }
            if (res.ok) {
                const d = await res.json();
                setProfile({ username: d.username, first_name: d.first_name || "", last_name: d.last_name || "", email: d.email || "" });
            }
        } catch { console.error("Profile fetch failed"); }
    };

    const fetchEnrollments = async () => {
        try {
            const res = await fetch("/api/enrollments/mine/", { headers: authHeaders });
            if (res.ok) setEnrollments(await res.json());
        } catch { console.error("Enrollments fetch failed"); }
    };

    const fetchVideoProgress = async () => {
        try {
            const res = await fetch("/api/video-progress/", { headers: authHeaders });
            if (res.ok) {
                const data = await res.json();
                setCompletedVideos(data.filter((p: any) => p.is_completed).map((p: any) => p.video));
            }
        } catch { console.error("Progress fetch failed"); }
    };

    const fetchAllCourses = async () => {
        try {
            const res = await fetch("/api/courses/");
            if (res.ok) setAllCourses(await res.json());
        } catch { console.error("Courses fetch failed"); }
    };

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/conversations/", { headers: authHeaders });
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
                setUnreadTotal(data.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0));
            }
        } catch { console.error("Conversations fetch failed"); }
    };

    const fetchMessages = async (convId: number) => {
        try {
            const res = await fetch(`/api/conversations/${convId}/messages/`, { headers: authHeaders });
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                fetchConversations();
            }
        } catch { console.error("Messages fetch failed"); }
    };

    const fetchPurchasedBooks = async () => {
        try {
            const res = await fetch("/api/payment/my-books/", { headers: authHeaders });
            if (res.ok) setPurchasedBooks(await res.json());
        } catch { console.error("Purchased books fetch failed"); }
    };

    const fetchComments = async (courseId: number) => {
        try {
            const res = await fetch(`/api/comments/?course_id=${courseId}`, { headers: authHeaders });
            if (res.ok) setComments(await res.json());
        } catch { }
    };

    /* ─── Actions ─── */
    const toggleVideoComplete = async (videoId: number) => {
        try {
            const res = await fetch("/api/video-progress/toggle/", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({ video_id: videoId }),
            });
            if (res.ok) {
                const data = await res.json();
                setCompletedVideos((prev) =>
                    data.is_completed ? [...prev, videoId] : prev.filter((id) => id !== videoId)
                );
            }
        } catch { toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour la progression." }); }
    };

    const downloadCertificate = async (courseId: number) => {
        try {
            const res = await fetch(`/api/courses/${courseId}/certificate/`, { headers: authHeaders });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `certificat_${courseId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                toast({ title: "Certificat téléchargé !", description: "Félicitations pour avoir terminé cette formation." });
            } else {
                const err = await res.json();
                toast({ variant: "destructive", title: "Erreur", description: err.error || "Impossible de générer le certificat." });
            }
        } catch { toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." }); }
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await fetch("/api/users/me/", {
                method: "PATCH",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });
            if (res.ok) toast({ title: "Profil mis à jour." });
            else toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour." });
        } catch { toast({ variant: "destructive", title: "Erreur réseau." }); }
    };



    const handlePostComment = async () => {
        const activeEnrollment = enrollments.find(e => e.id === activeEnrollmentId);
        if (!activeEnrollment || !newComment.trim()) return;
        try {
            const res = await fetch("/api/comments/", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({ course: activeEnrollment.course_details.id, content: newComment }),
            });
            if (res.ok) {
                setComments([await res.json(), ...comments]);
                setNewComment("");
            }
        } catch { }
    };

    const startConversation = async (teacherId: number) => {
        try {
            const res = await fetch("/api/conversations/", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({ teacher_id: teacherId })
            });
            if (res.ok) {
                const conv = await res.json();
                await fetchConversations();
                setActiveTab("messages");
                openConversation(conv);
            }
        } catch (e) { console.error("Could not start conversation", e); }
    };

    const openConversation = (conv: any) => {
        setActiveConv(conv);
        fetchMessages(conv.id);
    };

    const sendMessage = async () => {
        if (!msgInput.trim() || !activeConv || sendingMsg) return;
        setSendingMsg(true);
        try {
            const res = await fetch(`/api/conversations/${activeConv.id}/send/`, {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({ body: msgInput.trim() }),
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
                setMsgInput("");
                fetchConversations();
            }
        } catch { console.error("Message send failed"); }
        setSendingMsg(false);
    };

    const handleExtendConversation = async () => {
        if (!activeConv) return;
        try {
            const res = await fetch("/api/payment/initiate/", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    item_type: "conversation",
                    item_id: activeConv.id
                }),
            });
            const data = await res.json();
            if (res.ok && data.redirect_url) {
                window.location.href = data.redirect_url;
            } else {
                toast({ variant: "destructive", title: "Erreur", description: data.error || "Impossible d'initier le paiement." });
            }
        } catch {
            toast({ variant: "destructive", title: "Erreur réseau", description: "Vérifiez votre connexion." });
        }
    };

    const handleSubmitComplaint = async () => {
        if (!activeConv || !complaintReason.trim()) return;
        setSubmittingComplaint(true);
        try {
            const res = await fetch("/api/complaints/", {
                method: "POST",
                headers: { ...authHeaders, "Content-Type": "application/json" },
                body: JSON.stringify({
                    teacher_id: getOtherParty(activeConv)?.id,
                    reason: complaintReason.trim()
                })
            });
            if (res.ok) {
                toast({ title: "Réclamation envoyée", description: "L'administration va examiner votre signalement." });
                setComplaintOpen(false);
                setComplaintReason("");
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer la réclamation." });
            }
        } catch {
            toast({ variant: "destructive", title: "Erreur réseau", description: "Vérifiez votre connexion." });
        } finally {
            setSubmittingComplaint(false);
        }
    };

    const getOtherParty = (conv: any) => {
        return conv.teacher_details;
    };

    /* ─── Helpers ─── */
    const calcProgress = (course: Course) => {
        if (!course.videos?.length) return 0;
        const done = course.videos.filter((v) => completedVideos.includes(v.id)).length;
        return Math.round((done / course.videos.length) * 100);
    };

    const formatDuration = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m} min`;
    };

    const formatPrice = (p: string) => parseFloat(p).toLocaleString("fr-DZ");

    const enrolledCourseIds = new Set(enrollments.map((e) => e.course_details.id));

    const catalogueCourses = allCourses.filter(
        (c) =>
            !enrolledCourseIds.has(c.id) &&
            (catalogueSearch === "" ||
                c.title.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
                c.description?.toLowerCase().includes(catalogueSearch.toLowerCase()))
    );

    const activeEnrollment = enrollments.find((e) => e.id === activeEnrollmentId);
    const activeVideo = activeEnrollment?.course_details.videos?.find((v) => v.id === activeVideoId);

    const openPlayer = (enrollment: Enrollment) => {
        setActiveEnrollmentId(enrollment.id);
        const firstVideo = enrollment.course_details.videos?.[0];
        setActiveVideoId(firstVideo?.id ?? null);
        fetchComments(enrollment.course_details.id);
    };

    const handleVideoEnded = () => {
        if (!activeVideo) return;
        if (!completedVideos.includes(activeVideo.id)) {
            toggleVideoComplete(activeVideo.id);
        }
        // Auto-advance to next video
        const videos = activeEnrollment?.course_details.videos?.slice().sort((a, b) => a.order - b.order) ?? [];
        const idx = videos.findIndex((v) => v.id === activeVideo.id);
        if (idx < videos.length - 1) {
            setActiveVideoId(videos[idx + 1].id);
        }
    };

    /* ─────────────── Player Screen ─────────────── */
    if (activeEnrollment && activeVideo) {
        const course = activeEnrollment.course_details;
        const sortedVideos = [...(course.videos ?? [])].sort((a, b) => a.order - b.order);
        const progress = calcProgress(course);
        const fullName = `${profile.first_name} ${profile.last_name}`.trim() || profile.username;

        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 pt-16 flex flex-col">

                    {/* Top bar */}
                    <div className="border-b border-border px-4 py-3 flex items-center gap-4 bg-card/80 backdrop-blur-sm sticky top-16 z-30">
                        <Button variant="ghost" size="sm" onClick={() => { setActiveEnrollmentId(null); setActiveVideoId(null); }} className="gap-2">
                            <ChevronLeft className="w-4 h-4" /> Mes Formations
                        </Button>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{course.title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground w-10">{progress}%</span>
                        </div>
                        {progress === 100 && (
                            <Button size="sm" className="gap-2 gradient-primary text-white border-0" onClick={() => downloadCertificate(course.id)}>
                                <Award className="w-4 h-4" /> Certificat
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </Button>
                    </div>

                    {/* Player + Sidebar */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Video area */}
                        <div className={`flex-1 min-w-0 flex flex-col overflow-y-auto p-4 md:p-6 gap-6 ${sidebarOpen ? "lg:pr-3" : ""}`}>
                            <SecureVideoPlayer
                                video={activeVideo}
                                token={token}
                                username={fullName || profile.username}
                                onEnded={handleVideoEnded}
                            />

                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="font-bold text-lg">{activeVideo.order}. {activeVideo.title}</h2>
                                    {activeVideo.description && <p className="text-sm text-muted-foreground mt-1">{activeVideo.description}</p>}
                                    <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded mt-2 inline-block">{formatDuration(activeVideo.duration_seconds)}</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant={completedVideos.includes(activeVideo.id) ? "outline" : "default"}
                                    className={`shrink-0 gap-2 ${completedVideos.includes(activeVideo.id) ? "text-green-500 border-green-500 hover:bg-green-500/10" : ""}`}
                                    onClick={() => toggleVideoComplete(activeVideo.id)}
                                >
                                    {completedVideos.includes(activeVideo.id) ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                    {completedVideos.includes(activeVideo.id) ? "Terminé" : "Marquer comme terminé"}
                                </Button>
                            </div>

                            {/* Comments */}
                            <div className="pt-6 border-t border-border space-y-6">
                                <h3 className="font-semibold text-base">Discussions & Questions</h3>
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                        {profile.first_name ? profile.first_name[0] : profile.username?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <textarea
                                            className="w-full min-h-[72px] p-3 text-sm rounded-lg border border-border bg-background resize-y"
                                            placeholder="Posez une question ou partagez une remarque..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                        <Button size="sm" className="self-end" onClick={handlePostComment}>Publier</Button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {comments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic text-center py-4">Soyez le premier à commenter.</p>
                                    ) : comments.map((c) => (
                                        <div key={c.id} className="flex gap-3">
                                            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center font-bold text-sm shrink-0">
                                                {c.user_name[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-baseline gap-2 mb-1">
                                                    <span className="font-semibold text-sm">{c.user_name}</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm bg-card border border-border p-3 rounded-lg rounded-tl-none">{c.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Module Sidebar */}
                        {sidebarOpen && (
                            <aside className="w-80 shrink-0 border-l border-border bg-card/50 overflow-y-auto hidden lg:flex flex-col">
                                <div className="p-4 border-b border-border">
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                        Modules · {sortedVideos.filter(v => completedVideos.includes(v.id)).length}/{sortedVideos.length}
                                    </h3>
                                </div>
                                <div className="flex flex-col divide-y divide-border">
                                    {sortedVideos.map((v) => {
                                        const done = completedVideos.includes(v.id);
                                        const active = v.id === activeVideo.id;
                                        return (
                                            <button
                                                key={v.id}
                                                onClick={() => setActiveVideoId(v.id)}
                                                className={`w-full text-left p-4 flex items-start gap-3 transition-colors hover:bg-muted/60 ${active ? "bg-primary/10 border-l-2 border-primary" : ""}`}
                                            >
                                                <span className="mt-0.5 shrink-0">
                                                    {done ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : active ? (
                                                        <PlayCircle className="w-4 h-4 text-primary" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-muted-foreground/50" />
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium leading-snug truncate ${active ? "text-primary" : done ? "text-muted-foreground line-through" : ""}`}>
                                                        {v.order}. {v.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(v.duration_seconds)}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </aside>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    /* ─────────────── Dashboard Screen ─────────────── */
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 container max-w-7xl mx-auto px-4 py-32">

                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                        Espace <span className="text-accent">Étudiant</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Bonjour {profile.first_name || profile.username} 👋 — Gérez vos formations et explorez le catalogue.
                    </p>
                </div>

                <Tabs defaultValue="courses" className="space-y-8">
                    <TabsList className="bg-muted/50 p-1 rounded-xl border border-border h-auto">
                        <TabsTrigger value="courses" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 py-2.5">
                            <BookOpen className="w-4 h-4" /> Mes Formations
                            {enrollments.filter(e => e.is_approved).length > 0 && (
                                <Badge className="ml-1 h-5 px-1.5 text-xs">{enrollments.filter(e => e.is_approved).length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="books" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 py-2.5">
                            <ShoppingBag className="w-4 h-4" /> Mes Livres
                            {purchasedBooks.length > 0 && (
                                <Badge className="ml-1 h-5 px-1.5 text-xs">{purchasedBooks.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="catalogue" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 py-2.5">
                            <ShoppingBag className="w-4 h-4" /> Catalogue
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 py-2.5">
                            <UserCircle className="w-4 h-4" /> Mon Profil
                        </TabsTrigger>
                        <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2 py-2.5">
                            <MessageCircle className="w-4 h-4" /> Mes Messages
                            {unreadTotal > 0 && (
                                <Badge className="ml-1 h-5 px-1.5 text-xs bg-primary text-white">{unreadTotal}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ── MY COURSES TAB ── */}
                    <TabsContent value="courses" className="animate-in fade-in-50 duration-300 space-y-4">
                        {enrollments.length === 0 ? (
                            <div className="text-center py-20 bg-card rounded-2xl border border-border">
                                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-xl font-medium mb-2">Aucune formation inscrite.</p>
                                <p className="text-sm text-muted-foreground mb-6">Explorez le catalogue pour trouver votre prochaine formation.</p>
                                <Button onClick={() => document.querySelector<HTMLButtonElement>('[data-value="catalogue"]')?.click()}>
                                    Voir le catalogue
                                </Button>
                            </div>
                        ) : (
                            enrollments.map((enrollment) => {
                                const course = enrollment.course_details;
                                const progress = calcProgress(course);
                                const isComplete = progress === 100 && course.videos && course.videos.length > 0;

                                return (
                                    <div key={enrollment.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row p-5 gap-5 items-center">
                                            {/* Thumbnail */}
                                            <div className="w-full md:w-44 h-28 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                                                {course.cover_image ? (
                                                    <img
                                                        src={course.cover_image.startsWith("http") ? course.cover_image : `${course.cover_image}`}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                                        <BookOpen className="w-9 h-9 text-primary/40" />
                                                    </div>
                                                )}
                                                {!enrollment.is_approved && (
                                                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center px-2">En attente</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-start gap-2 flex-wrap">
                                                    <h3 className="font-bold text-lg leading-tight">{course.title}</h3>
                                                    {isComplete && (
                                                        <Badge className="bg-green-500/10 text-green-500 border-green-500/30 shrink-0">
                                                            <Award className="w-3 h-3 mr-1" /> Terminé
                                                        </Badge>
                                                    )}
                                                    {!enrollment.is_approved && (
                                                        <Badge variant="outline" className="text-orange-500 border-orange-500/30 shrink-0">En attente</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-primary" /> {course.videos?.length || 0} modules</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {course.videos?.length
                                                            ? formatDuration(course.videos.reduce((s, v) => s + v.duration_seconds, 0))
                                                            : "—"}
                                                    </span>
                                                    {course.category_details && (
                                                        <Badge variant="outline" className="text-xs">{course.category_details.name}</Badge>
                                                    )}
                                                </div>
                                                {/* Teacher info */}
                                                {course.teacher_details && (
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                                                            <GraduationCap className="w-3.5 h-3.5 text-accent" />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">Formateur :</span>
                                                        <button
                                                            className="text-xs font-semibold text-primary hover:underline"
                                                            onClick={() => navigate(`/teachers/${course.teacher}`)}
                                                        >
                                                            {course.teacher_details.name}
                                                        </button>
                                                        <button
                                                            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary rounded-full px-2 py-0.5 transition-colors"
                                                            onClick={async () => {
                                                                if (course.teacher) {
                                                                    await startConversation(course.teacher);
                                                                }
                                                            }}
                                                        >
                                                            <MessageCircle className="w-3 h-3" /> Contacter
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right panel */}
                                            <div className="w-full md:w-auto flex flex-col items-end gap-3 shrink-0">
                                                {enrollment.is_approved && (
                                                    <>
                                                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                                            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-500 ${isComplete ? "bg-green-500" : "bg-primary"}`}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-muted-foreground w-9 text-right">{progress}%</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {isComplete && (
                                                                <Button size="sm" variant="outline" className="gap-2 text-green-500 border-green-500/40 hover:bg-green-500/10" onClick={() => downloadCertificate(course.id)}>
                                                                    <Download className="w-4 h-4" /> Certificat
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                className="gradient-primary text-white border-0 gap-2"
                                                                onClick={() => openPlayer(enrollment)}
                                                            >
                                                                <PlayCircle className="w-4 h-4" />
                                                                {progress > 0 ? "Continuer" : "Commencer"}
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                                {!enrollment.is_approved && (
                                                    <Button disabled variant="outline" size="sm">En attente d'approbation</Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </TabsContent>

                    {/* ── MY BOOKS TAB ── */}
                    <TabsContent value="books" className="animate-in fade-in-50 duration-300 space-y-4">
                        {purchasedBooks.length === 0 ? (
                            <div className="text-center py-20 bg-card rounded-2xl border border-border">
                                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-xl font-medium mb-2">Aucun livre acheté.</p>
                                <p className="text-sm text-muted-foreground mb-6">Explorez notre catalogue de livres.</p>
                                <Button onClick={() => navigate("/books")}>Voir les livres</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {purchasedBooks.map((book) => (
                                    <div key={book.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
                                        <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden">
                                            {book.cover_image ? (
                                                <img
                                                    src={book.cover_image.startsWith("http") ? book.cover_image : `${book.cover_image}`}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <BookOpen className="w-16 h-16 text-primary/30" />
                                            )}
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-base mb-1 line-clamp-2">{book.title}</h3>
                                            {book.author && <p className="text-sm text-muted-foreground mb-2">par {book.author}</p>}
                                            {book.description && <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">{book.description}</p>}
                                            {book.book_file && (
                                                <a
                                                    href={book.book_file.startsWith("http") ? book.book_file : `${book.book_file}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium"
                                                >
                                                    <BookOpen className="h-4 w-4" /> Lire le livre
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── CATALOGUE TAB ── */}
                    <TabsContent value="catalogue" className="animate-in fade-in-50 duration-300 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    className="pl-10"
                                    placeholder="Rechercher une formation..."
                                    value={catalogueSearch}
                                    onChange={(e) => setCatalogueSearch(e.target.value)}
                                />
                            </div>
                            <span className="text-sm text-muted-foreground">{catalogueCourses.length} formation(s)</span>
                        </div>

                        {catalogueCourses.length === 0 ? (
                            <div className="text-center py-16 bg-card rounded-2xl border border-border">
                                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="font-medium text-lg">Vous êtes inscrit à toutes nos formations !</p>
                                <p className="text-sm text-muted-foreground mt-1">Revenez bientôt pour de nouvelles formations.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {catalogueCourses.map((course) => (
                                    <div key={course.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
                                        <div className="h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                                            {course.cover_image ? (
                                                <img src={course.cover_image.startsWith("http") ? course.cover_image : `${course.cover_image}`} alt={course.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <BookOpen className="w-12 h-12 text-primary/40" />
                                            )}
                                            {course.category_details && (
                                                <Badge className="absolute top-3 left-3 bg-background/90 backdrop-blur text-foreground border border-border">
                                                    {course.category_details.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-base mb-1 line-clamp-2">{course.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-4">{course.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                                <span className="flex items-center gap-1"><Video className="w-3 h-3 text-primary" /> {course.videos?.length || 0} modules</span>
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                                <span className="font-bold text-lg">{formatPrice(course.price_dzd)} <span className="text-xs font-normal text-muted-foreground">DZD</span></span>
                                                <Button
                                                    size="sm"
                                                    className="gradient-primary text-white border-0"
                                                    onClick={() => navigate("/courses")}
                                                >
                                                    Acheter
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── MESSAGES TAB (Messenger UI) ── */}
                    <TabsContent value="messages" className="animate-in fade-in-50 duration-300">
                        <div className="h-[calc(100vh-280px)] flex gap-0 bg-card border border-border rounded-2xl overflow-hidden mt-6 shadow-sm">
                            {/* Left: Conversations list */}
                            <div className={`w-full sm:w-80 border-r border-border flex flex-col shrink-0 ${activeConv ? "hidden sm:flex" : "flex"}`}>
                                <div className="px-5 py-5 border-b border-border bg-muted/20">
                                    <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-primary" /> Messages
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-1">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {conversations.length === 0 ? (
                                        <div className="text-center py-16 px-6">
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <MessageSquare className="h-8 w-8 text-primary/40" />
                                            </div>
                                            <p className="font-medium text-foreground">Aucun message</p>
                                            <p className="text-sm text-muted-foreground mt-1">Vous n'avez pas encore contacté de formateur. Posez vos questions depuis la page du profil formateur dans chaque formation.</p>
                                        </div>
                                    ) : conversations.map(conv => {
                                        const other = getOtherParty(conv);
                                        const isActive = activeConv?.id === conv.id;
                                        const initials = (other?.name || "?").slice(0, 2).toUpperCase();
                                        return (
                                            <button
                                                key={conv.id}
                                                onClick={() => openConversation(conv)}
                                                className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/40 transition-colors text-left border-b border-border/50 ${isActive ? "bg-primary/5 border-l-4 border-l-primary px-[1.125rem]" : "border-l-4 border-l-transparent"}`}
                                            >
                                                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${isActive ? "gradient-primary text-white ring-2 ring-primary/20 ring-offset-2 ring-offset-background" : "bg-primary/10 text-primary"}`}>
                                                    {initials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <p className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>{other?.name}</p>
                                                        {conv.unread_count > 0 && (
                                                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                                                                {conv.unread_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {conv.last_message && (
                                                        <p className="text-xs text-muted-foreground truncate">{conv.last_message.body}</p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Chat window */}
                            <div className={`flex-1 flex flex-col bg-background/50 ${activeConv ? "flex" : "hidden sm:flex"}`}>
                                {!activeConv ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/10">
                                        <MessageSquare className="h-16 w-16 text-primary/10 mb-5" />
                                        <p className="text-xl font-semibold text-foreground mb-2">Sélectionnez une conversation</p>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">Choisissez une conversation dans le panneau de gauche pour commencer à discuter avec votre formateur.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Chat header */}
                                        <div className="px-6 py-4 border-b border-border flex items-center gap-4 bg-card shadow-sm z-10">
                                            <button className="sm:hidden -ml-2 p-2 hover:bg-muted rounded-full transition-colors" onClick={() => setActiveConv(null)}>
                                                <ArrowLeft size={20} className="text-foreground" />
                                            </button>
                                            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                                {(getOtherParty(activeConv)?.name || "?").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm">{getOtherParty(activeConv)?.name}</p>
                                                <p className="text-xs text-accent font-medium">Formateur</p>
                                            </div>
                                            {(() => {
                                                if (!activeConv?.access_expires_at) return null;
                                                const diffTime = new Date(activeConv.access_expires_at).getTime() - new Date().getTime();
                                                const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                                                const isExpired = diffTime <= 0;

                                                return (
                                                    <div className="ml-auto flex items-center gap-3">
                                                        <Button variant="ghost" size="sm" onClick={() => setComplaintOpen(true)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 h-8 px-2 transition-colors">
                                                            <AlertTriangle size={14} /> <span className="hidden sm:inline">Signaler</span>
                                                        </Button>
                                                        {isExpired ? (
                                                            <Badge variant="destructive" className="font-medium py-1 px-3 shadow-none">Expirée</Badge>
                                                        ) : (
                                                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none">
                                                                <Clock size={14} className="mr-1.5" />
                                                                {daysRemaining} jour{daysRemaining !== 1 && 's'} restant{daysRemaining !== 1 && 's'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Complaint Modal */}
                                        {complaintOpen && (
                                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                                                <div className="bg-background rounded-2xl shadow-xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="p-5 border-b border-border bg-muted/20 flex gap-3 items-center">
                                                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                                            <AlertTriangle className="text-destructive w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-foreground">Signaler ce formateur</h3>
                                                            <p className="text-xs text-muted-foreground">L'administration examinera votre réclamation.</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-5 space-y-4">
                                                        <div>
                                                            <label className="text-sm font-medium mb-1.5 block">Que s'est-il passé ?</label>
                                                            <textarea
                                                                value={complaintReason}
                                                                onChange={(e) => setComplaintReason(e.target.value)}
                                                                className="w-full min-h-[100px] p-3 text-sm bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/60"
                                                                placeholder="Décrivez le problème (ex: le formateur ne répond pas depuis plusieurs jours...)"
                                                            />
                                                        </div>
                                                        <div className="flex justify-end gap-3 pt-2">
                                                            <Button variant="outline" onClick={() => setComplaintOpen(false)} disabled={submittingComplaint}>Annuler</Button>
                                                            <Button variant="destructive" onClick={handleSubmitComplaint} disabled={!complaintReason.trim() || submittingComplaint}>
                                                                {submittingComplaint ? <Loader2 size={16} className="animate-spin mr-2" /> : <AlertTriangle size={16} className="mr-2" />}
                                                                Envoyer
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Messages */}
                                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                                            {messages.length === 0 && (
                                                <div className="text-center py-10 bg-muted/30 rounded-xl mb-6 border border-dashed border-border">
                                                    <p className="text-sm text-muted-foreground font-medium">Début de la conversation avec {getOtherParty(activeConv)?.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Les messages sont chiffrés et sécurisés.</p>
                                                </div>
                                            )}
                                            {messages.map((msg) => {
                                                const isMine = msg.sender === profile.username || msg.sender === profile.email || msg.sender_name === profile.first_name + ' ' + profile.last_name || /* fallback since backend returns ids sometimes */ !msg.sender_name?.includes(getOtherParty(activeConv)?.name);
                                                // Actually the cleanest way to check is if msg is from me -> styling is blue vs grey
                                                // The backend typically passes sender id, but we can check if it matches the current user. Let's assume backend returns "true" for `is_mine` or we check sender name vs teacher name
                                                const isFromTeacher = msg.sender_name === getOtherParty(activeConv)?.name || msg.sender === getOtherParty(activeConv)?.id;
                                                const iSentIt = !isFromTeacher;

                                                return (
                                                    <div key={msg.id} className={`flex ${iSentIt ? "justify-end" : "justify-start"}`}>
                                                        {!iSentIt && (
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mr-3 shrink-0 shadow-sm self-end mb-1">
                                                                {(msg.sender_name || getOtherParty(activeConv)?.name || "?").slice(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group ${iSentIt
                                                            ? "gradient-primary text-white rounded-br-sm"
                                                            : "bg-card border border-border text-foreground rounded-bl-sm"
                                                            }`}>
                                                            <p style={{ wordBreak: 'break-word' }}>{msg.body}</p>
                                                            <div className={`text-[10px] mt-1.5 flex items-center gap-1 opacity-70 ${iSentIt ? "text-white justify-end" : "text-muted-foreground"}`}>
                                                                {new Date(msg.sent_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                                                {iSentIt && <CheckCircle2 size={10} className="ml-0.5" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} className="h-1" />
                                        </div>

                                        {/* Input */}
                                        <div className="p-4 bg-card border-t border-border mt-auto">
                                            {(() => {
                                                const isExpired = activeConv?.access_expires_at && new Date() > new Date(activeConv.access_expires_at);
                                                if (isExpired) {
                                                    return (
                                                        <div className="flex flex-col sm:flex-row items-center justify-between bg-destructive/5 border border-destructive/20 p-4 rounded-xl gap-4">
                                                            <div className="flex gap-3 text-center sm:text-left">
                                                                <div className="hidden sm:flex w-10 h-10 rounded-full bg-destructive/10 items-center justify-center shrink-0">
                                                                    <Lock size={20} className="text-destructive" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-foreground text-sm">Accès gratuit terminé</p>
                                                                    <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">Votre période d'essai de messagerie de 30 jours est arrivée à expiration. Veuillez la renouveler.</p>
                                                                </div>
                                                            </div>
                                                            <Button onClick={handleExtendConversation} className="shrink-0 font-medium">
                                                                <CreditCard size={16} className="mr-2" />
                                                                Prolonger l'accès pour 10 000 DZD
                                                            </Button>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <>
                                                        <div className="flex gap-2 items-end bg-background border border-border p-1.5 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                                            <textarea
                                                                className="flex-1 min-h-[44px] max-h-32 rounded-xl bg-transparent px-4 py-3 text-sm focus:outline-none resize-none hide-scrollbar placeholder:text-muted-foreground/70"
                                                                placeholder="Écrivez votre message à votre formateur..."
                                                                value={msgInput}
                                                                onChange={e => setMsgInput(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        sendMessage();
                                                                    }
                                                                }}
                                                                rows={1}
                                                            />
                                                            <Button
                                                                size="icon"
                                                                className="h-11 w-11 gradient-primary text-white border-0 rounded-xl shrink-0 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                                                                onClick={sendMessage}
                                                                disabled={!msgInput.trim() || sendingMsg}
                                                            >
                                                                {sendingMsg ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
                                                            </Button>
                                                        </div>
                                                        <div className="text-center mt-2">
                                                            <p className="text-[10px] text-muted-foreground">Appuyez sur Entrée pour envoyer, Maj+Entrée pour passer à la ligne.</p>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── PROFILE TAB ── */}
                    <TabsContent value="profile" className="animate-in fade-in-50 duration-300">
                        <div className="max-w-2xl bg-card border border-border rounded-2xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold mb-6">Informations Personnelles</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Prénom</label>
                                        <Input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} placeholder="Votre prénom" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nom</label>
                                        <Input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} placeholder="Votre nom" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nom d'utilisateur</label>
                                    <Input value={profile.username} disabled className="bg-muted" />
                                    <p className="text-xs text-muted-foreground">Le nom d'utilisateur ne peut pas être modifié.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Adresse Email</label>
                                    <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="votre@email.com" />
                                </div>
                                <div className="pt-4">
                                    <Button onClick={handleUpdateProfile}>Enregistrer les modifications</Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
            <Footer />
        </div>
    );
};

export default StudentDashboard;
