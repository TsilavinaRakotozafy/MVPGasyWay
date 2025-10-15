import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { toast } from 'sonner@2.0.3'
import { AlertTriangle, Database, CheckCircle, Wrench, RefreshCw } from 'lucide-react'
import { supabase } from '../../utils/supabase/client'

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
}

interface StructureCheck {
  table: string
  status: 'ok' | 'error' | 'warning'
  message: string
  columns?: string[]
}

export function ProfileStructureFixer() {
  const [checking, setChecking] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [checks, setChecks] = useState<StructureCheck[]>([])

  const checkTableStructure = async () => {
    setChecking(true)
    setChecks([])
    
    try {
      console.log('🔍 Vérification de la structure des tables...')
      
      // Vérifier la structure de la table profiles
      const { data: profileColumns, error: profileError } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'profiles')
        .order('ordinal_position')

      if (profileError) {
        console.error('Erreur lecture structure profiles:', profileError)
        setChecks([{
          table: 'profiles',
          status: 'error',
          message: `Erreur lecture structure: ${profileError.message}`
        }])
        return
      }

      // Vérifier la structure de la table users
      const { data: userColumns, error: userError } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'users')
        .order('ordinal_position')

      if (userError) {
        console.error('Erreur lecture structure users:', userError)
        setChecks(prev => [...prev, {
          table: 'users',
          status: 'error',
          message: `Erreur lecture structure: ${userError.message}`
        }])
        return
      }

      const newChecks: StructureCheck[] = []

      // Colonnes attendues pour profiles (avec role dans profiles selon votre Supabase)
      const expectedProfileColumns = [
        'id', 'user_id', 'first_name', 'last_name', 
        'phone', 'avatar_url', 'bio', 'role', 'created_at', 'updated_at'
      ]
      
      // Colonnes attendues pour users (sans role qui est dans profiles)
      const expectedUserColumns = [
        'id', 'email', 'status', 'gdpr_consent', 
        'locale', 'last_login', 'created_at', 'updated_at'
      ]

      // Vérifier profiles
      const profileColNames = profileColumns?.map(col => col.column_name) || []
      const profileHasRole = profileColNames.includes('role')
      const profileMissingCols = expectedProfileColumns.filter(col => !profileColNames.includes(col))

      if (!profileHasRole) {
        newChecks.push({
          table: 'profiles',
          status: 'error',
          message: '❌ ERREUR: La table profiles ne contient pas la colonne "role" requise dans votre structure Supabase.',
          columns: profileColNames
        })
      } else if (profileMissingCols.length > 0) {
        newChecks.push({
          table: 'profiles',
          status: 'warning',
          message: `⚠️ Colonnes manquantes: ${profileMissingCols.join(', ')}`,
          columns: profileColNames
        })
      } else {
        newChecks.push({
          table: 'profiles',
          status: 'ok',
          message: '✅ Structure correcte (avec role dans profiles)',
          columns: profileColNames
        })
      }

      // Vérifier users
      const userColNames = userColumns?.map(col => col.column_name) || []
      const userHasRole = userColNames.includes('role')
      const userMissingCols = expectedUserColumns.filter(col => !userColNames.includes(col))

      if (userHasRole) {
        newChecks.push({
          table: 'users',
          status: 'warning',
          message: '⚠️ INFO: La table users contient une colonne "role" mais dans votre Supabase le rôle est dans profiles.',
          columns: userColNames
        })
      } else if (userMissingCols.length > 0) {
        newChecks.push({
          table: 'users',
          status: 'warning',
          message: `⚠️ Colonnes manquantes: ${userMissingCols.join(', ')}`,
          columns: userColNames
        })
      } else {
        newChecks.push({
          table: 'users',
          status: 'ok',
          message: '✅ Structure correcte (sans role qui est dans profiles)',
          columns: userColNames
        })
      }

      setChecks(newChecks)
      
      // Tester une requête de lecture pour détecter d'autres problèmes
      const { data: testProfiles, error: testError } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, phone')
        .limit(1)

      if (testError) {
        console.error('Erreur test lecture profiles:', testError)
        setChecks(prev => [...prev, {
          table: 'test',
          status: 'error',
          message: `❌ Erreur test lecture: ${testError.message}`
        }])
      } else {
        setChecks(prev => [...prev, {
          table: 'test',
          status: 'ok',
          message: '✅ Test de lecture réussi'
        }])
      }

    } catch (error: any) {
      console.error('Erreur vérification structure:', error)
      toast.error('Erreur lors de la vérification')
    } finally {
      setChecking(false)
    }
  }

  const fixCommonIssues = async () => {
    setFixing(true)
    
    try {
      console.log('🔧 Tentative de correction automatique...')
      
      // Vérifier s'il y a des profils avec des colonnes incorrectes
      const { data: problemProfiles, error: queryError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .limit(5)

      if (queryError && queryError.message.includes('role')) {
        toast.error('❌ Colonne "role" détectée dans profiles. Correction manuelle requise via SQL Editor.')
        return
      }

      // Vérifier les utilisateurs sans profil
      const { data: usersWithoutProfiles, error: usersError } = await supabase
        .from('users')
        .select(`
          id, email, role,
          profiles!inner(user_id)
        `)
        .is('profiles.user_id', null)

      if (usersError) {
        console.error('Erreur vérification utilisateurs:', usersError)
      }

      toast.success('✅ Vérifications terminées')
      
    } catch (error: any) {
      console.error('Erreur correction:', error)
      toast.error('Erreur lors de la correction')
    } finally {
      setFixing(false)
    }
  }

  const getStatusIcon = (status: 'ok' | 'error' | 'warning') => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />
    }
  }

  const getStatusColor = (status: 'ok' | 'error' | 'warning') => {
    switch (status) {
      case 'ok': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      case 'warning': return 'border-orange-200 bg-orange-50'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-600" />
          <CardTitle>🔧 Correcteur Structure Profiles/Users</CardTitle>
        </div>
        <CardDescription>
          Diagnostique et corrige les problèmes de structure entre les tables profiles et users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex space-x-2">
          <Button
            onClick={checkTableStructure}
            disabled={checking}
            variant="outline"
            size="sm"
          >
            {checking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Vérifier Structure
              </>
            )}
          </Button>
          
          <Button
            onClick={fixCommonIssues}
            disabled={fixing || checks.length === 0}
            size="sm"
          >
            {fixing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Correction...
              </>
            ) : (
              <>
                <Wrench className="mr-2 h-4 w-4" />
                Corriger
              </>
            )}
          </Button>
        </div>

        {checks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Résultats de vérification :</h4>
            
            {checks.map((check, index) => (
              <Alert key={index} className={getStatusColor(check.status)}>
                <div className="flex items-start space-x-3">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium capitalize">{check.table}</span>
                    </div>
                    <AlertDescription className="text-sm">
                      {check.message}
                    </AlertDescription>
                    {check.columns && (
                      <div className="mt-2 text-xs text-gray-600">
                        <div className="font-medium">Colonnes détectées:</div>
                        <div className="font-mono bg-gray-100 rounded px-2 py-1 mt-1">
                          {check.columns.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {checks.some(check => check.status === 'error') && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>🔧 Actions recommandées :</strong></p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Votre structure Supabase a le <code>role</code> dans <code>profiles</code>, pas dans <code>users</code></li>
                  <li>• Si la table <code>profiles</code> ne contient pas de colonne <code>role</code>, ajoutez-la</li>
                  <li>• Si la table <code>users</code> contient une colonne <code>role</code>, vous pouvez la supprimer</li>
                  <li>• Le code a été adapté à votre structure réelle</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

      </CardContent>
    </Card>
  )
}