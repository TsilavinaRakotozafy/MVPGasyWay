import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { CheckCircle, XCircle, AlertTriangle, Wrench, Database, RefreshCw } from 'lucide-react'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface DatabaseIssue {
  id: string
  type: 'missing_column' | 'missing_table' | 'data_integrity'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  sqlFix?: string
  canAutoFix: boolean
}

export function DatabaseSchemaFixer() {
  const [issues, setIssues] = useState<DatabaseIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState<string | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkSchema = async () => {
    setLoading(true)
    const foundIssues: DatabaseIssue[] = []

    try {
      console.log('🔍 Vérification du schéma de base de données...')

      // 1. Vérifier la colonne icon dans interest_category
      try {
        const { data, error } = await supabase
          .from('interest_category')
          .select('id, name, icon')
          .limit(1)

        if (error && error.code === '42703') {
          foundIssues.push({
            id: 'missing_icon_column',
            type: 'missing_column',
            severity: 'high',
            title: 'Colonne icon manquante dans interest_category',
            description: 'La colonne icon est requise pour afficher les icônes des catégories d\'intérêts.',
            sqlFix: `ALTER TABLE public.interest_category ADD COLUMN icon TEXT;`,
            canAutoFix: true
          })
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de interest_category:', err)
      }

      // 2. Vérifier si les tables principales existent
      const requiredTables = ['interest_category', 'interests', 'user_profiles', 'packs']
      
      for (const tableName of requiredTables) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)

          if (error && error.code === '42P01') {
            foundIssues.push({
              id: `missing_table_${tableName}`,
              type: 'missing_table',
              severity: 'high',
              title: `Table ${tableName} manquante`,
              description: `La table ${tableName} est requise pour le bon fonctionnement de l'application.`,
              canAutoFix: false
            })
          }
        } catch (err) {
          console.error(`Erreur lors de la vérification de ${tableName}:`, err)
        }
      }

      // 3. Vérifier l'intégrité des données
      try {
        const { data: categories, error } = await supabase
          .from('interest_category')
          .select('id, name, icon')

        if (!error && categories) {
          const categoriesWithoutIcons = categories.filter(cat => !cat.icon || cat.icon.trim() === '')
          
          if (categoriesWithoutIcons.length > 0) {
            foundIssues.push({
              id: 'categories_missing_icons',
              type: 'data_integrity',
              severity: 'medium',
              title: `${categoriesWithoutIcons.length} catégories sans icône`,
              description: 'Certaines catégories n\'ont pas d\'icône définie.',
              canAutoFix: true
            })
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification des icônes:', err)
      }

      setIssues(foundIssues)
      setLastCheck(new Date())
      
      if (foundIssues.length === 0) {
        toast.success('✅ Aucun problème détecté dans le schéma de base de données')
      } else {
        toast.warning(`⚠️ ${foundIssues.length} problème(s) détecté(s)`)
      }

    } catch (error) {
      console.error('Erreur lors de la vérification du schéma:', error)
      toast.error('Erreur lors de la vérification du schéma')
    } finally {
      setLoading(false)
    }
  }

  const fixIssue = async (issue: DatabaseIssue) => {
    if (!issue.canAutoFix) {
      toast.error('Cette réparation nécessite une intervention manuelle')
      return
    }

    setFixing(issue.id)
    
    try {
      if (issue.id === 'missing_icon_column') {
        // Corriger la colonne icon manquante
        const { error } = await supabase.rpc('exec_sql', {
          sql: `
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'interest_category' 
                    AND column_name = 'icon'
                    AND table_schema = 'public'
                ) THEN
                    ALTER TABLE public.interest_category ADD COLUMN icon TEXT;
                END IF;
            END $$;
          `
        })

        if (error) throw error

        // Ajouter des icônes par défaut
        await supabase
          .from('interest_category')
          .update({ 
            icon: '🎯' // Icône par défaut
          })
          .is('icon', null)

        toast.success('✅ Colonne icon ajoutée avec succès')
      }
      
      if (issue.id === 'categories_missing_icons') {
        // Ajouter des icônes par défaut aux catégories
        const { data: categories } = await supabase
          .from('interest_category')
          .select('id, name')
          .or('icon.is.null,icon.eq.')

        if (categories) {
          for (const category of categories) {
            let icon = '🎯' // Par défaut
            
            const name = category.name.toLowerCase()
            if (name.includes('nature') || name.includes('paysage')) icon = '🌿'
            else if (name.includes('culture') || name.includes('tradition')) icon = '🎭'
            else if (name.includes('aventure') || name.includes('sport')) icon = '🏔️'
            else if (name.includes('détente') || name.includes('plage')) icon = '🏖️'
            else if (name.includes('ville') || name.includes('urbain')) icon = '🏙️'
            else if (name.includes('gastronomie') || name.includes('cuisine')) icon = '🍽️'
            else if (name.includes('histoire') || name.includes('patrimoine')) icon = '🏛️'
            else if (name.includes('faune') || name.includes('animaux')) icon = '🦎'

            await supabase
              .from('interest_category')
              .update({ icon })
              .eq('id', category.id)
          }
        }

        toast.success('✅ Icônes ajoutées aux catégories')
      }

      // Refaire la vérification
      await checkSchema()

    } catch (error) {
      console.error('Erreur lors de la réparation:', error)
      toast.error('Erreur lors de la réparation')
    } finally {
      setFixing(null)
    }
  }

  const getSeverityIcon = (severity: DatabaseIssue['severity']) => {
    switch (severity) {
      case 'high': return <XCircle className="h-5 w-5 text-red-500" />
      case 'medium': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'low': return <AlertTriangle className="h-5 w-5 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: DatabaseIssue['severity']) => {
    switch (severity) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
    }
  }

  return (
    <div></div>
  )
}