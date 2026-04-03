import { Link } from "react-router-dom";
import logo from "@/assets/new_logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-16">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="The Bequer" className="h-10 w-10 rounded-lg object-cover" />
              <span className="text-xl font-bold">
                <span className="font-light">The</span> Bequer
              </span>
            </Link>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              L'académie de formulation cosmétique qui transforme ta passion en marque de beauté.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Formations</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li><Link to="/courses" className="hover:text-primary-foreground transition-colors">Soins Visage</Link></li>
              <li><Link to="/courses" className="hover:text-primary-foreground transition-colors">Cosmétique Capillaire</Link></li>
              <li><Link to="/courses" className="hover:text-primary-foreground transition-colors">Lancer sa Marque</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li><Link to="/brand" className="hover:text-primary-foreground transition-colors">Brand Builder</Link></li>
              <li><Link to="/brand" className="hover:text-primary-foreground transition-colors">Consultation</Link></li>
              <li><Link to="/brand" className="hover:text-primary-foreground transition-colors">Accompagnement</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li>
                <a href="mailto:contact@thebequer.tech" className="hover:text-primary-foreground transition-colors">
                  contact@thebequer.tech
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/the_bequer?igsh=MXNkMHg3OWczanI2Mg=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground transition-colors"
                >
                  Instagram: @the_bequer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 text-center text-sm text-primary-foreground/40">
          © {new Date().getFullYear()} The Bequer. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
