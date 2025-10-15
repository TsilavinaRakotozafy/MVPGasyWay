import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Button } from '../ui/button'
import { ChevronDown, ChevronUp, MessageCircleQuestion, Loader2 } from 'lucide-react'
import { Badge } from '../ui/badge'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

interface GeneralFAQ {
  id: string
  question: string
  answer: string
  order_index: number
}

interface GeneralFAQSectionProps {
  title?: string
  description?: string
  className?: string
  maxItems?: number
  showViewAllButton?: boolean
}

export const GeneralFAQSection: React.FC<GeneralFAQSectionProps> = ({
  title = "Questions fréquentes",
  description = "Trouvez rapidement les réponses aux questions les plus courantes sur GasyWay",
  className = "",
  maxItems,
  showViewAllButton = true
}) => {
  const [faqs, setFaqs] = useState<GeneralFAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadGeneralFAQs()
  }, [])

  const loadGeneralFAQs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3aa6b185/faqs`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des FAQ')
      }

      const data = await response.json()
      setFaqs(data)
    } catch (err) {
      console.error('Erreur chargement FAQ générales:', err)
      setError('Impossible de charger les FAQ pour le moment')
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (faqId: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(faqId)) {
      newOpenItems.delete(faqId)
    } else {
      newOpenItems.add(faqId)
    }
    setOpenItems(newOpenItems)
  }

  const displayedFAQs = maxItems ? faqs.slice(0, maxItems) : faqs

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Chargement des FAQ...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <MessageCircleQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadGeneralFAQs} variant="outline">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (faqs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageCircleQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune FAQ disponible</h3>
            <p className="text-muted-foreground">
              Les questions fréquentes seront bientôt disponibles.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5 text-primary" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {faqs.length}
          </Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedFAQs.map((faq) => {
          const isOpen = openItems.has(faq.id)
          
          return (
            <Collapsible 
              key={faq.id} 
              open={isOpen} 
              onOpenChange={() => toggleItem(faq.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto text-left hover:bg-muted/50"
                >
                  <span className="font-medium">{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
        
        {maxItems && faqs.length > maxItems && showViewAllButton && (
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full">
              Voir toutes les FAQ ({faqs.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default GeneralFAQSection