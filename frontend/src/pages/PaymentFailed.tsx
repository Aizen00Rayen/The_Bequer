import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PaymentFailed = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="max-w-md w-full text-center">
                    {/* Icon */}
                    <div className="relative inline-flex items-center justify-center mb-8">
                        <div className="relative w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
                            <XCircle className="h-12 w-12 text-red-500" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-3">Paiement non abouti</h1>
                    <p className="text-muted-foreground text-lg mb-2">
                        Votre paiement n'a pas pu être traité.
                    </p>
                    <p className="text-muted-foreground mb-10">
                        Aucun montant n'a été débité. Vous pouvez réessayer depuis la page des formations ou des livres.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            className="gradient-primary text-white border-0 gap-2"
                            onClick={() => navigate("/courses")}
                        >
                            <RotateCcw className="h-4 w-4" /> Réessayer – Formations
                        </Button>
                        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
                            <ArrowLeft className="h-4 w-4" /> Retour
                        </Button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PaymentFailed;
