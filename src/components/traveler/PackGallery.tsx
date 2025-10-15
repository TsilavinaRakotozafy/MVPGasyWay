import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  ArrowLeft,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Pack } from "../../types";
import { cn } from "../ui/utils";

interface PackGalleryProps {
  pack: Pack;
  onBack: () => void;
}

export function PackGallery({
  pack,
  onBack,
}: PackGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<
    number | null
  >(null);

  // Images de la galerie depuis le pack
  const galleryImages = pack.images || [];

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImageIndex === null) return;

    const newIndex =
      direction === "prev"
        ? selectedImageIndex === 0
          ? galleryImages.length - 1
          : selectedImageIndex - 1
        : selectedImageIndex === galleryImages.length - 1
          ? 0
          : selectedImageIndex + 1;

    setSelectedImageIndex(newIndex);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec bouton retour */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2 hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>

            <div className="flex-1">
              <h3 className="text-foreground">{pack.title}</h3>
              <p className="text-muted-foreground">
                {galleryImages.length} photo
                {galleryImages.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Galerie principale */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-lg cursor-pointer bg-muted"
              style={{ height: "50vh" }}
              onClick={() => openImageModal(index)}
            >
              <ImageWithFallback
                src={image}
                alt={`${pack.title} - Image ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Badge numéro d'image */}
              <div className="absolute top-3 left-3">
                <Badge
                  variant="secondary"
                  className="bg-black/50 text-white border-none"
                >
                  {index + 1} / {galleryImages.length}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucune image */}
        {galleryImages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Aucune image disponible pour ce pack.
            </p>
          </div>
        )}
      </div>

      {/* Modal de zoom sur image */}
      <Dialog
        open={selectedImageIndex !== null}
        onOpenChange={() => closeImageModal()}
      >
        <DialogContent className="!max-w-[99vw] !max-h-[99vh] !w-[99vw] !h-[99vh] p-0 bg-black/90 border-none !sm:max-w-[99vw] [&>button]:hidden">
          <VisuallyHidden asChild>
            <DialogTitle>
              Image{" "}
              {selectedImageIndex !== null
                ? selectedImageIndex + 1
                : 1}{" "}
              de {galleryImages.length} - {pack.title}
            </DialogTitle>
          </VisuallyHidden>
          <div className="relative w-full h-full flex items-center justify-center min-h-[70vh]">
            {/* Bouton fermer */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-8 right-8 z-20 text-white hover:bg-white/20 hover:text-white !w-12 !h-12"
              onClick={closeImageModal}
            >
              <X className="h-7 w-7" />
            </Button>

            {/* Navigation précédente */}
            {galleryImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 hover:text-white !w-16 !h-16"
                onClick={() => navigateImage("prev")}
              >
                <ChevronLeft className="h-12 w-12" />
              </Button>
            )}

            {/* Image en plein écran */}
            {selectedImageIndex !== null && (
              <div className="w-full h-full flex items-center justify-center p-1">
                <ImageWithFallback
                  src={galleryImages[selectedImageIndex]}
                  alt={`${pack.title} - Image ${selectedImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Navigation suivante */}
            {galleryImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 hover:text-white !w-16 !h-16"
                onClick={() => navigateImage("next")}
              >
                <ChevronRight className="h-12 w-12" />
              </Button>
            )}

            {/* Indicateur de position */}
            {selectedImageIndex !== null &&
              galleryImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                  <Badge
                    variant="secondary"
                    className="bg-black/50 text-white border-none"
                  >
                    {selectedImageIndex + 1} /{" "}
                    {galleryImages.length}
                  </Badge>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PackGallery;