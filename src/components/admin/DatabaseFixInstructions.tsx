import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ExternalLink,
  Copy,
  Database
} from 'lucide-react'
import { Button } from '../ui/button'
import { toast } from 'sonner@2.0.3'

export function DatabaseFixInstructions() {
  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql).then(() => {
      toast.success('SQL copié dans le presse-papiers')
    })
  }

  const correctUsersTableSQL = `-- Table users correcte (SANS password_hash)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL UNIQUE,
  role VARCHAR DEFAULT 'voyageur' CHECK (role IN ('voyageur', 'admin')),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  locale VARCHAR DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);`

  const correctProfilesTableSQL = `-- Table profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  avatar_url VARCHAR,
  bio TEXT,
  role VARCHAR DEFAULT 'voyageur' CHECK (role IN ('voyageur', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle>Instructions de correction de la base de données</CardTitle>
          </div>
          <CardDescription>
            Guide étape par étape pour corriger les erreurs de schéma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Erreur principale */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <strong>🔥 PROBLÈME CRITIQUE DÉTECTÉ :</strong>
                </div>
                <ul className="space-y-1 ml-4">
                  <li>• <code>null value in column "password_hash" violates not-null constraint</code></li>
                  <li>• Votre table <code>users</code> contient une colonne <code>password_hash</code></li>
                  <li>• Cette colonne <strong>ne devrait PAS exister</strong> avec Supabase Auth</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Étapes de correction */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">🔧 Étapes de correction</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Badge variant="destructive" className="mt-0.5">1</Badge>
                <div className="flex-1">
                  <p className="font-medium text-red-800">Connectez-vous à votre Dashboard Supabase</p>
                  <p className="text-sm text-red-600 mt-1">
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank" 
                      className="underline flex items-center space-x-1"
                    >
                      <span>Ouvrir Dashboard Supabase</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Badge variant="secondary" className="mt-0.5">2</Badge>
                <div className="flex-1">
                  <p className="font-medium text-orange-800">Allez dans Table Editor</p>
                  <p className="text-sm text-orange-600 mt-1">
                    Navigation : <code>Table Editor</code> → Table <code>users</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Badge variant="secondary" className="mt-0.5">3</Badge>
                <div className="flex-1">
                  <p className="font-medium text-yellow-800">Supprimer la colonne password_hash</p>
                  <ul className="text-sm text-yellow-700 mt-1 ml-4 space-y-1">
                    <li>• Cliquez sur l'en-tête de colonne "password_hash"</li>
                    <li>• Menu ⋮ → "Delete column"</li>
                    <li>• Confirmez la suppression</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Badge className="mt-0.5 bg-green-100 text-green-800">4</Badge>
                <div className="flex-1">
                  <p className="font-medium text-green-800">Vérifier le schéma correct</p>
                  <p className="text-sm text-green-600 mt-1">
                    La table <code>users</code> ne doit contenir que ces colonnes :
                  </p>
                  <div className="mt-2 bg-white p-2 rounded border text-xs font-mono">
                    id, email, role, status, gdpr_consent, locale, last_login, created_at, updated_at
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schéma SQL correct */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">📋 Schéma SQL correct</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Table <code>users</code> (correcte)</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copySQL(correctUsersTableSQL)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier
                  </Button>
                </div>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto border">
                  {correctUsersTableSQL}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Table <code>profiles</code> (référence)</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copySQL(correctProfilesTableSQL)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copier
                  </Button>
                </div>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto border">
                  {correctProfilesTableSQL}
                </pre>
              </div>
            </div>
          </div>

          {/* Pourquoi ce problème */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>💡 Pourquoi ce problème survient-il ?</strong></p>
                <ul className="ml-4 space-y-1 text-sm">
                  <li>• <strong>Supabase Auth</strong> gère automatiquement les mots de passe dans sa table système <code>auth.users</code></li>
                  <li>• Notre table <code>users</code> ne doit contenir que les <strong>métadonnées supplémentaires</strong></li>
                  <li>• Dupliquer <code>password_hash</code> crée des conflits et des erreurs de contraintes</li>
                  <li>• La sécurité est assurée par Supabase, pas par notre schéma</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Après correction */}
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>✅ Après la correction :</strong></p>
                <ol className="ml-4 space-y-1 text-sm text-green-800">
                  <li>1. Les erreurs <code>password_hash</code> disparaîtront</li>
                  <li>2. L'inscription fonctionnera normalement</li>
                  <li>3. La connexion utilisera uniquement Supabase Auth</li>
                  <li>4. Testez avec le diagnostic d'authentification</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}