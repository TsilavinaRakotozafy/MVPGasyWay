import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import { Calendar as CalendarComponent } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Heart,
  MapPin,
  Users,
  Calendar,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Share2,
  MessageCircle,
  Camera,
  Grid3X3,
  CalendarIcon,
  Plus,
  Minus,
  Info,
  Route,
  FileText,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  Phone,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useAuth } from "../../contexts/AuthContextSQL";
import { toast } from "sonner@2.0.3";
import { cn } from "../ui/utils";
import Masonry from "react-responsive-masonry";
import {
  getPackInterests,
  mockInterests,
} from "../../utils/interestsData";
import { getPackReviews, Review } from "../../utils/packsData";
import PackFAQSection from "./PackFAQSection";

type PackType =
  | "discovery"
  | "adventure"
  | "cultural"
  | "relaxation"
  | "business";

interface Pack {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  price: number;
  currency?: string;
  duration_days: number;
  max_participants: number;
  min_participants: number;
  location?: string;
  category_id?: string;
  status?: "active" | "inactive" | "archived";
  difficulty_level?:
    | "easy"
    | "medium"
    | "hard"
    | 1
    | 2
    | 3
    | 4
    | 5;
  type?: PackType;
  region_name?: string;
  partner_name?: string;
  rating?: number;
  total_reviews?: number;
  included_services: string[];
  excluded_services?: string[];
  images?: string[];
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
  available_dates?: string[];
  is_favorite?: boolean;
  imageUrl?: string;
  created_by?: string;
  season_start?: string;
  season_end?: string;
  cancellation_policy?: string;
  category?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
  };
}

// Interface Review maintenant importée depuis packsData

