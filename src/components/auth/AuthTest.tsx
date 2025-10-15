import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useAuth } from '../../contexts/AuthContextSQL'
import { User, Mail, Shield, LogOut, Database } from 'lucide-react'

export function AuthTest() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement des données utilisateur...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Test Contexte AuthSQL</span>
        </CardTitle>
        <CardDescription>
          Vérification du nouveau contexte d'authentification avec tables SQL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Utilisateur connecté</h3>
              <Badge variant="default">Authentifié</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">ID:</span>
                </div>
                <p className="text-gray-600 text-xs font-mono">{user.id}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email:</span>
                </div>
                <p className="text-gray-600">{user.email}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Rôle:</span>
                </div>
                <Badge variant={user.profile.role === 'admin' ? 'default' : 'secondary'}>
                  {user.profile.role}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Nom:</span>
                </div>
                <p className="text-gray-600">
                  {user.profile.first_name} {user.profile.last_name}
                </p>
              </div>
            </div>

            {user.interests && user.interests.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Centres d'intérêt ({user.interests.length}):</h4>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <Badge key={interest.id} variant="outline">
                      {interest.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button onClick={() => signOut()} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <Badge variant="secondary">Non connecté</Badge>
            <p className="text-gray-600">
              Aucun utilisateur n'est actuellement connecté au système.
            </p>
          </div>
        )}

        <div className="pt-4 border-t text-xs text-gray-500">
          <p>✅ Utilise AuthContextSQL (tables relationnelles)</p>
          <p>📊 Données chargées depuis users, profiles, interests, user_interests</p>
        </div>
      </CardContent>
    </Card>
  )
}