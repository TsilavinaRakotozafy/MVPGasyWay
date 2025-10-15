import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { toast } from 'sonner@2.0.3'
import { 
  Shield, 
  User, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  UserPlus,
  Key
} from 'lucide-react'

export function AdminAccountCreator() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [results, setResults] = useState<string[]>([])
  
  // Données du compte admin
  const [adminData, setAdminData] = useState({
    email: 'admin@gasyway.com',
    password: 'Admin123!GasyWay',
    firstName: 'Admin',
    lastName: 'GasyWay',
    phone: '+261123456789'
  })

  const createAdminAccount = async () => {
    setLoading(true)
    setResults([])
    setStep(1)
    
    try {
      // Étape 1: Créer le compte dans auth.users via le serveur
      const newResults = ['🚀 Création du compte admin en cours...']
      setResults(newResults)
      
      const response = await fetch('/functions/v1/make-server-3aa6b185/admin/create-admin-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminData)
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du compte admin')
      }
      
      const result = await response.json()
      
      if (result.success) {
        const successResults = [
          ...newResults,
          '✅ Compte créé dans auth.users',
          '✅ Données insérées dans public.users', 
          '✅ Profil créé dans profiles',
          `✅ ID utilisateur: ${result.userId}`,
          '🎉 Compte admin créé avec succès!'
        ]
        setResults(successResults)
        setStep(2)
        toast.success('🎉 Compte admin créé avec succès!')
      } else {
        throw new Error(result.error || 'Erreur inconnue')
      }
      
    } catch (error: any) {
      console.error('Erreur création admin:', error)
      const errorResults = [
        '❌ Erreur lors de la création:',
        error.message
      ]
      setResults(errorResults)
      setStep(0)
      toast.error('❌ Erreur lors de la création du compte admin')
    } finally {
      setLoading(false)
    }
  }

  const createDirectSQL = async () => {
    setLoading(true)
    setResults([])
    setStep(1)
    
    const sqlScript = `
-- 🔐 Création du compte admin GasyWay
-- ATTENTION: Ce script doit être exécuté dans le SQL Editor de Supabase

BEGIN;

-- Variables
\\set admin_email 'admin@gasyway.com'
\\set admin_password 'Admin123!GasyWay'

-- 1. Créer l'utilisateur dans auth.users (à faire manuellement via Dashboard)
-- Aller dans Authentication > Users > Add user
-- Email: admin@gasyway.com  
-- Password: Admin123!GasyWay
-- Confirm email: true

-- 2. Récupérer l'ID de l'utilisateur créé et l'insérer ici
-- REMPLACER 'XXXX-XXXX-XXXX' par l'ID réel de l'utilisateur créé
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Récupérer l'ID depuis auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@gasyway.com' 
    LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur admin non trouvé dans auth.users. Créez-le d abord via le Dashboard.';
    END IF;
    
    -- 3. Insérer dans public.users
    INSERT INTO users (id, email, role, gdpr_consent, status, locale, created_at, updated_at) 
    VALUES (
        admin_user_id,
        'admin@gasyway.com',
        'admin',
        true,
        'active',
        'fr',
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        status = 'active',
        updated_at = now();
    
    -- 4. Créer le profil dans profiles
    INSERT INTO profiles (user_id, first_name, last_name, phone, created_at, updated_at)
    VALUES (
        admin_user_id,
        'Admin',
        'GasyWay', 
        '+261123456789',
        now(),
        now()
    ) ON CONFLICT (user_id) DO UPDATE SET
        first_name = 'Admin',
        last_name = 'GasyWay',
        phone = '+261123456789',
        updated_at = now();
    
    RAISE NOTICE 'Compte admin créé avec succès! ID: %', admin_user_id;
END $$;

COMMIT;

-- Vérification
SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    p.first_name,
    p.last_name,
    p.phone
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'admin@gasyway.com';
`
    
    try {
      // Copier le script dans le presse-papiers
      await navigator.clipboard.writeText(sqlScript)
      
      const results = [
        '📋 Script SQL copié dans le presse-papiers!',
        '',
        '📝 Instructions:',
        '1. Ouvrez le Supabase Dashboard',
        '2. Allez dans SQL Editor',
        '3. Créez une "New query"',
        '4. Collez le script (Ctrl+V)',
        '5. Exécutez avec "Run"',
        '',
        '⚠️ Important:',
        '- Créez d\'abord l\'utilisateur via Authentication > Users',
        '- Email: admin@gasyway.com',
        '- Password: Admin123!GasyWay',
        '- Confirm email: true'
      ]
      
      setResults(results)
      setStep(2)
      toast.success('📋 Script SQL prêt!')
      
    } catch (error) {
      setResults(['❌ Erreur lors de la copie du script'])
      setStep(0)
      toast.error('❌ Erreur lors de la préparation du script')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>🔐 Créateur de Compte Admin</CardTitle>
          </div>
          <CardDescription>
            Créer le compte administrateur dans les tables SQL Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Données du compte */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={adminData.firstName}
                  onChange={(e) => setAdminData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={adminData.lastName}
                  onChange={(e) => setAdminData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={adminData.phone}
                  onChange={(e) => setAdminData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            {step === 0 && (
              <>
                <Button 
                  onClick={createDirectSQL}
                  disabled={loading}
                  className="flex-1"
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Préparation...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Générer Script SQL
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  variant="outline"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Ouvrir Supabase
                </Button>
              </>
            )}

            {step === 2 && (
              <Button 
                onClick={() => {
                  setStep(0)
                  setResults([])
                  toast.info('🔄 Réinitialisé')
                }}
                variant="outline"
                className="w-full"
              >
                🔄 Recommencer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur les tables */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-green-600" />
            <CardTitle>Structure des Tables</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>📊 Tables impliquées :</strong></p>
                <ul className="ml-4 space-y-1 text-sm">
                  <li>• <strong>auth.users</strong> : Authentification Supabase</li>
                  <li>• <strong>public.users</strong> : Données utilisateur (rôle, statut)</li>
                  <li>• <strong>public.profiles</strong> : Profil détaillé (nom, téléphone)</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ Important :</strong> L'utilisateur doit d'abord être créé dans auth.users 
              via le Dashboard Supabase, puis les données seront synchronisées dans les autres tables.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Données de connexion */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-amber-600" />
            <CardTitle>Informations de Connexion</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <p><strong>📧 Email :</strong> {adminData.email}</p>
              <p><strong>🔒 Mot de passe :</strong> {adminData.password}</p>
              <p><strong>👤 Rôle :</strong> admin</p>
              <p><strong>📱 Téléphone :</strong> {adminData.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}