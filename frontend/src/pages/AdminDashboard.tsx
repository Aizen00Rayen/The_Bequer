import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, Users, BookOpen, MessageSquare, LayoutDashboard, Trash2, Plus, Tags, X, ChevronDown, ChevronUp, Video, Edit, CreditCard, TrendingUp, Ticket, Flame, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    is_approved: boolean;
    date_joined: string;
}

interface Category {
    id: number;
    name: string;
    parent?: number | null;
    subcategories?: Category[];
}

interface VideoLesson {
    id: number;
    title: string;
    description: string;
    stream_url: string;
    duration_seconds: number;
    order: number;
    status?: string;
    is_free_preview?: boolean;
}

interface Course {
    id: number;
    title: string;
    price_dzd: string;
    discount_percent: number;
    admin_discount_percent?: number;
    category: number | null;
    category_details: Category | null;
    cover_image: string | null;
    teacher: number | null;
    teacher_details: { id: number; name: string; username: string } | null;
    videos?: VideoLesson[];
    status?: string;
    submitted_at?: string;
}

interface Book {
    id: number;
    title: string;
    price_dzd: string;
    discount_percent: number;
    admin_discount_percent?: number;
    author: string;
    description: string;
    category: number | null;
    category_details: Category | null;
    cover_image: string | null;
    book_file: string | null;
}

interface Coupon {
    id: number;
    code: string;
    description: string;
    discount_percent: number;
    scope: string;
    valid_from: string;
    valid_until: string;
    max_uses: number;
    used_count: number;
    is_active: boolean;
    is_expired: boolean;
    uses_left: number | null;
}

interface Teacher {
    id: number;
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    speciality: string;
}

interface BrandRequest {
    id: number;
    full_name: string;
    email: string;
    brand_name: string;
    product_category: string;
    budget: string;
    created_at: string;
}

interface Stats {
    total_users: number;
    pending_users: number;
    total_courses: number;
    brand_requests: number;
}

interface Payment {
    id: number;
    user: number;
    user_username?: string;
    item_type: string;
    item_id: number;
    chargily_id: string;
    status: string;
    created_at: string;
}

interface Complaint {
    id: number;
    student: number;
    teacher: number;
    student_details: { id: number; name: string; username: string };
    teacher_details: { id: number; name: string; username: string };
    reason: string;
    created_at: string;
    is_resolved: boolean;
}

const renderCategoryOptions = (categories: Category[], prefix = ""): React.ReactNode[] => {
    return categories.reduce<React.ReactNode[]>((acc, cat) => {
        acc.push(<option key={cat.id} value={cat.id}>{prefix}{cat.name}</option>);
        if (cat.subcategories && cat.subcategories.length > 0) {
            acc.push(...renderCategoryOptions(cat.subcategories, prefix + "— "));
        }
        return acc;
    }, []);
};

