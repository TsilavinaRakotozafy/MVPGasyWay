import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { toast } from 'sonner@2.0.3'
import { 
  Users, 
  UserPlus, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Key,
  Database,
  RotateCcw
} from 'lucide-react'
import { createDemoAuthAccounts, resetDemoAuthAccounts, checkDemoAuthAccounts } from '../../utils/createDemoAuthAccounts'
import { initializeSQLDatabase } from '../../utils/initSQLDatabase'

interface AccountStatus {
  email: string
  status: string
  active: boolean
}

export function DemoAccountsManager() {
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [accountsStatus, setAccountsStatus] = useState<AccountStatus[]>([])
  const [lastCheck, setLastCheck] = useState<string | null>(null)

  useEffect(() => {
    checkAccountsStatus()
  }, [])

  const checkAccountsStatus = async () => {
    setLoading(true)
    try {
      const result = await checkDemoAuthAccounts()
      
      if (result.success && result.details?.status) {
        const status = result.details.status.map((statusLine: string) => {
          const [email, ...statusParts] = statusLine.split(': ')
          const statusText = statusParts.join(': ')
          return {
            email,
            status: statusText,
            active: statusText.includes('Actif')
          }
        })
        setAccountsStatus(status)
      }
      
      setLastCheck(new Date().toLocaleString('fr-FR'))
    } catch (error: any) {
      console.error('Erreur vérification comptes:', error)
      toast.error('Erreur lors de la vérification des comptes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAuthAccounts = async () => {
    setActionLoading('create-auth')
    try {
      const result = await createDemoAuthAccounts()
      
      if (result.success) {
        toast.success(result.message)
        await checkAccountsStatus()
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error('Erreur lors de la création des comptes auth')
    } finally {
      setActionLoading(null)
    }
  }

  const handleInitializeSQLData = async () => {
    setActionLoading('init-sql')
    try {
      const result = await initializeSQLDatabase()
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error('Erreur lors de l\'initialisation SQL')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFullSetup = async () => {
    setActionLoading('full-setup')
    try {
      // 1. Initialiser les données SQL
      console.log('🔄 Initialisation des données SQL...')
      const sqlResult = await initializeSQLDatabase()
      if (!sqlResult.success) {
        throw new Error('Échec initialisation SQL: ' + sqlResult.message)
      }

      // 2. Créer les comptes auth
      console.log('🔄 Création des comptes auth...')
      const authResult = await createDemoAuthAccounts()
      if (!authResult.success) {
        throw new Error('Échec création comptes auth: ' + authResult.message)
      }

      toast.success('🎉 Configuration complète terminée !')
      await checkAccountsStatus()

    } catch (error: any) {
      console.error('Erreur configuration complète:', error)
      toast.error('Erreur: ' + error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReset = async () => {
    if (!confirm('⚠️ ATTENTION: Cette action supprimera et recréera tous les comptes de démonstration. Continuer ?')) {
      return
    }

    setActionLoading('reset')
    try {
      const result = await resetDemoAuthAccounts()
      
      if (result.success) {
        toast.success(result.message)
        await checkAccountsStatus()
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error('Erreur lors de la réinitialisation')
    } finally {
      setActionLoading(null)
    }
  }

  const allAccountsActive = accountsStatus.every(account => account.active)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <span>Gestion Comptes Démo</span>
          </h1>
          <p className="text-gray-600">Configuration et maintenance des comptes de démonstration</p>
        </div>
        <Button
          onClick={checkAccountsStatus}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Vérifier
        </Button>
      </div>

      {/* État global */}
      <Alert className={allAccountsActive ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
        <div className="flex items-center space-x-2">
          {allAccountsActive ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          )}
          <AlertDescription className={allAccountsActive ? 'text-green-800' : 'text-orange-800'}>
            {allAccountsActive 
              ? 'Tous les comptes de démonstration sont actifs et prêts à utiliser'
              : 'Certains comptes de démonstration nécessitent une configuration'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Configuration rapide */}
      {!allAccountsActive && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Configuration Rapide</CardTitle>
            <CardDescription className="text-blue-700">
              Configurez automatiquement tous les comptes de démonstration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleFullSetup}
              disabled={actionLoading !== null}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading === 'full-setup' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Configuration en cours...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Configuration Complète Automatique
                </>
              )}
            </Button>
            <p className="text-sm text-blue-700 mt-2">
              Cette action configure automatiquement les données SQL et les comptes d'authentification
            </p>
          </CardContent>
        </Card>
      )}

      {/* État des comptes */}
      <Card>
        <CardHeader>
          <CardTitle>État des Comptes</CardTitle>
          <CardDescription>
            Statut actuel des comptes de démonstration
            {lastCheck && ` - Dernière vérification: ${lastCheck}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Vérification en cours...</span>
            </div>
          ) : accountsStatus.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée de statut disponible
            </div>
          ) : (
            <div className="space-y-3">
              {accountsStatus.map((account, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{account.email}</div>
                    <div className="text-sm text-gray-600">{account.status}</div>
                  </div>
                  <Badge variant={account.active ? 'default' : 'secondary'}>
                    {account.active ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Actif
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactif
                      </>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions avancées */}
      <Card>
        <CardHeader>
          <CardTitle>Actions de Maintenance</CardTitle>
          <CardDescription>
            Outils pour gérer individuellement les composants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Données SQL */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-1">
                <Database className="h-4 w-4" />
                <span>Données SQL</span>
              </h4>
              <p className="text-sm text-gray-600">
                Initialise les tables avec les données de base
              </p>
              <Button
                onClick={handleInitializeSQLData}
                disabled={actionLoading !== null}
                variant="outline"
                className="w-full"
              >
                {actionLoading === 'init-sql' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Initialiser SQL
              </Button>
            </div>

            {/* Comptes Auth */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-1">
                <Key className="h-4 w-4" />
                <span>Comptes Auth</span>
              </h4>
              <p className="text-sm text-gray-600">
                Crée les comptes d'authentification Supabase
              </p>
              <Button
                onClick={handleCreateAuthAccounts}
                disabled={actionLoading !== null}
                variant="outline"
                className="w-full"
              >
                {actionLoading === 'create-auth' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Créer Auth
              </Button>
            </div>

            {/* Réinitialisation */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center space-x-1 text-red-600">
                <RotateCcw className="h-4 w-4" />
                <span>Réinitialiser</span>
              </h4>
              <p className="text-sm text-gray-600">
                Supprime et recrée tous les comptes
              </p>
              <Button
                onClick={handleReset}
                disabled={actionLoading !== null}
                variant="destructive"
                className="w-full"
              >
                {actionLoading === 'reset' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle>Comptes de Démonstration</CardTitle>
          <CardDescription>
            Identifiants pour tester l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">👤 Compte Voyageur</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Email :</strong> demo@voyageur.com</p>
                  <p><strong>Mot de passe :</strong> demo123</p>
                  <p><strong>Accès :</strong> Interface voyageur complète</p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">⚙️ Compte Admin</h4>
                <div className="text-sm text-purple-800 space-y-1">
                  <p><strong>Email :</strong> admin@gasyway.com</p>
                  <p><strong>Mot de passe :</strong> admin123</p>
                  <p><strong>Accès :</strong> Dashboard administrateur</p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important :</strong> Ces comptes sont recréés automatiquement à chaque initialisation.
                Utilisez-les uniquement pour les tests et démonstrations.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}