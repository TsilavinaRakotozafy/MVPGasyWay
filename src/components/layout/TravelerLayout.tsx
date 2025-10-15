import React, { useState } from "react";
import { useBrandSettings } from "../../hooks/useBrandSettings";
import { Button } from "../ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Home,
  MapPin,
  Compass,
  Info,
  BookOpen,
  Users,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  LogIn,
  Star,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContextSQL";
import { MenuItem } from "../common/MenuItem";
import { CookieSettingsLink } from "../common/CookieSettingsLink";

interface TravelerLayoutProps {
  children: React.ReactNode;
  currentPage:
    | "home"
    | "destinations"
    | "catalog"
    | "favorites"
    | "bookings"
    | "reviews"
    | "profile"
    | "notifications"
    | "messages"
    | "pack-detail"
    | "pack-gallery";
  onPageChange: (page: string) => void;
  showLoginButton?: boolean;
  onLoginClick?: () => void;
}

export function TravelerLayout({
  children,
  currentPage,
  onPageChange,
  showLoginButton,
  onLoginClick,
}: TravelerLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings: brandSettings } = useBrandSettings();

  // ✅ Scroll automatique vers le haut lors des changements de page
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const navigation = [
    {
      key: "destinations",
      label: "Destinations",
      icon: MapPin,
      path: "/destinations/",
    },
    {
      key: "experiences",
      label: "Expériences",
      icon: Compass,
      path: "/experiences/",
    },
    {
      key: "about",
      label: "À propos",
      icon: Info,
      path: "/about/",
    },
    {
      key: "blog",
      label: "Blog",
      icon: BookOpen,
      path: "/blog/",
    },
    {
      key: "partners",
      label: "Partenaires",
      icon: Users,
      path: "/partners/",
    },
    {
      key: "contact",
      label: "Contact",
      icon: MessageCircle,
      path: "/contact/",
    },
  ];

  function getInitials() {
    if (!user) return "U";
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (first + last).toUpperCase();
  }

  const handleNavigation = (key: string) => {
    // ✅ Navigation spécifique selon le menu cliqué
    switch (key) {
      case "destinations":
        onPageChange("destinations");
        break;
      case "experiences":
        onPageChange("catalog");
        break;
      case "about":
        onPageChange("about");
        break;
      case "blog":
        onPageChange("blog");
        break;
      case "partners":
        onPageChange("partners");
        break;
      case "contact":
        onPageChange("contact");
        break;
      default:
        // Fallback vers home pour les routes non définies
        onPageChange("home");
        break;
    }
  };

  const handleLogoClick = () => {
    onPageChange("home");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card shadow-sm border-b border-secondary">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={handleLogoClick}
                className="text-primary hover:text-accent transition-colors cursor-pointer"
              >
                {brandSettings.logo_header.startsWith(
                  "http",
                ) ? (
                  <img
                    src={brandSettings.logo_header}
                    alt={brandSettings.brand_name}
                    className="h-16 w-auto"
                  />
                ) : (
                  <h2>{brandSettings.logo_header}</h2>
                )}
              </button>
            </div>

            {/* Desktop Navigation - Centré */}
            <div className="hidden lg:flex">
              <nav className="flex space-x-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavigation(item.key)}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                        // ✅ État actif selon la page courante
                        (currentPage === "destinations" && item.key === "destinations") ||
                        (currentPage === "catalog" && item.key === "experiences") ||
                        currentPage === item.key
                          ? "bg-muted text-primary shadow-sm"
                          : "text-primary hover:bg-muted hover:text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* CTA et User Menu */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 text-primary hover:bg-muted rounded-lg transition-colors"
                onClick={() =>
                  setMobileMenuOpen(!mobileMenuOpen)
                }
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              {/* CTA Button ou User menu */}
              {!user && showLoginButton && onLoginClick ? (
                <Button
                  onClick={onLoginClick}
                  className="px-6 py-2 rounded-lg shadow-sm flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Se connecter
                  </span>
                  <span className="sm:hidden">Connexion</span>
                </Button>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  {/* CTA pour utilisateurs connectés */}
                  <Button
                    variant="outline"
                    onClick={() => onPageChange("catalog")}
                    className="px-4 py-2 rounded-lg shadow-sm hidden sm:flex"
                  >
                    Réserver
                  </Button>

                  {/* Menu utilisateur */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="relative h-10 w-10 rounded-full hover:opacity-75 transition-opacity border-2 border-secondary hover:border-accent">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user?.profile_picture_url || ""}
                          alt={user?.first_name}
                        />
                        <AvatarFallback className="bg-secondary text-primary">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-64 border-secondary"
                      align="end"
                      forceMount
                    >
                      <div className="flex items-center justify-start gap-3 bg-[rgba(250,251,250,1)] p-[12px]">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              user?.profile_picture_url || ""
                            }
                            alt={user?.first_name}
                          />
                          <AvatarFallback className="bg-secondary text-primary">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1 leading-none">
                          <h6 className="text-primary">
                            {user?.first_name} {user?.last_name}
                          </h6>
                          <h6 className="w-[160px] truncate text-muted-foreground">
                            {user?.email}
                          </h6>
                        </div>
                      </div>
                      <div className="p-2">
                        <MenuItem
                          icon={User}
                          label="Mon profil"
                          onClick={() =>
                            onPageChange("profile")
                          }
                        />
                        <MenuItem
                          icon={Star}
                          label="Favoris et Avis"
                          onClick={() =>
                            onPageChange("favorites")
                          }
                        />
                        <MenuItem
                          icon={MapPin}
                          label="Mes réservations"
                          onClick={() =>
                            onPageChange("bookings")
                          }
                        />
                        <MenuItem
                          icon={MessageCircle}
                          label="Messages"
                          onClick={() =>
                            onPageChange("messages")
                          }
                        />
                        <div className="h-px bg-border my-2" />
                        <MenuItem
                          icon={LogOut}
                          label="Se déconnecter"
                          onClick={logout}
                          variant="destructive"
                        />
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-4 pt-4 pb-6 space-y-2 bg-card border-t border-secondary">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      handleNavigation(item.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      // ✅ Destinations et expériences sont actifs quand on est sur catalog
                      (currentPage === "catalog" && (item.key === "destinations" || item.key === "experiences")) ||
                      currentPage === item.key
                        ? "bg-secondary text-primary shadow-sm"
                        : "text-primary hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Séparateur */}
              <div className="h-px bg-border my-4" />

              {/* CTA mobile pour utilisateurs connectés */}
              {user && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onPageChange("catalog");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-lg shadow-sm"
                >
                  Réserver une expérience
                </Button>
              )}

              {/* Bouton de connexion mobile */}
              {!user && showLoginButton && onLoginClick && (
                <Button
                  onClick={() => {
                    onLoginClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Se connecter</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-[1280px] mx-auto py-8 px-5 overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[rgba(240,242,235,1)] text-primary-foreground m-[0px]">
        <div className="max-w-[1280px] mx-auto px-6">
          {/* Section principale du footer */}
          <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* À propos de GasyWay */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                {brandSettings.logo_footer.startsWith(
                  "http",
                ) ? (
                  <img
                    src={brandSettings.logo_footer}
                    alt={brandSettings.brand_name}
                    className="h-24 w-auto"
                  />
                ) : (
                  <h3 className="text-[rgba(13,64,71,1)]">
                    {brandSettings.logo_footer}
                  </h3>
                )}
              </div>
              <p className="text-secondary-foreground mb-4">
                Vivez Madagascar autrement : un voyage où chaque
                rencontre est authentique, chaque expérience a
                du sens et chaque choix soutient directement les
                communautés locales.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-secondary text-primary rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                  <span>f</span>
                </button>
                <button className="w-10 h-10 bg-secondary text-primary rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                  <span>@</span>
                </button>
                <button className="w-10 h-10 bg-secondary text-primary rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                  <span>in</span>
                </button>
              </div>
            </div>

            {/* Découvrir */}
            <div>
              <h4 className="mb-4 text-[rgba(13,64,71,1)]">
                Découvrir
              </h4>
              <ul className="space-y-2 text-secondary-foreground">
                <li>
                  <button
                    onClick={() => onPageChange("catalog")}
                    className="hover:text-primary hover:underline transition-colors cursor-pointer"
                  >
                    Toutes les expériences
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onPageChange("catalog")}
                    className="hover:text-primary hover:underline transition-colors cursor-pointer"
                  >
                    Destinations
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onPageChange("catalog")}
                    className="hover:text-primary hover:underline transition-colors cursor-pointer"
                  >
                    Hébergements responsables
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onPageChange("catalog")}
                    className="hover:text-primary hover:underline transition-colors cursor-pointer"
                  >
                    Expériences authentiques
                  </button>
                </li>
                <li>
                  <span className="text-muted-foreground text-[14px]">
                    Blog & Inspirations
                  </span>
                </li>
              </ul>
            </div>

            {/* Aide & Support */}
            <div>
              <h4 className="mb-4 text-[rgba(13,64,71,1)]">
                Aide & Support
              </h4>
              <ul className="space-y-2 text-secondary-foreground">
                <li className="text-[14px]">
                  <span className="text-muted-foreground">
                    Centre d'aide
                  </span>
                </li>
                <li className="text-[14px]">
                  <span className="text-muted-foreground">
                    Contact
                  </span>
                </li>
                <li className="text-[14px]">
                  <span className="text-muted-foreground">
                    FAQ
                  </span>
                </li>
                <li>
                  <span className="text-muted-foreground text-[14px]">
                    Conditions d'utilisation
                  </span>
                </li>
                <li className="text-[14px]">
                  <span className="text-muted-foreground">
                    Politique de confidentialité
                  </span>
                </li>
                <li className="text-[14px]">
                  <span className="text-muted-foreground">
                    Politique d'annulation
                  </span>
                </li>
                <li className="text-[14px]">
                  <span className="text-muted-foreground">
                    Politique des cookies
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Barre de copyright */}
          <div className="py-6 border-t border-border flex flex-col md:flex-row justify-between items-center">
            <div className="text-secondary-foreground mb-4 md:mb-0 text-[14px] flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <span>
                © {new Date().getFullYear()} GasyWay. Tous droits
                réservés.
              </span>
              <span className="block md:inline text-[14px]">
                Voyager responsable, découvrir autrement.
              </span>
              <CookieSettingsLink 
                variant="link" 
                size="sm" 
                className="text-secondary-foreground hover:text-primary text-[14px] p-0 h-auto justify-start md:justify-center"
                showIcon={false}
              >
                Paramètres des cookies
              </CookieSettingsLink>
            </div>
            <div className="flex items-center space-x-6 text-secondary-foreground">
              <span className="text-[14px]">
                🇲🇬 Made in Madagascar
              </span>
              <span className="hidden md:inline">•</span>
              <span className="text-[14px]">
                🌱 Tourisme durable
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}