interface BookingForm {
  date: string;
  participants: string;
  special_requests: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

interface PackDetailProps {
  pack: Pack;
  onBack: () => void;
  onToggleFavorite: (packId: string) => void;
  favoriteLoading: boolean;
  onLoginRequest?: () => void;
}

// Les reviews sont maintenant chargées dynamiquement depuis Supabase

const packTypeLabels: Record<PackType, string> = {
  discovery: "Découverte",
  adventure: "Aventure",
  cultural: "Culturel",
  relaxation: "Détente",
  business: "Affaires",
};

const typeColors: Record<PackType, string> = {
  discovery: "bg-blue-100 text-blue-800",
  adventure: "bg-orange-100 text-orange-800",
  cultural: "bg-purple-100 text-purple-800",
  relaxation: "bg-green-100 text-green-800",
  business: "bg-gray-100 text-gray-800",
};

export function PackDetail({
  pack,
  onBack,
  onToggleFavorite,
  favoriteLoading,
  onLoginRequest,
}: PackDetailProps) {
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);
  const [isBookingDialogOpen, setIsBookingDialogOpen] =
    useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Images de la galerie
  const galleryImages = [
    pack.imageUrl ||
      `https://via.placeholder.com/800x400/2563eb/ffffff?text=${encodeURIComponent(pack.title.substring(0, 20))}`,
    "https://images.unsplash.com/photo-1624272909636-4995421e37e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWRhZ2FzY2FyJTIwbGFuZHNjYXBlfGVufDF8fHx8MTc1Njk5MzA0Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1659944975073-453265ccf3a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWRhZ2FzY2FyJTIwYmFvYmFifGVufDF8fHx8MTc1NzA1ODA4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1700146606640-0202e6463425?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWRhZ2FzY2FyJTIwbGVtdXJ8ZW58MXx8fHwxNzU3MDU4MDkzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1627475086303-7fe5958555ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWRhZ2FzY2FyJTIwdHNpbmd5fGVufDF8fHx8MTc1NzA1ODA5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1620993464273-0f640df30b0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWRhZ2FzY2FyJTIwYmVhY2h8ZW58MXx8fHwxNTU3MDU4MTAyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  ];

  // État pour la sélection de dates et participants
  const [selectedStartDate, setSelectedStartDate] = useState<
    Date | undefined
  >(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<
    Date | undefined
  >(undefined);
  const [travelers, setTravelers] = useState({
    adults: pack.min_participants,
    children: 0,
    babies: 0,
  });
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [travelersOpen, setTravelersOpen] = useState(false);

  const [bookingForm, setBookingForm] = useState<BookingForm>({
    date: "",
    participants: pack.min_participants.toString(),
    special_requests: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  });

  // Charger les avis du pack
  useEffect(() => {
    const loadReviews = async () => {
      setReviewsLoading(true)
      try {
        const packReviews = await getPackReviews(pack.id)
        setReviews(packReviews)
      } catch (error) {
        console.error('Erreur lors du chargement des avis:', error)
        toast.error('Impossible de charger les avis')
      } finally {
        setReviewsLoading(false)
      }
    }

    loadReviews()
  }, [pack.id])

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getDifficultyLabel = (
    level?: "easy" | "medium" | "hard" | number,
  ) => {
    if (typeof level === "string") {
      const labels = {
        easy: "Facile",
        medium: "Modéré",
        hard: "Difficile",
      };
      return labels[level] || "Non défini";
    }

    if (typeof level === "number") {
      const labels = [
        "Très facile",
        "Facile",
        "Modéré",
        "Difficile",
        "Très difficile",
      ];
      return labels[level - 1] || "Non défini";
    }

    return "Non défini";
  };

  const getDifficultyColor = (
    level?: "easy" | "medium" | "hard" | number,
  ) => {
    if (typeof level === "string") {
      const colors = {
        easy: "bg-green-100 text-green-800",
        medium: "bg-yellow-100 text-yellow-800",
        hard: "bg-red-100 text-red-800",
      };
      return colors[level] || "bg-gray-100 text-gray-800";
    }

    if (typeof level === "number") {
      const colors = [
        "bg-green-100 text-green-800",
        "bg-yellow-100 text-yellow-800",
        "bg-orange-100 text-orange-800",
        "bg-red-100 text-red-800",
        "bg-purple-100 text-purple-800",
      ];
      return colors[level - 1] || "bg-gray-100 text-gray-800";
    }

    return "bg-gray-100 text-gray-800";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-MG").format(price) + " Ar";
  };

  const handleBooking = async () => {
    if (!user) {
      if (onLoginRequest) {
        onLoginRequest();
      } else {
        toast.error(
          "Vous devez être connecté pour faire une réservation",
        );
      }
      return;
    }

    if (
      !bookingForm.date ||
      !bookingForm.contact_name ||
      !bookingForm.contact_email ||
      !bookingForm.contact_phone
    ) {
      toast.error(
        "Veuillez remplir tous les champs obligatoires",
      );
      return;
    }

    setBookingLoading(true);

    try {
      // Simuler un appel API de réservation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success(
        "Demande de réservation envoyée avec succès ! Nous vous contacterons sous 24h.",
      );
      setIsBookingDialogOpen(false);

      // Réinitialiser le formulaire
      setBookingForm({
        date: "",
        participants: pack.min_participants.toString(),
        special_requests: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
      });
    } catch (error) {
      console.error("Erreur réservation:", error);
      toast.error(
        "Erreur lors de l'envoi de la demande de réservation",
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: pack.title,
        text: pack.short_description,
        url: window.location.href,
      });
    } else {
      // Copier l'URL dans le presse-papiers
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  // Filtrer les avis selon showAllReviews
  const displayedReviews = showAllReviews
    ? reviews
    : reviews.slice(0, 2);
  const totalPrice =
    parseInt(bookingForm.participants) * pack.price;

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au catalogue
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleFavorite(pack.id)}
              disabled={favoriteLoading}
            >
              <Heart
                className={`h-4 w-4 ${
                  pack.is_favorite
                    ? "text-red-500 fill-red-500"
                    : "text-gray-600"
                } ${favoriteLoading ? "animate-pulse" : ""}`}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Galerie d'images masonry */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-[0px] rounded-[0px]">
          <div className="grid grid-cols-12 gap-2 h-96 overflow-hidden !border-none !border-0 !outline-none !ring-0 !shadow-none -mb-6" style={{border: 'none', outline: 'none', boxShadow: 'none'}}>
            {/* Image principale - 50% de largeur */}
            <div className="col-span-6 relative rounded-lg overflow-hidden">
              <ImageWithFallback
                src={galleryImages[0]}
                alt={pack.title}
                className="w-full h-full object-cover rounded-lg"
              />

              {/* Overlay avec badges */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-[16px] overflow-hidden" />
              <div className="absolute top-4 left-4 flex gap-2">
                {pack.type && (
                  <Badge className={typeColors[pack.type]}>
                    {packTypeLabels[pack.type]}
                  </Badge>
                )}
                {pack.is_featured && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    ⭐ Pack vedette
                  </Badge>
                )}
                <Badge
                  className={getDifficultyColor(
                    pack.difficulty_level,
                  )}
                >
                  {getDifficultyLabel(pack.difficulty_level)}
                </Badge>
              </div>

              {/* Note en bas à droite */}
              {pack.average_rating && pack.average_rating > 0 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-sm">
                    {pack.average_rating}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ({pack.total_reviews || 0} avis)
                  </span>
                </div>
              )}
            </div>

