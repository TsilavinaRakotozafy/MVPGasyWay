import React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContextSQL'

export function BlockedScreen() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-600">Compte bloqué</CardTitle>
          </div>
          <CardDescription>
            Votre compte a été temporairement suspendu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Votre compte a été bloqué par un administrateur. 
              Pour plus d'informations ou pour faire appel de cette décision, 
              veuillez contacter notre équipe support.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Contact support : support@gasyway.mg
            </p>
          </div>

          <Button 
            onClick={signOut} 
            variant="outline" 
            className="w-full"
          >
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}