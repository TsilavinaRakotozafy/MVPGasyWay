import React from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const destinations = [
  {
    id: "cote-est-tropicale",
    title: "Côte Est Tropicale",
    description:
      "La côte orientale s'étend avec ses forêts primaires, plantations de vanille et plages préservées.",
    image:
      "https://images.unsplash.com/photo-1671177083873-df2bf9201c82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGNvYXN0JTIwTWFkYWdhc2NhcnxlbnwxfHx8fDE3NTk2OTcyOTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Nature & Plages",
  },
  {
    id: "grand-sud-aride",
    title: "Grand Sud Aride",
    description:
      "Le Sud mystique, terre des épineux et du folklore Antandroy avec paysages lunaires.",
    image:
      "https://images.unsplash.com/photo-1740487261621-8674ee558336?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmlkJTIwbGFuZHNjYXBlJTIwTWFkYWdhc2NhciUyMGRlc2VydHxlbnwxfHx8fDE3NTk2OTczMDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Paysages Uniques",
  },
  {
    id: "hautes-terres-centrales",
    title: "Hautes Terres Centrales",
    description:
      "Le cœur historique et culturel de Madagascar, où se mélangent traditions ancestrales et modernité.",
    image:
      "https://images.unsplash.com/photo-1644896961850-9cff25bd3e0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdobGFuZHMlMjBtb3VudGFpbnMlMjBNYWRhZ2FzY2FyJTIwY2VudHJhbHxlbnwxfHx8fDE3NTk2OTczMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Culture & Montagnes",
  },
  {
    id: "nord-madagascar",
    title: "Nord de Madagascar",
    description:
      "Découvrez les merveilles du Nord malgache avec ses formations coralliennes uniques et sa biodiversité remarquable.",
    image:
      "https://images.unsplash.com/photo-1627580206975-ede73a2ca147?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aGVybiUyME1hZGFnYXNjYXIlMjBiYW9iYWIlMjB0cmVlc3xlbnwxfHx8fDE3NTk2OTczMDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Biodiversité",
  },
];

interface DestinationsPageProps {
  onDestinationSelect?: (destinationId: string) => void;
}

export function DestinationsPage({
  onDestinationSelect,
}: DestinationsPageProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-primary">Top destinations</h1>
        <p className="text-muted-foreground max-w-4xl mx-auto">
          Du Cap d'Ambre aux eaux turquoise de Nosy Be, des Tsingy Rouges aux forêts luxuriantes de la Montagne d'Ambre : le Nord de Madagascar vous offre une mosaïque de paysages époustouflants et d'expériences authentiques.
        </p>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {destinations.map((destination) => (
          <div
            key={destination.id}
            className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl"
            onClick={() =>
              onDestinationSelect?.(destination.id)
            }
          >
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <ImageWithFallback
                src={destination.image}
                alt={destination.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="space-y-3">
                  <h3 className="text-white">
                    {destination.title}
                  </h3>
                  <p className="text-white/90 line-clamp-3">
                    {destination.description}
                  </p>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon Section */}
      <div className="text-center py-12 space-y-4">
        <h2 className="text-primary">Bientôt disponible</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Nous travaillons actuellement sur l'ajout de nouvelles
          destinations et d'expériences personnalisées pour
          chaque région.
        </p>
        <div className="flex justify-center">
          <Button variant="outline" disabled>
            Être notifié des nouveautés
          </Button>
        </div>
      </div>
    </div>
  );
}