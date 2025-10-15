import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { toast } from 'sonner@2.0.3'
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Zap,
  Users,
  Heart,
  Link
} from 'lucide-react'
import { supabase } from '../../utils/supabase/client'

export function ProfilesInterestsMigrator() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'checking' | 'migrating' | 'completed' | 'error'>('idle')
  const [results, setResults] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<string>('')

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`])
  }

  const checkCurrentStructure = async () => {
    setStatus('checking')
    setCurrentStep('Vérification de la structure actuelle...')
    setResults([])
    
    try {
      // Vérifier la structure de la table profiles
      const { data: profilesInfo, error: profilesError } = await supabase
        .rpc('get_table_info', { table_name: 'profiles' })
      
      if (profilesError) {
        addResult('❌ Erreur lors de la vérification de la table profiles')
        console.error('Erreur profiles:', profilesError)
      } else {
        addResult('✅ Table profiles trouvée')
      }

      // Vérifier la table interests
      const { data: interestsInfo, error: interestsError } = await supabase
        .rpc('get_table_info', { table_name: 'interests' })
      
      if (interestsError) {
        addResult('⚠️ Table interests non trouvée - sera créée')
      } else {
        addResult('✅ Table interests existe déjà')
      }

      // Vérifier la table user_interests
      const { data: userInterestsInfo, error: userInterestsError } = await supabase
        .rpc('get_table_info', { table_name: 'user_interests' })
      
      if (userInterestsError) {
        addResult('⚠️ Table user_interests non trouvée - sera créée')
      } else {
        addResult('✅ Table user_interests existe déjà')
      }

      setStatus('idle')
      setCurrentStep('')
      
    } catch (error: any) {
      addResult(`❌ Erreur lors de la vérification: ${error.message}`)
      setStatus('error')
    }
  }

  const executeMigration = async () => {
    setLoading(true)
    setStatus('migrating')
    setResults([])
    
    try {
      // Étape 1: Mise à jour de la structure de la table profiles
      setCurrentStep('Étape 1/4: Mise à jour de la table profiles...')
      addResult('🔄 Début de la migration de la table profiles')
      
      const profilesStructureSQL = `
        -- Sauvegarde des données existantes
        CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;
        
        -- Supprimer les contraintes problématiques si elles existent
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_key CASCADE;
        
        -- Ajouter les colonnes manquantes si nécessaire
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS user_id UUID,
        ADD COLUMN IF NOT EXISTS first_name TEXT,
        ADD COLUMN IF NOT EXISTS last_name TEXT,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS avatar_url TEXT,
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'voyageur',
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Créer une contrainte CHECK pour le rôle
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('voyageur', 'admin'));
        
        -- Définir user_id comme clé primaire si ce n'est pas déjà fait
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
        ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);
        
        -- Ajouter la contrainte de clé étrangère vers auth.users
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
        ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Mettre à jour les valeurs NULL pour les champs obligatoires
        UPDATE profiles SET 
          role = 'voyageur' WHERE role IS NULL,
          created_at = NOW() WHERE created_at IS NULL,
          updated_at = NOW() WHERE updated_at IS NULL;
      `
      
      const { error: profilesError } = await supabase.rpc('exec_sql', { sql: profilesStructureSQL })
      
      if (profilesError) {
        throw new Error(`Erreur mise à jour profiles: ${profilesError.message}`)
      }
      
      addResult('✅ Structure de la table profiles mise à jour')

      // Étape 2: Création de la table interests
      setCurrentStep('Étape 2/4: Création de la table interests...')
      addResult('🔄 Création de la table interests')
      
      const interestsSQL = `
        CREATE TABLE IF NOT EXISTS interests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          icon TEXT,
          category TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Index pour les recherches
        CREATE INDEX IF NOT EXISTS idx_interests_name ON interests(name);
        CREATE INDEX IF NOT EXISTS idx_interests_category ON interests(category);
        CREATE INDEX IF NOT EXISTS idx_interests_active ON interests(is_active);
      `
      
      const { error: interestsError } = await supabase.rpc('exec_sql', { sql: interestsSQL })
      
      if (interestsError) {
        throw new Error(`Erreur création interests: ${interestsError.message}`)
      }
      
      addResult('✅ Table interests créée')

      // Étape 3: Création de la table user_interests (many-to-many)
      setCurrentStep('Étape 3/4: Création de la table user_interests...')
      addResult('🔄 Création de la table user_interests')
      
      const userInterestsSQL = `
        CREATE TABLE IF NOT EXISTS user_interests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, interest_id)
        );
        
        -- Index pour les performances
        CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON user_interests(interest_id);
        CREATE INDEX IF NOT EXISTS idx_user_interests_composite ON user_interests(user_id, interest_id);
      `
      
      const { error: userInterestsError } = await supabase.rpc('exec_sql', { sql: userInterestsSQL })
      
      if (userInterestsError) {
        throw new Error(`Erreur création user_interests: ${userInterestsError.message}`)
      }
      
      addResult('✅ Table user_interests créée')

      // Étape 4: Insertion des centres d'intérêt par défaut
      setCurrentStep('Étape 4/4: Insertion des données de base...')
      addResult('🔄 Insertion des centres d\'intérêt par défaut')
      
      const defaultInterests = [
        { name: 'Plages', description: 'Plages paradisiaques et activités balnéaires', icon: '🏖️', category: 'Nature' },
        { name: 'Randonnée', description: 'Trekking et exploration de la nature', icon: '🥾', category: 'Aventure' },
        { name: 'Culture locale', description: 'Traditions et patrimoine malgache', icon: '🎭', category: 'Culture' },
        { name: 'Faune sauvage', description: 'Observation des lémuriens et biodiversité', icon: '🐒', category: 'Nature' },
        { name: 'Gastronomie', description: 'Cuisine traditionnelle malgache', icon: '🍛', category: 'Culture' },
        { name: 'Parcs nationaux', description: 'Réserves naturelles et aires protégées', icon: '🌲', category: 'Nature' },
        { name: 'Artisanat', description: 'Produits artisanaux locaux', icon: '🏺', category: 'Culture' },
        { name: 'Sports nautiques', description: 'Plongée, snorkeling, surf', icon: '🤿', category: 'Aventure' }
      ]
      
      for (const interest of defaultInterests) {
        const { error } = await supabase
          .from('interests')
          .upsert(interest, { onConflict: 'name' })
        
        if (error) {
          addResult(`⚠️ Erreur insertion intérêt ${interest.name}: ${error.message}`)
        } else {
          addResult(`✅ Intérêt "${interest.name}" ajouté`)
        }
      }

      setStatus('completed')
      setCurrentStep('')
      addResult('🎉 Migration terminée avec succès!')
      toast.success('Migration terminée avec succès!')
      
    } catch (error: any) {
      console.error('Erreur migration:', error)
      addResult(`❌ Erreur lors de la migration: ${error.message}`)
      setStatus('error')
      toast.error('Erreur lors de la migration')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'migrating': return 'bg-blue-50 border-blue-200'
      case 'checking': return 'bg-yellow-50 border-yellow-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'migrating': return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
      case 'checking': return <Database className="h-5 w-5 text-yellow-600" />
      default: return <Database className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <CardTitle>Migration Profiles & Intérêts</CardTitle>
          </div>
          <CardDescription>
            Mise à jour de la structure des tables profiles et création du système d'intérêts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="font-medium">
                {status === 'idle' && 'Prêt à migrer'}
                {status === 'checking' && 'Vérification en cours...'}
                {status === 'migrating' && 'Migration en cours...'}
                {status === 'completed' && 'Migration terminée'}
                {status === 'error' && 'Erreur lors de la migration'}
              </span>
              {status !== 'idle' && (
                <Badge variant="outline" className="ml-auto">
                  {status}
                </Badge>
              )}
            </div>
            {currentStep && (
              <p className="text-sm text-gray-600 mt-1">{currentStep}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={checkCurrentStructure}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              <Database className="mr-2 h-4 w-4" />
              Vérifier la structure
            </Button>
            
            <Button
              onClick={executeMigration}
              disabled={loading || status === 'completed'}
              className="flex-1"
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Exécuter la migration
            </Button>
          </div>

          {/* Informations sur les changements */}
          <Alert>
            <Heart className="h-4 w-4" />
            <AlertDescription>
              <strong>Cette migration va :</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Restructurer la table <code>profiles</code> (user_id comme clé primaire)</li>
                <li>• Créer la table <code>interests</code> avec 8 centres d'intérêt par défaut</li>
                <li>• Créer la table <code>user_interests</code> pour la liaison many-to-many</li>
                <li>• Ajouter les contraintes et index nécessaires</li>
                <li>• Préserver toutes les données existantes</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Résultats */}
          {results.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Link className="mr-2 h-4 w-4" />
                Journal de migration
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="text-xs font-mono text-gray-700 py-0.5">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}