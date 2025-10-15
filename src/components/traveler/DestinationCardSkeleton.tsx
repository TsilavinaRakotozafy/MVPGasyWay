import React from "react";
import { Card, CardContent } from "../ui/card";

/**
 * ✅ Skeleton pour DestinationCard
 * Utilisé pendant le chargement des régions depuis Supabase
 * Conforme au design system GasyWay (bg-muted + animate-pulse)
 */
export function DestinationCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-200">
      {/* Image skeleton */}
      <div className="aspect-video bg-muted animate-pulse" />
      
      {/* Content skeleton */}
      <CardContent className="p-6 space-y-4">
        {/* Titre skeleton */}
        <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
        
        {/* Description skeleton (2 lignes) */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full animate-pulse" />
          <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
        </div>
        
        {/* Bouton skeleton */}
        <div className="h-9 bg-muted rounded w-32 animate-pulse" />
      </CardContent>
    </Card>
  );
}
