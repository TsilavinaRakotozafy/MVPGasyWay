import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { supabase, validateToken, cleanCorruptedSession } from '../../utils/supabase/client'
import { useAuth } from '../../contexts/AuthContextSQL'

export function AuthDebugPanel() {
  const { session, user } = useAuth()
  const [debug, setDebug] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  const runDiagnostic = async () => {
    try {
      const diagnostic = {
        timestamp: new Date().toISOString(),
        
        // 1. Vérifier la session Supabase
        session: {
          exists: !!session,
          accessToken: session?.access_token ? {
            length: session.access_token.length,
            valid: validateToken(session.access_token),
            preview: session.access_token.substring(0, 20) + '...'
          } : null,
          refreshToken: session?.refresh_token ? {
            length: session.refresh_token.length,
            preview: session.refresh_token.substring(0, 20) + '...'
          } : null,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email
          } : null
        },
        
        // 2. Vérifier le localStorage
        localStorage: {
          gasyway: localStorage.getItem('gasyway-auth'),
          supabaseKeys: []
        },
        
        // 3. Vérifier les headers Supabase
        supabaseConfig: {
          url: supabase.supabaseUrl,
          anonKey: supabase.supabaseKey.substring(0, 20) + '...'
        },
        
        // 4. Tester la récupération de session
        sessionTest: null,
        
        // 5. User context
        userContext: user ? {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status
        } : null
      }
      
      // Récupérer toutes les clés Supabase du localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('supabase') || key.includes('sb-'))) {
          diagnostic.localStorage.supabaseKeys.push({
            key,
            valueLength: localStorage.getItem(key)?.length || 0
          })
        }
      }
      
      // Test de récupération de session
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        diagnostic.sessionTest = {
          success: !sessionError,
          error: sessionError?.message,
          hasSession: !!sessionData.session,
          sessionUser: sessionData.session?.user?.email
        }
      } catch (error: any) {
        diagnostic.sessionTest = {
          success: false,
          error: error.message,
          hasSession: false
        }
      }
      
      setDebug(diagnostic)
    } catch (error: any) {
      setDebug({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  const clearAllAuth = async () => {
    try {
      await cleanCorruptedSession()
      setDebug(null)
      window.location.reload()
    } catch (error) {
      console.error('Erreur nettoyage:', error)
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsVisible(true)}
        >
          🔍 Debug Auth
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Debug Authentification</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Button size="sm" onClick={runDiagnostic}>
              🔍 Diagnostiquer
            </Button>
            <Button size="sm" variant="destructive" onClick={clearAllAuth}>
              🧹 Reset Auth
            </Button>
          </div>
          
          {debug && (
            <div className="text-xs space-y-2 bg-gray-50 p-2 rounded">
              {debug.error ? (
                <div className="text-red-600">
                  <strong>Erreur:</strong> {debug.error}
                </div>
              ) : (
                <>
                  <div>
                    <strong>Session:</strong>{' '}
                    <Badge variant={debug.session.exists ? "default" : "destructive"}>
                      {debug.session.exists ? "Présente" : "Absente"}
                    </Badge>
                  </div>
                  
                  {debug.session.accessToken && (
                    <div>
                      <strong>Token:</strong>{' '}
                      <Badge variant={debug.session.accessToken.valid ? "default" : "destructive"}>
                        {debug.session.accessToken.valid ? "Valide" : "Invalide"}
                      </Badge>
                      <div className="ml-2 text-gray-600">
                        Longueur: {debug.session.accessToken.length}
                      </div>
                    </div>
                  )}
                  
                  {debug.session.expiresAt && (
                    <div>
                      <strong>Expire:</strong> {new Date(debug.session.expiresAt).toLocaleString()}
                    </div>
                  )}
                  
                  <div>
                    <strong>Test session:</strong>{' '}
                    <Badge variant={debug.sessionTest?.success ? "default" : "destructive"}>
                      {debug.sessionTest?.success ? "OK" : "ERREUR"}
                    </Badge>
                    {debug.sessionTest?.error && (
                      <div className="text-red-600 ml-2">
                        {debug.sessionTest.error}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <strong>LocalStorage:</strong> {debug.localStorage.supabaseKeys.length} clés Supabase
                  </div>
                  
                  {debug.userContext && (
                    <div>
                      <strong>User:</strong> {debug.userContext.email} ({debug.userContext.role})
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}