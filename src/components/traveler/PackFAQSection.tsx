import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ChevronDown, ChevronUp, MessageCircleQuestion, Loader2 } from 'lucide-react'
import { Badge } from '../ui/badge'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

interface FAQ {
  id: string
  question: string
  answer: string
  order_index: number
}

interface InterestFAQ {
  interest_name: string
  interest_icon: string
  faqs: FAQ[]
}

interface PackFAQSectionProps {
  packId: string
  className?: string
}

export const PackFAQSection: React.FC<PackFAQSectionProps> = ({ 
  packId,
  className = ""
}) => {
  const [faqGroups, setFaqGroups] = useState<InterestFAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  // Fonction pour basculer l'état d'un item
  const toggleItem = (itemId: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(itemId)) {
      newOpenItems.delete(itemId)
    } else {
      newOpenItems.add(itemId)
    }
    setOpenItems(newOpenItems)
  }

  // Charger les FAQ du pack
  useEffect(() => {
    const fetchPackFAQs = async () => {
      if (!packId) return

      setLoading(true)
      setError(null)

      try {
        console.log(`🔍 [FAQ Component] Fetching FAQs for pack: ${packId}`)
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/packs/${packId}/faqs`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        )

        console.log(`📡 [FAQ Component] Response status: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ [FAQ Component] HTTP Error ${response.status}:`, errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        console.log(`✅ [FAQ Component] Received data:`, data)
        console.log(`📊 [FAQ Component] FAQ groups count: ${data.faqs?.length || 0}`)
        
        setFaqGroups(data.faqs || [])
      } catch (err) {
        console.error('❌ [FAQ Component] Erreur chargement FAQ:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(`Impossible de charger les FAQ: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPackFAQs()
  }, [packId])

  if (loading) {
    return (
      <div className="col-span-full w-full space-y-4">
        <h4>FAQ</h4>
        <div className="text-center space-y-4 py-8">
          <div className="space-y-2">
            <h5>Questions fréquentes bientôt disponibles</h5>
            <p className="text-muted-foreground">Notre équipe prépare les réponses aux questions les plus courantes sur cette expérience.</p>
          </div>
          <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Nous contacter pour plus d'infos
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="col-span-full w-full space-y-4">
        <h4>FAQ</h4>
        <div className="text-center py-8">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (faqGroups.length === 0) {
    return (
      <div className="col-span-full w-full space-y-4">
        <h4>FAQ</h4>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Aucune question fréquente disponible pour ce pack.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="col-span-full w-full space-y-4">
      <div className="flex items-center gap-3">
        <h4>Questions fréquentes</h4>
        <Badge variant="secondary" className="ml-auto">
          {faqGroups.reduce((total, group) => total + group.faqs.length, 0)} questions
        </Badge>
      </div>

      <div className="space-y-6">
        {faqGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            {/* En-tête du groupe (centre d'intérêt) */}
            <div className="flex items-center gap-2 mb-3">
              <span>{group.interest_icon}</span>
              <h5 className="text-muted-foreground uppercase tracking-wide">
                {group.interest_name}
              </h5>
              <div className="flex-1 h-px bg-border ml-2" />
            </div>

            {/* FAQ du groupe */}
            <div className="space-y-2">
              {group.faqs.map((faq) => {
                const itemId = `${groupIndex}-${faq.id}`
                const isOpen = openItems.has(itemId)

                return (
                  <Collapsible key={faq.id} open={isOpen} onOpenChange={() => toggleItem(itemId)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto text-left hover:bg-muted/50"
                      >
                        <span className="pr-4">{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Message d'aide */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-muted-foreground text-center">
          Une question non répertoriée ? 
          <Button variant="link" className="px-1 h-auto">
            Contactez notre équipe
          </Button>
        </p>
      </div>
    </div>
  )
}

export default PackFAQSection