const AdminCategoryItem = ({ cat, deleteCategory }: { cat: Category, deleteCategory: (id: number) => void }) => {
    return (
        <div className="space-y-2 mt-2 w-full">
            <div className="flex items-center gap-2 px-3 py-1.5 border border-primary/20 rounded-lg bg-primary/5 text-sm w-fit font-medium">
                <Tags className="w-3.5 h-3.5 text-primary" />
                <span>{cat.name}</span>
                <button onClick={() => deleteCategory(cat.id)} className="ml-2 text-muted-foreground hover:text-red-500 opacity-50 hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
            {cat.subcategories && cat.subcategories.length > 0 && (
                <div className="flex flex-col gap-2 ml-6 border-l-2 border-border/50 pl-4 py-1">
                    {cat.subcategories.map(sub => (
                        <AdminCategoryItem key={sub.id} cat={sub} deleteCategory={deleteCategory} />
                    ))}
                </div>
            )}
        </div>
    );
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [brandRequests, setBrandRequests] = useState<BrandRequest[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAddingCourse, setIsAddingCourse] = useState(false);
    const [newCourse, setNewCourse] = useState({ title: "", price: "", category: "", teacher: "", discount: "0" });
    const [courseCoverFile, setCourseCoverFile] = useState<File | null>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryParentId, setNewCategoryParentId] = useState<string>("");

    const [isAddingBook, setIsAddingBook] = useState(false);
    const [newBook, setNewBook] = useState({ title: "", price: "", category: "", author: "", description: "" });
    const [bookCoverFile, setBookCoverFile] = useState<File | null>(null);
    const [bookPdfFile, setBookPdfFile] = useState<File | null>(null);
    const [editingBookId, setEditingBookId] = useState<number | null>(null);
    const [editBookData, setEditBookData] = useState({ title: "", price: "", category: "", author: "", description: "", discount: "0", admin_discount: "0" });
    const [editBookCoverFile, setEditBookCoverFile] = useState<File | null>(null);
    const [editBookPdfFile, setEditBookPdfFile] = useState<File | null>(null);

    const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
    const [editCourseData, setEditCourseData] = useState({ title: "", price: "", category: "", teacher: "", discount: "0", admin_discount: "0" });
    const [editCourseCoverFile, setEditCourseCoverFile] = useState<File | null>(null);

    const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [newVideo, setNewVideo] = useState({ title: "", description: "", order: 1 });
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [draggedVideoId, setDraggedVideoId] = useState<number | null>(null);

    const [isAddingCoupon, setIsAddingCoupon] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: "", description: "", discount_percent: "", scope: "all",
        valid_from: "", valid_until: "", max_uses: "0", is_active: true
    });

    const navigate = useNavigate();
    const { toast } = useToast();

    const getHeaders = () => ({
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json"
    });

    useEffect(() => {
        const role = localStorage.getItem("user_role");
        const token = localStorage.getItem("access_token");

        if (!token || role !== "admin") {
            navigate("/");
            return;
        }
        fetchAllData();
    }, [navigate]);

    const handleAuthError = (res: Response) => {
        if (res.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_role");
            toast({ variant: "destructive", title: "Session expirée", description: "Votre session a expiré. Veuillez vous reconnecter." });
            navigate("/login");
            return true;
        }
        return false;
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const getRes = async (url: string) => {
                try {
                    const res = await fetch(url, { headers: getHeaders() });
                    if (handleAuthError(res)) return null;
                    if (res.ok) return await res.json();
                } catch (e) {
                    console.error("Failed to fetch", url, e);
                }
                return null;
            };

            const [statsData, usersData, coursesData, catsData, brandData, paymentsData, teachersData, booksData, couponsData] = await Promise.all([
                getRes("/api/stats/"),
                getRes("/api/users/"),
                getRes("/api/courses/"),
                getRes("/api/categories/"),
                getRes("/api/admin/brand-requests/"),
                getRes("/api/payment/admin-payments/"),
                getRes("/api/teachers/"),
                getRes("/api/books/"),
                getRes("/api/payment/coupons/"),
                getRes("/api/complaints/"),
            ]);

            if (statsData) setStats(statsData);
            if (usersData) setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
            if (coursesData) setCourses(Array.isArray(coursesData) ? coursesData : coursesData.results || []);
            if (catsData) setCategories(Array.isArray(catsData) ? catsData : catsData.results || []);
            if (brandData) setBrandRequests(Array.isArray(brandData) ? brandData : brandData.results || []);
            if (paymentsData) setPayments(Array.isArray(paymentsData) ? paymentsData : paymentsData.results || []);
            if (teachersData) setTeachers(Array.isArray(teachersData) ? teachersData : teachersData.results || []);
            if (booksData) setBooks(Array.isArray(booksData) ? booksData : booksData.results || []);
            if (couponsData) setCoupons(Array.isArray(couponsData) ? couponsData : couponsData.results || []);
            if (complaintsData) setComplaints(Array.isArray(complaintsData) ? complaintsData : complaintsData.results || []);
        } catch (error) {
            console.error("Error fetching data", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données." });
        } finally {
            setLoading(false);
        }
    };

    const approveUser = async (userId: number) => {
        try {
            const response = await fetch(`/api/users/${userId}/approve/`, {
                method: "PATCH",
                headers: getHeaders()
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, is_approved: true } : u));
                if (stats) setStats({ ...stats, pending_users: stats.pending_users - 1 });
                toast({ title: "Approuvé", description: "L'accès de l'utilisateur a été approuvé." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de l'approbation." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const deleteUser = async (userId: number) => {
        console.log("Attempting to delete user:", userId);
        try {
            console.log("Sending DELETE request to:", `/api/users/${userId}/delete/`);
            const response = await fetch(`/api/users/${userId}/delete/`, {
                method: "DELETE",
                headers: getHeaders()
            });
            console.log("Delete response status:", response.status, response.ok);
            if (handleAuthError(response)) return;
            if (response.ok) {
                setUsers(users.filter(u => u.id !== userId));
                if (stats) setStats({ ...stats, total_users: stats.total_users - 1 });
                toast({ title: "Supprimé", description: "L'utilisateur a été supprimé." });
            } else {
                const errData = await response.text();
                console.error("Delete failed. Error data:", errData);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer l'utilisateur." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const approveEnrollment = async (enrollmentId: number) => {
        try {
            const response = await fetch(`/api/enrollments/${enrollmentId}/`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ is_approved: true })
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                setEnrollments(enrollments.map(e => e.id === enrollmentId ? { ...e, is_approved: true } : e));
                toast({ title: "Approuvé", description: "L'accès à la formation a été accordé." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Erreur lors de l'approbation." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const deleteEnrollment = async (enrollmentId: number) => {
        try {
            const response = await fetch(`/api/enrollments/${enrollmentId}/`, {
                method: "DELETE",
                headers: getHeaders()
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                setEnrollments(enrollments.filter(e => e.id !== enrollmentId));
                toast({ title: "Rejeté", description: "La demande d'accès a été supprimée." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la demande." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName) return;
        try {
            const bodyData: any = { name: newCategoryName };
            if (newCategoryParentId) {
                bodyData.parent = parseInt(newCategoryParentId, 10);
            }

            const response = await fetch("/api/categories/", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(bodyData)
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                const newCat = await response.json();
                if (newCat.parent) {
                    const addCatRecursive = (cats: Category[]): Category[] => {
                        return cats.map(c => {
                            if (c.id === newCat.parent) {
                                return { ...c, subcategories: [...(c.subcategories || []), newCat] };
                            }
                            return {
                                ...c,
                                subcategories: c.subcategories ? addCatRecursive(c.subcategories) : []
                            };
                        });
                    };
                    setCategories(addCatRecursive(categories));
                } else {
                    setCategories([...categories, newCat]);
                }
                toast({ title: "Succès", description: "Catégorie ajoutée." });
                setNewCategoryName("");
                setNewCategoryParentId("");
                setIsAddingCategory(false);
            } else {
                const err = await response.json();
                toast({ variant: "destructive", title: "Erreur", description: err.name ? `Catégorie: ${err.name[0]}` : "Impossible d'ajouter la catégorie." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const deleteCategory = async (id: number) => {
        try {
            const response = await fetch(`/api/categories/${id}/`, {
                method: "DELETE",
                headers: getHeaders()
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                // Remove from local state (recursive removal logic)
                const removeCat = (cats: Category[]): Category[] => {
                    return cats.filter(c => c.id !== id).map(c => ({
                        ...c,
                        subcategories: c.subcategories ? removeCat(c.subcategories) : []
                    }));
                };
                setCategories(removeCat(categories));
                toast({ title: "Succès", description: "Catégorie supprimée." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la catégorie." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const handleAddCourse = async () => {
        if (!newCourse.title || !newCourse.price) return;

        const formData = new FormData();
        formData.append("title", newCourse.title);
        formData.append("price_dzd", newCourse.price);
        formData.append("description", "Description générée automatiquement pour cette nouvelle formation.");
        formData.append("duration", "0h");
        if (newCourse.teacher) formData.append("teacher", newCourse.teacher);
        if (newCourse.category) {
            formData.append("category", newCourse.category);
        }
        if (courseCoverFile) {
            formData.append("cover_image", courseCoverFile);
        }

        try {
            const response = await fetch("/api/courses/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                },
                body: formData
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                setCourses([...courses, await response.json()]);
                toast({ title: "Succès", description: "Formation ajoutée." });
                setNewCourse({ title: "", price: "", category: "", teacher: "" });
                setCourseCoverFile(null);
                setIsAddingCourse(false);
            } else {
                const err = await response.json();
                toast({ variant: "destructive", title: "Erreur", description: "Vérifiez vos données: " + JSON.stringify(err) });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const deleteCourse = async (id: number) => {
        try {
            const response = await fetch(`/api/courses/${id}/`, {
                method: "DELETE",
                headers: getHeaders()
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                setCourses(courses.filter(c => c.id !== id));
                if (expandedCourseId === id) setExpandedCourseId(null);
                toast({ title: "Succès", description: "Formation supprimée." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la formation." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const handleEditClick = (e: React.MouseEvent, course: Course) => {
        e.stopPropagation();
        setEditingCourseId(course.id);
        setEditCourseData({
            title: course.title,
            price: course.price_dzd,
            category: course.category ? course.category.toString() : "",
            teacher: course.teacher ? course.teacher.toString() : "",
            discount: (course.discount_percent || 0).toString(),
            admin_discount: (course.admin_discount_percent || 0).toString()
        });
        setEditCourseCoverFile(null);
    };

    const handleUpdateCourse = async () => {
        if (!editingCourseId || !editCourseData.title || !editCourseData.price) return;

        const formData = new FormData();
        formData.append("title", editCourseData.title);
        formData.append("price_dzd", editCourseData.price);
        formData.append("discount_percent", editCourseData.discount || "0");
        formData.append("admin_discount_percent", editCourseData.admin_discount || "0");
        if (editCourseData.teacher) {
            formData.append("teacher", editCourseData.teacher);
        } else {
            formData.append("teacher", "");  // clear teacher
        }
        if (editCourseData.category) {
            formData.append("category", editCourseData.category);
        } else {
            formData.append("category", ""); // clear category
        }
        if (editCourseCoverFile) {
            formData.append("cover_image", editCourseCoverFile);
        }

        try {
            const response = await fetch(`/api/courses/${editingCourseId}/`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                },
                body: formData
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                const updatedCourse = await response.json();
                setCourses(courses.map(c => c.id === editingCourseId ? { ...c, ...updatedCourse, videos: c.videos } : c));
                toast({ title: "Succès", description: "Formation mise à jour." });
                setEditingCourseId(null);
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour la formation." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const handleUploadVideo = async (courseId: number) => {
        if (!newVideo.title || !videoFile) return;
        setIsUploadingVideo(true);

        // 1. Extract video duration using hidden video element
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.src = URL.createObjectURL(videoFile);

        videoElement.onloadedmetadata = async () => {
            window.URL.revokeObjectURL(videoElement.src);
            const durationInSeconds = Math.round(videoElement.duration);

            const formData = new FormData();
            formData.append("course", courseId.toString());
            formData.append("title", newVideo.title);
            formData.append("description", newVideo.description);
            formData.append("video_file", videoFile);
            formData.append("duration_seconds", durationInSeconds.toString());
            formData.append("order", newVideo.order.toString());

            try {
                const response = await fetch("/api/video-lessons/", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                    },
                    body: formData
                });
                if (handleAuthError(response)) { setIsUploadingVideo(false); return; }
                if (response.ok) {
                    const addedVideo = await response.json();
                    setCourses(courses.map(c => c.id === courseId ? {
                        ...c,
                        videos: [...(c.videos || []), addedVideo]
                    } : c));
                    toast({ title: "Succès", description: "Vidéo ajoutée à la formation." });
                    setNewVideo({ title: "", description: "", order: (c => (c.videos?.length || 0) + 2)(courses.find(c => c.id === courseId) as Course) });
                    setVideoFile(null);
                } else {
                    toast({ variant: "destructive", title: "Erreur", description: "Verifiez les fichiers (mp4 max 50MB, etc)." });
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau lors de l'upload." });
            } finally {
                setIsUploadingVideo(false);
            }
        };

        videoElement.onerror = () => {
            setIsUploadingVideo(false);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de lire la durée du fichier vidéo." });
        };
    };

    const deleteVideo = async (videoId: number, courseId: number) => {
        try {
            const response = await fetch(`/api/video-lessons/${videoId}/`, {
                method: "DELETE",
                headers: getHeaders()
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                setCourses(courses.map(c => c.id === courseId ? {
                    ...c,
                    videos: c.videos?.filter(v => v.id !== videoId) || []
                } : c));
                toast({ title: "Succès", description: "Vidéo supprimée." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la vidéo." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const approveCourse = async (courseId: number) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/approve/`, {
                method: "POST",
                headers: getHeaders()
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                const updated = await response.json();
                setCourses(courses.map(c => c.id === courseId ? updated : c));
                toast({ title: "Approuvée", description: "La formation a été approuvée avec succès." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible d'approuver la formation." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const rejectCourse = async (courseId: number) => {
        const reason = window.prompt("Raison du refus (optionnelle) :");
        if (reason === null) return; // User cancelled prompt
        try {
            const response = await fetch(`/api/courses/${courseId}/reject/`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ reason })
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                const updated = await response.json();
                setCourses(courses.map(c => c.id === courseId ? updated : c));
                toast({ title: "Refusée", description: "La formation a été refusée." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de refuser la formation." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const approveVideo = async (videoId: number, courseId: number) => {
        try {
            const response = await fetch(`/api/video-lessons/${videoId}/approve/`, {
                method: "POST",
                headers: getHeaders()
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                const updatedVideo = await response.json();
                setCourses(courses.map(c => c.id === courseId ? {
                    ...c, videos: c.videos?.map(v => v.id === videoId ? updatedVideo : v)
                } : c));
                toast({ title: "Approuvée", description: "La vidéo a été approuvée." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible d'approuver la vidéo." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const rejectVideo = async (videoId: number, courseId: number) => {
        try {
            const response = await fetch(`/api/video-lessons/${videoId}/reject/`, {
                method: "POST",
                headers: getHeaders(),
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                const updatedVideo = await response.json();
                setCourses(courses.map(c => c.id === courseId ? {
                    ...c, videos: c.videos?.map(v => v.id === videoId ? updatedVideo : v)
                } : c));
                toast({ title: "Refusée", description: "La vidéo a été refusée." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de refuser la vidéo." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const setPreviewVideo = async (videoId: number, courseId: number, isPreview: boolean) => {
        try {
            const endpoint = isPreview ? 'set_preview' : 'unset_preview';
            const response = await fetch(`/api/video-lessons/${videoId}/${endpoint}/`, {
                method: "POST",
                headers: getHeaders(),
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                const updatedVideo = await response.json();
                setCourses(courses.map(c => c.id === courseId ? {
                    ...c, videos: c.videos?.map(v => {
                        if (isPreview) return v.id === videoId ? updatedVideo : { ...v, is_free_preview: false };
                        return v.id === videoId ? updatedVideo : v;
                    })
                } : c));
                toast({ title: isPreview ? "Aperçu défini" : "Aperçu retiré", description: isPreview ? "Cette vidéo est maintenant visible par tous gratuitement." : "La vidéo n'est plus en aperçu gratuit." });
            }
        } catch {
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    const handleVideoDrop = async (e: React.DragEvent, targetVideoId: number, courseId: number) => {
        e.preventDefault();
        if (!draggedVideoId || draggedVideoId === targetVideoId) return;

        const course = courses.find(c => c.id === courseId);
        if (!course || !course.videos) return;

        // Clone and sort current videos by order
        const sortedVideos = [...course.videos].sort((a, b) => a.order - b.order);
        const draggedIndex = sortedVideos.findIndex(v => v.id === draggedVideoId);
        const targetIndex = sortedVideos.findIndex(v => v.id === targetVideoId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Reorder array
        const [draggedVideo] = sortedVideos.splice(draggedIndex, 1);
        sortedVideos.splice(targetIndex, 0, draggedVideo);

        // Update orders to match new array positions
        const updatedVideos = sortedVideos.map((v, index) => ({
            ...v,
            order: index + 1
        }));

        // Optimistically update UI
        setCourses(courses.map(c => c.id === courseId ? { ...c, videos: updatedVideos } : c));
        setDraggedVideoId(null);

        // Send bulk update to backend
        try {
            const updates = updatedVideos.map(({ id, order }) => ({ id, order }));
            const response = await fetch("/api/video-lessons/reorder/", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ updates })
            });

            if (handleAuthError(response)) return;
            if (!response.ok) {
                // Revert if failed
                setCourses([...courses]);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de réorganiser les vidéos sur le serveur." });
            } else {
                toast({ title: "Ordre mis à jour", description: "L'ordre des vidéos a été sauvegardé." });
            }
        } catch (error) {
            setCourses([...courses]);
            toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." });
        }
    };

    // Helper function to format duration string
    const formatDuration = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes} min`;
    };

    const handleAddBook = async () => {
        if (!newBook.title || !newBook.price) return;
        const formData = new FormData();
        formData.append("title", newBook.title);
        formData.append("price_dzd", newBook.price);
        formData.append("description", newBook.description);
        formData.append("author", newBook.author);
        if (newBook.category) formData.append("category", newBook.category);
        if (bookCoverFile) formData.append("cover_image", bookCoverFile);
        if (bookPdfFile) formData.append("book_file", bookPdfFile);
        try {
            const response = await fetch("/api/books/", {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` },
                body: formData
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                setBooks([await response.json(), ...books]);
                toast({ title: "Succès", description: "Livre ajouté." });
                setNewBook({ title: "", price: "", category: "", author: "", description: "" });
                setBookCoverFile(null); setBookPdfFile(null); setIsAddingBook(false);
            } else {
                const err = await response.json();
                toast({ variant: "destructive", title: "Erreur", description: "Vérifiez vos données: " + JSON.stringify(err) });
            }
        } catch { toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." }); }
    };

    const handleUpdateBook = async () => {
        if (!editingBookId || !editBookData.title || !editBookData.price) return;
        const formData = new FormData();
        formData.append("title", editBookData.title);
        formData.append("price_dzd", editBookData.price);
        formData.append("discount_percent", editBookData.discount || "0");
        formData.append("admin_discount_percent", editBookData.admin_discount || "0");
        formData.append("description", editBookData.description);
        formData.append("author", editBookData.author);
        if (editBookData.category) formData.append("category", editBookData.category);
        else formData.append("category", "");
        if (editBookCoverFile) formData.append("cover_image", editBookCoverFile);
        if (editBookPdfFile) formData.append("book_file", editBookPdfFile);
        try {
            const response = await fetch(`/api/books/${editingBookId}/`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` },
                body: formData
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                const updated = await response.json();
                setBooks(books.map(b => b.id === editingBookId ? { ...b, ...updated } : b));
                toast({ title: "Succès", description: "Livre mis à jour." });
                setEditingBookId(null);
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le livre." });
            }
        } catch { toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." }); }
    };

    const deleteBook = async (id: number) => {
        try {
            const response = await fetch(`/api/books/${id}/`, {
                method: "DELETE",
                headers: getHeaders()
            });
            if (handleAuthError(response)) return;
            if (response.ok) {
                setBooks(books.filter(b => b.id !== id));
                toast({ title: "Succès", description: "Livre supprimé." });
            } else {
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le livre." });
            }
        } catch { toast({ variant: "destructive", title: "Erreur", description: "Erreur réseau." }); }
    };

    const pendingUsers = users.filter(u => !u.is_approved);
    const approvedUsers = users.filter(u => u.is_approved);
    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

    const handleAddCoupon = async () => {
        if (!newCoupon.code || !newCoupon.discount_percent || !newCoupon.valid_from || !newCoupon.valid_until) return;
        try {
            const res = await fetch("/api/payment/coupons/", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    code: newCoupon.code.toUpperCase(),
                    description: newCoupon.description,
                    discount_percent: parseInt(newCoupon.discount_percent),
                    scope: newCoupon.scope,
                    valid_from: newCoupon.valid_from,
                    valid_until: newCoupon.valid_until,
                    max_uses: parseInt(newCoupon.max_uses),
                    is_active: newCoupon.is_active,
                })
            });
            if (handleAuthError(res)) return;
            if (res.ok) {
                const created = await res.json();
                setCoupons([created, ...coupons]);
                setNewCoupon({ code: "", description: "", discount_percent: "", scope: "all", valid_from: "", valid_until: "", max_uses: "0", is_active: true });
                setIsAddingCoupon(false);
                toast({ title: "Coupon créé", description: `Le coupon ${created.code} a été créé.` });
            } else {
                const err = await res.json();
                toast({ variant: "destructive", title: "Erreur", description: JSON.stringify(err) });
            }
        } catch { toast({ variant: "destructive", title: "Erreur réseau" }); }
    };

    const deleteCoupon = async (id: number) => {
        try {
            const res = await fetch(`/api/payment/coupons/${id}/`, { method: "DELETE", headers: getHeaders() });
            if (handleAuthError(res)) return;
            if (res.ok) {
                setCoupons(coupons.filter(c => c.id !== id));
                toast({ title: "Supprimé", description: "Coupon supprimé." });
            }
        } catch { toast({ variant: "destructive", title: "Erreur réseau" }); }
    };

    const toggleCoupon = async (coupon: Coupon) => {
        try {
            const res = await fetch(`/api/payment/coupons/${coupon.id}/`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({ is_active: !coupon.is_active })
            });
            if (handleAuthError(res)) return;
            if (res.ok) {
                const updated = await res.json();
                setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_active: updated.is_active } : c));
            }
        } catch { toast({ variant: "destructive", title: "Erreur réseau" }); }
    };

    const resolveComplaint = async (id: number) => {
        try {
            const res = await fetch(`/api/complaints/${id}/resolve/`, {
                method: "POST",
                headers: getHeaders()
            });
            if (handleAuthError(res)) return;
            if (res.ok) {
                const updated = await res.json();
                setComplaints(complaints.map(c => c.id === id ? updated : c));
                toast({ title: "Signalement résolu", description: "La réclamation a été marquée comme résolue." });
            }
        } catch { toast({ variant: "destructive", title: "Erreur réseau" }); }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 pb-16 px-4">
                <div className="container max-w-6xl mx-auto space-y-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                            <LayoutDashboard className="h-8 w-8 text-primary" /> Tableau de Bord Administrateur
                        </h1>
                        <p className="text-muted-foreground mt-2">Gérez la plateforme The Bequer au complet.</p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto md:h-12 bg-card border border-border">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5">
                                Vue d'ensemble
                            </TabsTrigger>
                            <TabsTrigger value="approvals" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5 relative">
                                Approbations
                                {stats && stats.pending_users > 0 && (
                                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="validations" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5 relative">
                                Validations
                                {(courses.filter(c => c.status === 'pending').length > 0 || courses.some(c => c.videos?.some(v => v.status === 'pending'))) && (
                                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="users" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5">
                                Utilisateurs
                            </TabsTrigger>
                            <TabsTrigger value="payments" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5 relative">
                                Paiements
                                {payments.filter(p => p.status === 'paid').length > 0 && (
                                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-green-500" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="courses" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5">
                                Formations
                            </TabsTrigger>
                            <TabsTrigger value="books" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5">
                                Livres
                            </TabsTrigger>
                            <TabsTrigger value="coupons" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5">
                                <Ticket className="h-3.5 w-3.5 mr-1" /> Coupons
                            </TabsTrigger>
                            <TabsTrigger value="complaints" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5 relative">
                                <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Réclamations
                                {complaints.filter(c => !c.is_resolved).length > 0 && (
                                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500" />
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-8 bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
                            {loading ? (
                                <div className="flex justify-center items-center h-64"><p className="text-muted-foreground">Chargement des données...</p></div>
                            ) : (
                                <>
                                    {/* TAB: OVERVIEW */}
                                    <TabsContent value="overview" className="mt-0">
                                        <h2 className="text-xl font-semibold mb-6">Statistiques Globales</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="p-6 border border-border rounded-xl bg-background/50 text-center hover:border-primary/50 transition-colors">
                                                <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                                                <p className="text-3xl font-bold">{stats?.total_users || 0}</p>
                                                <p className="text-sm text-muted-foreground">Membres Inscrits</p>
                                            </div>
                                            <div className="p-6 border border-border rounded-xl bg-background/50 text-center hover:border-orange-500/50 transition-colors">
                                                <Clock className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                                                <p className="text-3xl font-bold">{stats?.pending_users || 0}</p>
                                                <p className="text-sm text-muted-foreground">En attente d'accès</p>
                                            </div>
                                            <div className="p-6 border border-border rounded-xl bg-background/50 text-center hover:border-blue-500/50 transition-colors">
                                                <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                                                <p className="text-3xl font-bold">{stats?.total_courses || 0}</p>
                                                <p className="text-sm text-muted-foreground">Formations Actives</p>
                                            </div>
                                            <div className="p-6 border border-border rounded-xl bg-background/50 text-center hover:border-accent/50 transition-colors">
                                                <MessageSquare className="h-8 w-8 text-accent mx-auto mb-3" />
                                                <p className="text-3xl font-bold">{stats?.brand_requests || 0}</p>
                                                <p className="text-sm text-muted-foreground">Demandes de Marque</p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* TAB: APPROVALS */}
                                    <TabsContent value="approvals" className="mt-0">
                                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-orange-500" />
                                            Comptes en attente de vérification
                                        </h2>
                                        {pendingUsers.length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                                <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                                                <p className="text-lg font-medium">Aucun compte en attente</p>
                                                <p className="text-muted-foreground text-sm">Toutes les demandes ont été traitées.</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {pendingUsers.map(user => (
                                                    <div key={user.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border border-border rounded-xl bg-background/50">
                                                        <div className="space-y-1 mb-4 sm:mb-0 w-full sm:w-auto">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-lg">{user.username}</span>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${user.role === 'teacher' ? 'border-orange-500/30 text-orange-500 bg-orange-500/10' : 'border-blue-500/30 text-blue-500 bg-blue-500/10'}`}>
                                                                    {user.role === 'teacher' ? 'Formateur' : 'Étudiant'}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">{user.email} • Inscrit le {new Date(user.date_joined).toLocaleDateString()}</div>
                                                        </div>
                                                        <div className="flex gap-2 w-full sm:w-auto">
                                                            <Button variant="outline" size="sm" onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">Rejeter</Button>
                                                            <Button size="sm" onClick={() => approveUser(user.id)} className="gradient-primary text-white border-0 flex-1 sm:flex-none">Approuver l'accès</Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* TAB: VALIDATIONS */}
                                    <TabsContent value="validations" className="mt-0 space-y-8">
                                        <div>
                                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                                <BookOpen className="h-5 w-5 text-orange-500" />
                                                Formations en attente de validation
                                            </h2>
                                            {courses.filter(c => c.status === 'pending').length === 0 ? (
                                                <div className="text-center py-6 border-2 border-dashed border-border rounded-xl bg-background/50">
                                                    <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                                                    <p className="font-medium text-muted-foreground">Aucune formation en attente</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {courses.filter(c => c.status === 'pending').map(course => (
                                                        <div key={course.id} className="flex flex-col sm:flex-row items-center justify-between p-4 border border-border rounded-xl bg-background/50">
                                                            <div className="space-y-1 mb-4 sm:mb-0 w-full sm:w-auto">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-lg">{course.title}</span>
                                                                    <span className="text-xs px-2 py-0.5 rounded-full border border-orange-500/30 text-orange-500 bg-orange-500/10">
                                                                        En attente
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {course.teacher_details?.name || 'Formateur inconnu'} • Soumis le {course.submitted_at ? new Date(course.submitted_at).toLocaleDateString() : 'Récemment'}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 w-full sm:w-auto">
                                                                <Button variant="outline" size="sm" onClick={() => rejectCourse(course.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">Refuser</Button>
                                                                <Button size="sm" onClick={() => approveCourse(course.id)} className="gradient-primary text-white border-0 flex-1 sm:flex-none">Approuver</Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                                <Video className="h-5 w-5 text-orange-500" />
                                                Vidéos en attente de validation
                                            </h2>
                                            {courses.flatMap(c => (c.videos || []).filter((v: any) => v.status === 'pending').map((v: any) => ({ ...v, courseTitle: c.title, courseId: c.id }))).length === 0 ? (
                                                <div className="text-center py-6 border-2 border-dashed border-border rounded-xl bg-background/50">
                                                    <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                                                    <p className="font-medium text-muted-foreground">Aucune vidéo en attente</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {courses.flatMap(c => (c.videos || []).filter((v: any) => v.status === 'pending').map((v: any) => ({ ...v, courseTitle: c.title, courseId: c.id }))).map((video: any) => (
                                                        <div key={video.id} className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-xl bg-background/50">
                                                            <div className="shrink-0 w-full sm:w-48 aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                                                                <video src={`${video.stream_url.startsWith('http') ? video.stream_url : '' + video.stream_url}?token=${localStorage.getItem('access_token')}`} controls className="w-full h-full object-contain" />
                                                            </div>
                                                            <div className="flex flex-col justify-between flex-1 py-1">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-semibold text-base">{video.title}</span>
                                                                        <span className="text-xs px-2 py-0.5 rounded-full border border-orange-500/30 text-orange-500 bg-orange-500/10">À vérifier</span>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground line-clamp-2">{video.description || "Aucune description"}</p>
                                                                    <p className="text-xs text-muted-foreground mt-2">Formation : <strong>{video.courseTitle}</strong></p>
                                                                </div>
                                                                <div className="flex gap-2 justify-end mt-4 sm:mt-0">
                                                                    <Button variant="outline" size="sm" onClick={() => rejectVideo(video.id, video.courseId)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">Rejeter</Button>
                                                                    <Button size="sm" onClick={() => approveVideo(video.id, video.courseId)} className="gradient-primary text-white border-0">Approuver la vidéo</Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* TAB: USERS */}

                                    <TabsContent value="users" className="mt-0">
                                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" /> Membres Approuvés
                                        </h2>
                                        <div className="grid gap-3">
                                            {approvedUsers.map(user => (
                                                <div key={user.id} className="flex items-center justify-between p-3 border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                    <div className="w-1/3 font-medium">{user.username}</div>
                                                    <div className="w-1/3 text-sm text-muted-foreground">{user.email}</div>
                                                    <div className="w-1/6">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50">{user.role}</span>
                                                    </div>
                                                    <div className="w-1/6 text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => deleteUser(user.id)} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    {/* TAB: PAYMENTS */}
                                    <TabsContent value="payments" className="mt-0 space-y-6">
                                        {/* Summary cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="p-5 border border-border rounded-xl bg-background/50 text-center">
                                                <TrendingUp className="h-7 w-7 text-green-500 mx-auto mb-2" />
                                                <p className="text-2xl font-bold">{totalRevenue.toLocaleString('fr-DZ')} DZD</p>
                                                <p className="text-sm text-muted-foreground">Revenus confirmés</p>
                                            </div>
                                            <div className="p-5 border border-border rounded-xl bg-background/50 text-center">
                                                <CreditCard className="h-7 w-7 text-primary mx-auto mb-2" />
                                                <p className="text-2xl font-bold">{payments.filter(p => p.status === 'paid').length}</p>
                                                <p className="text-sm text-muted-foreground">Paiements réussis</p>
                                            </div>
                                            <div className="p-5 border border-border rounded-xl bg-background/50 text-center">
                                                <Clock className="h-7 w-7 text-orange-500 mx-auto mb-2" />
                                                <p className="text-2xl font-bold">{payments.filter(p => p.status === 'pending').length}</p>
                                                <p className="text-sm text-muted-foreground">En attente</p>
                                            </div>
                                        </div>

                                        {/* Payments table */}
                                        <div>
                                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                                <CreditCard className="h-5 w-5 text-primary" /> Historique des paiements
                                            </h2>
                                            {payments.length === 0 ? (
                                                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                                    <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                                                    <p className="text-lg font-medium">Aucun paiement encore</p>
                                                    <p className="text-muted-foreground text-sm">Les paiements Chargily apparaîtront ici automatiquement.</p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto rounded-xl border border-border">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-muted/50 text-muted-foreground">
                                                            <tr>
                                                                <th className="text-left px-4 py-3 font-medium">Utilisateur</th>
                                                                <th className="text-left px-4 py-3 font-medium">Article</th>
                                                                <th className="text-left px-4 py-3 font-medium">Montant</th>
                                                                <th className="text-left px-4 py-3 font-medium">Statut</th>
                                                                <th className="text-left px-4 py-3 font-medium">Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {payments.map(p => (
                                                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                                                    <td className="px-4 py-3 font-medium">{p.user_username || `User #${p.user}`}</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`text-xs px-2 py-0.5 rounded-full border mr-1 ${p.item_type === 'course'
                                                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                                            : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                                                            }`}>
                                                                            {p.item_type === 'course' ? 'Formation' : 'Livre'}
                                                                        </span>
                                                                        #{p.item_id}
                                                                    </td>
                                                                    <td className="px-4 py-3 font-semibold">{parseFloat(p.amount).toLocaleString('fr-DZ')} DZD</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${p.status === 'paid' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                                            p.status === 'pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                                                p.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                                    'bg-muted text-muted-foreground border-border'
                                                                            }`}>
                                                                            {p.status === 'paid' ? '✓ Payé' :
                                                                                p.status === 'pending' ? '⏳ En attente' :
                                                                                    p.status === 'failed' ? '✗ Échoué' :
                                                                                        p.status === 'canceled' ? 'Annulé' : 'Expiré'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* TAB: COURSES AND CATEGORIES */}
                                    <TabsContent value="courses" className="mt-0 space-y-10">

                                        {/* Courses Sub-section */}
                                        <section>
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                                    <BookOpen className="h-5 w-5 text-primary" /> Formations
                                                </h2>
                                                <Button size="sm" onClick={() => setIsAddingCourse(!isAddingCourse)} className="gradient-primary text-white border-0 gap-2">
                                                    {isAddingCourse ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                    {isAddingCourse ? "Annuler" : "Ajouter une formation"}
                                                </Button>
                                            </div>
                                            {isAddingCourse && (
                                                <div className="grid gap-3 mb-6 p-4 border border-border rounded-lg bg-card max-w-lg">
                                                    <Input autoFocus placeholder="Titre de la formation" value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} />
                                                    <Input placeholder="Prix en DZD (ex: 15000.00)" type="number" value={newCourse.price} onChange={e => setNewCourse({ ...newCourse, price: e.target.value })} />
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={newCourse.category}
                                                        onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                                                    >
                                                        <option value="">Sélectionnez une catégorie (optionnel)</option>
                                                        {renderCategoryOptions(categories)}
                                                    </select>
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={newCourse.teacher}
                                                        onChange={e => setNewCourse({ ...newCourse, teacher: e.target.value })}
                                                    >
                                                        <option value="">— Formateur (optionnel) —</option>
                                                        {teachers.map(t => (
                                                            <option key={t.user_id} value={t.user_id}>
                                                                {[t.first_name, t.last_name].filter(Boolean).join(" ") || t.username}
                                                                {t.speciality ? ` — ${t.speciality}` : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground ml-1">Image de couverture</span>
                                                        <Input type="file" accept="image/*" onChange={e => setCourseCoverFile(e.target.files?.[0] || null)} />
                                                    </div>
                                                    <Button size="sm" onClick={handleAddCourse} disabled={!newCourse.title || !newCourse.price} className="w-full">Sauvegarder la formation</Button>
                                                </div>
                                            )}
                                            {courses.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8">Aucune formation disponible.</p>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {courses.map(course => (
                                                        <div key={course.id} className="border border-border rounded-lg bg-background/50 overflow-hidden transition-all">
                                                            <div
                                                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                                                onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-lg flex items-center gap-2">
                                                                        {course.title}
                                                                        <span className="text-xs font-normal px-2 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/20">
                                                                            {course.videos?.length || 0} vidéo(s)
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground mt-1">
                                                                        Catégorie: {course.category_details ? course.category_details.name : 'Non définie'}
                                                                        {course.teacher_details && (
                                                                            <span className="ml-3">• Formateur: <span className="text-primary font-medium">{course.teacher_details.name}</span></span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex flex-col items-end">
                                                                        {(course.discount_percent > 0 || (course.admin_discount_percent && course.admin_discount_percent > 0)) ? (
                                                                            <>
                                                                                <div className="text-accent font-semibold whitespace-nowrap">{course.discounted_price || course.price_dzd} DZD</div>
                                                                                <div className="text-xs text-muted-foreground line-through">{course.price_dzd} DZD</div>
                                                                                <div className="flex gap-1 mt-1">
                                                                                    {course.discount_percent > 0 && <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20">Exp: -{course.discount_percent}%</span>}
                                                                                    {course.admin_discount_percent && course.admin_discount_percent > 0 ? <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded border border-red-500/20">Adm: -{course.admin_discount_percent}%</span> : null}
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <div className="text-accent font-semibold whitespace-nowrap">{course.price_dzd} DZD</div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <Button variant="ghost" size="sm" onClick={(e) => handleEditClick(e, course)} className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="sm">
                                                                            {expandedCourseId === course.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* EXPANDED CONTENT: EDIT COURSE FORM */}
                                                            {editingCourseId === course.id && (
                                                                <div className="p-4 border-t border-border bg-card/50">
                                                                    <h4 className="font-semibold text-sm mb-4">Modifier la formation</h4>
                                                                    <div className="grid gap-3 max-w-lg">
                                                                        <Input autoFocus placeholder="Titre de la formation" value={editCourseData.title} onChange={e => setEditCourseData({ ...editCourseData, title: e.target.value })} />
                                                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                                                            <Input placeholder="Prix en DZD" type="number" value={editCourseData.price} onChange={e => setEditCourseData({ ...editCourseData, price: e.target.value })} />
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                                                            <div className="space-y-1">
                                                                                <span className="text-xs text-muted-foreground ml-1">Réduction Expert (%)</span>
                                                                                <Input placeholder="0" type="number" min="0" max="100" value={editCourseData.discount} onChange={e => setEditCourseData({ ...editCourseData, discount: e.target.value })} />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <span className="text-xs text-muted-foreground ml-1">Réduction Admin (%)</span>
                                                                                <Input placeholder="0" type="number" min="0" max="100" value={editCourseData.admin_discount} onChange={e => setEditCourseData({ ...editCourseData, admin_discount: e.target.value })} />
                                                                            </div>
                                                                        </div>
                                                                        <select
                                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                                                            value={editCourseData.category}
                                                                            onChange={e => setEditCourseData({ ...editCourseData, category: e.target.value })}
                                                                        >
                                                                            <option value="">Sélectionnez une catégorie (optionnel)</option>
                                                                            {renderCategoryOptions(categories)}
                                                                        </select>
                                                                        <div className="space-y-1">
                                                                            <label className="text-xs text-muted-foreground ml-1 font-medium">Formateur assigné</label>
                                                                            <select
                                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                                                value={editCourseData.teacher}
                                                                                onChange={e => setEditCourseData({ ...editCourseData, teacher: e.target.value })}
                                                                            >
                                                                                <option value="">— Aucun formateur —</option>
                                                                                {teachers.map(t => (
                                                                                    <option key={t.user_id} value={t.user_id}>
                                                                                        {[t.first_name, t.last_name].filter(Boolean).join(" ") || t.username}
                                                                                        {t.speciality ? ` — ${t.speciality}` : ""}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <span className="text-xs text-muted-foreground ml-1">Nouvelle image de couverture (laisser vide pour conserver l'actuelle)</span>
                                                                            <Input type="file" accept="image/*" onChange={e => setEditCourseCoverFile(e.target.files?.[0] || null)} />
                                                                        </div>
                                                                        <div className="flex gap-2 justify-end mt-2">
                                                                            <Button size="sm" variant="outline" onClick={() => setEditingCourseId(null)}>Annuler</Button>
                                                                            <Button size="sm" onClick={handleUpdateCourse} disabled={!editCourseData.title || !editCourseData.price}>Enregistrer les modifications</Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* EXPANDED CONTENT: VIDEOS DASHBOARD */}
                                                            {expandedCourseId === course.id && editingCourseId !== course.id && (
                                                                <div className="p-4 border-t border-border bg-card/30">
                                                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                                                                        <Video className="w-4 h-4" /> Contenu de la formation
                                                                    </h4>

                                                                    <div className="space-y-2 mb-6">
                                                                        {course.videos && course.videos.length > 0 ? [...course.videos].sort((a, b) => a.order - b.order).map(video => (
                                                                            <div
                                                                                key={video.id}
                                                                                draggable
                                                                                onDragStart={() => setDraggedVideoId(video.id)}
                                                                                onDragOver={(e) => e.preventDefault()}
                                                                                onDrop={(e) => handleVideoDrop(e, video.id, course.id)}
                                                                                className={`flex justify-between items-center bg-background rounded-lg p-3 border border-border shadow-sm cursor-grab active:cursor-grabbing transition-transform ${draggedVideoId === video.id ? 'opacity-50 scale-[0.98]' : 'hover:border-primary/50'}`}
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                                                        {video.order}
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <span className="text-sm font-medium block">{video.title}</span>
                                                                                        <div className="flex items-center gap-2 mt-0.5 mb-2 flex-wrap">
                                                                                            <span className="text-xs text-accent bg-accent/10 px-1.5 rounded">{formatDuration(video.duration_seconds)}</span>
                                                                                            {video.status && (
                                                                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${video.status === 'approved' ? 'bg-green-500/10 text-green-600 border-green-500/20' : video.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}`}>{video.status === 'approved' ? 'Approuvée' : video.status === 'rejected' ? 'Refusée' : 'En attente'}</span>
                                                                                            )}
                                                                                            {video.is_free_preview && (
                                                                                                <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-500 border-orange-500/20">⭐ Aperçu gratuit</span>
                                                                                            )}
                                                                                            {video.description && <p className="text-xs text-muted-foreground line-clamp-1">{video.description}</p>}
                                                                                        </div>
                                                                                        <div className="flex gap-2 mb-3 flex-wrap">
                                                                                            {video.status !== 'approved' && <Button size="sm" variant="outline" className="text-green-600 border-green-500/30 hover:bg-green-500/10 px-2 py-1 h-auto text-xs" onClick={() => approveVideo(video.id, course.id)}>Approuver</Button>}
                                                                                            {video.status !== 'rejected' && <Button size="sm" variant="outline" className="text-red-500 border-red-500/30 hover:bg-red-500/10 px-2 py-1 h-auto text-xs" onClick={() => rejectVideo(video.id, course.id)}>Refuser</Button>}
                                                                                            {video.is_free_preview ? (
                                                                                                <Button size="sm" variant="outline" className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10 px-2 py-1 h-auto text-xs" onClick={() => setPreviewVideo(video.id, course.id, false)}>⭐ Aperçu actif — retirer</Button>
                                                                                            ) : (
                                                                                                <Button size="sm" variant="outline" className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10 px-2 py-1 h-auto text-xs" onClick={() => setPreviewVideo(video.id, course.id, true)}>Définir comme aperçu</Button>
                                                                                            )}
                                                                                        </div>
                                                                                        <video
                                                                                            className="w-full max-w-sm rounded-md border border-border bg-black"
                                                                                            controls
                                                                                            controlsList="nodownload"
                                                                                            src={`${video.stream_url}?token=${localStorage.getItem('access_token')}`}
                                                                                            preload="metadata"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                                <Button variant="ghost" size="icon" onClick={() => deleteVideo(video.id, course.id)}>
                                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                                </Button>
                                                                            </div>
                                                                        )) : (
                                                                            <p className="text-sm text-muted-foreground italic bg-background p-3 rounded-lg border border-border">Aucune vidéo n'a été ajoutée à cette formation pour le moment.</p>
                                                                        )}
                                                                    </div>

                                                                    <div className="p-5 border border-dashed border-border rounded-xl bg-background/50">
                                                                        <h5 className="font-medium text-sm mb-4">Ajouter un nouveau module vidéo</h5>
                                                                        <div className="grid gap-3">
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                <Input placeholder="Titre de la vidéo" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} />
                                                                                <Input placeholder="Description (optionnelle)" value={newVideo.description} onChange={e => setNewVideo({ ...newVideo, description: e.target.value })} />
                                                                            </div>
                                                                            <div className="flex gap-3">
                                                                                <div className="w-24 shrink-0">
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
                                                                                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Upload en cours... Cela peut prendre plusieurs minutes selon la taille du fichier.</span>
                                                                                ) : (
                                                                                    <span className="flex items-center gap-2"><Video className="w-4 h-4" /> Téléverser et enregistrer la vidéo</span>
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                        {/* Categories Sub-section */}
                                        <section className="pt-6 border-t border-border">
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                                    <Tags className="h-5 w-5 text-orange-500" /> Catégories
                                                </h2>
                                                <Button size="sm" variant="outline" onClick={() => setIsAddingCategory(!isAddingCategory)} className="gap-2">
                                                    {isAddingCategory ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                    {isAddingCategory ? "Annuler" : "Ajouter une catégorie"}
                                                </Button>
                                            </div>
                                            {isAddingCategory && (
                                                <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 p-4 border border-border rounded-lg bg-card">
                                                    <Input autoFocus placeholder="Nom de la catégorie" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full sm:max-w-xs" />
                                                    <select
                                                        className="flex h-10 w-full sm:max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={newCategoryParentId}
                                                        onChange={e => setNewCategoryParentId(e.target.value)}
                                                    >
                                                        <option value="">Catégorie Principale (Aucun parent)</option>
                                                        {renderCategoryOptions(categories)}
                                                    </select>
                                                    <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName} className="w-full sm:w-auto">Sauvegarder</Button>
                                                </div>
                                            )}
                                            {categories.length === 0 ? (
                                                <p className="text-muted-foreground text-sm italic">Aucune catégorie disponible. Veuillez en ajouter une.</p>
                                            ) : (
                                                <div className="flex flex-col gap-4 w-full">
                                                    {categories.map(cat => (
                                                        <AdminCategoryItem key={cat.id} cat={cat} deleteCategory={deleteCategory} />
                                                    ))}
                                                </div>
                                            )}
                                        </section>

                                    </TabsContent>

                                    {/* TAB: BOOKS */}
                                    <TabsContent value="books" className="mt-0">
                                        <section>
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                                    <BookOpen className="h-5 w-5 text-primary" /> Livres
                                                </h2>
                                                <Button size="sm" onClick={() => setIsAddingBook(!isAddingBook)} className="gradient-primary text-white border-0 gap-2">
                                                    {isAddingBook ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                    {isAddingBook ? "Annuler" : "Ajouter un livre"}
                                                </Button>
                                            </div>

                                            {isAddingBook && (
                                                <div className="grid gap-3 mb-6 p-4 border border-border rounded-lg bg-card max-w-lg">
                                                    <Input autoFocus placeholder="Titre du livre" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} />
                                                    <Input placeholder="Auteur (optionnel)" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} />
                                                    <Input placeholder="Prix en DZD (ex: 2500.00)" type="number" value={newBook.price} onChange={e => setNewBook({ ...newBook, price: e.target.value })} />
                                                    <Input placeholder="Description (optionnelle)" value={newBook.description} onChange={e => setNewBook({ ...newBook, description: e.target.value })} />
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                        value={newBook.category}
                                                        onChange={e => setNewBook({ ...newBook, category: e.target.value })}
                                                    >
                                                        <option value="">Sélectionnez une catégorie (optionnel)</option>
                                                        {renderCategoryOptions(categories)}
                                                    </select>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground ml-1">Image de couverture</span>
                                                        <Input type="file" accept="image/*" onChange={e => setBookCoverFile(e.target.files?.[0] || null)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground ml-1">Fichier PDF (optionnel)</span>
                                                        <Input type="file" accept="application/pdf" onChange={e => setBookPdfFile(e.target.files?.[0] || null)} />
                                                    </div>
                                                    <Button size="sm" onClick={handleAddBook} disabled={!newBook.title || !newBook.price} className="w-full">Sauvegarder le livre</Button>
                                                </div>
                                            )}

                                            {books.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8">Aucun livre disponible.</p>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {books.map(book => (
                                                        <div key={book.id} className="border border-border rounded-lg bg-background/50 overflow-hidden">
                                                            <div className="flex items-center justify-between p-4">
                                                                <div className="flex items-center gap-4 flex-1">
                                                                    {book.cover_image && (
                                                                        <img
                                                                            src={book.cover_image.startsWith('http') ? book.cover_image : `${book.cover_image}`}
                                                                            alt={book.title}
                                                                            className="h-14 w-10 object-cover rounded border border-border shrink-0"
                                                                        />
                                                                    )}
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-lg">{book.title}</div>
                                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                                            {book.author && <span className="mr-3">Par {book.author}</span>}
                                                                            Catégorie: {book.category_details?.name || 'Non définie'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex flex-col items-end">
                                                                        {(book.discount_percent > 0 || (book.admin_discount_percent && book.admin_discount_percent > 0)) ? (
                                                                            <>
                                                                                <div className="text-accent font-semibold whitespace-nowrap">{book.discounted_price || book.price_dzd} DZD</div>
                                                                                <div className="text-xs text-muted-foreground line-through">{book.price_dzd} DZD</div>
                                                                                <div className="flex gap-1 mt-1">
                                                                                    {book.discount_percent > 0 && <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20">Exp: -{book.discount_percent}%</span>}
                                                                                    {book.admin_discount_percent && book.admin_discount_percent > 0 ? <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded border border-red-500/20">Adm: -{book.admin_discount_percent}%</span> : null}
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <div className="text-accent font-semibold whitespace-nowrap">{book.price_dzd} DZD</div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button variant="ghost" size="sm" onClick={() => { setEditingBookId(book.id); setEditBookData({ title: book.title, price: book.price_dzd, category: book.category ? book.category.toString() : "", author: book.author, description: book.description, discount: (book.discount_percent || 0).toString(), admin_discount: (book.admin_discount_percent || 0).toString() }); setEditBookCoverFile(null); setEditBookPdfFile(null); }} className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="sm" onClick={() => deleteBook(book.id)} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {editingBookId === book.id && (
                                                                <div className="p-4 border-t border-border bg-card/50">
                                                                    <h4 className="font-semibold text-sm mb-4">Modifier le livre</h4>
                                                                    <div className="grid gap-3 max-w-lg">
                                                                        <Input autoFocus placeholder="Titre" value={editBookData.title} onChange={e => setEditBookData({ ...editBookData, title: e.target.value })} />
                                                                        <Input placeholder="Auteur" value={editBookData.author} onChange={e => setEditBookData({ ...editBookData, author: e.target.value })} />
                                                                        <Input placeholder="Prix en DZD" type="number" value={editBookData.price} onChange={e => setEditBookData({ ...editBookData, price: e.target.value })} />
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <div className="space-y-1">
                                                                                <span className="text-xs text-muted-foreground ml-1">Réduction Expert (%)</span>
                                                                                <Input placeholder="0" type="number" min="0" max="100" value={editBookData.discount} onChange={e => setEditBookData({ ...editBookData, discount: e.target.value })} />
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <span className="text-xs text-muted-foreground ml-1">Réduction Admin (%)</span>
                                                                                <Input placeholder="0" type="number" min="0" max="100" value={editBookData.admin_discount} onChange={e => setEditBookData({ ...editBookData, admin_discount: e.target.value })} />
                                                                            </div>
                                                                        </div>
                                                                        <Input placeholder="Description" value={editBookData.description} onChange={e => setEditBookData({ ...editBookData, description: e.target.value })} />
                                                                        <select
                                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                                                            value={editBookData.category}
                                                                            onChange={e => setEditBookData({ ...editBookData, category: e.target.value })}
                                                                        >
                                                                            <option value="">Sélectionnez une catégorie (optionnel)</option>
                                                                            {renderCategoryOptions(categories)}
                                                                        </select>
                                                                        <div className="space-y-1">
                                                                            <span className="text-xs text-muted-foreground ml-1">Nouvelle image de couverture (laisser vide pour conserver)</span>
                                                                            <Input type="file" accept="image/*" onChange={e => setEditBookCoverFile(e.target.files?.[0] || null)} />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <span className="text-xs text-muted-foreground ml-1">Nouveau fichier PDF (laisser vide pour conserver)</span>
                                                                            <Input type="file" accept="application/pdf" onChange={e => setEditBookPdfFile(e.target.files?.[0] || null)} />
                                                                        </div>
                                                                        <div className="flex gap-2 justify-end mt-2">
                                                                            <Button size="sm" variant="outline" onClick={() => setEditingBookId(null)}>Annuler</Button>
                                                                            <Button size="sm" onClick={handleUpdateBook} disabled={!editBookData.title || !editBookData.price}>Enregistrer</Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    </TabsContent>

                                    {/* TAB: COUPONS */}
                                    <TabsContent value="coupons" className="mt-0 space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                                <Ticket className="h-5 w-5 text-primary" /> Gestion des Coupons
                                            </h2>
                                            <Button size="sm" onClick={() => setIsAddingCoupon(!isAddingCoupon)} className="gradient-primary text-white border-0 gap-2">
                                                {isAddingCoupon ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                {isAddingCoupon ? "Annuler" : "Nouveau coupon"}
                                            </Button>
                                        </div>

                                        {isAddingCoupon && (
                                            <div className="grid gap-3 p-4 border border-border rounded-xl bg-card max-w-lg">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input autoFocus placeholder="Code promo (ex: SUMMER20)" value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} className="font-mono uppercase" />
                                                    <Input placeholder="Réduction (%)" type="number" min="1" max="100" value={newCoupon.discount_percent} onChange={e => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })} />
                                                </div>
                                                <Input placeholder="Description (optionnelle)" value={newCoupon.description} onChange={e => setNewCoupon({ ...newCoupon, description: e.target.value })} />
                                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newCoupon.scope} onChange={e => setNewCoupon({ ...newCoupon, scope: e.target.value })}>
                                                    <option value="all">Applicable à tout</option>
                                                    <option value="course">Formations uniquement</option>
                                                    <option value="book">Livres uniquement</option>
                                                </select>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground">Valide à partir du</span>
                                                        <Input type="datetime-local" value={newCoupon.valid_from} onChange={e => setNewCoupon({ ...newCoupon, valid_from: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground">Valide jusqu'au</span>
                                                        <Input type="datetime-local" value={newCoupon.valid_until} onChange={e => setNewCoupon({ ...newCoupon, valid_until: e.target.value })} />
                                                    </div>
                                                </div>
                                                <Input placeholder="Utilisations max (0 = illimité)" type="number" min="0" value={newCoupon.max_uses} onChange={e => setNewCoupon({ ...newCoupon, max_uses: e.target.value })} />
                                                <Button size="sm" onClick={handleAddCoupon} disabled={!newCoupon.code || !newCoupon.discount_percent || !newCoupon.valid_from || !newCoupon.valid_until} className="w-full gradient-primary text-white border-0">
                                                    Créer le coupon
                                                </Button>
                                            </div>
                                        )}

                                        {coupons.length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                                <Ticket className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                                <p className="text-lg font-medium">Aucun coupon créé</p>
                                                <p className="text-muted-foreground text-sm">Créez votre premier coupon promo ci-dessus.</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-3">
                                                {coupons.map(coupon => (
                                                    <div key={coupon.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${!coupon.is_active || coupon.is_expired ? 'border-border bg-muted/30 opacity-60' : 'border-border bg-background/50'
                                                        }`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg ${!coupon.is_active || coupon.is_expired ? 'bg-muted text-muted-foreground' : 'bg-red-500/10 text-red-600'
                                                                }`}>
                                                                <Flame className="h-4 w-4" /> -{coupon.discount_percent}%
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-bold text-sm tracking-widest">{coupon.code}</span>
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${coupon.is_expired ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                        coupon.is_active ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                                            'bg-muted text-muted-foreground border-border'
                                                                        }`}>{coupon.is_expired ? 'Expiré' : coupon.is_active ? 'Actif' : 'Inactif'}</span>
                                                                    <span className="text-xs border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                                                                        {coupon.scope === 'all' ? 'Tout' : coupon.scope === 'course' ? 'Formations' : 'Livres'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {coupon.description && <span>{coupon.description} • </span>}
                                                                    Utilisé {coupon.used_count}× {coupon.max_uses > 0 ? `/ ${coupon.max_uses}` : '(illimité)'} •
                                                                    Expire: {new Date(coupon.valid_until).toLocaleDateString('fr-FR')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 shrink-0">
                                                            <Button variant="outline" size="sm" onClick={() => toggleCoupon(coupon)}>
                                                                {coupon.is_active ? 'Désactiver' : 'Activer'}
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => deleteCoupon(coupon.id)} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* TAB: BRAND REQUESTS */}
                                    <TabsContent value="brand" className="mt-0">
                                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5 text-accent" /> Dossiers "Créer ta Marque"
                                        </h2>
                                        {brandRequests.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">Aucune demande pour le moment.</p>
                                        ) : (
                                            <div className="grid gap-4">
                                                {brandRequests.map((req) => (
                                                    <div key={req.id} className="p-5 border border-border rounded-xl bg-background/50 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h3 className="font-bold text-lg">{req.brand_name || "Marque sans nom"}</h3>
                                                                <p className="text-sm text-muted-foreground">{req.full_name} • {req.email} • {req.phone}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-md mb-1">{req.product_category}</span>
                                                                <p className="text-xs font-semibold">{req.budget.replace('_', ' ')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-card rounded-lg border border-border text-sm">
                                                            <p className="text-muted-foreground italic">"{req.description}"</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* TAB: COMPLAINTS */}
                                    <TabsContent value="complaints" className="mt-0 space-y-6">
                                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-red-500" /> Réclamations Étudiants
                                        </h2>
                                        {complaints.length === 0 ? (
                                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                                <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                                <p className="text-lg font-medium">Aucune réclamation</p>
                                                <p className="text-muted-foreground text-sm">Tout se passe bien.</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {complaints.map((complaint) => (
                                                    <div key={complaint.id} className={`p-5 border rounded-xl space-y-3 transition-colors ${complaint.is_resolved ? 'bg-muted/30 border-border opacity-70' : 'bg-background/50 border-red-500/30'}`}>
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="flex gap-2 items-center">
                                                                    <strong className="text-lg font-semibold">{complaint.student_details?.name}</strong>
                                                                    <span className="text-muted-foreground text-sm">contre</span>
                                                                    <strong className="text-primary font-medium">{complaint.teacher_details?.name}</strong>
                                                                    {complaint.is_resolved && <span className="text-xs px-2 py-0.5 rounded-full border border-green-500/20 bg-green-500/10 text-green-600 ml-2">Résolue</span>}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-1">Soumise le {new Date(complaint.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            {!complaint.is_resolved && (
                                                                <Button size="sm" variant="outline" onClick={() => resolveComplaint(complaint.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                                                    <CheckCircle className="w-4 h-4 mr-1.5" /> Marquer comme résolue
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="p-3 bg-card rounded-lg border border-border text-sm">
                                                            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{complaint.reason}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>

                                </>
                            )}
                        </div>
                    </Tabs>

                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AdminDashboard;
