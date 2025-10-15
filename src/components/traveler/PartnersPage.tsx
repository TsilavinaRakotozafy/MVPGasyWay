import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Handshake, MapPin, Globe, Mail, Phone, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "../../utils/supabase/client";

interface Partner {
  id: string;
  name: string;
  type: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  region_id: string | null;
  region_name?: string;
}

export function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    async function loadPartners() {
      try {
        const { data, error } = await supabase
          .from("partners")
          .select("id, name, type, description, logo_url, website, phone, email, region_id")
          .eq("status", "active")
          .order("name");

        if (error) {
          console.error("Erreur chargement partenaires:", error);
          setPartners([]);
        } else {
          setPartners(data || []);
        }
      } catch (err) {
        console.error("Erreur inattendue:", err);
        setPartners([]);
      } finally {
        setLoading(false);
      }
    }

    loadPartners();
  }, []);

  const partnerTypes = ["all", ...new Set(partners.map((p) => p.type))];
  const filteredPartners =
    selectedType === "all"
      ? partners
      : partners.filter((p) => p.type === selectedType);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section - Version Minimaliste */}
      <div className="text-center space-y-4 pt-8 px-4">
        <h1>Nos Partenaires</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Nous travaillons avec des acteurs locaux passionnés et engagés pour
          un tourisme responsable à Madagascar.
        </p>
      </div>

      {/* Filtres par type - Version simplifiée */}
      {!loading && filteredPartners.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center px-4">
          {partnerTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="capitalize"
            >
              {type === "all" ? "Tous" : type}
            </Button>
          ))}
        </div>
      )}

      {/* Partenaires Grid */}
      <div className="px-4 sm:px-6 lg:px-8 m-[0px]">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPartners.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {filteredPartners.map((partner) => (
              <Card
                key={partner.id}
                className="group hover:shadow-md transition-all duration-300 border border-border"
              >
                <CardContent className="p-8 space-y-6">
                  {/* Logo simplifié */}
                  <div className="h-20 flex items-center justify-center">
                    {partner.logo_url ? (
                      <ImageWithFallback
                        src={partner.logo_url}
                        alt={partner.name}
                        className="max-h-full max-w-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <Handshake className="w-16 h-16 text-muted-foreground" />
                    )}
                  </div>

                  {/* Informations essentielles */}
                  <div className="space-y-2 text-center">
                    <h3 className="text-primary">{partner.name}</h3>
                    <p className="text-muted-foreground">{partner.type}</p>
                  </div>

                  {partner.description && (
                    <p className="text-muted-foreground line-clamp-2 text-center">
                      {partner.description}
                    </p>
                  )}

                  {/* Actions simplifiées */}
                  {partner.website && (
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(partner.website!, "_blank")}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Visiter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4 max-w-2xl mx-auto px-[0px] py-[80px]">
            <Handshake className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
            <div className="space-y-2">
              <h2>Bientôt disponible</h2>
              <p className="text-muted-foreground">
                Nous travaillons actuellement sur l'ajout de nouveaux partenaires
                pour enrichir votre expérience.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call to Action - Version épurée */}
      <div className="text-center space-y-4 px-4 max-w-2xl mx-auto px-[16px] py-[80px]">
        <h2>Devenir partenaire</h2>
        <p className="text-muted-foreground">
          Vous êtes un acteur du tourisme à Madagascar et souhaitez rejoindre
          notre réseau ?
        </p>
        <Button onClick={() => (window.location.href = "#")}>
          Nous contacter
        </Button>
      </div>
    </div>
  );
}
