import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { toast } from 'sonner@2.0.3'
import { 
  FileText, 
  Copy, 
  ExternalLink,
  Zap,
  Search,
  Wrench,
  Database,
  CheckCircle
} from 'lucide-react'

export function AdminScriptSelector() {
  const [copiedScript, setCopiedScript] = useState<string | null>(null)

  const copyScript = async (scriptName: string, scriptContent: string) => {
    try {
      await navigator.clipboard.writeText(scriptContent)
      setCopiedScript(scriptName)
      toast.success(`📋 Script ${scriptName} copié!`)
      setTimeout(() => setCopiedScript(null), 3000)
    } catch (error) {
      toast.error('❌ Erreur lors de la copie')
    }
  }

  const scripts = {
    creation: {
      name: 'Création V3 (Réel)',
      file: 'create_admin_account_v3_real_structure.sql',
      description: 'Créer admin avec VOTRE structure réelle (role dans profiles)',
      icon: Zap,
      color: 'text-green-600',
      content: `-- Voir le fichier: /sql/create_admin_account_v3_real_structure.sql
-- Script de création admin avec VOTRE structure Supabase réelle

-- ⭐ STRUCTURE RÉELLE RESPECTÉE:
-- • users: id, email, status, gdpr_consent, locale, last_login...
-- • profiles: id, user_id, first_name, last_name, phone, ROLE...
-- • LE RÔLE EST DANS PROFILES, PAS DANS USERS

-- 🔐 ÉTAPES AUTOMATIQUES:
-- 1. Vérification auth.users (création manuelle requise)
-- 2. Synchronisation public.users (SANS rôle)
-- 3. Création public.profiles (AVEC rôle admin)
-- 4. Nettoyage doublons et incohérences
-- 5. Vérification finale structure réelle

-- 🚀 UTILISATION:
-- 1. Créer admin dans Dashboard > Authentication > Users
-- 2. Coller ce script dans SQL Editor  
-- 3. Exécuter le script V3`
    },
    verification: {
      name: 'Vérification',
      file: 'verify_admin_supabase_sql.sql',
      description: 'Vérifier l\'état du compte admin dans toutes les tables',
      icon: Search,
      color: 'text-blue-600',
      content: `-- Voir le fichier: /sql/verify_admin_supabase_sql.sql
-- Script de vérification admin avec colonnes SQL Supabase

-- 🔍 VÉRIFICATIONS:
-- 1. Structure des tables (colonnes exactes)
-- 2. Présence admin dans auth.users
-- 3. Synchronisation public.users
-- 4. Profil dans public.profiles
-- 5. Cohérence des données
-- 6. Recommandations automatiques

-- 🚀 UTILISATION:
-- 1. Coller ce script dans SQL Editor
-- 2. Exécuter pour diagnostic complet
-- 3. Suivre les recommandations affichées`
    },
    reparation: {
      name: 'Réparation',
      file: 'repair_admin_supabase_sql.sql',
      description: 'Réparer automatiquement les problèmes détectés',
      icon: Wrench,
      color: 'text-orange-600',
      content: `-- Voir le fichier: /sql/repair_admin_supabase_sql.sql
-- Script de réparation admin avec colonnes SQL Supabase

-- 🔧 RÉPARATIONS AUTOMATIQUES:
-- 1. Diagnostic initial des problèmes
-- 2. Synchronisation forcée public.users
-- 3. Création/réparation public.profiles
-- 4. Nettoyage avancé des incohérences
-- 5. Vérification post-réparation

-- 🚀 UTILISATION:
-- 1. Utiliser après avoir identifié des problèmes
-- 2. Coller ce script dans SQL Editor
-- 3. Le script détecte et corrige automatiquement`
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-purple-600" />
            <CardTitle>🗂️ Scripts Admin SQL Supabase</CardTitle>
          </div>
          <CardDescription>
            Scripts optimisés pour les vraies colonnes SQL Supabase (pas de KV store)
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          <Tabs defaultValue="creation" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="creation" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Création</span>
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Vérification</span>
              </TabsTrigger>
              <TabsTrigger value="reparation" className="flex items-center space-x-2">
                <Wrench className="h-4 w-4" />
                <span>Réparation</span>
              </TabsTrigger>
            </TabsList>

            {Object.entries(scripts).map(([key, script]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <script.icon className={`h-5 w-5 ${script.color}`} />
                        <CardTitle className="text-lg">{script.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyScript(script.name, script.content)}
                          disabled={copiedScript === script.name}
                        >
                          {copiedScript === script.name ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Copié!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copier
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          SQL Editor
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {script.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <code className="text-sm">{script.file}</code>
                      </div>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                        {script.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

        </CardContent>
      </Card>

      {/* Instructions générales */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Instructions Générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>⭐ STRUCTURE DÉTECTÉE : RÔLE dans PROFILES</strong></p>
                <p><strong>🔄 Processus recommandé :</strong></p>
                <ol className="ml-4 space-y-1 text-sm">
                  <li><strong>1. Création manuelle :</strong> Dashboard → Authentication → Users → Add user</li>
                  <li><strong>2. Script création V3 :</strong> Respecte votre structure (rôle dans profiles)</li>
                  <li><strong>3. Script vérification :</strong> Contrôle l'état et donne des recommandations</li>
                  <li><strong>4. Script réparation :</strong> Si problèmes détectés, corrige automatiquement</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-green-800 mb-2">✅ Scripts V3 - Structure Réelle</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• ⭐ Rôle dans profiles (pas users)</li>
                <li>• Code AuthContext adapté</li>
                <li>• Structure Supabase réelle respectée</li>
                <li>• Nettoyage automatique</li>
                <li>• Vérifications complètes</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-amber-800 mb-2">🔑 Données de connexion</h4>
              <div className="text-sm text-amber-700 space-y-1">
                <div><strong>Email:</strong> admin@gasyway.com</div>
                <div><strong>Password:</strong> Admin123!GasyWay</div>
                <div><strong>Rôle:</strong> admin</div>
                <div><strong>Statut:</strong> active</div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}