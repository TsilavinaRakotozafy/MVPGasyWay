import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "../ui/card";

interface FAQItemProps {
  /**
   * Question de la FAQ
   */
  question: string;
  /**
   * Réponse de la FAQ
   */
  answer: string;
  /**
   * Mode par défaut (ouvert ou fermé)
   */
  defaultOpen?: boolean;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  /**
   * Callback appelé lors du changement d'état
   */
  onToggle?: (isOpen: boolean) => void;
}

/**
 * Composant FAQItem pour GasyWay
 *
 * Affiche une question/réponse avec la possibilité de l'ouvrir/fermer.
 * La question utilise H4 conformément au design system.
 *
 * @example
 * ```tsx
 * <FAQItem
 *   question="Comment réserver un pack ?"
 *   answer="Vous pouvez réserver directement via notre plateforme..."
 *   defaultOpen={false}
 * />
 * ```
 */
export function FAQItem({
  question,
  answer,
  defaultOpen = false,
  className = "",
  onToggle,
}: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  return (
    <div className={`transition-all duration-300 ${className}`}>
      {/* En-tête cliquable */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between transition-colors duration-200 text-left focus:outline-none bg-transparent hover:bg-transparent focus:bg-transparent px-0 py-2"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/[^a-zA-Z0-9]/g, "")}`}
      >
        {/* Question avec style H4 explicite */}
        <h5 className="text-primary flex-1 pr-4 m-0">
          {question}
        </h5>
        {/* Icône chevron */}
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-4" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-4" />
        )}
      </button>

      {/* Contenu de la réponse avec animation */}
      <div
        id={`faq-answer-${question.replace(/[^a-zA-Z0-9]/g, "")}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-0">
          <div className="border-t border-border/50 py-4 px-0">
            {/* Réponse avec style P explicite */}
            <p className="text-muted-foreground m-0 leading-relaxed">
              {answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant pour un groupe de FAQs
 */
interface FAQGroupProps {
  /**
   * Liste des questions/réponses
   */
  faqs: Array<{
    question: string;
    answer: string;
    defaultOpen?: boolean;
  }>;
  /**
   * Titre du groupe de FAQs
   */
  title?: string;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Composant FAQGroup pour afficher plusieurs FAQs ensemble
 */
export function FAQGroup({
  faqs,
  title,
  className = "",
}: FAQGroupProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && <h3 className="text-primary">{title}</h3>}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            defaultOpen={faq.defaultOpen}
          />
        ))}
      </div>
    </div>
  );
}