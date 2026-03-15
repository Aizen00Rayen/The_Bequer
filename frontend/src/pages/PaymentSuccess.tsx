import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, BookOpen, ArrowRight, Loader2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API = "/api";

const PaymentSuccess = () => {
    const { tag } = useParams<{ tag?: string }>();
    const navigate = useNavigate();
    const token = localStorage.getItem("access_token");

    const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
    const [attempts, setAttempts] = useState(0);
    const MAX_ATTEMPTS = 5;

    useEffect(() => {
        if (!tag) {
            // No tag → just show success (legacy or direct navigation)
            setStatus("paid");
            return;
        }
        if (!token) {
            navigate("/login");
            return;
        }
        verifyPayment();
    }, [tag]);

    const verifyPayment = async () => {
        if (!tag || !token) return;
        setStatus("loading");
        try {
            const res = await fetch(`${API}/payment/verify/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ redirection_tag: tag }),
            });
            const data = await res.json();
            if (res.ok && data.paid) {
                setStatus("paid");
            } else if (res.ok && !data.paid) {
                const nextAttempt = attempts + 1;
                setAttempts(nextAttempt);
                if (nextAttempt < MAX_ATTEMPTS) {
                    // Retry after 3 seconds (Paypart may take a moment)
                    setTimeout(() => verifyPayment(), 3000);
                    setStatus("pending");
                } else {
                    setStatus("pending");
                }
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-14 w-14 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-lg font-semibold">Vérification du paiement...</p>
                        <p className="text-sm text-muted-foreground mt-1">Confirmation avec Paypart en cours.</p>
                    </div>
                </main>
            </div>
        );
    }

    if (status === "pending") {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4 py-20">
                    <div className="max-w-md w-full text-center">
                        <div className="relative inline-flex items-center justify-center mb-8">
                            <div className="absolute w-32 h-32 rounded-full bg-yellow-500/10 animate-pulse" />
                            <div className="relative w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <RefreshCw className="h-12 w-12 text-yellow-500 animate-spin" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold mb-3">Paiement en cours...</h1>
                        <p className="text-muted-foreground mb-2">
                            Votre paiement est en cours de traitement par Paypart.
                        </p>
                        <p className="text-sm text-muted-foreground mb-8">
                            Si vous avez complété le paiement, cliquez sur "Vérifier à nouveau".
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button className="gradient-primary text-white border-0 gap-2" onClick={verifyPayment}>
                                <RefreshCw className="h-4 w-4" /> Vérifier à nouveau
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/student-dashboard")} className="gap-2">
                                Aller à mon espace <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4 py-20">
                    <div className="max-w-md w-full text-center">
                        <div className="relative inline-flex items-center justify-center mb-8">
                            <div className="relative w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
                                <XCircle className="h-12 w-12 text-red-500" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold mb-3">Erreur de vérification</h1>
                        <p className="text-muted-foreground mb-8">
                            Impossible de vérifier votre paiement. Si vous avez payé, contactez le support.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button className="gradient-primary text-white border-0 gap-2" onClick={verifyPayment}>
                                <RefreshCw className="h-4 w-4" /> Réessayer
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
                                Retour à l'accueil <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Paid!
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="max-w-md w-full text-center">
                    <div className="relative inline-flex items-center justify-center mb-8">
                        <div className="absolute w-32 h-32 rounded-full bg-green-500/10 animate-ping" />
                        <div className="relative w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-3">Paiement réussi !</h1>
                    <p className="text-muted-foreground text-lg mb-2">
                        Votre achat a été confirmé avec succès.
                    </p>
                    <p className="text-muted-foreground mb-10">
                        L'accès a été activé instantanément dans votre espace étudiant.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            className="gradient-primary text-white border-0 gap-2"
                            onClick={() => navigate("/student-dashboard")}
                        >
                            <BookOpen className="h-4 w-4" /> Aller à mon espace
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
                            Retour à l'accueil <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PaymentSuccess;
