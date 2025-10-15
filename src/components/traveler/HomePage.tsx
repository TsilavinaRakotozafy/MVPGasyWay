import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { cn } from "../../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  DateRangePicker,
  DateRange,
} from "../common/DateRangePicker";
import {
  Heart,
  MapPin,
  Users,
  Clock,
  Star,
  ArrowRight,
  Eye,
  Loader2,
  Leaf,
  Handshake,
  Shield,
  Lightbulb,
  Target,
  Quote,
  BookOpen,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContextSQL";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { supabase } from "../../utils/supabase/client";
import { PackCard } from "./PackCard";
import { PackCardSkeleton } from "./PackCardSkeleton";
import { DestinationCard } from "./DestinationCard";
import { DestinationCardSkeleton } from "./DestinationCardSkeleton";
import { ExperienceCard } from "./ExperienceCard";
import { FAQGroup } from "../common/FAQItem";
import { BlogArticleCard } from "../common/BlogArticleCard";
import { api } from "../../utils/api";
import { toast } from "sonner@2.0.3";

import {
  getPackInterests,
  mockInterests,
  getUserInterests,
  getActiveInterests,
} from "../../utils/interestsData";
import heroImage from "figma:asset/9c8385ca8529b87f02bb97229ac535487ed257d8.png";

interface Pack {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  price: number;
  currency: string;
  duration_days: number;
  max_participants: number;
  min_participants: number;
  location: string;
  category_id: string;
  status: "active" | "inactive" | "archived";
  images: string[];
  included_services: string[];
  excluded_services?: string[];
  difficulty_level?: "easy" | "medium" | "hard";
  season_start?: string;
  season_end?: string;
  cancellation_policy?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
  };
  partner?: {
    id: string;
    name: string;
    logo?: string;
  };
  is_favorite?: boolean;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

// Interface pour les centres d'intérêt Supabase
interface Interest {
  id: string;
  name: string;
  description: string;
  icon: string; // ✅ Utiliser icon comme demandé
  category: string;
  active: boolean; // Changé de is_active à active pour correspondre à la structure PostgreSQL
  created_at: string;
  updated_at: string;
}

interface HomePageProps {
  onPageChange: (page: string) => void;
  onPackSelect?: (pack: Pack) => void;
}

export function HomePage({
  onPageChange,
  onPackSelect,
}: HomePageProps) {
  const { user } = useAuth();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [totalPacksCount, setTotalPacksCount] =
    useState<number>(0);
  const [totalInterestsCount, setTotalInterestsCount] =
    useState<number>(0);
  const [recommendedPacks, setRecommendedPacks] = useState<
    Pack[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]); // État pour les centres d'intérêt dynamiques
  const [regions, setRegions] = useState<any[]>([]); // État pour les régions Supabase
  const [loading, setLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(true); // État spécifique pour les régions
  const [favoriteLoading, setFavoriteLoading] = useState<
    string | null
  >(null);
  const [email, setEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] =
    useState(false);
  const [consentChecked, setConsentChecked] = useState(false); // ✅ État pour le consentement RGPD

  // États pour la recherche de régions (maintenant basée sur les locations réelles des packs)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [locations, setLocations] = useState<string[]>([]); // Locations extraites des packs réels
  const [comboboxOpen, setComboboxOpen] = useState(false); // État pour le Combobox shadcn

  // Convertir les locations des packs en format compatible avec le Combobox shadcn
  const packLocationRegions = locations.map(
    (location, index) => ({
      id: location, // Utiliser la location comme ID
      name: location,
    }),
  );

  // État pour l'index du carrousel (carrousel linéaire)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // États pour les contrôles de navigation du carrousel
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // État pour la plage de dates
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined);

  // État pour les voyageurs
  const [travelers, setTravelers] = useState({
    adults: 0,
    children: 0,
    babies: 0,
  });
  const [travelersOpen, setTravelersOpen] = useState(false);

  console.log(
    "HomePage rendu - loading:",
    loading,
    "packs:",
    packs.length,
    "categories:",
    categories.length,
    "interests:",
    interests.length,
  );

  useEffect(() => {
    console.log("HomePage useEffect - chargement des données");
    loadHomeData();
  }, []);

  // Charger le nombre total de packs depuis la base de données
  useEffect(() => {
    async function fetchTotalPacksCount() {
      try {
        const { count, error } = await supabase
          .from("packs")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        if (error) {
          console.error(
            "Erreur lors du chargement du nombre total de packs:",
            error,
          );
          return;
        }

        setTotalPacksCount(count || 0);
        console.log(
          "✅ Nombre total de packs actifs chargé:",
          count,
        );
      } catch (err) {
        console.error(
          "Erreur inattendue lors du chargement du total de packs:",
          err,
        );
      }
    }

    fetchTotalPacksCount();
  }, []);

  // Charger le nombre total d'interests depuis la base de données
  useEffect(() => {
    async function fetchTotalInterestsCount() {
      try {
        const { count, error } = await supabase
          .from("interests")
          .select("*", { count: "exact", head: true })
          .eq("active", true);

        if (error) {
          console.error(
            "Erreur lors du chargement du nombre total d'interests:",
            error,
          );
          return;
        }

        setTotalInterestsCount(count || 0);
        console.log(
          "✅ Nombre total d'interests actifs chargé:",
          count,
        );
      } catch (err) {
        console.error(
          "Erreur inattendue lors du chargement du total d'interests:",
          err,
        );
      }
    }

    fetchTotalInterestsCount();
  }, []);

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    setRegionsLoading(true); // Début du chargement des régions
    try {
      console.log("🚀 Début du chargement des données...");

      // ✅ OPTIMISATION: Paralléliser TOUS les appels API + gestion immédiate des régions
      const [
        interestsData,
        packsData,
        categoriesData,
        regionsData,
      ] = await Promise.all([
        api.get("/interests"),
        api.get("/packs"),
        api.get("/categories"),
        api.get("/regions"),
      ]);

      // ✅ FIX PERFORMANCE: Traiter les régions immédiatement pour réduire le temps d'affichage
      if (regionsData && regionsData.length > 0) {
        setRegions(regionsData);
        console.log(
          "🌍 Régions chargées depuis Supabase:",
          regionsData.length,
        );
      } else {
        console.log("⚠️ Aucune région trouvée dans Supabase");
        setRegions([]);
      }
      setRegionsLoading(false); // ✅ Arrêter le loading des régions immédiatement

      console.log("📦 Données chargées en parallèle:", {
        interests: interestsData.length,
        packs: packsData.length,
        categories: categoriesData.length,
        regions: regionsData.length,
      });

      // Traiter les centres d'intérêt
      const activeInterests = interestsData.filter(
        (interest: Interest) => interest.active,
      ); // ✅ Supprimer .slice(0, 10) pour afficher TOUS les centres d'intérêt
      if (activeInterests.length > 0) {
        setInterests(activeInterests);
        console.log(
          "💾 Centres d'intérêt sauvegardés:",
          activeInterests.length,
        );
      } else {
        console.log("⚠️ Aucun centre d'intérêt actif trouvé");
        setInterests([]);
      }

      // Ajouter des images spécifiques selon le pack
      const packsWithImages = packsData.map((pack: Pack) => {
        let baseImageUrl =
          "https://images.unsplash.com/photo-1624272909636-4995421e37e7?w=400&h=250&fit=crop"; // Madagascar par défaut
        let images: string[] = [];
        let partnerLogo =
          "https://images.unsplash.com/photo-1549924231-f129b911e442?w=100&h=100&fit=crop"; // Logo par défaut
        let partnerName = "Partenaire Local";

        if (
          pack.title &&
          typeof pack.title === "string" &&
          (pack.title || "").toLowerCase().includes("tsingy")
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1738803232667-241cd72c4715?w=600&h=400&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1624272909636-4995421e37e7?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&h=400&fit=crop",
          ];
          partnerName = "Tsingy Explorer";
        } else if (
          pack.title &&
          typeof pack.title === "string" &&
          ((pack.title || "")
            .toLowerCase()
            .includes("andasibe") ||
            (pack.title || "").toLowerCase().includes("lemur"))
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1700077254075-c426ed0caafa?w=600&h=400&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1598563426949-bbff8101ed13?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&h=400&fit=crop",
          ];
          partnerName = "Andasibe Nature";
        } else if (
          pack.title &&
          typeof pack.title === "string" &&
          (pack.title || "").toLowerCase().includes("nosy be")
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1483651646696-c1b5fe39fc0e?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1571104508999-893933ded431?w=600&h=400&fit=crop",
          ];
          partnerName = "Nosy Be Écolodge";
        } else if (
          pack.title &&
          typeof pack.title === "string" &&
          pack.title.toLowerCase().includes("baobab")
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=600&h=400&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1734368779443-f1f1d7ea6e45?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
          ];
          partnerName = "Allée des Baobabs";
        } else if (
          pack.category?.name &&
          typeof pack.category.name === "string" &&
          pack.category.name.toLowerCase().includes("aventure")
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1749104674665-cfea164f926b?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
          ];
          partnerName = "Madagascar Aventure";
        } else if (
          pack.category?.name &&
          typeof pack.category.name === "string" &&
          pack.category.name.toLowerCase().includes("plage")
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1571104508999-893933ded431?w=600&h=400&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1483651646696-c1b5fe39fc0e?w=600&h=400&fit=crop",
          ];
          partnerName = "Côte Bleue Resort";
        } else {
          // Images par défaut pour les autres packs
          baseImageUrl =
            "https://images.unsplash.com/photo-1624272909636-4995421e37e7?w=600&h=400&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1734368779443-f1f1d7ea6e45?w=600&h=400&fit=crop",
            "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=600&h=400&fit=crop",
          ];
        }

        return {
          ...pack,
          imageUrl: baseImageUrl,
          images: images,
          partner: {
            id: `partner-${pack.id}`,
            name: partnerName,
            logo: partnerLogo,
          },
          is_favorite: user ? Math.random() > 0.7 : false, // Simuler des favoris aléatoires
        };
      });

      // Obtenir les recommandations basées sur les centres d'intérêt
      let displayPacks = packsWithImages;
      if (user) {
        const userInterests = getUserInterests(user.id);
        const recommended = getPackInterests(
          userInterests,
          packsWithImages,
        );
        setRecommendedPacks(recommended.slice(0, 6));
        displayPacks =
          recommended.length > 0
            ? recommended
            : packsWithImages;
      }

      // ✅ Extraire les locations uniques depuis les packs (même logique que PackCatalogSimple)
      const uniqueLocations = [
        ...new Set(
          packsWithImages
            .map((pack) => pack.location)
            .filter(
              (location) =>
                location &&
                typeof location === "string" &&
                location.trim() !== "",
            ),
        ),
      ].sort();

      setLocations(uniqueLocations);
      console.log(
        "📍 Locations extraites des packs:",
        uniqueLocations,
      );
      console.log(
        "🔄 HomePage - Synchronisation avec PackCatalogSimple: OK",
      );

      setPacks(displayPacks.slice(0, 6)); // Limiter à 6 packs pour la page d'accueil
      setCategories(categoriesData);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleFavorite = async (packId: string) => {
    if (!user) {
      toast.error(
        "Vous devez être connecté pour ajouter des favoris",
      );
      return;
    }

    setFavoriteLoading(packId);

    try {
      // Simuler un appel API
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mettre à jour l'état local
      setPacks((prevPacks) =>
        prevPacks.map((pack) =>
          pack.id === packId
            ? { ...pack, is_favorite: !pack.is_favorite }
            : pack,
        ),
      );

      const pack = packs.find((p) => p.id === packId);
      if (pack) {
        toast.success(
          pack.is_favorite
            ? `"${pack.title}" retiré de vos favoris`
            : `"${pack.title}" ajouté à vos favoris`,
        );
      }
    } catch (error) {
      console.error("Erreur toggle favori:", error);
      toast.error("Erreur lors de la mise à jour des favoris");
    } finally {
      setFavoriteLoading(null);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Vérification RGPD : checkbox cochée ?
    if (!consentChecked) {
      toast.error(
        "Veuillez accepter de recevoir nos communications avant de vous abonner",
      );
      return;
    }

    // ✅ Validation email
    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setNewsletterLoading(true);

    try {
      // ✅ Stocker le consentement dans la BDD avec toutes les infos RGPD
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .insert([
          {
            email: email.toLowerCase().trim(),
            consent_given: true,
            consent_date: new Date().toISOString(),
            consent_source: "Homepage Newsletter Form",
            consent_text:
              "J'accepte de recevoir les offres, actualités et conseils de voyage de GasyWay par email.",
            opted_in: true,
            subscription_date: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        // Si l'email existe déjà (erreur de clé unique)
        if (error.code === "23505") {
          toast.error(
            "Cette adresse email est déjà inscrite à notre newsletter",
          );
        } else {
          console.error(
            "Erreur inscription newsletter:",
            error,
          );
          toast.error(
            "Une erreur est survenue. Veuillez réessayer.",
          );
        }
        return;
      }

      // ✅ Succès
      toast.success(
        "Merci pour votre inscription à la newsletter ! 📧",
      );
      setEmail("");
      setConsentChecked(false); // Réinitialiser le consentement
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error(
        "Une erreur est survenue. Veuillez réessayer.",
      );
    } finally {
      setNewsletterLoading(false);
    }
  };

  // ✅ Fonctions pour le carrousel des expériences - scroll de 5 en 5
  const handlePreviousExperience = () => {
    if (isAnimating || currentIndex === 0) return;

    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(0, prev - 5)); // ✅ Défiler de 5 centres d'intérêt en arrière
      setIsAnimating(false);
    }, 300);
  };

  const handleNextExperience = () => {
    // Calculer l'index maximum pour afficher les 5 derniers centres d'intérêt
    const maxIndex = Math.max(0, interests.length - 5);
    if (isAnimating || currentIndex >= maxIndex) return;

    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(maxIndex, prev + 5)); // ✅ D��filer de 5 centres d'intérêt en avant
      setIsAnimating(false);
    }, 300);
  };

  // Calculer les expériences visibles
  const visibleExperiences = interests.slice(
    currentIndex,
    currentIndex + 5,
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-MG").format(price) + " Ar";
  };

  const getDifficultyLabel = (level?: string) => {
    const labels = {
      easy: "Facile",
      medium: "Modéré",
      hard: "Difficile",
    };
    return labels[level as keyof typeof labels] || "Non défini";
  };

  const getDifficultyColor = (level?: string) => {
    const colors = {
      easy: "bg-secondary text-secondary-foreground",
      medium: "bg-accent text-accent-foreground",
      hard: "bg-destructive text-destructive-foreground",
    };
    return (
      colors[level as keyof typeof colors] ||
      "bg-muted text-muted-foreground"
    );
  };

  // Fonction pour vérifier l'état du scroll du carrousel des destinations
  const checkScrollPosition = useCallback(() => {
    const container = document.getElementById(
      "destinations-carousel",
    );
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } =
        container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(
        scrollLeft < scrollWidth - clientWidth - 1,
      );
    }
  }, []);

  // useEffect pour surveiller les changements de scroll et les changements de régions
  useEffect(() => {
    const container = document.getElementById(
      "destinations-carousel",
    );
    if (container && regions.length > 0) {
      // Vérifier la position initiale
      checkScrollPosition();

      // Ajouter l'event listener pour le scroll
      container.addEventListener("scroll", checkScrollPosition);

      // Nettoyer l'event listener
      return () => {
        container.removeEventListener(
          "scroll",
          checkScrollPosition,
        );
      };
    }
  }, [regions, checkScrollPosition]);

  const handlePackClick = (pack: Pack) => {
    if (onPackSelect) {
      onPackSelect(pack);
    }
  };

  // Filtrer les régions des packs basé sur la recherche (avec protection contre les valeurs undefined)
  const filteredPackRegions = packLocationRegions.filter(
    (region) =>
      region.name &&
      region.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  // Données FAQ pour GasyWay
  const faqData = [
    {
      question:
        "Aurai-je un guide touristique pendant mon voyage ?",
      answer:
        "Oui, tous nos packs incluent un guide local expérimenté qui vous accompagnera tout au long de votre aventure. Nos guides sont natifs de Madagascar et parlent français, ils connaissent parfaitement les sites visités et la culture locale.",
      defaultOpen: false,
    },
    {
      question:
        "Comment GasyWay soutient-il les communautés locales ?",
      answer:
        "80% des revenus de chaque réservation sont directement reversés aux communautés locales. Nous travaillons avec des partenaires locaux pour les hébergements, la restauration et les activités, garantissant un impact positif direct.",
      defaultOpen: false,
    },
    {
      question: "Quelles sont les conditions d'annulation ?",
      answer:
        "Vous pouvez annuler votre réservation jusqu'à 48h avant le départ avec un remboursement complet. Entre 48h et 24h avant, des frais de 50% s'appliquent. Moins de 24h avant le départ, aucun remboursement n'est possible.",
      defaultOpen: false,
    },
    {
      question: "Les packs sont-ils adaptés aux familles ?",
      answer:
        "Absolument ! Nos packs sont conçus pour tous les âges. Nous proposons des activités adaptées aux enfants et des hébergements familiaux. Les difficultés sont clairement indiquées pour chaque pack.",
      defaultOpen: false,
    },
    {
      question: "Que comprennent exactement les packs ?",
      answer:
        "Chaque pack inclut l'hébergement, les repas mentionnés, le transport local, les guides, les activités pr��vues et l'assistance 24h/7j. Les détails spécifiques sont indiqués dans la description de chaque pack.",
      defaultOpen: false,
    },
    {
      question: "Comment réserver un pack sur GasyWay ?",
      answer:
        "C'est simple ! Parcourez notre catalogue, sélectionnez votre pack favori, choisissez vos dates et le nombre de participants, puis procédez au paiement sécurisé. Vous recevrez immédiatement une confirmation par email.",
      defaultOpen: false,
    },
  ];

  // ✅ OPTIMISATION : Ne plus bloquer l'affichage complet, afficher la structure immédiatement
  // Les sections individuelles géreront leur propre loading avec des skeletons

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative h-[500px] rounded-3xl overflow-hidden">
        <img
          src={heroImage}
          alt="Discover Madagascar the GasyWay"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-center px-12 lg:px-20">
          <div className="max-w-2xl">
            <div className="mb-6">
              <h1 className="text-white max-w-[400px]">
                Discover Madagascar the GasyWay
              </h1>
            </div>
            <p className="text-white mb-8 max-w-xl">
              Vivez Madagascar autrement : un voyage où chaque
              rencontre est authentique, chaque expérience a du
              sens et chaque choix soutient directement les
              communautés locales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="accent"
                size="lg"
                className="px-8 py-4"
                onClick={() => onPageChange("catalog")}
              >
                Explorez maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="glass"
                size="lg"
                className="px-8 py-4"
                onClick={() => {
                  // Scroll vers la section des destinations
                  const element = document.querySelector(
                    '[data-section="destinations"]',
                  );
                  element?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                Voir les destinations
                <Eye className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Recherche de Destinations */}
      <div className="flex justify-center">
        <div className="bg-background md:rounded-full rounded-2xl border border-border shadow-lg flex flex-col md:flex-row items-stretch md:items-center gap-0 md:gap-1 px-4 md:px-[12px] py-4 md:py-[0px]">
          {/* Où */}
          <div className="py-3 px-[12px] px-[16px] py-[0px] w-full md:w-[300px]">
            <div className="text-foreground">Destination</div>
            <Popover
              open={comboboxOpen}
              onOpenChange={setComboboxOpen}
            >
              <PopoverTrigger asChild>
                <button
                  onClick={() => setComboboxOpen(!comboboxOpen)}
                  className="w-full min-w-[280px] relative bg-transparent border-0 p-0 cursor-pointer outline-none"
                >
                  <span
                    className={cn(
                      "bg-transparent border-0 rounded-lg focus:ring-0 focus:outline-none focus:border-0 focus:shadow-none p-0 cursor-pointer min-h-[20px] flex items-center transition-colors duration-200",
                      // Style identique à SearchableDropdown original
                      selectedRegion && selectedRegion !== "all"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                    style={{
                      fontSize:
                        "var(--text-p-size, var(--text-base))",
                      fontWeight:
                        "var(--text-p-weight, var(--font-weight-normal))",
                      lineHeight:
                        "var(--text-p-line-height, 1.5)",
                      fontFamily: "var(--font-family)",
                    }}
                  >
                    {selectedRegion && selectedRegion !== "all"
                      ? packLocationRegions.find(
                          (region) =>
                            region.id === selectedRegion,
                        )?.name
                      : "Choisir une destination"}
                  </span>
                  <ChevronDown
                    className={cn(
                      "absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform",
                      comboboxOpen && "rotate-180",
                    )}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Rechercher une destination..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandEmpty>
                    Aucune région trouvée
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      key="all"
                      value="all"
                      onSelect={() => {
                        setSelectedRegion("all");
                        setSearchQuery("");
                        setComboboxOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedRegion === "all"
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      Toutes les régions
                    </CommandItem>
                    {packLocationRegions.map((region) => (
                      <CommandItem
                        key={region.id}
                        value={region.id}
                        onSelect={(currentValue) => {
                          setSelectedRegion(currentValue);
                          setSearchQuery(region.name);
                          setComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedRegion === region.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {region.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Séparateur */}
          <div className="hidden md:block w-px h-8 bg-border"></div>
          <div className="block md:hidden h-px w-full bg-border my-2"></div>

          {/* Quand */}
          <div className="w-full md:min-w-[200px] cursor-pointer py-[0px] py-[8px] px-[12px]">
            <div className="text-foreground">Date</div>
            <DateRangePicker
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              placeholder="Choisir la date"
              className="text-muted-foreground"
            />
          </div>

          {/* Séparateur */}
          <div className="hidden md:block w-px h-8 bg-border"></div>
          <div className="block md:hidden h-px w-full bg-border my-2"></div>

          {/* Qui */}
          <div className="w-full md:min-w-[280px] px-6 py-3 px-[12px] py-[0px]">
            <div className="text-foreground">Voyageur(s)</div>
            <Popover
              open={travelersOpen}
              onOpenChange={setTravelersOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full text-left justify-start p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center">
                    {(() => {
                      const totalTravelers =
                        travelers.adults +
                        travelers.children +
                        travelers.babies;
                      const hasSelection = totalTravelers > 0;

                      if (hasSelection) {
                        const parts = [];
                        if (travelers.adults > 0)
                          parts.push(
                            `${travelers.adults} adulte${travelers.adults > 1 ? "s" : ""}`,
                          );
                        if (travelers.children > 0)
                          parts.push(
                            `${travelers.children} enfant${travelers.children > 1 ? "s" : ""}`,
                          );
                        if (travelers.babies > 0)
                          parts.push(
                            `${travelers.babies} bébé${travelers.babies > 1 ? "s" : ""}`,
                          );

                        return (
                          <span className="text-muted-foreground whitespace-normal break-words">
                            {parts.join(", ")}
                          </span>
                        );
                      }

                      return (
                        <span className="text-muted-foreground whitespace-normal break-words">
                          Choisir le nombre de voyageur
                        </span>
                      );
                    })()}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p>Adultes</p>
                      <p className="text-muted-foreground">
                        13 ans et plus
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTravelers((prev) => ({
                            ...prev,
                            adults: Math.max(
                              1,
                              prev.adults - 1,
                            ),
                          }))
                        }
                        disabled={travelers.adults <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">
                        {travelers.adults}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTravelers((prev) => ({
                            ...prev,
                            adults: prev.adults + 1,
                          }))
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p>Enfants</p>
                      <p className="text-muted-foreground">
                        2-12 ans
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTravelers((prev) => ({
                            ...prev,
                            children: Math.max(
                              0,
                              prev.children - 1,
                            ),
                          }))
                        }
                        disabled={travelers.children <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">
                        {travelers.children}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTravelers((prev) => ({
                            ...prev,
                            children: prev.children + 1,
                          }))
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p>Bébés</p>
                      <p className="text-muted-foreground">
                        Moins de 2 ans
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTravelers((prev) => ({
                            ...prev,
                            babies: Math.max(
                              0,
                              prev.babies - 1,
                            ),
                          }))
                        }
                        disabled={travelers.babies <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">
                        {travelers.babies}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTravelers((prev) => ({
                            ...prev,
                            babies: prev.babies + 1,
                          }))
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Bouton Rechercher */}
          <Button
            className="w-full md:w-auto p-3 rounded-full md:ml-2 mt-4 md:mt-0"
            onClick={() => {
              // Collecter les critères de recherche
              const searchCriteria = {
                region: selectedRegion,
                dateRange: selectedDateRange,
                travelers: travelers,
                location: selectedRegion, // Recherche aussi dans location field des packs
              };

              // Stocker les critères dans sessionStorage pour les transmettre au catalog
              sessionStorage.setItem(
                "searchCriteria",
                JSON.stringify(searchCriteria),
              );

              // Rediriger vers le catalog
              onPageChange("catalog");
            }}
          >
            <div className="w-4 h-4">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </Button>
        </div>
      </div>

      {/* Pourquoi GasyWay ? */}
      <Card className="bg-secondary/30">
        <CardContent className="p-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="mb-4">Pourquoi GasyWay ?</h2>
            <p className="text-muted-foreground mb-6">
              Parce que voyager n'est pas seulement partir loin,
              c'est créer des liens et laisser une trace
              positive.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2">Voyager durablement</h4>
                <p className="text-muted-foreground">
                  80 % des revenus reversés aux communautés
                  locales.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Handshake className="h-6 w-6 text-accent-foreground" />
                </div>
                <h4 className="mb-2">Rencontres humaines</h4>
                <p className="text-muted-foreground">
                  Guides, artisans et familles qui partagent
                  leur quotidien.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-secondary-foreground" />
                </div>
                <h4 className="mb-2">Confiance & simplicité</h4>
                <p className="text-muted-foreground">
                  Paiements sécurisés, accompagnement humain.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <h4 className="mb-2">Sur-mesure</h4>
                <p className="text-muted-foreground">
                  Bientôt, créez votre itinéraire unique avec
                  GasyWayTailor.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="text-center max-w-4xl mx-auto mb-8">
        <p className="text-muted-foreground">
          Avec GasyWay, vous ne réservez pas une activité. Vous
          partagez un repas chez l'habitant, découvrez des
          savoir-faire ancestraux, marchez aux côtés de guides
          passionnés. Vous explorez, mais vous participez aussi
          à une aventure collective.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <h2 className="text-primary mb-2">
              {totalPacksCount}+
            </h2>
            <p className="text-muted-foreground">
              Expériences disponibles
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <h2 className="text-accent mb-2">
              {totalInterestsCount}
            </h2>
            <p className="text-muted-foreground">
              Types d'aventures
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <h2 className="text-accent mb-2">80%</h2>
            <p className="text-muted-foreground">
              Revenus aux communautés
            </p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <h2 className="text-primary mb-2">25+</h2>
            <p className="text-muted-foreground">
              Partenaires engagés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Carrousel de destinations optimisé */}
      <div className="space-y-6 py-20">
        {/* ✅ Titre et description - Toujours affichés immédiatement */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <h2>Explorez Madagascar comme jamais auparavant</h2>
          <div className="text-center">
            <p className="text-muted-foreground">
              Partez à la découverte de l'île Rouge à travers
              des expériences authentiques qui connectent votre
              âme voyageuse aux merveilles naturelles et
              culturelles de Madagascar. Chaque destination
              révèle ses secrets : des forêts primaires aux
              lagons turquoise, des villages traditionnels aux
              réserves naturelles protégées. Vivez des moments
              inoubliables en harmonie avec les communautés
              locales et contribuez à un tourisme responsable et
              durable.
            </p>
          </div>
        </div>

        {/* Conteneur principal du carrousel avec contrôles fixes */}
        <div className="relative w-full max-w-7xl mx-auto space-y-6">
          {/* ✅ Afficher les skeletons pendant le chargement */}
          {regionsLoading ? (
            <div className="relative overflow-hidden">
              {/* Dégradés de fondu - Affichés immédiatement */}
              <div className="absolute left-0 top-0 bottom-0 w-20 md:w-24 bg-gradient-to-r from-background via-background/80 to-transparent z-30 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-20 md:w-24 bg-gradient-to-l from-background via-background/80 to-transparent z-30 pointer-events-none" />

              {/* Chevrons désactivés pendant le chargement */}
              <Button
                variant="outline"
                size="icon"
                disabled
                className="absolute left-2 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm border-border text-[rgba(13,64,71,1)] opacity-50 cursor-not-allowed md:left-4 rounded-[32px]"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled
                className="absolute right-2 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm border-border text-[rgba(13,64,71,1)] opacity-50 cursor-not-allowed md:right-4 rounded-[32px]"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>

              {/* Skeletons de destinations */}
              <div className="flex gap-6 overflow-x-auto">
                <div className="flex-none w-16 md:w-20" />
                
                {/* Afficher 6 skeletons */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="flex-none w-72 md:w-80"
                  >
                    <DestinationCardSkeleton />
                  </div>
                ))}
                
                <div className="flex-none w-16 md:w-20" />
              </div>
            </div>
          ) : regions.length === 0 ? (
            /* Message si aucune destination disponible */
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Aucune destination disponible pour le moment.
              </p>
            </div>
          ) : (
            /* ✅ Vraies cards quand les données sont chargées */
            <>
              <div className="relative overflow-hidden">
                {/* Dégradés de fondu fixes - Ne bougent jamais */}
                <div className="absolute left-0 top-0 bottom-0 w-20 md:w-24 bg-gradient-to-r from-background via-background/80 to-transparent z-30 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 md:w-24 bg-gradient-to-l from-background via-background/80 to-transparent z-30 pointer-events-none" />

                {/* Chevrons de navigation fixes - Ne bougent jamais */}
                <Button
                  variant="outline"
                  size="icon"
                  disabled={!canScrollLeft}
                  className={cn(
                    "absolute left-2 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm border-border text-[rgba(13,64,71,1)] hover:bg-gray-100 hover:text-[rgba(13,64,71,1)] transition-all duration-200 md:left-4 rounded-[32px]",
                    !canScrollLeft &&
                      "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => {
                    if (!canScrollLeft) return;
                    const container = document.getElementById(
                      "destinations-carousel",
                    );
                    if (container) {
                      // Défilement adaptatif selon la taille d'écran
                      const scrollDistance =
                        window.innerWidth < 768 ? -280 : -320;
                      container.scrollBy({
                        left: scrollDistance,
                        behavior: "smooth",
                      });
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={!canScrollRight}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 z-40 bg-background/95 backdrop-blur-sm border-border text-[rgba(13,64,71,1)] hover:bg-gray-100 hover:text-[rgba(13,64,71,1)] transition-all duration-200 md:right-4 rounded-[32px]",
                    !canScrollRight &&
                      "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => {
                    if (!canScrollRight) return;
                    const container = document.getElementById(
                      "destinations-carousel",
                    );
                    if (container) {
                      // Défilement adaptatif selon la taille d'écran
                      const scrollDistance =
                        window.innerWidth < 768 ? 280 : 320;
                      container.scrollBy({
                        left: scrollDistance,
                        behavior: "smooth",
                      });
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </Button>

                {/* Conteneur de défilement des destinations */}
                <div
                  id="destinations-carousel"
                  className="flex gap-6 overflow-x-auto"
                  onScroll={checkScrollPosition}
                >
                  {/* Espace initial pour le dégradé */}
                  <div className="flex-none w-16 md:w-20" />

                  {/* Cards du carrousel */}
                  {regions.map((region) => (
                    <div
                      key={region.id}
                      className="flex-none w-72 md:w-80"
                    >
                      <DestinationCard
                        name={region.name}
                        description={
                          region.description ||
                          `Découvrez les merveilles de ${region.name}`
                        }
                        imageUrl={
                          region.image_url ||
                          `https://images.unsplash.com/photo-1687360433534-eb696fe4e49e?w=400&h=400&fit=crop&auto=format`
                        }
                        imageAlt={region.name}
                        onClick={() => {
                          onPageChange("catalog");
                        }}
                      />
                    </div>
                  ))}

                  {/* Espace final pour le dégradé */}
                  <div className="flex-none w-16 md:w-20" />
                </div>
              </div>

              {/* Bouton "Plus de destinations" */}
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  className="bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  onClick={() => onPageChange("destinations")}
                >
                  Plus de destinations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
        
        {/* ✅ Bouton "Plus de destinations" - Toujours affiché */}
        {!regionsLoading && regions.length === 0 && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              className="bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              onClick={() => onPageChange("destinations")}
            >
              Plus de destinations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Expériences authentiques */}
      {interests.length > 0 && (
        <div className="space-y-6 px-[0px] py-[80px] m-[0px]">
          <div className="flex items-center justify-center">
            <div>
              <h2 className="text-center">Activités à faire</h2>
              <p className="text-muted-foreground text-center">
                Parce que les plus beaux souvenirs se vivent
                dans l'instant.
              </p>
            </div>
          </div>
          {interests.length > 0 && (
            <div className="space-y-6 py-[0px] m-[0px] px-[0px] p-[0px]">
              {/* Carrousel horizontal des services */}
              <div className="space-y-4">
                <style>{`
              /* Carrousel de destinations - Masquage scrollbar complet */
              #destinations-carousel::-webkit-scrollbar {
                display: none;
                width: 0;
                height: 0;
              }
              
              #destinations-carousel {
                scrollbar-width: none;
                -ms-overflow-style: none;
                scroll-behavior: smooth;
              }
              
              /* Animations pour les expériences */
              @keyframes scroll-perpetual-left {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-6300px, 0, 0); }
              }
              
              @keyframes scroll-perpetual-right {
                0% { transform: translate3d(-6300px, 0, 0); }
                100% { transform: translate3d(0, 0, 0); }
              }
              
              .scroll-container {
                overflow: hidden;
                mask: linear-gradient(
                  90deg,
                  transparent,
                  white 5%,
                  white 95%,
                  transparent
                );
                -webkit-mask: linear-gradient(
                  90deg,
                  transparent,
                  white 5%,
                  white 95%,
                  transparent
                );
              }
              
              .scroll-track {
                display: flex;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
                will-change: transform;
              }
              
              .perpetual-left {
                animation-name: scroll-perpetual-left;
                animation-duration: 120s;
              }
              
              .perpetual-right {
                animation-name: scroll-perpetual-right;
                animation-duration: 120s;
              }
              
              .scroll-paused .scroll-track {
                animation-play-state: paused;
              }
              
              .scroll-item {
                flex: 0 0 180px;
                margin-right: 16px;
              }
            `}</style>

                {(() => {
                  // ✅ AFFICHAGE SIMPLE : Tous les intérêts disponibles
                  const filteredInterests = interests;

                  return filteredInterests.length > 0 ? (
                    <>
                      {/* Rangée 1 - défilement perpétuel vers la gauche */}
                      <div
                        className="scroll-container"
                        onMouseEnter={(e) =>
                          e.currentTarget.classList.add(
                            "scroll-paused",
                          )
                        }
                        onMouseLeave={(e) =>
                          e.currentTarget.classList.remove(
                            "scroll-paused",
                          )
                        }
                      >
                        <div className="scroll-track perpetual-left">
                          {/* Contenu répété exactement pour créer une boucle invisible */}
                          {[...Array(3)].map((_, iteration) =>
                            filteredInterests
                              .slice(
                                0,
                                Math.ceil(
                                  filteredInterests.length / 3,
                                ),
                              )
                              .map((interest, index) => (
                                <div
                                  key={`row1-cycle${iteration}-${interest.id}`}
                                  className="scroll-item"
                                >
                                  <ExperienceCard
                                    name={interest.name}
                                    description={
                                      interest.description
                                    }
                                    icon={interest.icon}
                                  />
                                </div>
                              )),
                          )}
                        </div>
                      </div>

                      {/* Rangée 2 - défilement perpétuel vers la droite */}
                      <div
                        className="scroll-container"
                        onMouseEnter={(e) =>
                          e.currentTarget.classList.add(
                            "scroll-paused",
                          )
                        }
                        onMouseLeave={(e) =>
                          e.currentTarget.classList.remove(
                            "scroll-paused",
                          )
                        }
                      >
                        <div className="scroll-track perpetual-right">
                          {/* Contenu répété exactement pour créer une boucle invisible */}
                          {[...Array(3)].map((_, iteration) =>
                            filteredInterests
                              .slice(
                                Math.ceil(
                                  filteredInterests.length / 3,
                                ),
                                Math.ceil(
                                  (filteredInterests.length *
                                    2) /
                                    3,
                                ),
                              )
                              .map((interest, index) => (
                                <div
                                  key={`row2-cycle${iteration}-${interest.id}`}
                                  className="scroll-item"
                                >
                                  <ExperienceCard
                                    name={interest.name}
                                    description={
                                      interest.description
                                    }
                                    icon={interest.icon}
                                  />
                                </div>
                              )),
                          )}
                        </div>
                      </div>

                      {/* Rangée 3 - défilement perpétuel vers la gauche */}
                      <div
                        className="scroll-container"
                        onMouseEnter={(e) =>
                          e.currentTarget.classList.add(
                            "scroll-paused",
                          )
                        }
                        onMouseLeave={(e) =>
                          e.currentTarget.classList.remove(
                            "scroll-paused",
                          )
                        }
                      >
                        <div className="scroll-track perpetual-left">
                          {/* Contenu répété exactement pour créer une boucle invisible */}
                          {[...Array(3)].map((_, iteration) =>
                            filteredInterests
                              .slice(
                                Math.ceil(
                                  (filteredInterests.length *
                                    2) /
                                    3,
                                ),
                              )
                              .map((interest, index) => (
                                <div
                                  key={`row3-cycle${iteration}-${interest.id}`}
                                  className="scroll-item"
                                >
                                  <ExperienceCard
                                    name={interest.name}
                                    description={
                                      interest.description
                                    }
                                    icon={interest.icon}
                                  />
                                </div>
                              )),
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Activités en cours de chargement...
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packs recommandés ou en vedette */}
      <div className="space-y-6 px-[0px] py-[80px] m-[0px]">
        <div className="flex items-center justify-center">
          <div>
            <h2 className="text-2xl font-bold text-[32px]">
              {user && recommendedPacks.length > 0
                ? "Recommandés pour vous"
                : user
                  ? "Expériences recommandées"
                  : "Expériences en vedette"}
            </h2>
            <p className="text-muted-foreground text-center">
              {user && recommendedPacks.length > 0
                ? "Basé sur vos centres d'intérêt"
                : user
                  ? "Nos meilleures sélections pour vous"
                  : "Nos expériences les plus populaires"}
            </p>
          </div>
        </div>

        {/* ✅ Afficher skeletons pendant le chargement, puis les packs */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <PackCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(user && recommendedPacks.length > 0
              ? recommendedPacks
              : packs
            ).map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                onClick={() => handlePackClick(pack)}
                onToggleFavorite={
                  user
                    ? (e) => {
                        e.stopPropagation();
                        toggleFavorite(pack.id);
                      }
                    : undefined
                }
                favoriteLoading={favoriteLoading === pack.id}
                showLoginButton={!user}
              />
            ))}
          </div>
        )}
        <div className="text-center">
          <Button
            className="gap-2"
            variant="outline"
            onClick={() => onPageChange("catalog")}
          >
            Voir plus d'expériences
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Section Témoignages clients - Version améliorée */}
      <div className="bg-[rgba(247,247,247,1)] py-16 rounded-[24px]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
            {/* Section titre à gauche */}
            <div className="space-y-4">
              <div>
                <p className="tracking-widest text-muted-foreground text-sm uppercase">
                  Témoignages
                </p>
                <h2 className="text-primary">
                  Ne nous croyez pas sur parole
                </h2>
                <p className="text-muted-foreground px-[0px] py-[4px]">
                  Découvrez ce que nos clients ont à dire
                </p>
              </div>
            </div>

            {/* Section témoignages à droite - Layout 2 colonnes verticales avec 4 témoignages par colonne */}
            <div className="w-full md:w-[700px] lg:col-span-2">
              <style>{`
                /* Animations pour les colonnes verticales desktop */
                @keyframes scroll-seamless-up {
                  from { transform: translate3d(0, 0, 0); }
                  to { transform: translate3d(0, -50%, 0); }
                }
                
                @keyframes scroll-seamless-down {
                  from { transform: translate3d(0, -50%, 0); }
                  to { transform: translate3d(0, 0, 0); }
                }
                
                /* Conteneurs colonnes verticales desktop */
                .testimonials-scroll-container {
                  overflow: hidden;
                  mask: linear-gradient(
                    180deg,
                    transparent,
                    white 10%,
                    white 90%,
                    transparent
                  );
                  -webkit-mask: linear-gradient(
                    180deg,
                    transparent,
                    white 10%,
                    white 90%,
                    transparent
                  );
                  height: 500px;
                }
                
                .testimonials-scroll-track {
                  display: flex;
                  flex-direction: column;
                  animation-timing-function: linear;
                  animation-iteration-count: infinite;
                  will-change: transform;
                }
                
                .testimonials-seamless-up {
                  animation-name: scroll-seamless-up;
                  animation-duration: 50s;
                }
                
                .testimonials-seamless-down {
                  animation-name: scroll-seamless-down;
                  animation-duration: 50s;
                }
                
                .testimonials-scroll-paused .testimonials-scroll-track {
                  animation-play-state: paused;
                }
                
                .testimonials-scroll-item {
                  flex: 0 0 auto;
                  margin-bottom: 24px;
                }
                
                /* Carrousel horizontal mobile */
                .testimonials-horizontal-scroll {
                  overflow-x: auto;
                  overflow-y: hidden;
                  scroll-snap-type: x mandatory;
                  -webkit-overflow-scrolling: touch;
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                }
                
                .testimonials-horizontal-scroll::-webkit-scrollbar {
                  display: none;
                }
                
                .testimonials-horizontal-item {
                  flex: 0 0 auto;
                  width: 85%;
                  scroll-snap-align: start;
                }
              `}</style>

              {/* Carrousel horizontal (Mobile uniquement) */}
              <div className="relative md:hidden">
                {/* Bouton Chevron Gauche */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-lg border-primary/20 text-primary hover:bg-muted hover:text-primary"
                  onClick={() => {
                    const container = document.querySelector(
                      ".testimonials-horizontal-scroll",
                    );
                    if (container) {
                      container.scrollBy({
                        left: -container.clientWidth * 0.85,
                        behavior: "smooth",
                      });
                    }
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* Bouton Chevron Droite */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-lg border-primary/20 text-primary hover:bg-muted hover:text-primary"
                  onClick={() => {
                    const container = document.querySelector(
                      ".testimonials-horizontal-scroll",
                    );
                    if (container) {
                      container.scrollBy({
                        left: container.clientWidth * 0.85,
                        behavior: "smooth",
                      });
                    }
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>

                {/* Container scrollable */}
                <div className="flex testimonials-horizontal-scroll gap-4 pb-4">
                  {/* Tous les 8 témoignages fusionnés en ligne */}
                  <div className="testimonials-horizontal-item">
                    <div className="bg-card p-6 rounded-xl shadow-sm h-full">
                      <div className="flex items-start gap-4">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0JTIwYnVzaW5lc3MlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NTkxNzUwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                          alt="Alexia Randria"
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="space-y-3 flex-1">
                          <p className="text-card-foreground leading-relaxed">
                            "J'adore travailler avec GasyWay. Je
                            n'ai pas eu besoin d'expliquer les
                            choses deux fois. L'expérience s'est
                            déroulée exactement comme je l'avais
                            imaginée."
                          </p>
                          <div>
                            <h4 className="text-primary">
                              Alexia Randria
                            </h4>
                            <p className="text-muted-foreground">
                              Guide locale, Andasibe
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="testimonials-horizontal-item">
                    <div className="bg-card p-6 rounded-xl shadow-sm h-full">
                      <div className="flex items-start gap-4">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1639986162505-c9bcccfc9712?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVuY2glMjB3b21hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzU5MTc1MDg0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                          alt="Sophie Laurent"
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="space-y-3 flex-1">
                          <p className="text-card-foreground leading-relaxed">
                            "Une expérience authentique
                            incroyable. Chaque moment était
                            parfaitement organisé et nous avons
                            créé des liens durables."
                          </p>
                          <div>
                            <h4 className="text-primary">
                              Sophie Laurent
                            </h4>
                            <p className="text-muted-foreground">
                              Voyageuse, France
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="testimonials-horizontal-item">
                    <div className="bg-card p-6 rounded-xl shadow-sm h-full">
                      <div className="flex items-start gap-4">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1710778044102-56a3a6b69a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBlbnRyZXByZW5ldXIlMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NTkxODMyNzh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                          alt="Mamitiana Razafi"
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="space-y-3 flex-1">
                          <p className="text-card-foreground leading-relaxed">
                            "Grâce à cette plateforme, mon
                            activité d'artisanat a trouvé une
                            nouvelle clientèle. Les touristes
                            comprennent mieux notre culture."
                          </p>
                          <div>
                            <h4 className="text-primary">
                              Mamitiana Razafi
                            </h4>
                            <p className="text-muted-foreground">
                              Artisane textile, Antananarivo
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="testimonials-horizontal-item">
                    <div className="bg-card p-6 rounded-xl shadow-sm h-full">
                      <div className="flex items-start gap-4">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1743540039538-2b2055db2868?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8ZWxkZXJseSUyMGFmcmljYW4lMjBtYW4lMjB0cmFkaXRpb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTE4MzI4Nnww&ixlib=rb-4.1.0&q=80&w=1080"
                          alt="Jean-Baptiste Andry"
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="space-y-3 flex-1">
                          <p className="text-foreground leading-relaxed">
                            "En tant qu'ancien du village, je
                            vois comment GasyWay préserve nos
                            traditions tout en les partageant
                            avec respect."
                          </p>
                          <div>
                            <h4 className="text-primary">
                              Jean-Baptiste Andry
                            </h4>
                            <p className="text-muted-foreground">
                              Sage du village, Morondava
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="testimonials-horizontal-item">
                    <div className="bg-card p-6 rounded-xl shadow-sm h-full">
                      <div className="flex items-start gap-4">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1571429682044-fbf7dfc72c33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWFuJTIwYnVzaW5lc3NtYW4lMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NTkxNzUwODF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                          alt="Michel Razana"
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="space-y-3 flex-1">
                          <p className="text-foreground leading-relaxed">
                            "Grâce à GasyWay, nos visiteurs
                            comprennent mieux notre travail.
                            Chaque visite valorise notre
                            savoir-faire traditionnel."
                          </p>
                          <div>
                            <h4 className="text-primary">
                              Michel Razana
                            </h4>
                            <p className="text-muted-foreground">
                              Artisan vanille, SAVA
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="testimonials-horizontal-item">
                    <div className="bg-card p-6 rounded-xl shadow-sm h-full">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary">
                            RH
                          </span>
                        </div>
                        <div className="space-y-3 flex-1">
                          <p className="text-foreground leading-relaxed">
                            "Nos enfants ont découvert
                            Madagascar d'une façon qu'ils
                            n'oublieront jamais. Une aventure
                            éducative exceptionnelle."
                          </p>
                          <div>
                            <h4 className="text-primary">
                              Ravo Hery
                            </h4>
                            <p className="text-muted-foreground">
                              Famille voyageuse, Diego
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="testimonials-horizontal-item">
                    <div className="bg-card p-6 rounded-xl shadow-sm h-full">
                      <div className="flex items-start gap-4">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1614772903208-613ed4282ded?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHRvdXJpc3QlMjB0cmF2ZWxlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTE4MzI4M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                          alt="Thomas Weber"
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="space-y-3 flex-1">
                          <p className="text-foreground leading-relaxed">
                            "Un voyage transformateur ! Les
                            rencontres authentiques et les
                            expériences locales ont dépassé
                            toutes mes attentes."
                          </p>
                          <div>
                            <h4 className="text-primary">
                              Thomas Weber
                            </h4>
                            <p className="text-muted-foreground">
                              Photographe voyageur, Allemagne
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="testimonials-horizontal-item">
                    <div className="bg-card p-6 rounded-xl shadow-sm h-full">
                      <div className="flex items-start gap-4">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1565151589416-d978f0faf6d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwdHJhdmVsJTIwdG91cmlzdCUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc1OTE4MzI5MHww&ixlib=rb-4.1.0&q=80&w=1080"
                          alt="Clara Martinez"
                          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="space-y-3 flex-1">
                          <p className="text-foreground leading-relaxed">
                            "Madagascar m'a révélé des trésors
                            cachés. GasyWay m'a permis de
                            voyager de manière responsable et
                            enrichissante."
                          </p>
                          <div>
                            <h4 className="text-primary">
                              Clara Martinez
                            </h4>
                            <p className="text-muted-foreground">
                              Étudiante en biologie, Espagne
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Fin wrapper relative avec chevrons */}
              </div>

              {/* 2 Colonnes verticales (Desktop uniquement) */}
              <div className="hidden md:flex gap-6">
                {/* Colonne 1 - Témoignages défilant vers le haut */}
                <div
                  className="flex-1 testimonials-scroll-container"
                  onMouseEnter={(e) =>
                    e.currentTarget.classList.add(
                      "testimonials-scroll-paused",
                    )
                  }
                  onMouseLeave={(e) =>
                    e.currentTarget.classList.remove(
                      "testimonials-scroll-paused",
                    )
                  }
                >
                  <div className="testimonials-scroll-track testimonials-seamless-up">
                    {/* Contenu répété exactement 2 fois pour une boucle seamless */}
                    {Array.from(
                      { length: 2 },
                      (_, iteration) => (
                        <React.Fragment
                          key={`col1-cycle${iteration}`}
                        >
                          <div className="testimonials-scroll-item">
                            <div className="bg-card p-6 rounded-xl shadow-sm">
                              <div className="flex items-start gap-4">
                                <ImageWithFallback
                                  src="https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0JTIwYnVzaW5lc3MlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NTkxNzUwNzd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                                  alt="Alexia Randria"
                                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="space-y-3 flex-1">
                                  <p className="text-foreground leading-relaxed">
                                    "J'adore travailler avec
                                    GasyWay. Je n'ai pas eu
                                    besoin d'expliquer les
                                    choses deux fois.
                                    L'expérience s'est déroulée
                                    exactement comme je l'avais
                                    imaginée."
                                  </p>
                                  <div>
                                    <h4 className="text-primary">
                                      Alexia Randria
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                      Guide locale, Andasibe
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="testimonials-scroll-item">
                            <div className="bg-card p-6 rounded-xl shadow-sm">
                              <div className="flex items-start gap-4">
                                <ImageWithFallback
                                  src="https://images.unsplash.com/photo-1639986162505-c9bcccfc9712?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVuY2glMjB3b21hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzU5MTc1MDg0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                                  alt="Sophie Laurent"
                                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="space-y-3 flex-1">
                                  <p className="text-foreground leading-relaxed">
                                    "Une expérience authentique
                                    incroyable. Chaque moment
                                    était parfaitement organisé
                                    et nous avons créé des liens
                                    durables."
                                  </p>
                                  <div>
                                    <h4 className="text-primary">
                                      Sophie Laurent
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                      Voyageuse, France
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="testimonials-scroll-item">
                            <div className="bg-card p-6 rounded-xl shadow-sm">
                              <div className="flex items-start gap-4">
                                <ImageWithFallback
                                  src="https://images.unsplash.com/photo-1710778044102-56a3a6b69a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBlbnRyZXByZW5ldXIlMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NTkxODMyNzh8MA&ixlib=rb-4.1.0&q=80&w=1080"
                                  alt="Mamitiana Razafi"
                                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="space-y-3 flex-1">
                                  <p className="text-foreground leading-relaxed">
                                    "Grâce à cette plateforme,
                                    mon activité d'artisanat a
                                    trouvé une nouvelle
                                    clientèle. Les touristes
                                    comprennent mieux notre
                                    culture."
                                  </p>
                                  <div>
                                    <h4 className="text-primary">
                                      Mamitiana Razafi
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                      Artisane textile,
                                      Antananarivo
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="testimonials-scroll-item">
                            <div className="bg-card p-6 rounded-xl shadow-sm">
                              <div className="flex items-start gap-4">
                                <ImageWithFallback
                                  src="https://images.unsplash.com/photo-1743540039538-2b2055db2868?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8ZWxkZXJseSUyMGFmcmljYW4lMjBtYW4lMjB0cmFkaXRpb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTE4MzI4Nnww&ixlib=rb-4.1.0&q=80&w=1080"
                                  alt="Jean-Baptiste Andry"
                                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="space-y-3 flex-1">
                                  <p className="text-foreground leading-relaxed">
                                    "En tant qu'ancien du
                                    village, je vois comment
                                    GasyWay préserve nos
                                    traditions tout en les
                                    partageant avec respect."
                                  </p>
                                  <div>
                                    <h4 className="text-primary">
                                      Jean-Baptiste Andry
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                      Sage du village, Morondava
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      ),
                    )}
                  </div>
                </div>

                {/* Colonne 2 - Témoignages défilant vers le bas */}
                <div
                  className="flex-1 testimonials-scroll-container"
                  onMouseEnter={(e) =>
                    e.currentTarget.classList.add(
                      "testimonials-scroll-paused",
                    )
                  }
                  onMouseLeave={(e) =>
                    e.currentTarget.classList.remove(
                      "testimonials-scroll-paused",
                    )
                  }
                >
                  <div className="testimonials-scroll-track testimonials-seamless-down">
                    {/* Contenu répété exactement 2 fois pour une boucle seamless */}
                    {Array.from(
                      { length: 2 },
                      (_, iteration) => (
                        <React.Fragment
                          key={`col2-cycle${iteration}`}
                        >
                          <div className="testimonials-scroll-item">
                            <div className="bg-card p-6 rounded-xl shadow-sm">
                              <div className="flex items-start gap-4">
                                <ImageWithFallback
                                  src="https://images.unsplash.com/photo-1571429682044-fbf7dfc72c33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWFuJTIwYnVzaW5lc3NtYW4lMjBwb3J0cmFpdCUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NTkxNzUwODF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                                  alt="Michel Razana"
                                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="space-y-3 flex-1">
                                  <p className="text-foreground leading-relaxed">
                                    "Grâce à GasyWay, nos
                                    visiteurs comprennent mieux
                                    notre travail. Chaque visite
                                    valorise notre savoir-faire
                                    traditionnel."
                                  </p>
                                  <div>
                                    <h4 className="text-primary">
                                      Michel Razana
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                      Artisan vanille, SAVA
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="testimonials-scroll-item">
                            <div className="bg-card p-6 rounded-xl shadow-sm">
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-primary text-lg">
                                    RH
                                  </span>
                                </div>
                                <div className="space-y-3 flex-1">
                                  <p className="text-foreground leading-relaxed">
                                    "Nos enfants ont découvert
                                    Madagascar d'une façon
                                    qu'ils n'oublieront jamais.
                                    Une aventure éducative
                                    exceptionnelle."
                                  </p>
                                  <div>
                                    <h4 className="text-primary">
                                      Ravo Hery
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                      Famille voyageuse, Diego
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="testimonials-scroll-item">
                            <div className="bg-card p-6 rounded-xl shadow-sm">
                              <div className="flex items-start gap-4">
                                <ImageWithFallback
                                  src="https://images.unsplash.com/photo-1614772903208-613ed4282ded?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMHRvdXJpc3QlMjB0cmF2ZWxlciUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTE4MzI4M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                                  alt="Thomas Weber"
                                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="space-y-3 flex-1">
                                  <p className="text-foreground leading-relaxed">
                                    "Un voyage transformateur !
                                    Les rencontres authentiques
                                    et les expériences locales
                                    ont dépassé toutes mes
                                    attentes."
                                  </p>
                                  <div>
                                    <h4 className="text-primary">
                                      Thomas Weber
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                      Photographe voyageur,
                                      Allemagne
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="testimonials-scroll-item">
                            <div className="bg-card p-6 rounded-xl shadow-sm">
                              <div className="flex items-start gap-4">
                                <ImageWithFallback
                                  src="https://images.unsplash.com/photo-1565151589416-d978f0faf6d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwdHJhdmVsJTIwdG91cmlzdCUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc1OTE4MzI5MHww&ixlib=rb-4.1.0&q=80&w=1080"
                                  alt="Clara Martinez"
                                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="space-y-3 flex-1">
                                  <p className="text-foreground leading-relaxed">
                                    "Madagascar m'a révélé des
                                    trésors cachés. GasyWay m'a
                                    permis de voyager de manière
                                    responsable et
                                    enrichissante."
                                  </p>
                                  <div>
                                    <h4 className="text-primary">
                                      Clara Martinez
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                      Étudiante en biologie,
                                      Espagne
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      ),
                    )}
                  </div>
                </div>
                {/* Fin 2 colonnes verticales desktop */}
              </div>
              {/* Fin conteneur responsive (md:w-[700px] lg:col-span-2) */}
            </div>
            {/* Fin Section témoignages à droite */}
          </div>
          {/* Fin grid lg:grid-cols-3 */}
        </div>
        {/* Fin max-w-6xl */}
      </div>
      {/* Fin section témoignages */}

      {/* FAQ Section redesignée */}
      <div className="bg-[rgba(240,242,235,0)] px-2.5 px-[10px] py-[80px] m-[0px]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Navigation sidebar */}
          <div className="w-96 flex flex-col gap-8">
            <div className="p-2.5 border-b border-[#bcdc49] flex flex-col items-end gap-2">
              <div className="items-start gap-2 p-[0px]">
                <h4 className="text-left text-[#0d4047] text-lg font-normal leading-7">
                  Encore des Questions ? Nous sommes là pour
                  vous aider !
                </h4>
                <Button size="lg" className="rounded-full mt-4">
                  Explorez maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu FAQ */}
          <div className="flex-1 flex flex-col gap-8">
            <FAQGroup
              faqs={faqData}
              title="Tout ce que vous devez savoir pour Vivre l'expérience GasyWay."
              className="space-y-6"
            />
          </div>
        </div>
      </div>

      {/* Section Étapes de réservation redesignée */}
      <div className="bg-gradient-to-b from-white/0 to-white bg-accent/50 rounded-3xl px-16 py-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-8 max-w-[1125px]">
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-primary max-w-[500px] text-[36px] text-center">
                Réservez votre prochaine aventure en juste 4
                étapes !
              </h2>
              <p className="text-primary max-w-[732px] text-center">
                Voyager devrait être excitant, pas compliqué !
                Chez GasyWay, nous rendons la réservation de
                votre voyage rapide, simple et sans stress.
                Suivez simplement ces quatre étapes faciles et
                préparez-vous pour une expérience inoubliable !
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col gap-4">
                <div className="w-20 h-20 bg-[rgba(4,51,57,0)] rounded-full flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-primary" />
                </div>
                <div className="flex flex-col gap-2">
                  <h5 className="text-primary text-[16px]">
                    Choisissez votre destination
                  </h5>
                  <p className="text-primary">
                    Notre équipe expérimentée s'assure que votre
                    voyage soit sans stress, sûr et bien
                    planifié.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="w-20 h-20 bg-[rgba(4,51,57,0)] rounded-full flex items-center justify-center">
                  <Leaf className="w-10 h-10 text-primary" />
                </div>
                <div className="flex flex-col gap-2">
                  <h5 className="text-primary">
                    Personnalisez votre voyage
                  </h5>
                  <p className="text-primary">
                    Notre équipe expérimentée s'assure que votre
                    voyage soit sans stress, sûr et bien
                    planifié.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="w-20 h-20 bg-[rgba(4,51,57,0)] rounded-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-primary" />
                </div>
                <div className="flex flex-col gap-2">
                  <h5 className="text-primary">
                    Réservez & Confirmez
                  </h5>
                  <p className="text-primary">
                    Notre équipe expérimentée s'assure que votre
                    voyage soit sans stress, sûr et bien
                    planifié.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="w-20 h-20 bg-[rgba(4,51,57,0)] rounded-full flex items-center justify-center">
                  <Heart className="w-10 h-10 text-primary" />
                </div>
                <div className="flex flex-col gap-2">
                  <h5 className="text-primary">
                    Voyagez & Profitez
                  </h5>
                  <p className="text-primary">
                    Notre équipe expérimentée s'assure que votre
                    voyage soit sans stress, sûr et bien
                    planifié.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Blog redesignée */}
      <div className="py-28 bg-white px-[0px] py-[80px]">
        <div className="max-w-[1200px] mx-auto space-y-14">
          <div className="px-20 text-center">
            <h2 className="text-primary max-w-[550px] mx-auto">
              Dernières informations et conseils d'experts sur
              les voyages
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <BlogArticleCard
              image="https://images.unsplash.com/photo-1624272909636-4995421e37e7?w=407&h=271&fit=crop"
              alt="Aventures culturelles Madagascar"
              date="6 février, 2025"
              category="Aventure"
              title="Expériences culturelles inoubliables à essayer à Madagascar"
              excerpt="Voyager est un moyen incroyable de découvrir de nouvelles cultures, des paysages à couper le souffle et des aventures passionnantes..."
            />

            <BlogArticleCard
              image="https://images.unsplash.com/photo-1670712733724-728ee7ffd009?w=407&h=271&fit=crop"
              alt="Faune endémique Madagascar"
              date="6 février, 2025"
              category="Nature"
              title="Découverte de la faune endémique de Madagascar"
              excerpt="Madagascar abrite une biodiversité unique au monde. Découvrez comment observer responsablement les espèces endémiques..."
            />

            <BlogArticleCard
              image="https://images.unsplash.com/photo-1750756856784-378ddfe3a467?w=407&h=271&fit=crop"
              alt="Traditions malgaches"
              date="6 février, 2025"
              category="Culture"
              title="Traditions ancestrales et artisanat local"
              excerpt="Plongez dans l'authenticité des traditions malgaches et découvrez l'artisanat local qui fait la richesse culturelle de l'île..."
            />

            <BlogArticleCard
              image="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=407&h=271&fit=crop"
              alt="Voyage responsable Madagascar"
              date="6 février, 2025"
              category="Écotourisme"
              title="Voyager responsable à Madagascar"
              excerpt="Découvrez comment voyager de manière responsable et contribuer au développement durable tout en profitant de votre séjour..."
            />
          </div>

          {/* Newsletter intégrée */}
          <div className="bg-[#f0f2eb] rounded-3xl p-6 md:p-8 md:relative md:min-h-[180px] flex flex-col md:block gap-4 md:gap-0">
            {/* Titre */}
            <div className="max-w-full md:max-w-[400px]">
              <h3 className="text-[#0d4047] leading-10 text-[24px]">
                <span className="font-medium">
                  Abonnez-vous pour{" "}
                </span>
                <span className="font-extralight">
                  rester connectés à Madagascar
                </span>
              </h3>
            </div>

            {/* Input + Bouton + Checkbox RGPD */}
            <div className="flex flex-col gap-3 md:absolute md:right-8 md:top-8 md:max-w-[500px]">
              <div className="p-2 bg-white rounded-full flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0">
                <Input
                  type="email"
                  placeholder="Votre meilleure adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-0 bg-transparent px-4 md:px-8 py-2 w-full md:min-w-[320px] text-[#6b7280] text-base font-normal focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-transparent focus:bg-transparent px-[16px] py-[8px]"
                />
                <Button
                  onClick={handleNewsletterSubmit}
                  disabled={
                    newsletterLoading || !consentChecked
                  }
                  className="px-8 py-4 rounded-full relative overflow-hidden border border-white w-full md:w-auto"
                >
                  {newsletterLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
                      <span className="relative z-10 text-base font-semibold">
                        Inscription...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10 text-base font-semibold">
                        S'abonner
                      </span>
                      <div className="absolute inset-0 bg-[#bcdc49] transform -skew-x-12 -translate-x-full transition-transform duration-300 hover:translate-x-0" />
                    </>
                  )}
                </Button>
              </div>

              {/* ✅ Checkbox RGPD obligatoire */}
              <div className="flex items-start gap-3 px-2">
                <Checkbox
                  id="newsletter-consent"
                  checked={consentChecked}
                  onCheckedChange={(checked) =>
                    setConsentChecked(checked === true)
                  }
                  className="mt-1 flex-shrink-0"
                />
                <label
                  htmlFor="newsletter-consent"
                  className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                >
                  J'accepte de recevoir les offres, actualités
                  et conseils de voyage de GasyWay par email. Je
                  peux me désabonner à tout moment via le lien
                  présent dans chaque email.
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}