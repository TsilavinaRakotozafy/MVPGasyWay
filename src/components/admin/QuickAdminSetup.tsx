import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { toast } from 'sonner@2.0.3'
import { 
  Shield, 
  CheckCircle, 
  Loader2,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react'

export function QuickAdminSetup() {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('📋 Copié dans le presse-papiers!')
  }

  const runQuickSetup = async () => {
    setLoading(true)
    setStep(1)
    
    // Script SQL V2 optimisé pour Supabase avec colonnes exactes
    const quickScript = `
-- 🚀 SETUP ADMIN RAPIDE V2 - GasyWay (Colonnes Supabase Exactes)
-- Exécuter dans le SQL Editor de Supabase

DO $
DECLARE
    admin_auth_id UUID;
    admin_exists BOOLEAN;
BEGIN
    -- Vérifier si admin existe déjà dans auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'admin@gasyway.com'
    ) INTO admin_exists;
    
    IF admin_exists THEN
        -- Récupérer l'ID admin existant
        SELECT id INTO admin_auth_id 
        FROM auth.users 
        WHERE email = 'admin@gasyway.com' 
        LIMIT 1;
        
        RAISE NOTICE 'Admin trouvé - Synchronisation avec colonnes Supabase exactes...';
    ELSE
        RAISE NOTICE 'ÉTAPE 1: Créer l admin via Dashboard > Authentication > Users';
        RAISE NOTICE 'Email: admin@gasyway.com';
        RAISE NOTICE 'Password: Admin123!GasyWay';
        RAISE NOTICE 'Confirm email: true';
        RAISE EXCEPTION 'Créez d abord l admin via le Dashboard, puis relancez ce script.';
    END IF;
    
    -- Synchroniser dans public.users (colonnes exactes Supabase)
    INSERT INTO public.users (
        id, email, role, status, gdpr_consent, locale, 
        last_login, created_at, updated_at
    ) VALUES (
        admin_auth_id, 'admin@gasyway.com', 'admin', 'active', 
        true, 'fr', now(), now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = 'admin@gasyway.com',
        role = 'admin',
        status = 'active',
        gdpr_consent = true,
        locale = 'fr',
        last_login = now(),
        updated_at = now();
    
    -- Créer/Mettre à jour le profil (colonnes exactes Supabase)
    INSERT INTO public.profiles (
        user_id, first_name, last_name, phone, 
        bio, created_at, updated_at
    ) VALUES (
        admin_auth_id, 'Admin', 'GasyWay', '+261123456789',
        'Administrateur de la plateforme GasyWay', now(), now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        first_name = 'Admin',
        last_name = 'GasyWay',
        phone = '+261123456789',
        bio = 'Administrateur de la plateforme GasyWay',
        updated_at = now();
    
    RAISE NOTICE '✅ Setup admin V2 terminé! ID: %', admin_auth_id;
    RAISE NOTICE '🔑 Connexion: admin@gasyway.com / Admin123!GasyWay';
END $;

-- Vérification finale avec colonnes exactes
SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    u.gdpr_consent,
    u.locale,
    p.first_name,
    p.last_name,
    p.phone,
    p.bio
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE u.role = 'admin';`

    try {
      await navigator.clipboard.writeText(quickScript)
      setStep(2)
      toast.success('🚀 Script de setup prêt!')
    } catch (error) {
      toast.error('❌ Erreur lors de la copie')
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <CardTitle>⚡ Setup Admin Express V2</CardTitle>
          </div>
          <CardDescription>
            Configuration rapide avec colonnes SQL Supabase exactes (pas de KV store)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Étapes */}
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              step >= 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
            }`}>
              1
            </div>
            <span className="text-sm">Script copié</span>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              step >= 2 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
            }`}>
              2
            </div>
            <span className="text-sm">Exécution SQL</span>
          </div>

          {/* Actions */}
          {step === 0 && (
            <div className="flex space-x-2">
              <Button 
                onClick={runQuickSetup}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Préparation...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    1. Préparer le script
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                variant="outline"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir Supabase
              </Button>
            </div>
          )}

          {step === 2 && (
            <Button 
              onClick={() => {
                setStep(0)
                toast.info('🔄 Prêt pour un nouveau setup')
              }}
              variant="outline"
              className="w-full"
            >
              🔄 Recommencer
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Instructions détaillées */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>📋 Instructions Express</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p><strong>🚀 Étapes rapides :</strong></p>
                  <ol className="ml-4 space-y-2 text-sm">
                    <li>
                      <strong>1. Dashboard Supabase :</strong>
                      <div className="ml-2 text-gray-600">
                        • Authentication → Users → "Add user"<br/>
                        • Email: <code className="bg-gray-100 px-1 rounded">admin@gasyway.com</code><br/>
                        • Password: <code className="bg-gray-100 px-1 rounded">Admin123!GasyWay</code><br/>
                        • ✅ Confirm email
                      </div>
                    </li>
                    <li>
                      <strong>2. SQL Editor :</strong>
                      <div className="ml-2 text-gray-600">
                        • "New query" → Coller le script (Ctrl+V) → "Run"
                      </div>
                    </li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-800 mb-2">
                <Copy className="h-4 w-4" />
                <span className="text-sm">Script V2 copié - Colonnes Supabase exactes!</span>
              </div>
              <p className="text-xs text-blue-600">
                Le script V2 utilise les vraies colonnes SQL Supabase (users, profiles) sans KV store.
              </p>
            </div>

            {/* Données de connexion */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-amber-800 mb-2">🔑 Informations de connexion</h4>
              <div className="space-y-1 text-sm text-amber-700">
                <div className="flex items-center justify-between">
                  <span>📧 Email:</span>
                  <code 
                    className="bg-amber-100 px-2 py-1 rounded cursor-pointer hover:bg-amber-200"
                    onClick={() => copyToClipboard('admin@gasyway.com')}
                  >
                    admin@gasyway.com
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span>🔒 Password:</span>
                  <code 
                    className="bg-amber-100 px-2 py-1 rounded cursor-pointer hover:bg-amber-200"
                    onClick={() => copyToClipboard('Admin123!GasyWay')}
                  >
                    Admin123!GasyWay
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span>👤 Rôle:</span>
                  <span className="bg-amber-100 px-2 py-1 rounded">admin</span>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                💡 Cliquez sur les valeurs pour les copier
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}