import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import {
  Search,
  Filter,
  Loader2,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContextSQL";
import { PackCard } from "./PackCard";
import { toast } from "sonner@2.0.3";
import { api } from "../../utils/api";
import { createDebouncer } from "../../utils/performance";
import {
  getPackInterests,
  getActiveInterests,
} from "../../utils/interestsData";
import { cn } from "../ui/utils";

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

interface LocationInfo {
  location: string;
  count: number;
}

interface Filters {
  search: string;
  category: string[]; // ✅ Changé en array pour sélection multiple
  difficulty_level: string[]; // ✅ Changé en array pour sélection multiple
  price_range: [number, number];
  duration_range: [number, number];
  interests: string[];
  regions: string[]; // ✅ Ajout pour sélection multiple des régions
  max_participants?: number; // ✅ Ajout pour filtrer par nombre de voyageurs
}

interface PackCatalogProps {
  onLoginRequest?: () => void;
  onPackSelect?: (pack: Pack) => void;
}

const PACKS_PER_PAGE = 12;

export function PackCatalogSimple({
  onLoginRequest,
  onPackSelect,
}: PackCatalogProps) {
  const { user } = useAuth();
  const [allPacks, setAllPacks] = useState<Pack[]>([]);
  const [filteredPacks, setFilteredPacks] = useState<Pack[]>(
    [],
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState<
    string | null
  >(null);

  // ✅ États pour les dropdowns
  const [categoryDropdownOpen, setCategoryDropdownOpen] =
    useState(false);
  const [difficultyDropdownOpen, setDifficultyDropdownOpen] =
    useState(false);
  const [interestsDropdownOpen, setInterestsDropdownOpen] =
    useState(false);
  const [regionsDropdownOpen, setRegionsDropdownOpen] =
    useState(false);

  // ✅ États pour les inputs éditables des sliders (valeurs par défaut)
  const [priceInputs, setPriceInputs] = useState({
    min: 0,
    max: 2000000,
  });
  const [durationInputs, setDurationInputs] = useState({
    min: 1,
    max: 10,
  });

  // ✅ Options de difficulté (memoized to prevent re-creation)
  const difficultyOptions = React.useMemo(
    () => [
      { id: "easy", name: "Facile", icon: "🟢" },
      { id: "medium", name: "Modéré", icon: "🟡" },
      { id: "hard", name: "Difficile", icon: "🔴" },
    ],
    [],
  );

  // ✅ Fonction pour supprimer une sélection (memoized)
  const removeSelection = React.useCallback(
    (
      type:
        | "category"
        | "difficulty_level"
        | "interests"
        | "regions",
      value: string,
    ) => {
      if (type === "category") {
        setFilters((prev) => ({
          ...prev,
          category: prev.category.filter((c) => c !== value),
        }));
      } else if (type === "difficulty_level") {
        setFilters((prev) => ({
          ...prev,
          difficulty_level: prev.difficulty_level.filter(
            (d) => d !== value,
          ),
        }));
      } else if (type === "interests") {
        setFilters((prev) => ({
          ...prev,
          interests: prev.interests.filter((i) => i !== value),
        }));
      } else if (type === "regions") {
        setFilters((prev) => ({
          ...prev,
          regions: prev.regions.filter((r) => r !== value),
        }));
      }
    },
    [],
  );

  // ✅ Fonction pour basculer une sélection (memoized)
  const toggleSelection = React.useCallback(
    (
      type:
        | "category"
        | "difficulty_level"
        | "interests"
        | "regions",
      value: string,
    ) => {
      if (type === "category") {
        setFilters((prev) => ({
          ...prev,
          category: prev.category.includes(value)
            ? prev.category.filter((c) => c !== value)
            : [...prev.category, value],
        }));
      } else if (type === "difficulty_level") {
        setFilters((prev) => ({
          ...prev,
          difficulty_level: prev.difficulty_level.includes(
            value,
          )
            ? prev.difficulty_level.filter((d) => d !== value)
            : [...prev.difficulty_level, value],
        }));
      } else if (type === "interests") {
        setFilters((prev) => ({
          ...prev,
          interests: prev.interests.includes(value)
            ? prev.interests.filter((i) => i !== value)
            : [...prev.interests, value],
        }));
      } else if (type === "regions") {
        setFilters((prev) => ({
          ...prev,
          regions: prev.regions.includes(value)
            ? prev.regions.filter((r) => r !== value)
            : [...prev.regions, value],
        }));
      }
    },
    [],
  );

  // ✅ Fonction pour générer les données de distribution (memoized)
  const getPriceDistribution = React.useCallback(() => {
    const buckets = 12;
    const maxPrice = 2000000;
    const bucketSize = maxPrice / buckets;
    const distribution = new Array(buckets).fill(0);

    allPacks.forEach((pack) => {
      const bucketIndex = Math.min(
        Math.floor(pack.price / bucketSize),
        buckets - 1,
      );
      distribution[bucketIndex]++;
    });

    const maxCount = Math.max(...distribution);
    return distribution.map(
      (count) => (count / maxCount) * 100,
    ); // Normaliser en pourcentage
  }, [allPacks]);

  const getDurationDistribution = React.useCallback(() => {
    const buckets = 10;
    const distribution = new Array(buckets).fill(0);

    allPacks.forEach((pack) => {
      const bucketIndex = Math.min(
        pack.duration_days - 1,
        buckets - 1,
      );
      distribution[bucketIndex]++;
    });

    const maxCount = Math.max(...distribution);
    return distribution.map(
      (count) => (count / maxCount) * 100,
    );
  }, [allPacks]);

  // ✅ Gestion des inputs éditables (memoized)
  const handlePriceInputChange = React.useCallback(
    (type: "min" | "max", value: string) => {
      const numValue = parseInt(value.replace(/\D/g, "")) || 0;
      const clampedValue = Math.max(
        0,
        Math.min(2000000, numValue),
      );

      setPriceInputs((prev) => ({
        ...prev,
        [type]: clampedValue,
      }));

      const newRange: [number, number] =
        type === "min"
          ? [
              clampedValue,
              Math.max(clampedValue, priceInputs.max),
            ]
          : [
              Math.min(priceInputs.min, clampedValue),
              clampedValue,
            ];

      setFilters((prev) => ({
        ...prev,
        price_range: newRange,
      }));
    },
    [priceInputs],
  );

  const handleDurationInputChange = React.useCallback(
    (type: "min" | "max", value: string) => {
      const numValue = parseInt(value) || 1;
      const clampedValue = Math.max(1, Math.min(10, numValue));

      setDurationInputs((prev) => ({
        ...prev,
        [type]: clampedValue,
      }));

      const newRange: [number, number] =
        type === "min"
          ? [
              clampedValue,
              Math.max(clampedValue, durationInputs.max),
            ]
          : [
              Math.min(durationInputs.min, clampedValue),
              clampedValue,
            ];

      setFilters((prev) => ({
        ...prev,
        duration_range: newRange,
      }));
    },
    [durationInputs],
  );

  // 🎯 Gestion des sliders à double curseur (memoized)
  const handlePriceSliderChange = React.useCallback(
    (values: number[]) => {
      const [min, max] = values;
      setFilters((prev) => ({
        ...prev,
        price_range: [min, max],
      }));
    },
    [],
  );

  const handleDurationSliderChange = React.useCallback(
    (values: number[]) => {
      const [min, max] = values;
      setFilters((prev) => ({
        ...prev,
        duration_range: [min, max],
      }));
    },
    [],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: [], // ✅ Array vide pour sélection multiple
    difficulty_level: [], // ✅ Array vide pour sélection multiple
    price_range: [0, 2000000],
    duration_range: [1, 10],
    interests: [],
    regions: [], // ✅ Array vide pour sélection multiple des régions
    max_participants: undefined, // ✅ Filtre par nombre de voyageurs
  });

  useEffect(() => {
    loadData();

    // ✅ Récupérer les critères de recherche depuis sessionStorage
    const storedCriteria =
      sessionStorage.getItem("searchCriteria");
    if (storedCriteria) {
      try {
        const searchCriteria = JSON.parse(storedCriteria);
        console.log(
          "🔍 [PackCatalog] Critères de recherche reçus:",
          searchCriteria,
        );

        // Appliquer les critères aux filtres
        let searchTerm = "";
        let filtersUpdated = false;

        // Gestion de la région/destination
        if (
          searchCriteria.region &&
          searchCriteria.region !== "all"
        ) {
          searchTerm = searchCriteria.region;
          filtersUpdated = true;
        }

        // Gestion du nombre de voyageurs (filtrer par max_participants)
        let maxParticipantsFilter = null;
        if (searchCriteria.travelers) {
          const totalTravelers =
            (searchCriteria.travelers.adults || 0) +
            (searchCriteria.travelers.children || 0) +
            (searchCriteria.travelers.babies || 0);
          if (totalTravelers > 0) {
            maxParticipantsFilter = totalTravelers;
            filtersUpdated = true;
          }
        }

        if (filtersUpdated) {
          setFilters((prev) => ({
            ...prev,
            search: searchTerm,
            max_participants: maxParticipantsFilter,
            // Note: les dates pourraient être utilisées pour filtrer selon les saisons
            // mais cela nécessiterait une logique plus complexe avec season_start/season_end
          }));

          // Message de confirmation
          let message = "🎯 Recherche appliquée";
          if (searchTerm) message += ` pour "${searchTerm}"`;
          if (maxParticipantsFilter)
            message += ` (${maxParticipantsFilter} voyageur${maxParticipantsFilter > 1 ? "s" : ""})`;

          toast.success(message);
        }

        // Nettoyer le sessionStorage après utilisation
        sessionStorage.removeItem("searchCriteria");
      } catch (error) {
        console.error(
          "❌ Erreur lors du parsing des critères de recherche:",
          error,
        );
      }
    }
  }, []);

  // ✅ Fermer les dropdowns en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setCategoryDropdownOpen(false);
        setDifficultyDropdownOpen(false);
        setInterestsDropdownOpen(false);
        setRegionsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  // ✅ Fonction pour appliquer les filtres (définie avant utilisation)
  const applyFilters = React.useCallback(() => {
    // ✅ Protection contre les données vides ou invalides
    if (!allPacks || allPacks.length === 0) {
      console.log(
        "⚠️ [PackCatalog] applyFilters appelé avec allPacks vide:",
        allPacks,
      );
      setFilteredPacks([]);
      return;
    }

    let filtered = [...allPacks];

    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (pack) =>
          (pack.title &&
            typeof pack.title === "string" &&
            pack.title.toLowerCase().includes(searchLower)) ||
          (pack.short_description &&
            typeof pack.short_description === "string" &&
            pack.short_description
              .toLowerCase()
              .includes(searchLower)) ||
          (pack.description &&
            typeof pack.description === "string" &&
            pack.description
              .toLowerCase()
              .includes(searchLower)) ||
          // ✅ Recherche par location (avec vérification de sécurité renforcée)
          (pack.location &&
            typeof pack.location === "string" &&
            pack.location.toLowerCase().includes(searchLower)),
      );
    }

    if (filters.category.length > 0) {
      filtered = filtered.filter((pack) =>
        filters.category.includes(pack.category_id),
      );
    }

    if (filters.difficulty_level.length > 0) {
      filtered = filtered.filter(
        (pack) =>
          pack.difficulty_level &&
          filters.difficulty_level.includes(
            pack.difficulty_level,
          ),
      );
    }

    filtered = filtered.filter(
      (pack) =>
        pack.price >= filters.price_range[0] &&
        pack.price <= filters.price_range[1],
    );

    filtered = filtered.filter(
      (pack) =>
        pack.duration_days >= filters.duration_range[0] &&
        pack.duration_days <= filters.duration_range[1],
    );

    // ✅ Filtre par nombre de voyageurs
    if (filters.max_participants) {
      filtered = filtered.filter(
        (pack) =>
          pack.max_participants >= filters.max_participants!,
      );
    }

    if (filters.interests.length > 0) {
      filtered = filtered.filter((pack) => {
        const packInterests =
          pack.interests || getPackInterests(pack);
        return filters.interests.some((interest) =>
          packInterests.includes(interest),
        );
      });
    }

    if (filters.regions.length > 0) {
      filtered = filtered.filter((pack) => {
        // Filtrer directement par location (avec vérification de sécurité renforcée)
        return (
          pack.location &&
          typeof pack.location === "string" &&
          filters.regions.includes(pack.location)
        );
      });
    }

    setFilteredPacks(filtered);
  }, [allPacks, filters]); // ✅ Memoized avec les bonnes dépendances

  const debouncedApplyFilters = React.useMemo(
    () => createDebouncer(applyFilters, 300),
    [applyFilters], // ✅ Dépendance sur applyFilters
  );

  useEffect(() => {
    // ✅ Éviter d'appliquer les filtres si allPacks est vide (données pas encore chargées)
    if (allPacks.length === 0 && !loading) return;

    // ✅ Appel immédiat des filtres lors du chargement initial des données
    if (allPacks.length > 0 && filteredPacks.length === 0) {
      applyFilters();
    } else {
      debouncedApplyFilters();
    }

    setCurrentPage(1);
  }, [
    filters,
    allPacks,
    loading,
    applyFilters,
    debouncedApplyFilters,
    filteredPacks,
  ]);

  // ✅ Synchroniser les inputs avec les filtres uniquement lors du changement depuis les sliders
  useEffect(() => {
    // Éviter la synchronisation si les inputs sont déjà cohérents (prévient les boucles)
    if (
      priceInputs.min !== filters.price_range[0] ||
      priceInputs.max !== filters.price_range[1]
    ) {
      setPriceInputs({
        min: filters.price_range[0],
        max: filters.price_range[1],
      });
    }
  }, [filters.price_range]);

  useEffect(() => {
    // Éviter la synchronisation si les inputs sont déjà cohérents (prévient les boucles)
    if (
      durationInputs.min !== filters.duration_range[0] ||
      durationInputs.max !== filters.duration_range[1]
    ) {
      setDurationInputs({
        min: filters.duration_range[0],
        max: filters.duration_range[1],
      });
    }
  }, [filters.duration_range]);

  async function loadData() {
    setLoading(true);
    console.log("🔄 [PackCatalog] Starting loadData...");

    try {
      console.log(
        "🌐 [PackCatalog] Calling API /packs and /categories...",
      );

      const [packsData, categoriesData] = await Promise.all([
        api.get("/packs"),
        api.get("/categories"),
      ]);

      console.log(
        `📦 [PackCatalog] Raw API Response - Packs:`,
        packsData,
      );
      console.log(
        `📂 [PackCatalog] Raw API Response - Categories:`,
        categoriesData,
      );
      console.log(
        `📊 [PackCatalog] Packs count: ${Array.isArray(packsData) ? packsData.length : "NOT AN ARRAY"}`,
      );
      console.log(
        `📊 [PackCatalog] Categories count: ${Array.isArray(categoriesData) ? categoriesData.length : "NOT AN ARRAY"}`,
      );

      // ✅ Vérification que l'API retourne bien des tableaux
      if (!Array.isArray(packsData)) {
        console.error(
          "❌ [PackCatalog] /packs did not return an array:",
          typeof packsData,
          packsData,
        );
        throw new Error(
          "API /packs ne retourne pas un tableau",
        );
      }

      if (!Array.isArray(categoriesData)) {
        console.error(
          "❌ [PackCatalog] /categories did not return an array:",
          typeof categoriesData,
          categoriesData,
        );
        throw new Error(
          "API /categories ne retourne pas un tableau",
        );
      }

      const packsWithImages = packsData.map((pack: Pack) => {
        let baseImageUrl =
          "https://images.unsplash.com/photo-1624272909636-4995421e37e7?w=400&h=250&fit=crop";
        let images: string[] = [];
        let partnerName = "Partenaire Local";

        if (
          pack.title &&
          typeof pack.title === "string" &&
          pack.title.toLowerCase().includes("tsingy")
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1624272909636-4995421e37e7?w=400&h=250&fit=crop",
            "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=400&h=250&fit=crop",
          ];
          partnerName = "Tsingy Explorer";
        } else if (
          pack.title &&
          typeof pack.title === "string" &&
          (pack.title.toLowerCase().includes("andasibe") ||
            pack.title.toLowerCase().includes("lemur"))
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=400&h=250&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1700077254075-c426ed0caafa?w=400&h=250&fit=crop",
            "https://images.unsplash.com/photo-1598563426949-bbff8101ed13?w=400&h=250&fit=crop",
          ];
          partnerName = "Andasibe Nature";
        } else if (
          pack.title &&
          typeof pack.title === "string" &&
          pack.title.toLowerCase().includes("nosy be")
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1483651646696-c1b5fe39fc0e?w=400&h=250&fit=crop",
            "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=250&fit=crop",
          ];
          partnerName = "Nosy Be Écolodge";
        } else if (
          pack.title &&
          typeof pack.title === "string" &&
          pack.title.toLowerCase().includes("baobab")
        ) {
          baseImageUrl =
            "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=400&h=250&fit=crop";
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1734368779443-f1f1d7ea6e45?w=400&h=250&fit=crop",
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
          ];
          partnerName = "Allée des Baobabs";
        } else {
          images = [
            baseImageUrl,
            "https://images.unsplash.com/photo-1734368779443-f1f1d7ea6e45?w=400&h=250&fit=crop",
            "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=400&h=250&fit=crop",
          ];
        }

        return {
          ...pack,
          imageUrl: baseImageUrl,
          images: images,
          partner: {
            id: `partner-${pack.id}`,
            name: partnerName,
            logo: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=100&h=100&fit=crop",
          },
          is_favorite: user ? Math.random() > 0.7 : false,
          interests: getPackInterests(pack),
        };
      });

      console.log(
        `✅ [PackCatalog] Setting ${packsWithImages.length} packs`,
      );

      // ✅ Extraire les locations uniques depuis les packs (avec vérification de sécurité)
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

      console.log(
        `🌍 [PackCatalog] Found ${uniqueLocations.length} unique locations:`,
        uniqueLocations,
      );

      // ✅ Forcer la mise à jour synchrone des états
      setAllPacks(packsWithImages);
      setFilteredPacks(packsWithImages);
      setCategories(categoriesData);
      setLocations(uniqueLocations);

      console.log(
        "✅ [PackCatalog] Data loading completed successfully",
      );

      // ✅ Forcer l'application immédiate des filtres après chargement
      setTimeout(() => {
        if (packsWithImages.length > 0) {
          setFilteredPacks([...packsWithImages]); // Sans filtres = tous les packs
        }
      }, 50);

      // ✅ Si aucune donnée n'est trouvée, essayer d'initialiser la base
      if (
        packsWithImages.length === 0 &&
        categoriesData.length === 0
      ) {
        console.log(
          "🔧 [PackCatalog] No data found, attempting to initialize database...",
        );
        try {
          const initResult = await api.post("/init");
          console.log(
            "🔧 [PackCatalog] Database initialization result:",
            initResult,
          );

          // Recharger les données après initialisation
          console.log(
            "🔄 [PackCatalog] Retrying data load after initialization...",
          );
          const [newPacksData, newCategoriesData] =
            await Promise.all([
              api.get("/packs"),
              api.get("/categories"),
            ]);

          if (
            Array.isArray(newPacksData) &&
            newPacksData.length > 0
          ) {
            console.log(
              `🎉 [PackCatalog] Successfully loaded ${newPacksData.length} packs after initialization`,
            );

            const newPacksWithImages = newPacksData.map(
              (pack: Pack) => {
                // Réutiliser la même logique d'images...
                let baseImageUrl =
                  "https://images.unsplash.com/photo-1624272909636-4995421e37e7?w=400&h=250&fit=crop";
                let images: string[] = [];
                let partnerName = "Partenaire Local";

                if (
                  pack.title &&
                  typeof pack.title === "string" &&
                  pack.title.toLowerCase().includes("tsingy")
                ) {
                  baseImageUrl =
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop";
                  images = [
                    baseImageUrl,
                    "https://images.unsplash.com/photo-1624272909636-4995421e37e7?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=400&h=250&fit=crop",
                  ];
                  partnerName = "Tsingy Explorer";
                } else if (
                  pack.title &&
                  typeof pack.title === "string" &&
                  (pack.title
                    .toLowerCase()
                    .includes("andasibe") ||
                    pack.title.toLowerCase().includes("lemur"))
                ) {
                  baseImageUrl =
                    "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=400&h=250&fit=crop";
                  images = [
                    baseImageUrl,
                    "https://images.unsplash.com/photo-1700077254075-c426ed0caafa?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1598563426949-bbff8101ed13?w=400&h=250&fit=crop",
                  ];
                  partnerName = "Andasibe Nature";
                } else if (
                  pack.title &&
                  typeof pack.title === "string" &&
                  pack.title.toLowerCase().includes("nosy be")
                ) {
                  baseImageUrl =
                    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop";
                  images = [
                    baseImageUrl,
                    "https://images.unsplash.com/photo-1483651646696-c1b5fe39fc0e?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=250&fit=crop",
                  ];
                  partnerName = "Nosy Be Écolodge";
                } else if (
                  pack.title &&
                  typeof pack.title === "string" &&
                  pack.title.toLowerCase().includes("baobab")
                ) {
                  baseImageUrl =
                    "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=400&h=250&fit=crop";
                  images = [
                    baseImageUrl,
                    "https://images.unsplash.com/photo-1734368779443-f1f1d7ea6e45?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
                  ];
                  partnerName = "Allée des Baobabs";
                } else {
                  images = [
                    baseImageUrl,
                    "https://images.unsplash.com/photo-1734368779443-f1f1d7ea6e45?w=400&h=250&fit=crop",
                    "https://images.unsplash.com/photo-1597426061335-e50c8697630b?w=400&h=250&fit=crop",
                  ];
                }

                return {
                  ...pack,
                  imageUrl: baseImageUrl,
                  images: images,
                  partner: {
                    id: `partner-${pack.id}`,
                    name: partnerName,
                    logo: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=100&h=100&fit=crop",
                  },
                  is_favorite: user
                    ? Math.random() > 0.7
                    : false,
                  interests: getPackInterests(pack),
                };
              },
            );

            // ✅ Extraire les locations uniques depuis les nouveaux packs (avec vérification de sécurité)
            const newUniqueLocations = [
              ...new Set(
                newPacksWithImages
                  .map((pack) => pack.location)
                  .filter(
                    (location) =>
                      location &&
                      typeof location === "string" &&
                      location.trim() !== "",
                  ),
              ),
            ].sort();

            setAllPacks(newPacksWithImages);
            setFilteredPacks(newPacksWithImages);
            setLocations(newUniqueLocations);
            console.log(
              "📍 PackCatalogSimple - Locations extraites:",
              newUniqueLocations,
            );
            console.log(
              "🔄 PackCatalogSimple - Synchronisation avec HomePage: OK",
            );
          }

          if (
            Array.isArray(newCategoriesData) &&
            newCategoriesData.length > 0
          ) {
            setCategories(newCategoriesData);
          }
        } catch (initError) {
          console.error(
            "❌ [PackCatalog] Failed to initialize database:",
            initError,
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ [PackCatalog] Erreur lors du chargement:",
        error,
      );
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(packId: string) {
    if (!user) {
      toast.error(
        "Vous devez être connecté pour ajouter des favoris",
      );
      return;
    }

    setFavoriteLoading(packId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatePack = (pack: Pack) =>
        pack.id === packId
          ? { ...pack, is_favorite: !pack.is_favorite }
          : pack;

      setAllPacks((prevPacks) => prevPacks.map(updatePack));
      setFilteredPacks((prevPacks) =>
        prevPacks.map(updatePack),
      );

      const pack = allPacks.find((p) => p.id === packId);
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
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-MG").format(price) + " Ar";
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      category: [], // ✅ Array vide
      difficulty_level: [], // ✅ Array vide
      price_range: [0, 2000000],
      duration_range: [1, 10],
      interests: [],
      regions: [], // ✅ Reset du filtre régions
      max_participants: undefined, // ✅ Reset du filtre voyageurs
    });
  };

  const handlePackClick = (pack: Pack) => {
    if (onPackSelect) {
      onPackSelect(pack);
    }
  };

  const hasActiveFilters = () => {
    return (
      filters.search.trim() !== "" ||
      filters.category.length > 0 || // ✅ Check array length
      filters.difficulty_level.length > 0 || // ✅ Check array length
      filters.price_range[0] !== 0 ||
      filters.price_range[1] !== 2000000 ||
      filters.duration_range[0] !== 1 ||
      filters.duration_range[1] !== 10 ||
      filters.interests.length > 0 ||
      filters.regions.length > 0 || // ✅ Check filtre régions
      filters.max_participants !== undefined // ✅ Check filtre voyageurs
    );
  };

  const totalPages = Math.ceil(
    filteredPacks.length / PACKS_PER_PAGE,
  );
  const startIndex = (currentPage - 1) * PACKS_PER_PAGE;
  const endIndex = startIndex + PACKS_PER_PAGE;
  const currentPacks = filteredPacks.slice(
    startIndex,
    endIndex,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex gap-1 min-h-screen">
      {/* 🔧 CORRECTION #1: Sidebar avec overflow-visible pour que les dropdowns ne soient pas coupés */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-6 h-fit max-h-[calc(100vh-3rem)] bg-card overflow-visible flex flex-col rounded-lg">
          {/* Header fixe */}
          <div className="bg-card p-[16px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h5 className="text-primary">Filtres</h5>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-visible space-y-4 px-6 pb-6">
            {/* Barre de recherche */}
            <div className="space-y-4">
              <label className="text-muted-foreground">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des packs..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  className="pl-10 bg-input-background border-border"
                />
              </div>
            </div>

            {/* 🔧 CORRECTION : Espacement harmonisé à space-y-4 (16px) */}
            <div className="space-y-4">
              {/* Catégories */}
              <div className="space-y-4">
                <label className="text-muted-foreground">
                  Catégories
                </label>

                {/* Dropdown personnalisé */}
                <div className="relative" data-dropdown>
                  <button
                    onClick={() =>
                      setCategoryDropdownOpen(
                        !categoryDropdownOpen,
                      )
                    }
                    className={cn(
                      "w-full text-left justify-between rounded-md flex items-center",
                      // ✅ Style conforme au GasyWayInput design system
                      "bg-input-background border border-border h-10 px-3",
                      "transition-all duration-200",
                      "hover:bg-input-background/80 hover:border-primary/50",
                      "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2",
                      // ✅ Couleur placeholder ou contenu
                      filters.category.length === 0
                        ? "text-muted-foreground/40"
                        : "text-foreground",
                    )}
                  >
                    <span>
                      {filters.category.length === 0
                        ? "Sélectionner des catégories"
                        : `${filters.category.length} catégorie${filters.category.length > 1 ? "s" : ""} sélectionnée${filters.category.length > 1 ? "s" : ""}`}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground/40 transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* 🔧 CORRECTION #1: z-index augmenté à z-[200] pour passer au dessus du Card */}
                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-[200] max-h-48 overflow-y-auto">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() =>
                            toggleSelection(
                              "category",
                              category.id,
                            )
                          }
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted text-left transition-colors"
                        >
                          <div
                            className={`w-4 h-4 border rounded transition-colors ${
                              filters.category.includes(
                                category.id,
                              )
                                ? "bg-primary border-primary"
                                : "border-border bg-background"
                            }`}
                          >
                            {filters.category.includes(
                              category.id,
                            ) && (
                              <Check className="w-3 h-3 text-primary-foreground m-0.5" />
                            )}
                          </div>
                          <span>
                            {category.icon} {category.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chips des catégories sélectionnées */}
                {filters.category.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.category.map((categoryId) => {
                      const category = categories.find(
                        (c) => c.id === categoryId,
                      );
                      return category ? (
                        <div
                          key={categoryId}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
                        >
                          <span>
                            {category.icon} {category.name}
                          </span>
                          <button
                            onClick={() =>
                              removeSelection(
                                "category",
                                categoryId,
                              )
                            }
                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Niveaux de difficulté */}
              <div className="space-y-4">
                <label className="text-muted-foreground">
                  Niveaux de difficulté
                </label>

                <div className="relative" data-dropdown>
                  <button
                    onClick={() =>
                      setDifficultyDropdownOpen(
                        !difficultyDropdownOpen,
                      )
                    }
                    className={cn(
                      "w-full text-left justify-between rounded-md flex items-center",
                      // ✅ Style conforme au GasyWayInput design system
                      "bg-input-background border border-border h-10 px-3",
                      "transition-all duration-200",
                      "hover:bg-input-background/80 hover:border-primary/50",
                      "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2",
                      // ✅ Couleur placeholder ou contenu
                      filters.difficulty_level.length === 0
                        ? "text-muted-foreground/40"
                        : "text-foreground",
                    )}
                  >
                    <span>
                      {filters.difficulty_level.length === 0
                        ? "Sélectionner des niveaux"
                        : `${filters.difficulty_level.length} niveau${filters.difficulty_level.length > 1 ? "x" : ""} sélectionné${filters.difficulty_level.length > 1 ? "s" : ""}`}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground/40 transition-transform ${difficultyDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {difficultyDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-[200] max-h-48 overflow-y-auto">
                      {difficultyOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() =>
                            toggleSelection(
                              "difficulty_level",
                              option.id,
                            )
                          }
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted text-left transition-colors"
                        >
                          <div
                            className={`w-4 h-4 border rounded transition-colors ${
                              filters.difficulty_level.includes(
                                option.id,
                              )
                                ? "bg-primary border-primary"
                                : "border-border bg-background"
                            }`}
                          >
                            {filters.difficulty_level.includes(
                              option.id,
                            ) && (
                              <Check className="w-3 h-3 text-primary-foreground m-0.5" />
                            )}
                          </div>
                          <span>
                            {option.icon} {option.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chips des niveaux sélectionnés */}
                {filters.difficulty_level.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.difficulty_level.map((levelId) => {
                      const level = difficultyOptions.find(
                        (l) => l.id === levelId,
                      );
                      return level ? (
                        <div
                          key={levelId}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
                        >
                          <span>
                            {level.icon} {level.name}
                          </span>
                          <button
                            onClick={() =>
                              removeSelection(
                                "difficulty_level",
                                levelId,
                              )
                            }
                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Centres d'intérêt */}
              <div className="space-y-4">
                <label className="text-muted-foreground">
                  Centres d'intérêt
                </label>

                <div className="relative" data-dropdown>
                  <button
                    onClick={() =>
                      setInterestsDropdownOpen(
                        !interestsDropdownOpen,
                      )
                    }
                    className={cn(
                      "w-full text-left justify-between rounded-md flex items-center",
                      // ✅ Style conforme au GasyWayInput design system
                      "bg-input-background border border-border h-10 px-3",
                      "transition-all duration-200",
                      "hover:bg-input-background/80 hover:border-primary/50",
                      "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2",
                      // ✅ Couleur placeholder ou contenu
                      filters.interests.length === 0
                        ? "text-muted-foreground/40"
                        : "text-foreground",
                    )}
                  >
                    <span>
                      {filters.interests.length === 0
                        ? "Sélectionner des centres d'intérêt"
                        : `${filters.interests.length} intérêt${filters.interests.length > 1 ? "s" : ""} sélectionné${filters.interests.length > 1 ? "s" : ""}`}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground/40 transition-transform ${interestsDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {interestsDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-[200] max-h-48 overflow-y-auto">
                      {getActiveInterests().map((interest) => (
                        <button
                          key={interest.id}
                          onClick={() =>
                            toggleSelection(
                              "interests",
                              interest.id,
                            )
                          }
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted text-left transition-colors"
                        >
                          <div
                            className={`w-4 h-4 border rounded transition-colors ${
                              filters.interests.includes(
                                interest.id,
                              )
                                ? "bg-primary border-primary"
                                : "border-border bg-background"
                            }`}
                          >
                            {filters.interests.includes(
                              interest.id,
                            ) && (
                              <Check className="w-3 h-3 text-primary-foreground m-0.5" />
                            )}
                          </div>
                          <span>
                            {interest.icon} {interest.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chips des intérêts sélectionnés */}
                {filters.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.interests.map((interestId) => {
                      const interest =
                        getActiveInterests().find(
                          (i) => i.id === interestId,
                        );
                      return interest ? (
                        <div
                          key={interestId}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
                        >
                          <span>
                            {interest.icon} {interest.name}
                          </span>
                          <button
                            onClick={() =>
                              removeSelection(
                                "interests",
                                interestId,
                              )
                            }
                            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Destinations (Locations) */}
              <div className="space-y-4">
                <label className="text-muted-foreground">
                  Destinations
                </label>

                <div className="relative" data-dropdown>
                  <button
                    onClick={() =>
                      setRegionsDropdownOpen(
                        !regionsDropdownOpen,
                      )
                    }
                    className={cn(
                      "w-full text-left justify-between rounded-md flex items-center",
                      // ✅ Style conforme au GasyWayInput design system
                      "bg-input-background border border-border h-10 px-3",
                      "transition-all duration-200",
                      "hover:bg-input-background/80 hover:border-primary/50",
                      "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2",
                      // ✅ Couleur placeholder ou contenu
                      filters.regions.length === 0
                        ? "text-muted-foreground/40"
                        : "text-foreground",
                    )}
                  >
                    <span>
                      {filters.regions.length === 0
                        ? "Sélectionner des destinations"
                        : `${filters.regions.length} destination${filters.regions.length > 1 ? "s" : ""} sélectionnée${filters.regions.length > 1 ? "s" : ""}`}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground/40 transition-transform ${regionsDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {regionsDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-[200] max-h-48 overflow-y-auto">
                      {locations.map((location) => (
                        <button
                          key={location}
                          onClick={() =>
                            toggleSelection("regions", location)
                          }
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted text-left transition-colors"
                        >
                          <div
                            className={`w-4 h-4 border rounded transition-colors ${
                              filters.regions.includes(location)
                                ? "bg-primary border-primary"
                                : "border-border bg-background"
                            }`}
                          >
                            {filters.regions.includes(
                              location,
                            ) && (
                              <Check className="w-3 h-3 text-primary-foreground m-0.5" />
                            )}
                          </div>
                          <span>📍 {location}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chips des destinations sélectionnées */}
                {filters.regions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.regions.map((location) => (
                      <div
                        key={location}
                        className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
                      >
                        <span>📍 {location}</span>
                        <button
                          onClick={() =>
                            removeSelection("regions", location)
                          }
                          className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 🔧 CORRECTION #3: Sliders avec double curseur style Airbnb */}
              {/* Filtre prix avec graphique */}
              <div className="space-y-6">
                <label className="text-muted-foreground">
                  Gamme de prix
                </label>

                {/* Graphique de distribution */}
                <div className="h-12 bg-muted/30 rounded-md p-2 flex items-end gap-0.5 bg-[rgba(236,236,240,0)]">
                  {getPriceDistribution().map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-accent/70 rounded-sm transition-all duration-300"
                        style={{
                          height: `${Math.max(height, 5)}%`,
                        }}
                      />
                    ),
                  )}
                </div>

                {/* Double slider prix */}
                <div className="space-y-4">
                  <Slider
                    value={filters.price_range}
                    onValueChange={handlePriceSliderChange}
                    max={2000000}
                    min={0}
                    step={50000}
                    className="w-full"
                  />

                  {/* Inputs éditables */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-muted-foreground">
                        Minimum
                      </label>
                      <Input
                        type="text"
                        value={
                          priceInputs.min >= 2000000
                            ? "2 000 000+"
                            : new Intl.NumberFormat(
                                "fr-MG",
                              ).format(priceInputs.min)
                        }
                        onChange={(e) =>
                          handlePriceInputChange(
                            "min",
                            e.target.value,
                          )
                        }
                        className="text-center bg-input-background border-border"
                        placeholder="0 Ar"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-muted-foreground">
                        Maximum
                      </label>
                      <Input
                        type="text"
                        value={
                          priceInputs.max >= 2000000
                            ? "2 000 000+"
                            : new Intl.NumberFormat(
                                "fr-MG",
                              ).format(priceInputs.max)
                        }
                        onChange={(e) =>
                          handlePriceInputChange(
                            "max",
                            e.target.value,
                          )
                        }
                        className="text-center bg-input-background border-border"
                        placeholder="2 000 000+"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtre durée avec graphique */}
              <div className="space-y-6">
                <label className="text-muted-foreground">
                  Durée (jours)
                </label>

                {/* Graphique de distribution */}
                <div className="h-12 bg-muted/30 rounded-md p-2 flex items-end gap-0.5 bg-[rgba(236,236,240,0)]">
                  {getDurationDistribution().map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex-1 bg-primary/40 rounded-sm transition-all duration-300"
                        style={{
                          height: `${Math.max(height, 5)}%`,
                        }}
                      />
                    ),
                  )}
                </div>

                {/* Double slider durée */}
                <div className="space-y-4">
                  <Slider
                    value={filters.duration_range}
                    onValueChange={handleDurationSliderChange}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />

                  {/* Inputs éditables */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-muted-foreground">
                        Minimum
                      </label>
                      <Input
                        type="number"
                        value={durationInputs.min}
                        onChange={(e) =>
                          handleDurationInputChange(
                            "min",
                            e.target.value,
                          )
                        }
                        min={1}
                        max={10}
                        className="text-center bg-input-background border-border"
                        placeholder="1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-muted-foreground">
                        Maximum
                      </label>
                      <Input
                        type="number"
                        value={durationInputs.max}
                        onChange={(e) =>
                          handleDurationInputChange(
                            "max",
                            e.target.value,
                          )
                        }
                        min={1}
                        max={10}
                        className="text-center bg-input-background border-border"
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone principale des résultats */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Chargement des packs...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header avec nombre de résultats */}
            <div className="flex items-center justify-between">
              <div>
                <h2>Expériences uniques à Madagascar</h2>
                <p className="text-muted-foreground">
                  {filteredPacks.length} pack
                  {filteredPacks.length > 1 ? "s" : ""}
                  {hasActiveFilters()
                    ? " correspondant à vos critères"
                    : " disponible"}
                  {filteredPacks.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Grille des résultats */}
            {filteredPacks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Aucun pack ne correspond à vos critères.
                </p>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {currentPacks.map((pack) => (
                  <PackCard
                    key={pack.id}
                    pack={pack}
                    onFavoriteToggle={toggleFavorite}
                    favoriteLoading={
                      favoriteLoading === pack.id
                    }
                    onClick={() => handlePackClick(pack)}
                    showLoginButton={!user}
                    onLoginRequest={onLoginRequest}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 &&
                        handlePageChange(currentPage - 1)
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />

                    {Array.from(
                      { length: totalPages },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages &&
                        handlePageChange(currentPage + 1)
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}