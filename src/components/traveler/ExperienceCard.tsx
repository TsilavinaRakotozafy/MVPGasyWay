import React from "react";
import { Card } from "../ui/card";

interface ExperienceCardProps {
  /**
   * Nom de l'expérience
   */
  name: string;
  /**
   * Description de l'expérience
   */
  description: string;
  /**
   * Icône émoji de l'expérience
   */
  icon: string;
  /**
   * Fonction appelée lors du clic sur la card
   */
  onClick?: () => void;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Composant ExperienceCard pour GasyWay
 *
 * Utilisé pour afficher les expériences/centres d'intérêt avec une icône émoji,
 * un titre en H4 et une description. Conforme au design system GasyWay.
 *
 * @example
 * ```tsx
 * <ExperienceCard
 *   name="Plongée sous-marine"
 *   description="Explorez les fonds marins exceptionnels de Madagascar"
 *   icon="🤿"
 *   onClick={() => filterByInterest('diving')}
 * />
 * ```
 */
export function ExperienceCard({
  name,
  description,
  icon,
  onClick,
  className = "",
}: ExperienceCardProps) {
  return (
    <Card
      className={`p-4 hover:shadow-lg transition-all duration-300 hover:shadow-accent/20 border-2 hover:border-secondary h-full cursor-pointer gap-1 ${className}`}
      onClick={onClick}
    >
      <div className="text-lg mb-1 text-center leading-none">
        {icon}
      </div>
      <h4
        className="m-0 text-center text-primary"
        style={{ lineHeight: "1.1" }}
      >
        {name}
      </h4>
      <p
        className="m-0 mt-1 text-muted-foreground text-center line-clamp-2 max-w-[80px] mx-auto"
        style={{ lineHeight: "1.2" }}
      >
        {description}
      </p>
    </Card>
  );
}