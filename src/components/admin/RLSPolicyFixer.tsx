import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Badge } from '../ui/badge'
import { supabase } from '../../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { AlertTriangle, CheckCircle, RefreshCw, Database, Shield, AlertCircle } from 'lucide-react'

export function RLSPolicyFixer() {
  const [loading, setLoading] = useState(false)
  const [diagnostic, setDiagnostic] = useState<any>(null)
  const [fixing, setFixing] = useState(false)

  const checkRLSPolicies = async () => {
    setLoading(true)
    try {
      console.log('🔍 Diagnostic des politiques RLS...')
      
      // Test d'accès à la table users
      const { data: usersTest, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      // Test d'accès à la table user_interests  
      const { data: interestsTest, error: interestsError } = await supabase
        .from('user_interests')
        .select('user_id')
        .limit(1)

      // Test d'accès à la table interests
      const { data: interestsListTest, error: interestsListError } = await supabase
        .from('interests')
        .select('id')
        .limit(1)

      setDiagnostic({
        users: {
          accessible: !usersError,
          error: usersError?.message,
          data: usersTest
        },
        user_interests: {
          accessible: !interestsError,
          error: interestsError?.message,
          data: interestsTest
        },
        interests: {
          accessible: !interestsListError,
          error: interestsListError?.message,
          data: interestsListTest
        },
        timestamp: new Date().toISOString()
      })

      console.log('📊 Résultats diagnostic RLS:', {
        users: !usersError,
        user_interests: !interestsError,
        interests: !interestsListError
      })

    } catch (error: any) {
      console.error('❌ Erreur diagnostic RLS:', error)
      toast.error('Erreur lors du diagnostic')
    } finally {
      setLoading(false)
    }
  }

  const fixRLSPolicies = async () => {
    setFixing(true)
    try {
      console.log('🔧 Réparation des politiques RLS...')
      
      // Lire le contenu du fichier SQL de réparation
      const fixSQL = `-- Script de réparation des politiques RLS pour résoudre les récursions infinies
-- GasyWay - Réparation urgente des politiques Row Level Security

-- ÉTAPE 1: Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "admin_full_access_users" ON users;
DROP POLICY IF EXISTS "Anyone can view interests" ON interests;
DROP POLICY IF EXISTS "interests_select_all" ON interests;
DROP POLICY IF EXISTS "interests_admin_manage" ON interests;
DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can manage own interests" ON user_interests;
DROP POLICY IF EXISTS "user_interests_select_own" ON user_interests;
DROP POLICY IF EXISTS "user_interests_manage_own" ON user_interests;
DROP POLICY IF EXISTS "user_interests_admin_full" ON user_interests;

-- ÉTAPE 2: Désactiver temporairement RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Réactiver RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 4: Créer des politiques simples SANS récursion

-- Table USERS
CREATE POLICY "users_can_view_own_profile" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile" ON users 
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile" ON users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policy SANS sous-requête récursive
CREATE POLICY "admin_users_full_access" ON users 
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Table INTERESTS
CREATE POLICY "interests_public_read" ON interests 
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "interests_admin_write" ON interests 
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Table USER_INTERESTS  
CREATE POLICY "user_interests_own_access" ON user_interests 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_interests_admin_access" ON user_interests 
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin');

-- Vérification
SELECT 'Politiques RLS réparées avec succès!' as status;`

      console.log('📝 SCRIPT SQL DE RÉPARATION RLS:')
      console.log('=====================================')
      console.log(fixSQL)
      console.log('=====================================')
      
      // Informer l'utilisateur
      toast.success('✅ Script de réparation généré !', {
        description: 'Copiez le script depuis la console et exécutez-le dans l\'éditeur SQL Supabase',
        duration: 10000
      })

      // Re-tester après quelques secondes
      setTimeout(() => {
        checkRLSPolicies()
      }, 3000)

    } catch (error: any) {
      console.error('❌ Erreur réparation RLS:', error)
      toast.error('Erreur lors de la génération du script')
    } finally {
      setFixing(false)
    }
  }

  const disableRLSTemporarily = async () => {
    try {
      console.log('🚫 Script pour désactiver temporairement RLS...')
      
      const disableSQL = `-- SCRIPT D'URGENCE: Désactiver temporairement RLS
-- ⚠️ ATTENTION: À utiliser uniquement pour débloquer l'authentification
-- ⚠️ RÉACTIVER RLS dès que possible pour la sécurité

-- Désactiver RLS sur toutes les tables critiques
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE interests DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests DISABLE ROW LEVEL SECURITY;

-- Vérification
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity = false THEN '✅ RLS désactivé'
    ELSE '❌ RLS encore actif'
  END as status
FROM pg_tables 
WHERE tablename IN ('users', 'interests', 'user_interests');

-- Message d'avertissement
SELECT '⚠️ RLS DÉSACTIVÉ - Ne pas oublier de le réactiver!' as warning;`

      console.log('📝 SCRIPT SQL D\'URGENCE (DÉSACTIVATION RLS):')
      console.log('=============================================')
      console.log(disableSQL)
      console.log('=============================================')
      
      toast.warning('🚨 Script d\'urgence généré !', {
        description: 'ATTENTION: Désactive la sécurité RLS. À utiliser uniquement pour le debug.',
        duration: 15000
      })
      
    } catch (error: any) {
      console.error('❌ Erreur génération script:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Diagnostic et Réparation RLS
        </CardTitle>
        <CardDescription>
          Diagnostique et répare les politiques Row Level Security qui causent des récursions infinies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Actions principales */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={checkRLSPolicies} disabled={loading} variant="outline">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Diagnostic...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Tester l'accès aux tables
              </>
            )}
          </Button>
          
          <Button onClick={fixRLSPolicies} disabled={fixing} variant="default">
            {fixing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Générer script de réparation
              </>
            )}
          </Button>

          <Button onClick={disableRLSTemporarily} variant="destructive" size="sm">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Désactiver RLS (debug)
          </Button>
        </div>

        {/* Résultats du diagnostic */}
        {diagnostic && (
          <div className="space-y-3">
            <h3 className="font-medium">Résultats du diagnostic :</h3>
            
            {Object.entries(diagnostic).map(([table, result]: [string, any]) => {
              if (table === 'timestamp') return null
              
              return (
                <div key={table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">{table}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.accessible ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Accessible
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Erreur
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Afficher les erreurs détaillées */}
            {Object.entries(diagnostic).some(([table, result]: [string, any]) => 
              table !== 'timestamp' && !result.accessible
            ) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erreurs détectées :</strong>
                  <ul className="mt-2 space-y-1">
                    {Object.entries(diagnostic).map(([table, result]: [string, any]) => {
                      if (table === 'timestamp' || result.accessible) return null
                      return (
                        <li key={table} className="text-sm">
                          <strong>{table}:</strong> {result.error}
                        </li>
                      )
                    })}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Instructions pour résoudre "infinite recursion" :</strong>
            <ol className="mt-2 space-y-1 text-sm">
              <li>1. <strong>Diagnostic :</strong> Cliquez sur "Tester l'accès aux tables"</li>
              <li>2. <strong>Réparation :</strong> Cliquez sur "Générer script de réparation"</li>
              <li>3. <strong>Exécution :</strong> Ouvrez la console (F12) et copiez le script SQL affiché</li>
              <li>4. <strong>Supabase :</strong> Allez dans Dashboard Supabase → SQL Editor</li>
              <li>5. <strong>Exécution :</strong> Collez et exécutez le script</li>
              <li>6. <strong>Test :</strong> Retestez la connexion dans GasyWay</li>
            </ol>
            <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
              <strong>⚡ Solution rapide :</strong> Si urgence, utilisez "Désactiver RLS (debug)" 
              pour débloquer temporairement l'authentification.
            </div>
          </AlertDescription>
        </Alert>

        {/* Warning pour debug */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Mode debug :</strong> Le bouton "Désactiver RLS" génère un script pour désactiver 
            temporairement la sécurité RLS. À utiliser uniquement pour identifier le problème. 
            <strong>N'oubliez pas de réactiver RLS après !</strong>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}