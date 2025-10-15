import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useAuth } from '../../contexts/AuthContextSQL'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export function AuthQuickDiagnostic() {
  const { user, session, loading } = useAuth()

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (status: boolean, label: string) => {
    return status ? 
      <Badge variant="secondary" className="bg-green-100 text-green-800">{label}</Badge> :
      <Badge variant="destructive">{label}</Badge>
  }

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-64">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">🔄 Chargement auth...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            🔍 Diagnostic Auth
            {!loading && !user && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Session Supabase:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(!!session)}
              {getStatusBadge(!!session, session ? 'Active' : 'Inactive')}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Utilisateur:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(!!user)}
              {getStatusBadge(!!user, user ? 'Connecté' : 'Déconnecté')}
            </div>
          </div>

          {user && (
            <div className="space-y-2 text-xs text-muted-foreground border-t pt-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rôle:</strong> {user.role}</p>
              <p><strong>Nom:</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Premier login:</strong> {user.first_login_completed ? 'Oui' : 'Non'}</p>
            </div>
          )}

          {!user && !loading && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              <p>❌ Aucun utilisateur connecté</p>
              <p>🔧 Vérifiez la session Supabase</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}