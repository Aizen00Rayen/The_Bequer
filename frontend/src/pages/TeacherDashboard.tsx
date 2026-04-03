import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen, MessageSquare, User, LogOut, Camera, Send,
    Plus, Clock, Video, Bell, Menu, X, Eye, Upload, CheckCircle,
    XCircle, AlertCircle, ChevronRight, ArrowLeft, Loader2, CornerDownRight, Trash2, Edit, CreditCard, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/new_logo.png";

const API = "/api";

const formatDuration = (videos: any[]) => {
    if (!videos || videos.length === 0) return "0 min";
    const total = videos.reduce((s: number, v: any) => s + (v.duration_seconds || 0), 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    approved: { label: "Approuvée", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
    pending: { label: "En attente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: AlertCircle },
    rejected: { label: "Refusée", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
    draft: { label: "Brouillon", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: Clock },
};

type Tab = "courses" | "create" | "messages" | "profile";

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id") ? parseInt(localStorage.getItem("user_id")!) : null;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [activeTab, setActiveTab] = useState<Tab>("courses");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);

    // Messenger state
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConv, setActiveConv] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [msgInput, setMsgInput] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [unreadTotal, setUnreadTotal] = useState(0);

    // Course management state
    const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
    const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
    const [editCourseData, setEditCourseData] = useState({ title: "", price: "", category: "", description: "", discount: "" });
    const [editCourseCoverFile, setEditCourseCoverFile] = useState<File | null>(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [newVideo, setNewVideo] = useState({ title: "", description: "", order: 1 });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [draggedVideoId, setDraggedVideoId] = useState<number | null>(null);

    // Profile form
    const [profileForm, setProfileForm] = useState({
        first_name: "", last_name: "", bio: "",
        speciality: "", linkedin: "", website: "", phone: "",
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    // Course creation form
    const [categories, setCategories] = useState<any[]>([]);
    const [courseForm, setCourseForm] = useState({
        title: "", description: "", price_dzd: "", category: "", duration: "", discount: "0"
    });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [submittingCourse, setSubmittingCourse] = useState(false);

    // Comments
    const [comments, setComments] = useState<any[]>([]);
    const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

    useEffect(() => {
        if (!token) { navigate("/login"); return; }
        const role = localStorage.getItem("user_role");
        if (role !== "teacher") { navigate("/"); return; }
        fetchAll();

        // Poll for new messages every 8s
        const interval = setInterval(fetchConversations, 8000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const authHeaders = () => ({
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    });

    const fetchAll = async () => {
        await Promise.all([fetchMyCourses(), fetchConversations(), fetchProfile(), fetchCategories(), fetchComments()]);
    };

    const fetchMyCourses = async () => {
        const res = await fetch(`${API}/courses/my_courses/`, { headers: authHeaders() });
        if (res.ok) setCourses(await res.json());
    };

    const fetchCategories = async () => {
        const res = await fetch(`${API}/categories/`);
        if (res.ok) {
            const data = await res.json();
            // Flatten nested categories
            const flat: any[] = [];
            const flatten = (cats: any[], depth = 0) => {
                cats.forEach(c => {
                    flat.push({ ...c, depth });
                    if (c.subcategories?.length) flatten(c.subcategories, depth + 1);
                });
            };
            flatten(data);
            setCategories(flat);
        }
    };

    const fetchConversations = async () => {
        const res = await fetch(`${API}/conversations/`, { headers: authHeaders() });
        if (res.ok) {
            const data = await res.json();
            setConversations(data);
            setUnreadTotal(data.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0));
        }
    };

    const fetchMessages = async (convId: number) => {
        const res = await fetch(`${API}/conversations/${convId}/messages/`, { headers: authHeaders() });
        if (res.ok) {
            const data = await res.json();
            setMessages(data);
            // Refresh conversations to update unread count
            fetchConversations();
        }
    };

    const fetchComments = async () => {
        const res = await fetch(`${API}/comments/`, { headers: authHeaders() });
        if (res.ok) setComments(await res.json());
    };

    const fetchProfile = async () => {
        const res = await fetch(`${API}/teacher/profile/`, { headers: authHeaders() });
        if (res.ok) {
            const data = await res.json();
            setProfile(data);
            setProfileForm({
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                bio: data.bio || "",
                speciality: data.speciality || "",
                linkedin: data.linkedin || "",
                website: data.website || "",
                phone: data.phone || "",
            });
            if (data.photo) setPhotoPreview(data.photo);
        }
    };

    const openConversation = (conv: any) => {
        setActiveConv(conv);
        fetchMessages(conv.id);
    };

    const sendMessage = async () => {
        if (!msgInput.trim() || !activeConv || sendingMsg) return;
        setSendingMsg(true);
        const res = await fetch(`${API}/conversations/${activeConv.id}/send/`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ body: msgInput.trim() }),
        });
        if (res.ok) {
            const msg = await res.json();
            setMessages(prev => [...prev, msg]);
            setMsgInput("");
            fetchConversations();
        }
        setSendingMsg(false);
    };

    const handleSubmitCourse = async () => {
        if (!courseForm.title || !courseForm.description || !courseForm.price_dzd) {
            toast({ variant: "destructive", title: "Champs requis", description: "Titre, description et prix sont obligatoires." });
            return;
        }
        setSubmittingCourse(true);
        try {
            const fd = new FormData();
            Object.entries(courseForm).forEach(([k, v]) => {
                if (v && k !== 'discount') fd.append(k, String(v));
            });
            fd.append("discount_percent", courseForm.discount || "0");
            if (coverFile) fd.append("cover_image", coverFile);
            const res = await fetch(`${API}/courses/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (res.ok) {
                toast({ title: "Formation soumise !", description: "L'administrateur examinera votre formation très prochainement." });
                setCourseForm({ title: "", description: "", price_dzd: "", category: "", duration: "", discount: "0" });
                setCoverFile(null);
                setCoverPreview(null);
                setActiveTab("courses");
                fetchMyCourses();
            } else {
                const err = await res.json().catch(() => ({}));
                toast({ variant: "destructive", title: "Erreur", description: JSON.stringify(err) });
            }
        } catch {
            toast({ variant: "destructive", title: "Erreur réseau" });
        } finally {
            setSubmittingCourse(false);
        }
    };

    const handleUpdateCourse = async () => {
        if (!editingCourseId || !editCourseData.title || !editCourseData.price) return;
        try {
            const formData = new FormData();
            formData.append("title", editCourseData.title);
            formData.append("description", editCourseData.description);
            formData.append("price_dzd", editCourseData.price);
            formData.append("discount_percent", editCourseData.discount || "0");
            if (editCourseData.category) formData.append("category", editCourseData.category);
            if (editCourseCoverFile) formData.append("cover_image", editCourseCoverFile);

            const response = await fetch(`${API}/courses/${editingCourseId}/`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData,
            });

            if (response.ok) {
                const updatedCourse = await response.json();
                setCourses(courses.map(c => c.id === editingCourseId ? { ...c, ...updatedCourse, videos: c.videos } : c));
                setEditingCourseId(null);
                setEditCourseCoverFile(null);
                toast({ title: "Formation mise à jour avec succès" });
            } else {
                toast({ variant: "destructive", title: "Erreur lors de la mise à jour" });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur réseau" });
        }
    };

    const handleUploadVideo = async (courseId: number) => {
        if (!newVideo.title || !videoFile) return;
        setIsUploadingVideo(true);

        const performUpload = async (durationInSeconds: number) => {
            const formData = new FormData();
            formData.append("course", courseId.toString());
            formData.append("title", newVideo.title);
            formData.append("description", newVideo.description);
            formData.append("video_file", videoFile);
            formData.append("duration_seconds", durationInSeconds.toString());
            formData.append("order", newVideo.order.toString());

            try {
                const response = await fetch(`${API}/video-lessons/`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (response.ok) {
                    const addedVideo = await response.json();
                    setCourses(courses.map(c => c.id === courseId ? {
                        ...c,
                        videos: [...(c.videos || []), addedVideo]
                    } : c));
                    setNewVideo({ title: "", description: "", order: (c => (c.videos?.length || 0) + 2)(courses.find(c => c.id === courseId) as any) });
                    setVideoFile(null);
                    toast({ title: "Vidéo ajoutée", description: "En attente de validation par un administrateur." });
                } else {
                    toast({ variant: "destructive", title: "Erreur lors de l'ajout de la vidéo" });
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Erreur lors de l'upload" });
            } finally {
                setIsUploadingVideo(false);
            }
        };

        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.src = URL.createObjectURL(videoFile);

        videoElement.onloadedmetadata = () => {
            window.URL.revokeObjectURL(videoElement.src);
            performUpload(Math.round(videoElement.duration || 0));
        };

        videoElement.onerror = () => {
            window.URL.revokeObjectURL(videoElement.src);
            // If the browser can't read the metadata (e.g. exotic video format or codec),
            // we proceed with the upload anyway with duration 0.
            performUpload(0);
        };
    };

    const deleteVideo = async (videoId: number, courseId: number) => {
        if (!confirm("Voulez-vous vraiment supprimer cette vidéo ?")) return;
        try {
            const response = await fetch(`${API}/video-lessons/${videoId}/`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (response.ok) {
                setCourses(courses.map(c => c.id === courseId ? {
                    ...c,
                    videos: c.videos?.filter((v: any) => v.id !== videoId) || []
                } : c));
                toast({ title: "Vidéo supprimée" });
            } else {
                toast({ variant: "destructive", title: "Erreur lors de la suppression de la vidéo" });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur réseau" });
        }
    };

    const handleVideoDrop = async (e: React.DragEvent, targetVideoId: number, courseId: number) => {
        e.preventDefault();
        if (!draggedVideoId || draggedVideoId === targetVideoId) return;

        const course = courses.find(c => c.id === courseId);
        if (!course || !course.videos) return;

        const sortedVideos = [...course.videos].sort((a: any, b: any) => a.order - b.order);
        const draggedIndex = sortedVideos.findIndex((v: any) => v.id === draggedVideoId);
        const targetIndex = sortedVideos.findIndex((v: any) => v.id === targetVideoId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedVideo] = sortedVideos.splice(draggedIndex, 1);
        sortedVideos.splice(targetIndex, 0, draggedVideo);

        const updatedVideos = sortedVideos.map((v: any, index: number) => ({
            ...v,
            order: index + 1
        }));

        setCourses(courses.map(c => c.id === courseId ? { ...c, videos: updatedVideos } : c));
        setDraggedVideoId(null);

        try {
            const updates = updatedVideos.map(({ id, order }: any) => ({ id, order }));
            const response = await fetch(`${API}/video-lessons/reorder/`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ updates }),
            });
            if (!response.ok) toast({ variant: "destructive", title: "Erreur lors de la réorganisation" });
        } catch {
            toast({ variant: "destructive", title: "Erreur réseau" });
        }
    };

    const handleReply = async (commentId: number, courseId: number) => {
        const text = replyTexts[commentId]?.trim();
        if (!text) return;
        const res = await fetch(`${API}/comments/`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ content: text, course: courseId, parent: commentId }),
        });
        if (res.ok) {
            setReplyTexts(prev => ({ ...prev, [commentId]: "" }));
            toast({ title: "Réponse envoyée !" });
            fetchComments();
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(profileForm).forEach(([k, v]) => fd.append(k, v));
            if (photoFile) fd.append("photo", photoFile);
            const res = await fetch(`${API}/teacher/profile/`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (res.ok) {
                toast({ title: "Profil mis à jour !" });
                fetchProfile();
                setPhotoFile(null);
            }
        } finally {
            setSaving(false);
        }
    };

    const getOtherParty = (conv: any) => {
        return conv.student_details;
    };

    const navItems: { id: Tab; label: string; icon: any; badge?: number }[] = [
        { id: "courses", label: "Mes Formations", icon: BookOpen },
        { id: "create", label: "Créer une Formation", icon: Plus },
        { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadTotal || undefined },
        { id: "profile", label: "Mon Profil", icon: User },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
                <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
                    <img src={logo} alt="Bequer" className="h-9 w-9 rounded-lg object-cover" />
                    <div>
                        <p className="font-bold text-foreground text-sm">The Bequer</p>
                        <p className="text-xs text-muted-foreground">Espace Formateur</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-1">
                    {navItems.map(({ id, label, icon: Icon, badge }) => (
                        <button
                            key={id}
                            onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === id
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                }`}
                        >
                            <Icon size={18} />
                            <span className="flex-1 text-left">{label}</span>
                            {badge ? (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                                    {badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </nav>

                <div className="px-3 pb-6">
                    {profile && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-secondary/40 rounded-xl mb-3">
                            {profile.photo ? (
                                <img src={profile.photo} alt="Photo" className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20" />
                            ) : (
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User size={16} className="text-primary" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{profile.first_name || profile.username}</p>
                                <p className="text-xs text-muted-foreground">Formateur</p>
                            </div>
                        </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full gap-2 justify-start" onClick={() => { localStorage.clear(); navigate("/"); }}>
                        <LogOut size={15} /> Se déconnecter
                    </Button>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
                        <Menu size={22} />
                    </button>
                    <h1 className="text-lg font-bold text-foreground flex-1">
                        {navItems.find(n => n.id === activeTab)?.label}
                    </h1>
                    {unreadTotal > 0 && (
                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-semibold">
                            <Bell size={14} /> {unreadTotal} non lu{unreadTotal > 1 ? "s" : ""}
                        </div>
                    )}
                </header>

                <main className="flex-1 p-6 w-full">
                    <AnimatePresence mode="wait">

                        {/* ── TAB: My Courses ── */}
                        {activeTab === "courses" && (
                            <motion.div key="courses" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto space-y-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-muted-foreground text-sm">Vos formations soumises et leur statut de validation.</p>
                                    <Button className="gradient-primary text-white border-0 gap-2" onClick={() => setActiveTab("create")}>
                                        <Plus size={16} /> Nouvelle formation
                                    </Button>
                                </div>

                                {courses.length === 0 ? (
                                    <div className="text-center py-24 bg-card rounded-2xl border border-border">
                                        <BookOpen className="h-14 w-14 text-primary/20 mx-auto mb-4" />
                                        <p className="text-lg font-semibold text-muted-foreground">Aucune formation soumise</p>
                                        <p className="text-sm text-muted-foreground mt-1 mb-6">Créez votre première formation et soumettez-la pour validation.</p>
                                        <Button className="gradient-primary text-white border-0 gap-2" onClick={() => setActiveTab("create")}>
                                            <Plus size={16} /> Créer une formation
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {courses.map((course, i) => {
                                            const st = statusConfig[course.status] || statusConfig.pending;
                                            const Icon = st.icon;
                                            const isExpanded = expandedCourseId === course.id;
                                            const isEditing = editingCourseId === course.id;

                                            return (
                                                <motion.div
                                                    key={course.id}
                                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.07 }}
                                                    className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300"
                                                >
                                                    <div className="flex flex-col sm:flex-row p-4 gap-5">
                                                        <div className="h-32 w-full sm:w-48 shrink-0 relative overflow-hidden rounded-xl">
                                                            {course.cover_image ? (
                                                                <img
                                                                    src={course.cover_image.startsWith("http") ? course.cover_image : `${course.cover_image}`}
                                                                    alt={course.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full gradient-primary flex items-center justify-center">
                                                                    <BookOpen className="h-8 w-8 text-primary-foreground/40" />
                                                                </div>
                                                            )}
                                                            <div className={`absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${st.color}`}>
                                                                <Icon size={12} /> {st.label}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-between py-1">
                                                            <div>
                                                                <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-2">{course.title}</h3>
                                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                                                                <div className="flex items-center gap-4 text-sm font-medium">
                                                                    <span className="flex items-center gap-1.5 text-accent"><CreditCard size={15} /> {course.price_dzd} DZD</span>
                                                                    <span className="flex items-center gap-1.5 text-muted-foreground"><Video size={15} /> {course.videos?.length || 0} vidéos</span>
                                                                    <span className="flex items-center gap-1.5 text-muted-foreground"><Clock size={15} /> {formatDuration(course.videos)}</span>
                                                                </div>
                                                                {course.status === "rejected" && course.rejection_reason && (
                                                                    <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-red-500 font-medium">
                                                                        ⚠️ Raison du refus : {course.rejection_reason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-end gap-2 mt-4 sm:mt-0">
                                                                <Button
                                                                    variant={isExpanded ? "secondary" : "outline"}
                                                                    onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                                                                    className="gap-2"
                                                                >
                                                                    {isExpanded ? "Fermer" : "Gérer la formation"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Content: Edit Course & Manage Videos */}
                                                    {isExpanded && (
                                                        <div className="border-t border-border bg-card/30">

                                                            {/* Tab-like sections */}
                                                            <div className="p-5 border-b border-border/50">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <h4 className="font-semibold flex items-center gap-2"><Edit size={16} className="text-primary" /> Détails de la formation</h4>
                                                                    {!isEditing ? (
                                                                        <Button size="sm" variant="ghost" className="gap-2 text-muted-foreground" onClick={() => {
                                                                            setEditingCourseId(course.id);
                                                                            setEditCourseData({ title: course.title, price: course.price_dzd, category: course.category, description: course.description, discount: (course.discount_percent || 0).toString() });
                                                                            setEditCourseCoverFile(null);
                                                                        }}>
                                                                            <Edit size={14} /> Modifier les détails
                                                                        </Button>
                                                                    ) : (
                                                                        <div className="flex gap-2">
                                                                            <Button size="sm" variant="outline" onClick={() => setEditingCourseId(null)}>Annuler</Button>
                                                                            <Button size="sm" onClick={handleUpdateCourse} disabled={!editCourseData.title || !editCourseData.price}>Enregistrer</Button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {isEditing ? (
                                                                    <div className="grid gap-4 bg-background p-4 rounded-xl border border-border">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                            <div className="space-y-1">
                                                                                <label className="text-xs font-medium text-muted-foreground ml-1">Titre de la formation</label>
                                                                                <Input value={editCourseData.title} onChange={e => setEditCourseData({ ...editCourseData, title: e.target.value })} />
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div className="space-y-1">
                                                                                    <label className="text-xs font-medium text-muted-foreground ml-1">Prix (DZD)</label>
                                                                                    <Input type="number" value={editCourseData.price} onChange={e => setEditCourseData({ ...editCourseData, price: e.target.value })} />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <label className="text-xs font-medium text-muted-foreground ml-1">Réduction (%)</label>
                                                                                    <Input type="number" min="0" max="100" value={editCourseData.discount} onChange={e => setEditCourseData({ ...editCourseData, discount: e.target.value })} />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-xs font-medium text-muted-foreground ml-1">Description</label>
                                                                            <Textarea value={editCourseData.description} onChange={e => setEditCourseData({ ...editCourseData, description: e.target.value })} rows={3} />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-xs font-medium text-muted-foreground ml-1">Nouvelle image de couverture (laisser vide pour conserver l'actuelle)</label>
                                                                            <Input type="file" accept="image/*" onChange={e => setEditCourseCoverFile(e.target.files?.[0] || null)} />
                                                                        </div>
                                                                    </div>
                                                                ) : null}
                                                            </div>

                                                            <div className="p-5">
                                                                <h4 className="font-semibold flex items-center gap-2 mb-4"><Video size={16} className="text-primary" /> Vidéos de la formation</h4>

                                                                <div className="space-y-3 mb-6">
                                                                    {course.videos && course.videos.length > 0 ? [...course.videos].sort((a: any, b: any) => a.order - b.order).map((video: any) => (
                                                                        <div
                                                                            key={video.id}
                                                                            draggable
                                                                            onDragStart={() => setDraggedVideoId(video.id)}
                                                                            onDragOver={(e) => e.preventDefault()}
                                                                            onDrop={(e) => handleVideoDrop(e, video.id, course.id)}
                                                                            className={`flex flex-col sm:flex-row justify-between items-start sm:items-center bg-background rounded-xl p-3 border border-border cursor-grab active:cursor-grabbing transition-all ${draggedVideoId === video.id ? 'opacity-50 scale-[0.99] border-primary' : 'hover:border-primary/40'}`}
                                                                        >
                                                                            <div className="flex items-start gap-3 w-full sm:w-auto">
                                                                                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                                                    {video.order}
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <span className="text-sm font-semibold flex items-center gap-2">
                                                                                        {video.title}
                                                                                        <Badge variant="outline" className={`text-[10px] uppercase h-5 px-1.5 ${video.status === 'approved' ? 'border-green-500/30 text-green-500 bg-green-500/10' : video.status === 'rejected' ? 'border-red-500/30 text-red-500 bg-red-500/10' : 'border-yellow-500/30 text-yellow-600 bg-yellow-500/10'}`}>
                                                                                            {video.status === 'approved' ? 'Approuvée' : video.status === 'rejected' ? 'Refusée' : 'En attente'}
                                                                                        </Badge>
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2 mt-1 mb-2">
                                                                                        <span className="text-xs font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded">{formatDuration([{ duration_seconds: video.duration_seconds }])}</span>
                                                                                        {video.description && <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>}
                                                                                    </div>
                                                                                    <video
                                                                                        className="w-full max-w-xs rounded-lg border border-border bg-black object-contain aspect-video"
                                                                                        controls
                                                                                        controlsList="nodownload"
                                                                                        src={video.stream_url.startsWith('http') ? `${video.stream_url}?token=${token}` : `${video.stream_url}?token=${token}`}
                                                                                        preload="metadata"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <Button variant="ghost" size="icon" onClick={() => deleteVideo(video.id, course.id)} className="shrink-0 mt-3 sm:mt-0 self-end sm:self-auto hover:bg-destructive/10 hover:text-destructive">
                                                                                <Trash2 size={16} />
                                                                            </Button>
                                                                        </div>
                                                                    )) : (
                                                                        <div className="text-center py-8 bg-background rounded-xl border border-dashed border-border flex flex-col items-center">
                                                                            <Video size={24} className="text-muted-foreground/50 mb-2" />
                                                                            <p className="text-sm font-medium text-muted-foreground">Aucune vidéo</p>
                                                                            <p className="text-xs text-muted-foreground mt-1">Ajoutez votre première vidéo ci-dessous.</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Add Video Form */}
                                                                <div className="p-4 border border-border rounded-xl bg-secondary/30">
                                                                    <h5 className="font-semibold text-sm mb-4">Ajouter un nouveau module vidéo</h5>
                                                                    <div className="grid gap-3">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            <Input placeholder="Titre de la vidéo" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} />
                                                                            <Input placeholder="Description (optionnelle)" value={newVideo.description} onChange={e => setNewVideo({ ...newVideo, description: e.target.value })} />
                                                                        </div>
                                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                                            <div className="w-full sm:w-24 shrink-0">
                                                                                <Input type="number" placeholder="Ordre" title="Ordre de lecture" value={newVideo.order} onChange={e => setNewVideo({ ...newVideo, order: parseInt(e.target.value) || 0 })} />
                                                                            </div>
                                                                            <Input type="file" accept="video/mp4,video/x-m4v,video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="flex-1 cursor-pointer file:cursor-pointer" />
                                                                        </div>
                                                                        <Button
                                                                            className="w-full mt-2"
                                                                            onClick={() => handleUploadVideo(course.id)}
                                                                            disabled={!newVideo.title || !videoFile || isUploadingVideo}
                                                                        >
                                                                            {isUploadingVideo ? (
                                                                                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours...</span>
                                                                            ) : (
                                                                                <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Envoyer la vidéo (En attente de validation)</span>
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ── TAB: Create Course ── */}
                        {activeTab === "create" && (
                            <motion.div key="create" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
                                <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Soumettre une nouvelle formation</h2>
                                        <p className="text-sm text-muted-foreground mt-1">Après soumission, l'administrateur examinera votre formation avant de la publier.</p>
                                    </div>

                                    {/* Cover image upload */}
                                    <div
                                        className="border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={() => coverRef.current?.click()}
                                    >
                                        {coverPreview ? (
                                            <img src={coverPreview} alt="Cover" className="w-full h-44 object-cover" />
                                        ) : (
                                            <div className="h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                <Upload size={28} />
                                                <p className="text-sm font-medium">Cliquez pour ajouter une image de couverture</p>
                                                <p className="text-xs">PNG, JPG — recommandé 1280×720</p>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={coverRef} type="file" accept="image/*" className="hidden"
                                        onChange={e => {
                                            const f = e.target.files?.[0];
                                            if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                                        }} />

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Titre de la formation *</label>
                                        <Input value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Formation Complète en Formulation Cosmétique" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description de la formation *</label>
                                        <Textarea value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez le contenu et les objectifs..." rows={4} />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix (DZD) *</label>
                                            <Input type="number" value={courseForm.price_dzd} onChange={e => setCourseForm(p => ({ ...p, price_dzd: e.target.value }))} placeholder="Ex: 15000" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Réduction (%)</label>
                                            <Input type="number" min="0" max="100" value={courseForm.discount} onChange={e => setCourseForm(p => ({ ...p, discount: e.target.value }))} placeholder="Ex: 20" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Durée estimée</label>
                                        <Input value={courseForm.duration} onChange={e => setCourseForm(p => ({ ...p, duration: e.target.value }))} placeholder="Ex: 12 heures" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catégorie</label>
                                        <select
                                            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm"
                                            value={courseForm.category}
                                            onChange={e => setCourseForm(p => ({ ...p, category: e.target.value }))}
                                        >
                                            <option value="">-- Sélectionner une catégorie --</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {"  ".repeat(c.depth)}{c.depth > 0 ? "└ " : ""}{c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" onClick={() => setActiveTab("courses")}>
                                            Annuler
                                        </Button>
                                        <Button
                                            className="gradient-primary text-white border-0 gap-2 flex-1"
                                            onClick={handleSubmitCourse}
                                            disabled={submittingCourse}
                                        >
                                            {submittingCourse ? <><Loader2 size={16} className="animate-spin" /> Soumission...</> : <><Send size={16} /> Soumettre pour validation</>}
                                        </Button>
                                    </div>

                                    <div className="flex items-start gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-xs text-yellow-600">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <span>Après approbation, vous pourrez ajouter les vidéos de cours depuis l'interface principale.</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── TAB: Messages (Messenger UI) ── */}
                        {activeTab === "messages" && (
                            <motion.div key="messages" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="h-[calc(100vh-120px)] flex gap-0 bg-card border border-border rounded-2xl overflow-hidden"
                            >
                                {/* Left: Conversations list */}
                                <div className={`w-full sm:w-72 border-r border-border flex flex-col shrink-0 ${activeConv ? "hidden sm:flex" : "flex"}`}>
                                    <div className="px-4 py-4 border-b border-border">
                                        <h2 className="font-bold text-foreground">Messages</h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {conversations.length === 0 ? (
                                            <div className="text-center py-16 px-4">
                                                <MessageSquare className="h-10 w-10 text-primary/20 mx-auto mb-3" />
                                                <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
                                                <p className="text-xs text-muted-foreground mt-1">Les étudiants vous contacteront ici.</p>
                                            </div>
                                        ) : conversations.map(conv => {
                                            const other = getOtherParty(conv);
                                            const isActive = activeConv?.id === conv.id;
                                            const initials = (other?.name || "?").slice(0, 2).toUpperCase();
                                            return (
                                                <button
                                                    key={conv.id}
                                                    onClick={() => openConversation(conv)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left border-b border-border/50 ${isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${isActive ? "gradient-primary text-white" : "bg-primary/10 text-primary"}`}>
                                                        {initials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-foreground truncate">{other?.name}</p>
                                                            {conv.unread_count > 0 && (
                                                                <span className="text-xs bg-primary text-white px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-1">
                                                                    {conv.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {conv.last_message && (
                                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message.body}</p>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right: Chat window */}
                                <div className={`flex-1 flex flex-col ${activeConv ? "flex" : "hidden sm:flex"}`}>
                                    {!activeConv ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                            <MessageSquare className="h-16 w-16 text-primary/10 mb-4" />
                                            <p className="text-lg font-semibold text-muted-foreground">Sélectionnez une conversation</p>
                                            <p className="text-sm text-muted-foreground mt-1">Choisissez une conversation à gauche pour commencer à chatter.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Chat header */}
                                            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                                                <button className="sm:hidden mr-1" onClick={() => setActiveConv(null)}>
                                                    <ArrowLeft size={20} className="text-muted-foreground" />
                                                </button>
                                                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                                                    {(getOtherParty(activeConv)?.name || "?").slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm">{getOtherParty(activeConv)?.name}</p>
                                                    <p className="text-xs text-muted-foreground">Étudiant</p>
                                                </div>
                                                {(() => {
                                                    if (!activeConv?.access_expires_at) return null;
                                                    const diffTime = new Date(activeConv.access_expires_at).getTime() - new Date().getTime();
                                                    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                                                    const isExpired = diffTime <= 0;

                                                    return isExpired ? (
                                                        <Badge variant="destructive" className="ml-auto font-medium py-1 px-3 shadow-none">Accès expiré</Badge>
                                                    ) : (
                                                        <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/20 shadow-none">
                                                            <Clock size={14} className="mr-1.5" />
                                                            {daysRemaining} jour{daysRemaining !== 1 && 's'} restant{daysRemaining !== 1 && 's'}
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>

                                            {/* Messages */}
                                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                                {messages.length === 0 && (
                                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                                        Début de la conversation avec {getOtherParty(activeConv)?.name}
                                                    </div>
                                                )}
                                                {messages.map((msg) => {
                                                    const isMine = msg.sender === userId;
                                                    return (
                                                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                                            {!isMine && (
                                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary mr-2 shrink-0 mt-1">
                                                                    {(msg.sender_name || "?").slice(0, 2).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine
                                                                ? "gradient-primary text-white rounded-br-none"
                                                                : "bg-secondary text-foreground rounded-bl-none"
                                                                }`}>
                                                                <p>{msg.body}</p>
                                                                <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground"}`}>
                                                                    {new Date(msg.sent_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>

                                            {/* Input */}
                                            <div className="px-4 py-3 border-t border-border flex gap-2">
                                                {(() => {
                                                    const isExpired = activeConv?.access_expires_at && new Date() > new Date(activeConv.access_expires_at);
                                                    if (isExpired) {
                                                        return (
                                                            <div className="w-full flex items-center justify-center bg-destructive/5 text-destructive border border-destructive/20 p-3 rounded-xl gap-3">
                                                                <Lock size={16} />
                                                                <p className="text-sm font-medium">L'abonnement de cet étudiant a expiré.</p>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <>
                                                            <Input
                                                                className="flex-1 rounded-full"
                                                                placeholder="Écrire un message..."
                                                                value={msgInput}
                                                                onChange={e => setMsgInput(e.target.value)}
                                                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                                            />
                                                            <Button
                                                                size="icon"
                                                                className="gradient-primary text-white border-0 rounded-full shrink-0"
                                                                onClick={sendMessage}
                                                                disabled={!msgInput.trim() || sendingMsg}
                                                            >
                                                                {sendingMsg ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                                            </Button>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ── TAB: Profile ── */}
                        {activeTab === "profile" && (
                            <motion.div key="profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
                                <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                                    <div className="flex flex-col items-center gap-4 pb-6 border-b border-border">
                                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Photo" className="h-28 w-28 rounded-full object-cover ring-4 ring-primary/20" />
                                            ) : (
                                                <div className="h-28 w-28 rounded-full gradient-primary flex items-center justify-center ring-4 ring-primary/10">
                                                    <User size={40} className="text-primary-foreground/60" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera size={22} className="text-white" />
                                            </div>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
                                        }} />
                                        {profile && (
                                            <div className="text-center">
                                                <p className="font-bold text-foreground">{profile.username}</p>
                                                <p className="text-xs text-muted-foreground">{profile.email}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prénom</label>
                                            <Input value={profileForm.first_name} onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))} placeholder="Prénom" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nom</label>
                                            <Input value={profileForm.last_name} onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Nom de famille" />
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spécialité</label>
                                            <Input value={profileForm.speciality} onChange={e => setProfileForm(p => ({ ...p, speciality: e.target.value }))} placeholder="Ex: Formulation cosmétique..." />
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Biographie</label>
                                            <Textarea rows={4} value={profileForm.bio} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} className="resize-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LinkedIn</label>
                                            <Input value={profileForm.linkedin} onChange={e => setProfileForm(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/in/..." />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</label>
                                            <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="+213 ..." />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button className="gradient-primary text-white border-0 px-8" onClick={handleSaveProfile} disabled={saving}>
                                            {saving ? "Enregistrement..." : "Enregistrer le profil"}
                                        </Button>
                                        {profile && (
                                            <Button variant="outline" className="gap-2" onClick={() => navigate(`/teachers/${profile.user_id}`)}>
                                                <Eye size={15} /> Voir mon profil public
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
