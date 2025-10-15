import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, cleanCorruptedSession, validateToken } from '../utils/supabase/client'

export interface User {
  id: string
  email: string
  status: 'active' | 'blocked' | 'pending'
  role: 'voyageur' | 'admin'
  first_name: string | null
  last_name: string | null
  phone: string | null
  bio: string | null
  profile_picture_url: string | null
  interests: Array<{
    id: string
    name: string
    description?: string
    icon?: string
  }>
  first_login_completed: boolean
  gdpr_consent: boolean
  locale: string
  created_at: string
  updated_at: string
  last_login: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
  signIn: async () => ({ error: 'Context not initialized' })
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const userCacheRef = useRef<{ userId: string, userData: User, timestamp: number } | null>(null)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Charger la session actuelle avec une meilleure gestion d'erreur
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ [Auth] Erreur récupération session:', error.message)
          // Nettoyer la session corrompue
          await cleanCorruptedSession()
          if (mounted) {
            setSession(null)
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setSession(session)
          if (session?.user) {
            await loadUserData(session.user)
          } else {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('❌ [Auth] Erreur critique initialisation:', error)
        if (mounted) {
          setSession(null)
          setUser(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // ✅ OPTIMISATION: Écouter les changements d'authentification avec debounce optimisé
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('🔄 [Auth] Event:', event, 'Session:', session ? 'présente' : 'absente')
      
      // Debounce optimisé pour éviter les appels multiples rapides  
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      
      debounceRef.current = setTimeout(async () => {
        if (!mounted) return

        if (event === 'SIGNED_OUT' || !session) {
          setSession(null)
          setUser(null)
          userCacheRef.current = null
          setLoading(false)
          return
        }

        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(session)
          if (session?.user) {
            await loadUserData(session.user)
          }
        }
      }, 300) // ✅ Réduit à 300ms pour une meilleure réactivité
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const loadUserData = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      // Vérifier la validité de l'utilisateur Supabase
      if (!supabaseUser?.id || !supabaseUser?.email) {
        console.error('❌ [Auth] Utilisateur Supabase invalide:', supabaseUser)
        setLoading(false)
        return
      }

      // ✅ Cache check : éviter les requêtes multiples
      const now = Date.now()
      const cache = userCacheRef.current
      if (cache && cache.userId === supabaseUser.id && (now - cache.timestamp) < 300000) { // ✅ 5 minutes TTL
        setUser(cache.userData)
        setLoading(false)
        return
      }

      // 🎯 APPROCHE DIRECTE : Essayer de charger, sinon créer immédiatement
      console.log('🔄 [Auth] Chargement utilisateur depuis table users...')
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          status,
          role,
          first_name,
          last_name,
          phone,
          bio,
          profile_picture_url,
          first_login_completed,
          gdpr_consent,
          locale,
          created_at,
          updated_at,
          last_login
        `)
        .eq('id', supabaseUser.id)
        .maybeSingle()

      // Si erreur de requête, pas de création possible
      if (userError) {
        console.error('❌ [Auth] Erreur base de données:', userError.message)
        setLoading(false)
        return
      }

      // 🆕 Si utilisateur trouvé, tout va bien
      if (userData) {
        console.log('✅ [Auth] Utilisateur trouvé dans la table users')
        console.log('📋 [Auth] Données utilisateur brutes depuis Supabase:', {
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          bio: userData.bio,
          profile_picture_url: userData.profile_picture_url,
          status: userData.status,
          role: userData.role,
          first_login_completed: userData.first_login_completed
        });
        
        const finalUser: User = {
          ...userData,
          interests: [], // Chargement séparé des intérêts si nécessaire
          status: userData.status || 'active',
          role: userData.role || 'voyageur',
          first_login_completed: userData.first_login_completed ?? false,
          gdpr_consent: userData.gdpr_consent ?? true,
          locale: userData.locale || 'fr'
        }

        console.log('👤 [Auth] finalUser après traitement:', {
          id: finalUser.id,
          email: finalUser.email,
          first_name: finalUser.first_name,
          last_name: finalUser.last_name,
          phone: finalUser.phone,
          bio: finalUser.bio,
          profile_picture_url: finalUser.profile_picture_url,
          status: finalUser.status,
          role: finalUser.role
        });

        // ✅ Mise en cache des données utilisateur
        userCacheRef.current = {
          userId: supabaseUser.id,
          userData: finalUser,
          timestamp: Date.now()
        }
        
        setUser(finalUser)
        setLoading(false)
        return
      }

      // 🔧 UTILISATEUR MANQUANT : Le créer immédiatement
      console.log('🆕 [Auth] Utilisateur manquant, création immédiate...')
      
      const newUserData = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        status: 'active' as const,
        role: (supabaseUser.user_metadata?.role || 'voyageur') as 'voyageur' | 'admin',
        first_name: supabaseUser.user_metadata?.first_name || null,
        last_name: supabaseUser.user_metadata?.last_name || null,
        phone: supabaseUser.user_metadata?.phone || null,
        bio: null,
        profile_picture_url: null,
        first_login_completed: supabaseUser.user_metadata?.first_login_completed ?? false,
        gdpr_consent: supabaseUser.user_metadata?.gdpr_consent ?? true,
        locale: supabaseUser.user_metadata?.locale || 'fr',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert(newUserData)

      if (insertError) {
        console.error('❌ [Auth] Erreur création utilisateur:', insertError.message)
        setLoading(false)
        return
      }

      console.log('✅ [Auth] Utilisateur créé avec succès')
      
      // 🔄 RECHARGER L'UTILISATEUR CRÉÉ
      const { data: createdUserData, error: reloadError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          status,
          role,
          first_name,
          last_name,
          phone,
          bio,
          profile_picture_url,
          first_login_completed,
          gdpr_consent,
          locale,
          created_at,
          updated_at,
          last_login
        `)
        .eq('id', supabaseUser.id)
        .single()

      if (reloadError || !createdUserData) {
        console.error('❌ [Auth] Erreur rechargement utilisateur créé:', reloadError?.message)
        setLoading(false)
        return
      }

      const finalUser: User = {
        ...createdUserData,
        interests: [],
        status: createdUserData.status || 'active',
        role: createdUserData.role || 'voyageur',
        first_login_completed: createdUserData.first_login_completed ?? false,
        gdpr_consent: createdUserData.gdpr_consent ?? true,
        locale: createdUserData.locale || 'fr'
      }

      // ✅ Mise en cache des données utilisateur
      userCacheRef.current = {
        userId: supabaseUser.id,
        userData: finalUser,
        timestamp: Date.now()
      }
      
      setUser(finalUser)
      setLoading(false)

    } catch (error) {
      console.error('❌ [Auth] Erreur critique loadUserData:', error)
      setLoading(false)
    }
  }, []) // ✅ useCallback pour éviter les re-créations

  const refreshUser = async () => {
    if (session?.user) {
      setLoading(true)
      await loadUserData(session.user)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 Tentative de connexion pour:', email)
      
      // ✅ Ne pas nettoyer la session si elle semble valide
      const { data: currentSession } = await supabase.auth.getSession()
      if (currentSession?.session?.user?.email === email) {
        console.log('📋 Session déjà active pour cet utilisateur')
        return {}
      }
      
      // ✅ Nettoyer seulement si nécessaire
      if (currentSession?.session) {
        console.log('🧹 Nettoyage session existante différente')
        await supabase.auth.signOut()
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Erreur de connexion:', error.message)
        
        let errorMessage = 'Erreur de connexion'
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Veuillez confirmer votre email'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Trop de tentatives, veuillez réessayer plus tard'
        } else {
          errorMessage = error.message
        }
        
        return { error: errorMessage }
      }

      if (data?.user && data?.session) {
        console.log('✅ Connexion réussie pour:', data.user.email)
        
        // La session sera automatiquement mise à jour via onAuthStateChange
        // et loadUserData sera appelé
        
        return {}
      }

      return { error: 'Erreur inattendue lors de la connexion' }
    } catch (error: any) {
      console.error('❌ Erreur critique de connexion:', error)
      return { error: 'Erreur de connexion' }
    }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
    setUser(null)
    setSession(null)
    userCacheRef.current = null
  }

  const value = {
    user,
    session,
    loading,
    refreshUser,
    logout,
    signIn
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}