            {/* Grille 2x2 des images secondaires - 50% de largeur */}
            <div className="col-span-6 relative">
              <div className="grid grid-cols-2 gap-2 h-full">
                {galleryImages
                  .slice(1, 5)
                  .map((image, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer overflow-hidden rounded-lg h-[186px]"
                    >
                      <ImageWithFallback
                        src={image}
                        alt={`${pack.title} - Image ${index + 2}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    </div>
                  ))}
              </div>

              {/* Bouton "Afficher toutes les photos" */}
              <div className="absolute bottom-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("navigate-to-gallery", {
                        detail: pack,
                      }),
                    )
                  }
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  Afficher toutes les photos
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal pour voir toutes les photos */}
      <Dialog
        open={showAllPhotos}
        onOpenChange={setShowAllPhotos}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Photos - {pack.title}</DialogTitle>
            <DialogDescription>
              Galerie complète du pack touristique
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="aspect-square relative overflow-hidden rounded-lg group cursor-pointer"
              >
                <ImageWithFallback
                  src={image}
                  alt={`${pack.title} - Image ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Titre et description compacte */}
          <Card className="border-none">
            <CardHeader>
              <CardTitle>{pack.title}</CardTitle>
              <CardDescription>
                {pack.short_description ||
                  (pack.description &&
                    pack.description.substring(0, 100) + "...")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">
                      Région
                    </p>
                    <p>
                      {pack.region_name ||
                        pack.location ||
                        "Non spécifié"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">
                      Durée
                    </p>
                    <p>
                      {pack.duration_days} jour
                      {pack.duration_days > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">
                      Participants
                    </p>
                    <p>
                      {pack.min_participants}-
                      {pack.max_participants}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">
                      Dates
                    </p>
                    <p>
                      {pack.available_dates?.length || 0}{" "}
                      disponibles
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Système de tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-secondary/30">
                  <TabsTrigger
                    value="details"
                    className="flex items-center gap-2"
                  >
                    <Info className="h-4 w-4" />
                    Détails
                  </TabsTrigger>
                  <TabsTrigger
                    value="itinerary"
                    className="flex items-center gap-2"
                  >
                    <Route className="h-4 w-4" />
                    Itinéraire
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Avis
                  </TabsTrigger>
                  <TabsTrigger
                    value="faq"
                    className="flex items-center gap-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    FAQ
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancellation"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Annulation
                  </TabsTrigger>
                </TabsList>

                {/* Tab Détails */}
                <TabsContent
                  value="details"
                  className="p-6 space-y-6"
                >
                  <div>
                    <h4>Description détaillée</h4>
                    <p className="text-muted-foreground leading-relaxed px-[0px] py-[8px]">
                      {pack.description}
                    </p>
                  </div>

                  {/* Centres d'intérêt */}
                  <div>
                    <h5>Centres d'intérêt</h5>
                    <div className="flex flex-wrap gap-2 px-[0px] py-[8px]">
                      {getPackInterests(pack).map(
                        (interestId) => {
                          const interest = mockInterests.find(
                            (i) => i.id === interestId,
                          );
                          return interest ? (
                            <Badge
                              key={interestId}
                              variant="outline"
                            >
                              {interest.icon} {interest.name}
                            </Badge>
                          ) : null;
                        },
                      )}
                      {getPackInterests(pack).length === 0 && (
                        <p className="text-muted-foreground">
                          Aucun centre d'intérêt spécifique
                          assigné.
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Services inclus/exclus */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-green-700 mb-4">
                        <CheckCircle className="h-5 w-5" />
                        Services inclus
                      </h4>
                      <ul className="space-y-2">
                        {(pack.included_services || []).map(
                          (service, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{service}</span>
                            </li>
                          ),
                        )}
                        {(!pack.included_services ||
                          pack.included_services.length ===
                            0) && (
                          <li className="text-muted-foreground">
                            Aucun service inclus spécifié
                          </li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="flex items-center gap-2 text-red-700 mb-4">
                        <XCircle className="h-5 w-5" />
                        Non inclus
                      </h4>
                      <ul className="space-y-2">
                        {pack.excluded_services?.map(
                          (service, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2"
                            >
                              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{service}</span>
                            </li>
                          ),
                        ) || (
                          <li className="text-muted-foreground">
                            Aucun service exclu spécifié
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Itinéraire */}
                <TabsContent
                  value="itinerary"
                  className="p-6 space-y-6"
                >
                  <div>
                    <h4>Itinéraire détaillé</h4>
                    <p className="text-muted-foreground mb-6">
                      Programme jour par jour de votre séjour
                    </p>
                  </div>

                  <div className="space-y-4">
                    {Array.from(
                      { length: pack.duration_days },
                      (_, index) => (
                        <Card
                          key={index}
                          className="border-l-4 border-accent"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4>Jour {index + 1}</h4>
                                <p className="text-muted-foreground">
                                  {index === 0 &&
                                    "Arrivée et découverte des environs"}
                                  {index === 1 &&
                                    "Visite guidée et activités principales"}
                                  {index === 2 &&
                                    "Exploration libre et détente"}
                                  {index > 2 &&
                                    `Activités spécialisées jour ${index + 1}`}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ),
                    )}
                  </div>
                </TabsContent>

                {/* Tab Avis */}
                <TabsContent value="reviews" className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Colonne gauche : Récapitulatif + Barres de progression */}
                    {/* Afficher la section avis seulement s'il y a des avis */}
                    {(pack.total_reviews > 0 || reviews.length > 0) && (
                      <div className="lg:col-span-1 space-y-6">
                        {/* Récapitulatif centré */}
                        <div className="flex flex-col items-center space-y-4">
                          <div className="text-center">
                            <div className="space-y-2">
                              {pack.average_rating && pack.average_rating > 0
                                ? pack.average_rating.toFixed(1)
                                : "Pas encore noté"}
                            </div>

                            {/* Étoiles */}
                            <div className="flex items-center justify-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < Math.floor(pack.average_rating || 0)
                                      ? "text-accent fill-accent"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>

                            <p className="text-muted-foreground">
                              {pack.total_reviews > 0 
                                ? `basé sur ${pack.total_reviews} avis`
                                : "Aucun avis pour le moment"}
                            </p>
                          </div>
                        </div>

                        {/* Barres de progression - Calculées dynamiquement */}
                        <div className="space-y-1">
                          {/* Distribution des notes calculée depuis les vrais avis */}
                          {(() => {
                            // Calculer la distribution dynamiquement
                            const distribution = [5, 4, 3, 2, 1].map(stars => {
                              const count = reviews.filter(review => review.rating === stars).length;
                              const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                              return { stars, count, percentage };
                            });

                            return distribution.map((item) => (
                              <div
                                key={item.stars}
                                className="flex items-center gap-3"
                              >
                                <span className="w-6 text-muted-foreground">
                                  {item.stars}
                                </span>
                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full bg-accent transition-all duration-300"
                                    style={{
                                      width: `${item.percentage}%`,
                                    }}
                                  />
                                </div>
                                <span className="w-12 text-muted-foreground">
                                  {item.count}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Colonne droite : Liste des avis individuels */}
                    <div className="col-span-full w-full space-y-4">
                      <h4>Avis des clients</h4>
                      {reviewsLoading ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Chargement des avis...</p>
                        </div>
                      ) : displayedReviews.length > 0 ? (
                        <>
                          {displayedReviews.map((review) => (
                            <div
                              key={review.id}
                              className="border-l-4 border-secondary pl-4"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span>{review.user_name}</span>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? "text-accent fill-accent"
                                            : "text-muted-foreground"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <span className="text-muted-foreground">
                                  {formatDate(review.date)}
                                </span>
                              </div>
                              <p className="text-muted-foreground">
                                {review.comment}
                              </p>
                            </div>
                          ))}

                          {/* Bouton pour voir plus d'avis */}
                          {reviews.length > 2 && (
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setShowAllReviews(!showAllReviews)
                                }
                              >
                                {showAllReviews
                                  ? "Voir moins d'avis"
                                  : `Voir tous les avis (${reviews.length})`}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center space-y-4 py-8">
                          <div className="space-y-2">
                            <h5>Aucun avis pour le moment</h5>
                            <p className="text-muted-foreground">
                              Soyez le premier à partager votre expérience avec ce pack !
                            </p>
                          </div>
                          {user ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                  Donner mon avis
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle>Donner votre avis sur {pack.title}</DialogTitle>
                                  <DialogDescription>
                                    Partagez votre expérience pour aider d'autres voyageurs
                                  </DialogDescription>
                                </DialogHeader>
                                <ReviewForm 
                                  packId={pack.id}
                                  packTitle={pack.title}
                                  onSuccess={(newReview) => {
                                    // Ajouter le nouvel avis à la liste
                                    setReviews(prev => [newReview, ...prev]);
                                    toast.success("Votre avis a été publié avec succès !");
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button 
                              variant="outline"
                              onClick={onLoginRequest}
                            >
                              Se connecter pour donner un avis
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab FAQ */}
                <TabsContent value="faq" className="p-6">
                  <PackFAQSection pack={pack} />
                </TabsContent>

                {/* Tab Annulation */}
                <TabsContent
                  value="cancellation"
                  className="p-6 space-y-6"
                >
                  <div>
                    <h4>Politique d'annulation</h4>
                    <p className="text-muted-foreground">
                      Conditions d'annulation et de
                      remboursement
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Card className="border-l-4 border-green-500">
                      <CardContent className="p-4">
                        <h4 className="text-green-700">
                          Annulation gratuite
                        </h4>
                        <p className="text-muted-foreground">
                          Jusqu'à 7 jours avant le départ -
                          Remboursement intégral
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-yellow-500">
                      <CardContent className="p-4">
                        <h4 className="text-yellow-700">
                          Annulation partielle
                        </h4>
                        <p className="text-muted-foreground">
                          Entre 3 et 7 jours avant le départ -
                          Remboursement à 50%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-red-500">
                      <CardContent className="p-4">
                        <h4 className="text-red-700">
                          Aucun remboursement
                        </h4>
                        <p className="text-muted-foreground">
                          Moins de 3 jours avant le départ ou en
                          cas de non-présentation
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h4>Conditions particulières</h4>
                    <div className="space-y-2 text-muted-foreground">
                      <p>
                        • Les modifications de dates sont
                        possibles sous réserve de disponibilité
                      </p>
                      <p>
                        • En cas de force majeure, un report ou
                        remboursement intégral sera proposé
                      </p>
                      <p>
                        • Les frais de service (3% du montant
                        total) ne sont pas remboursables
                      </p>
                      <p>
                        • Contactez notre service client pour
                        toute demande d'annulation
                      </p>
                    </div>
                  </div>

                  {pack.cancellation_policy && (
                    <div>
                      <h4>
                        Politique spécifique du partenaire
                      </h4>
                      <p className="text-muted-foreground">
                        {pack.cancellation_policy}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite : Sidebar de réservation */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{formatPrice(pack.price)}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  par personne
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sélection de dates */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Date d'arrivée</Label>
                  <Popover
                    open={startDateOpen}
                    onOpenChange={setStartDateOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        className={cn(
                          "w-full text-left justify-between",
                          // ✅ Style conforme au GasyWayInput design system (pas de variant outline)
                          "bg-input-background border border-border h-10",
                          "transition-all duration-200",
                          "hover:bg-input-background/80 hover:border-primary/50",
                          "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2",
                          // ✅ Couleur texte normale quand date sélectionnée
                          selectedStartDate ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 shrink-0" />
                        <span>
                          {selectedStartDate
                            ? selectedStartDate.toLocaleDateString(
                                "fr-FR",
                              )
                            : "Arrivée"}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <CalendarComponent
                      mode="single"
                      selected={selectedStartDate}
                      onSelect={setSelectedStartDate}
                      initialFocus
                    />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">Date de départ</Label>
                  <Popover
                    open={endDateOpen}
                    onOpenChange={setEndDateOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id="end-date"
                        className={cn(
                          "w-full text-left justify-between",
                          // ✅ Style conforme au GasyWayInput design system (pas de variant outline)
                          "bg-input-background border border-border h-10",
                          "transition-all duration-200",
                          "hover:bg-input-background/80 hover:border-primary/50",
                          "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2",
                          // ✅ Couleur texte normale quand date sélectionnée
                          selectedEndDate ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 shrink-0" />
                        <span>
                          {selectedEndDate
                            ? selectedEndDate.toLocaleDateString(
                                "fr-FR",
                              )
                            : "Départ"}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <CalendarComponent
                      mode="single"
                      selected={selectedEndDate}
                      onSelect={setSelectedEndDate}
                      initialFocus
                    />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Sélection du nombre de voyageurs */}
              <div className="space-y-2">
                <Label htmlFor="travelers">Nombre de voyageurs</Label>
                <Popover
                  open={travelersOpen}
                  onOpenChange={setTravelersOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="travelers"
                      className={cn(
                        "w-full text-left justify-between",
                        // ✅ Style conforme au GasyWayInput design system (pas de variant outline)
                        "bg-input-background border border-border h-10",
                        "transition-all duration-200",
                        "hover:bg-input-background/80 hover:border-primary/50",
                        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2",
                        "text-foreground", // Toujours du contenu sélectionné
                      )}
                    >
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 shrink-0" />
                      <span>
                        {travelers.adults +
                          travelers.children +
                          travelers.babies}{" "}
                        voyageur
                        {travelers.adults +
                          travelers.children +
                          travelers.babies >
                        1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Adultes</p>
                        <p className="text-sm text-muted-foreground">
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
                                pack.min_participants,
                                prev.adults - 1,
                              ),
                            }))
                          }
                          disabled={
                            travelers.adults <=
                            pack.min_participants
                          }
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
                              adults: Math.min(
                                pack.max_participants,
                                prev.adults + 1,
                              ),
                            }))
                          }
                          disabled={
                            travelers.adults +
                              travelers.children >=
                            pack.max_participants
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p>Enfants</p>
                        <p className="text-sm text-muted-foreground">
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
                          disabled={
                            travelers.adults +
                              travelers.children >=
                            pack.max_participants
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p>Bébés</p>
                        <p className="text-sm text-muted-foreground">
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

              {/* Prix total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span>
                    Total pour{" "}
                    {travelers.adults + travelers.children}{" "}
                    voyageur
                    {travelers.adults + travelers.children > 1
                      ? "s"
                      : ""}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(
                      (travelers.adults + travelers.children) *
                        pack.price,
                    )}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Les bébés voyagent gratuitement
                </p>
              </div>

              {/* Bouton de réservation */}
              <Dialog
                open={isBookingDialogOpen}
                onOpenChange={setIsBookingDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Réserver maintenant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      Réserver votre séjour
                    </DialogTitle>
                    <DialogDescription>
                      Remplissez vos informations pour confirmer
                      votre réservation
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="booking-date">
                        Date souhaitée
                      </Label>
                      <Input
                        id="booking-date"
                        type="date"
                        value={bookingForm.date}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="booking-participants">
                        Nombre de participants
                      </Label>
                      <Select
                        value={bookingForm.participants}
                        onValueChange={(value) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            participants: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-input-background border-border h-10 text-foreground data-[placeholder]:text-muted-foreground">
                          <SelectValue placeholder="Choisir le nombre de participants" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            {
                              length:
                                pack.max_participants -
                                pack.min_participants +
                                1,
                            },
                            (_, i) => (
                              <SelectItem
                                key={i}
                                value={(
                                  pack.min_participants + i
                                ).toString()}
                              >
                                {pack.min_participants + i}{" "}
                                participant
                                {pack.min_participants + i > 1
                                  ? "s"
                                  : ""}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="booking-name">
                        Nom complet
                      </Label>
                      <Input
                        id="booking-name"
                        value={bookingForm.contact_name}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            contact_name: e.target.value,
                          }))
                        }
                        placeholder="Votre nom et prénom"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="booking-email">
                        Email
                      </Label>
                      <Input
                        id="booking-email"
                        type="email"
                        value={bookingForm.contact_email}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            contact_email: e.target.value,
                          }))
                        }
                        placeholder="votre@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="booking-phone">
                        Téléphone
                      </Label>
                      <Input
                        id="booking-phone"
                        type="tel"
                        value={bookingForm.contact_phone}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            contact_phone: e.target.value,
                          }))
                        }
                        placeholder="+261 XX XX XX XXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="booking-requests">
                        Demandes spéciales (optionnel)
                      </Label>
                      <Textarea
                        id="booking-requests"
                        value={bookingForm.special_requests}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            special_requests: e.target.value,
                          }))
                        }
                        placeholder="Régime alimentaire, accessibilité, etc."
                        rows={3}
                      />
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>Total estimé</span>
                        <span className="font-semibold">
                          {formatPrice(totalPrice)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Prix final confirmé après validation
                      </p>
                    </div>

                    <Button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {bookingLoading
                        ? "Envoi en cours..."
                        : "Confirmer la demande"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Section des questions de réservation */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm">Have booking questions?</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">+1 855 275 5071</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat now
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Composant de formulaire pour ajouter un avis
interface ReviewFormProps {
  packId: string;
  packTitle: string;
  onSuccess: (newReview: Review) => void;
}

function ReviewForm({ packId, packTitle, onSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground mb-4">
          Vous devez être connecté pour laisser un avis.
        </p>
        <Button variant="outline">Se connecter</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Veuillez sélectionner une note");
      return;
    }

    if (!comment.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    setIsSubmitting(true);

    try {
      // Appel API pour créer l'avis via Supabase Edge Function
      const { projectId, publicAnonKey } = await import('../../utils/supabase/info');
      
      const requestBody = {
        rating,
        comment: comment.trim(),
        user_id: user.id
      };

      // Ajouter le titre seulement s'il est fourni
      if (title && title.trim()) {
        requestBody.title = title.trim();
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/packs/${packId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la création de l\'avis');
      }

      const data = await response.json();

      // Créer l'objet Review pour mise à jour immédiate
      const newReview: Review = {
        id: data.review_id || Date.now().toString(),
        user_name: `${user.first_name} ${user.last_name ? user.last_name.charAt(0) + '.' : ''}`,
        rating,
        comment: comment.trim(),
        date: new Date().toISOString().split('T')[0]
      };

      onSuccess(newReview);

      // Reset form
      setRating(0);
      setTitle("");
      setComment("");

    } catch (error) {
      console.error('Erreur création avis:', error);
      toast.error("Erreur lors de l'ajout de votre avis");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sélection de la note */}
      <div className="space-y-2">
        <Label>Note globale *</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="hover:scale-110 transition-transform"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-accent text-accent"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {rating > 0 && (
              rating === 1 ? "Décevant" :
              rating === 2 ? "Correct" :
              rating === 3 ? "Bien" :
              rating === 4 ? "Très bien" :
              "Excellent"
            )}
          </span>
        </div>
      </div>

      {/* Titre de l'avis (optionnel) */}
      <div className="space-y-2">
        <Label>Titre de votre avis (optionnel)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Résumez votre expérience..."
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          {title.length}/100 caractères
        </p>
      </div>

      {/* Commentaire */}
      <div className="space-y-2">
        <Label>Votre commentaire *</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partagez votre expérience détaillée avec ce pack..."
          rows={5}
          maxLength={1000}
          required
        />
        <p className="text-xs text-muted-foreground">
          {comment.length}/1000 caractères
        </p>
      </div>

      {/* Informations utilisateur */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm">
          <strong>Publié par :</strong> {user.first_name} {user.last_name ? user.last_name.charAt(0) + '.' : ''}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Votre avis sera publié immédiatement et visible par tous les visiteurs.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSubmitting ? "Publication..." : "Publier mon avis"}
        </Button>
      </div>
    </form>
  );
}