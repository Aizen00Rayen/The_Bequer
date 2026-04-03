import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/new_logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("user_role");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    navigate("/");
  };

  const links = [
    { label: "Accueil", href: "/" },
    { label: "Formations", href: "/courses" },
    { label: "Livres", href: "/books" },
    { label: "Créer ta Marque", href: "/brand" },
    { label: "À propos", href: "/about" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="The Bequer" className="h-10 w-10 rounded-lg object-cover" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            <span className="font-light">The</span> Bequer
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {token ? (
            <>
              {role === "admin" && (
                <Link to="/admin-dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard size={16} />
                    Dashboard Admin
                  </Button>
                </Link>
              )}
              {role === "teacher" && (
                <Link to="/teacher-dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard size={16} />
                    Espace Formateur
                  </Button>
                </Link>
              )}
              {role === "student" && (
                <Link to="/student-dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard size={16} />
                    Tableau de Bord Étudiant
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
                <LogOut size={16} />
                Se déconnecter
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="gradient-primary text-primary-foreground border-0">
                  Commencer
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-card border-b border-border px-6 pb-6 pt-2 space-y-4">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="block text-sm font-medium text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            {token ? (
              <>
                {role === "admin" && (
                  <Link to="/admin-dashboard" className="w-full" onClick={() => setOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <LayoutDashboard size={16} /> Dashboard Admin
                    </Button>
                  </Link>
                )}
                {role === "teacher" && (
                  <Link to="/teacher-dashboard" className="w-full" onClick={() => setOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <LayoutDashboard size={16} /> Espace Formateur
                    </Button>
                  </Link>
                )}
                {role === "student" && (
                  <Link to="/student-dashboard" className="w-full" onClick={() => setOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <LayoutDashboard size={16} /> Tableau de Bord Étudiant
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => { handleLogout(); setOpen(false); }}>
                  <LogOut size={16} /> Se déconnecter
                </Button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">Connexion</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full gradient-primary text-primary-foreground border-0">Commencer</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
