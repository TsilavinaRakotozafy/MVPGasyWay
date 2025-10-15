import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ExperienceCard } from "./ExperienceCard";
import {
  Leaf,
  Handshake,
  Shield,
  Heart,
  Check,
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  CircleDollarSign,
  Compass,
  Sliders,
  Eye,
  Headphones,
  Target,
  Users,
  Award,
  Star,
  LucideIcon,
} from "lucide-react";
import { supabase } from "../../utils/supabase/client";
import { toast } from "sonner@2.0.3";
import { useCompanyInfo } from "../../hooks/useCompanyInfo";

interface Partner {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  website: string | null;
  rating: number | null;
}

interface Stats {
  totalPacks: number;
  totalRegions: number;
  totalInterests: number;
  totalPartners: number;
}

export function AboutPage() {
  const { data: companyInfo, loading: companyLoading } = useCompanyInfo();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPacks: 0,
    totalRegions: 0,
    totalInterests: 0,
    totalPartners: 0,
  });
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Map des icônes disponibles
  const iconMap: Record<string, LucideIcon> = {
    Leaf,
    Handshake,
    Shield,
    Heart,
    Target,
    Users,
    Award,
    Star,
    Compass,
    Eye,
  };

  // Charger les partenaires depuis Supabase
  useEffect(() => {
    async function loadPartnersAndStats() {
      try {
        // Charger les partenaires actifs
        const { data: partnersData, error: partnersError } = await supabase
          .from("partners")
          .select("id, name, description, logo_url, website, rating")
          .eq("status", "active")
          .order("name");

        if (partnersError) {
          console.error("Erreur chargement partenaires:", partnersError);
        } else {
          setPartners(partnersData || []);
        }

        // Charger les statistiques
        const [packsCount, regionsCount, interestsCount, partnersCount] =
          await Promise.all([
            supabase
              .from("packs")
              .select("*", { count: "exact", head: true })
              .eq("status", "active"),
            supabase
              .from("regions")
              .select("*", { count: "exact", head: true })
              .eq("is_active", true),
            supabase
              .from("interests")
              .select("*", { count: "exact", head: true })
              .eq("active", true),
            supabase
              .from("partners")
              .select("*", { count: "exact", head: true })
              .eq("status", "active"),
          ]);

        setStats({
          totalPacks: packsCount.count || 0,
          totalRegions: regionsCount.count || 0,
          totalInterests: interestsCount.count || 0,
          totalPartners: partnersCount.count || 0,
        });
      } catch (err) {
        console.error("Erreur chargement données:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPartnersAndStats();
  }, []);

  // Soumettre le formulaire de contact
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          status: "new",
        },
      ]);

      if (error) {
        console.error("Erreur envoi message:", error);
        toast.error("Erreur lors de l'envoi du message");
      } else {
        toast.success("Message envoyé avec succès !");
        setFormData({ name: "", email: "", subject: "", message: "" });
      }
    } catch (err) {
      console.error("Erreur inattendue:", err);
      toast.error("Une erreur est survenue");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-16 px-4 sm:px-6 lg:px-8 pb-16">
      {/* Hero Section */}
      <div className="relative h-[400px] -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden rounded-[24px]">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1602174423520-daa2d87175a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYWRhZ2FzY2FyJTIwbGFuZHNjYXBlJTIwc3Vuc2V0fGVufDF8fHx8MTc2MDA0NTYyNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="GasyWay - Tourisme Responsable à Madagascar"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-white mb-4">
            {companyInfo?.hero_title || "À propos de GasyWay"}
          </h1>
          <p className="text-white max-w-2xl">
            {companyInfo?.hero_description || "Nous transformons la façon dont vous découvrez Madagascar, en connectant voyageurs et communautés locales pour un tourisme authentique et responsable."}
          </p>
        </div>
      </div>

      {/* Mission & Vision - Grid 2 colonnes */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notre Mission */}
          <Card className="p-8 bg-gradient-to-br from-primary/5 via-white to-primary/10">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-primary">
                {companyInfo?.mission_title || "Notre Mission"}
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                {companyInfo?.mission_description || "GasyWay s'engage à créer des expériences de voyage qui enrichissent à la fois les voyageurs et les communautés locales, tout en préservant la biodiversité unique de Madagascar."}
              </p>
            </div>
          </Card>

          {/* Notre Vision */}
          <Card className="p-8 bg-gradient-to-br from-secondary/20 via-white to-secondary/10">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-primary">
                {companyInfo?.vision_title || "Notre Vision"}
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                {companyInfo?.vision_description || "Faire de Madagascar une destination touristique de référence pour le tourisme responsable et communautaire."}
              </p>
            </div>
          </Card>
        </div>

        {/* Nos Valeurs - Dynamiques depuis admin */}
        {companyInfo?.values && companyInfo.values.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyInfo.values.map((value, index) => {
              const IconComponent = iconMap[value.icon] || Star;
              
              return (
                <Card key={index} className="text-center">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-primary">{value.title}</h4>
                      <p className="text-muted-foreground">
                        {value.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Notre Histoire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h2 className="text-primary">Notre Histoire</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              GasyWay est né d'une passion pour Madagascar et d'une conviction
              profonde : le tourisme peut être une force positive pour les
              communautés locales et l'environnement.
            </p>
            <p className="text-muted-foreground">
              Fondée par des amoureux de la Grande Île, notre plateforme
              connecte directement voyageurs et acteurs locaux du tourisme,
              garantissant des expériences authentiques et un impact économique
              direct sur les régions visitées.
            </p>
            <p className="text-muted-foreground">
              Aujourd'hui, GasyWay travaille avec des dizaines de partenaires
              locaux à travers Madagascar pour offrir des aventures uniques qui
              respectent l'environnement et valorisent le patrimoine culturel
              malgache.
            </p>
          </div>
        </div>

        <div className="relative h-[400px] rounded-2xl overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1557500629-29c45898e875?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYWRhZ2FzY2FyJTIwY29tbXVuaXR5JTIwbG9jYWx8ZW58MXx8fHwxNzYwMDQ1NjI2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Communauté locale à Madagascar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Notre Engagement */}
      <div className="bg-secondary/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 rounded-2xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-primary">
              {companyInfo?.commitment_title || "Notre Engagement"}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              {companyInfo?.commitment_description || "Nous nous engageons à reverser une partie de nos revenus aux communautés locales et à promouvoir un tourisme respectueux de l'environnement."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="text-center bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-primary">Impact Local</h4>
                <p className="text-muted-foreground">
                  Revenus directs aux communautés visitées
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-primary">Éco-responsable</h4>
                <p className="text-muted-foreground">
                  Pratiques durables et respect de la nature
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-primary">Transparence</h4>
                <p className="text-muted-foreground">
                  Informations claires sur nos actions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Impact & Chiffres Clés */}
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-primary">Notre Impact</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Des chiffres qui témoignent de notre engagement pour un tourisme
            responsable et bénéfique pour tous.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <h2 className="text-primary mb-2">{stats.totalPacks}</h2>
                <p className="text-muted-foreground">
                  Expériences proposées
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <h2 className="text-primary mb-2">{stats.totalRegions}</h2>
                <p className="text-muted-foreground">
                  Régions couvertes
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <h2 className="text-primary mb-2">{stats.totalInterests}</h2>
                <p className="text-muted-foreground">
                  Types d'aventures
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <h2 className="text-primary mb-2">{stats.totalPartners}</h2>
                <p className="text-muted-foreground">
                  Partenaires locaux
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Nos Partenaires */}
      {partners.length > 0 && (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-primary">Nos Partenaires</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Nous collaborons avec des acteurs locaux passionnés et engagés
              dans un tourisme responsable à Madagascar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.map((partner, index) => {
              // Images de fallback pour les partenaires Madagascar (resorts, lodges, guides)
              const fallbackImages = [
                "https://images.unsplash.com/photo-1561588431-9c28ffa92ae5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYWRhZ2FzY2FyJTIwcmVzb3J0JTIwYmVhY2h8ZW58MXx8fHwxNzYwMDQ5MjQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
                "https://images.unsplash.com/photo-1601701119533-fde20cecbf4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBsb2RnZSUyMHRyb3BpY2FsfGVufDF8fHx8MTc2MDA0OTI0NHww&ixlib=rb-4.1.0&q=80&w=1080",
                "https://images.unsplash.com/photo-1552873547-b88e7b2760e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwYnVuZ2Fsb3d8ZW58MXx8fHwxNzU5OTg4MjkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
                "https://images.unsplash.com/photo-1758881534770-37ba3e9cd8d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3VyaXN0JTIwZ3VpZGUlMjBhZnJpY2F8ZW58MXx8fHwxNzYwMDQ5MjQ0fDA&ixlib=rb-4.1.0&q=80&w=1080"
              ];
              
              const imageUrl = partner.logo_url || fallbackImages[index % fallbackImages.length];
              
              return (
                <Card
                  key={partner.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => partner.website && window.open(partner.website, "_blank")}
                >
                  <div className="aspect-square relative">
                    <ImageWithFallback
                      src={imageUrl}
                      alt={partner.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <h4>{partner.name}</h4>
                      {partner.description && (
                        <p className="opacity-90 line-clamp-2">
                          {partner.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Pourquoi choisir GasyWay */}
      <div className="space-y-6 px-[0px] py-[80px] m-[0px]">
        <div className="flex items-center justify-center">
          <div>
            <h2 className="text-center">Pourquoi choisir GasyWay ?</h2>
            <p className="text-muted-foreground text-center">
              Parce que voyager n'est pas seulement partir loin, c'est créer des liens et laisser une trace positive.
            </p>
          </div>
        </div>

        <div className="space-y-6 py-[0px] m-[0px] px-[0px] p-[0px]">
          {/* Carrousel horizontal des raisons */}
          <div className="space-y-4 px-[0px] py-[24px]">
            <style>{`
              /* Animations pour les raisons GasyWay */
              @keyframes scroll-perpetual-left-gasyway {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-784px, 0, 0); }
              }
              
              @keyframes scroll-perpetual-right-gasyway {
                0% { transform: translate3d(-784px, 0, 0); }
                100% { transform: translate3d(0, 0, 0); }
              }
              
              .scroll-container-gasyway {
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
              
              .scroll-track-gasyway {
                display: flex;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
                will-change: transform;
              }
              
              .perpetual-left-gasyway {
                animation-name: scroll-perpetual-left-gasyway;
                animation-duration: 30s;
              }
              
              .perpetual-right-gasyway {
                animation-name: scroll-perpetual-right-gasyway;
                animation-duration: 30s;
              }
              
              .scroll-paused-gasyway .scroll-track-gasyway {
                animation-play-state: paused;
              }
              
              .scroll-item-gasyway {
                flex: 0 0 180px;
                margin-right: 16px;
              }
            `}</style>

            {(() => {
              // ✅ 8 raisons de choisir GasyWay avec textes complets en H6
              const reasons = [
                {
                  id: "1",
                  text: "Connexion directe avec les acteurs locaux du tourisme",
                  icon: "🤝",
                },
                {
                  id: "2",
                  text: "Expériences authentiques loin des circuits touristiques classiques",
                  icon: "💚",
                },
                {
                  id: "3",
                  text: "Impact économique direct sur les communautés visitées",
                  icon: "💰",
                },
                {
                  id: "4",
                  text: "Engagement pour la préservation de l'environnement",
                  icon: "🌿",
                },
                {
                  id: "5",
                  text: "Guides passionnés et experts de leur région",
                  icon: "🧭",
                },
                {
                  id: "6",
                  text: "Flexibilité et personnalisation de vos voyages",
                  icon: "⚙️",
                },
                {
                  id: "7",
                  text: "Transparence totale sur les prix et les prestations",
                  icon: "👁️",
                },
                {
                  id: "8",
                  text: "Support client disponible avant, pendant et après votre voyage",
                  icon: "🎧",
                },
              ];

              return reasons.length > 0 ? (
                <>
                  {/* Rangée 1 - défilement perpétuel vers la gauche (4 premiers) */}
                  <div
                    className="scroll-container-gasyway"
                    onMouseEnter={(e) =>
                      e.currentTarget.classList.add(
                        "scroll-paused-gasyway",
                      )
                    }
                    onMouseLeave={(e) =>
                      e.currentTarget.classList.remove(
                        "scroll-paused-gasyway",
                      )
                    }
                  >
                    <div className="scroll-track-gasyway perpetual-left-gasyway">
                      {/* Contenu répété exactement pour créer une boucle invisible */}
                      {[...Array(3)].map((_, iteration) =>
                        reasons
                          .slice(0, 4)
                          .map((reason) => (
                            <div
                              key={`row1-cycle${iteration}-${reason.id}`}
                              className="scroll-item-gasyway"
                            >
                              <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:shadow-accent/20 border-2 hover:border-secondary h-full cursor-pointer">
                                <div className="text-lg mb-1 text-center leading-none">
                                  {reason.icon}
                                </div>
                                <h6 className="m-0 text-center text-primary">
                                  {reason.text}
                                </h6>
                              </Card>
                            </div>
                          )),
                      )}
                    </div>
                  </div>

                  {/* Rangée 2 - défilement perpétuel vers la droite (4 derniers) */}
                  <div
                    className="scroll-container-gasyway"
                    onMouseEnter={(e) =>
                      e.currentTarget.classList.add(
                        "scroll-paused-gasyway",
                      )
                    }
                    onMouseLeave={(e) =>
                      e.currentTarget.classList.remove(
                        "scroll-paused-gasyway",
                      )
                    }
                  >
                    <div className="scroll-track-gasyway perpetual-right-gasyway">
                      {/* Contenu répété exactement pour créer une boucle invisible */}
                      {[...Array(3)].map((_, iteration) =>
                        reasons
                          .slice(4, 8)
                          .map((reason) => (
                            <div
                              key={`row2-cycle${iteration}-${reason.id}`}
                              className="scroll-item-gasyway"
                            >
                              <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:shadow-accent/20 border-2 hover:border-secondary h-full cursor-pointer">
                                <div className="text-lg mb-1 text-center leading-none">
                                  {reason.icon}
                                </div>
                                <h6 className="m-0 text-center text-primary">
                                  {reason.text}
                                </h6>
                              </Card>
                            </div>
                          )),
                      )}
                    </div>
                  </div>
                </>
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {/* Formulaire de Contact */}
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <h2 className="text-primary">Contactez-nous</h2>
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Une question ? Un projet de voyage ? Notre équipe vous répond
              sous 24h.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="L'objet de votre message"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={6}
                  placeholder="Décrivez votre demande ou votre projet de voyage..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer le message
                  </>
                )}
              </Button>
            </form>

            {/* Informations de contact supplémentaires */}
            <div className="mt-8 pt-8 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <Mail className="w-6 h-6 text-primary mx-auto" />
                  <p className="text-muted-foreground">
                    {companyInfo?.contact_email || "contact@gasyway.mg"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Phone className="w-6 h-6 text-primary mx-auto" />
                  <p className="text-muted-foreground">
                    {companyInfo?.contact_phone || "+261 34 XX XX XX XX"}
                  </p>
                </div>

                <div className="space-y-2">
                  <MapPin className="w-6 h-6 text-primary mx-auto" />
                  <p className="text-muted-foreground">
                    {companyInfo?.address || "Antananarivo, Madagascar"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Final */}
      <div className="text-center space-y-6 bg-gradient-to-br from-white via-secondary/40 to-secondary p-12 rounded-2xl bg-[rgba(106,106,106,0)]">
        <h2 className="text-primary">Prêt pour l'aventure ?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Découvrez nos destinations et créez votre voyage sur mesure à
          Madagascar avec des guides locaux passionnés.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <a href="/catalog">
              Découvrir nos expériences
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
          >
            <a href="/destinations">
              Explorer les destinations
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
