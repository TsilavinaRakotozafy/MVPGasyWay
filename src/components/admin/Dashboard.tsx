import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  Users, 
  Package, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Star,
  Building2,
  Bell,
  Database,
  Wrench
} from 'lucide-react'
import { api, handleApiError } from '../../utils/api'
import { DatabaseSchemaFixer } from './DatabaseSchemaFixer'

interface DashboardStats {
  totalUsers: number
  totalPacks: number
  activePacks: number
  totalBookings: number
  totalRevenue: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  async function loadDashboardStats() {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Chargement des statistiques admin...')
      
      // Utiliser l'API unifiée au lieu d'accès direct Supabase
      const statsData = await api.authGet<DashboardStats>('/admin/stats')
      
      console.log('✅ Statistiques chargées:', statsData)
      setStats(statsData)
      
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error)
      const errorMessage = handleApiError(error)
      setError(errorMessage)
      
      // Fallback avec des stats par défaut
      setStats({
        totalUsers: 0,
        totalPacks: 0,
        activePacks: 0,
        totalBookings: 0,
        totalRevenue: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-secondary text-secondary-foreground'
      case 'pending': return 'bg-accent text-accent-foreground'
      case 'cancelled': return 'bg-destructive text-destructive-foreground'
      case 'refunded': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmé'
      case 'pending': return 'En attente'
      case 'cancelled': return 'Annulé'
      case 'refunded': return 'Remboursé'
      default: return status
    }
  }

  // Affichage direct même pendant le chargement
  const displayStats = stats || {
    totalUsers: 0,
    totalPacks: 0,
    activePacks: 0,
    totalBookings: 0,
    totalRevenue: 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Dashboard</h1>
        <p className="text-gray-600">Vue d'ensemble de votre plateforme GasyWay</p>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700">{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardStats}
                disabled={loading}
              >
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisateurs</p>
                <p className="text-2xl">{loading ? '...' : displayStats.totalUsers}</p>
                <p className="text-sm text-gray-500">Comptes actifs</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Packs</p>
                <p className="text-2xl">{loading ? '...' : displayStats.totalPacks}</p>
                <p className="text-sm text-gray-500">{displayStats.activePacks} actifs</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réservations</p>
                <p className="text-2xl">{loading ? '...' : displayStats.totalBookings}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenus</p>
                <p className="text-2xl">{loading ? '...' : displayStats.totalRevenue.toLocaleString()} Ar</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <CreditCard className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostic et réparation de la base de données */}
      <DatabaseSchemaFixer />

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Accès aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Gérer les utilisateurs
            </Button>
            <Button variant="outline" className="justify-start">
              <Package className="h-4 w-4 mr-2" />
              Créer un pack
            </Button>
            <Button variant="outline" className="justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Envoyer une notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}